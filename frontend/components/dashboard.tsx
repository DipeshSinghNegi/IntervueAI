"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Bot,
  User,
  FileText,
  Home,
  Loader2,
  Percent,
  ClipboardList,
  ListChecks,
} from "lucide-react";
import { Button } from "./ui/MovingBorders";

/* ----------------------------- URL helper -------------------------------- */

const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/** Join base + path with exactly one slash; default to same-origin if base is empty/bad */
function api(path: string) {
  const base = (RAW_BASE_URL || (typeof window !== "undefined" ? window.location.origin : ""))
    .replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${base}/${p}`;
}

/* ----------------------------- Types ----------------------------- */
type ChatMsg = { from: string; text: string };
type Metric = { label: string; value: string };
type GroupedResults = {
  metrics: Metric[];
  overview: string[];
  resume: string[];
  recommendations: string[];
};

/* --------------------------------- UI ------------------------------------ */

const Result = () => {
  const router = useRouter();
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(0);

  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);
  const [grouped, setGrouped] = useState<GroupedResults>({
    metrics: [],
    overview: [],
    resume: [],
    recommendations: [],
  });

  const [sessionId, setSessionId] = useState("");
  const [email, setEmail] = useState("");
  const fetchedRef = useRef(false);

  // Overlay shown ONLY during the actual API call
  const [isLoading, setIsLoading] = useState(false);

  // Filter "start", and parse results into grouped sections (match result.tsx)
  const updateSessionData = (sessionData: any) => {
    const sid = sessionData?.session?.session_id || "";

    const rawHist = Array.isArray(sessionData?.history) ? sessionData.history : [];
    const chat: ChatMsg[] = rawHist
      .filter((item: any) => String(item?.content ?? "").trim().toLowerCase() !== "start")
      .map((item: any) => ({
        from: item.role === "user" ? "You" : "AI",
        text: item.content,
      }));

    const raw = sessionData?.results || "";
    const parsedGrouped = parseGroupedResults(raw);

    setSessionId(sid);
    setChatHistory(chat);
    setGrouped(parsedGrouped);
  };

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    refetch(); // initial
  }, []);

  /** SAFER fetch that you can also trigger from a "Refetch" button */
  const refetch = async () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setAllSessions([]);
      setSessionId("");
      setChatHistory([]);
      setGrouped({ metrics: [], overview: [], resume: [], recommendations: [] });
      return;
    }

    let userEmail = "";
    try {
      const parsed = JSON.parse(storedUser);
      userEmail = typeof parsed === "string" ? parsed : parsed?.email || "";
    } catch {
      userEmail = storedUser; // raw string fallback
    }
    if (!userEmail) {
      setAllSessions([]);
      setSessionId("");
      setChatHistory([]);
      setGrouped({ metrics: [], overview: [], resume: [], recommendations: [] });
      return;
    }

    setEmail(userEmail);
    setIsLoading(true);

    try {
      const endpoint = api("/api/v1/show_results");
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const data = await res.json().catch(() => []);
      const sessions = Array.isArray(data) ? data : [];
      setAllSessions(sessions);

      if (sessions.length > 0) {
        setSelectedSessionIndex(0);
        updateSessionData(sessions[0]);
      } else {
        setSessionId("");
        setChatHistory([]);
        setGrouped({ metrics: [], overview: [], resume: [], recommendations: [] });
      }
    } catch (err) {
      setAllSessions([]);
      setSessionId("");
      setChatHistory([]);
      setGrouped({ metrics: [], overview: [], resume: [], recommendations: [] });
    } finally {
      setIsLoading(false);
    }
  };

  /* ----------------------- Parser (flexible like result.tsx, more robust) ----------------------- */

  function normalize(s: string) {
    return String(s).replace(/\*\*/g, "").replace(/\*/g, "").trim();
  }

  function splitSections(raw: string) {
    const lines = String(raw).split("\n").map(l => l.trim()).filter(Boolean);

    const headings = {
      // accept “Performance Metrics/Matrix/Ratings/Breakdown/Scores”
      metrics: /performance\s*(metrics?|matrix|ratings?|breakdown|scores?)\b/i,
      // accept “Performance Overview/Overall Performance/Performance Summary/Overall Summary”
      overview: /(performance\s*overview|overall\s*performance|performance\s*summary|overall\s*summary)\b/i,
      // accept “Resume/CV Review/Analysis/Feedback/Critique”
      resume: /(resume|cv)\s*(review|analysis|feedback|critique)\b/i,
      // accept “Recommendations/Suggestions/Next Steps/Action Items/Improvements/Tips”
      recs: /(recommendations?|suggestions?|next\s*steps|action\s*items?|improvements?|tips?)\b/i,
    };

    const isSectionHeading = (s: string) =>
      headings.metrics.test(s) ||
      headings.overview.test(s) ||
      headings.resume.test(s) ||
      headings.recs.test(s);

    const buckets: { [k: string]: string[] } = {
      metrics: [],
      overview: [],
      resume: [],
      recs: [],
      rest: [],
    };

    let current: keyof typeof buckets = "rest";
    for (const lineRaw of lines) {
      const plain = normalize(lineRaw);

      if (headings.metrics.test(plain)) { current = "metrics"; continue; }
      if (headings.overview.test(plain)) { current = "overview"; continue; }
      if (headings.resume.test(plain))  { current = "resume";  continue; }
      if (headings.recs.test(plain))    { current = "recs";    continue; }

      if (!plain || isSectionHeading(plain)) continue; // skip stray headings
      buckets[current].push(plain);
    }
    return buckets;
  }

  function parseMetrics(lines: string[]): Metric[] {
    const out: Metric[] = [];
    for (let raw of lines) {
      if (!raw) continue;

      // strip common bullets/quotes/numbers and markdown bits
      let line = normalize(
        raw
          .replace(/^\s*[-*•]\s+/, "")   // "- " / "• "
          .replace(/^\s*\d+\.\s+/, "")   // "1. "
          .replace(/^\s*"+|"+\s*$/g, "") // quotes
      );

      // skip intro sentences
      if (/based on|summary of your performance/i.test(line)) continue;

      // find a percent anywhere; allow notes after (e.g., "60% (Good)")
      const pm = line.match(/(\d{1,3})\s*%/);
      // also support x/100 → percent
      const per100 = !pm ? line.match(/(\d{1,3})\s*\/\s*100\b/) : null;

      let valueNum: number | null = null;
      if (pm) valueNum = Math.min(100, Math.max(0, parseInt(pm[1], 10)));
      else if (per100) valueNum = Math.min(100, Math.max(0, parseInt(per100[1], 10)));
      if (valueNum === null || Number.isNaN(valueNum)) continue;

      // label before ":" or " - " or before %/x/100
      let label = line;
      const colon = line.indexOf(":");
      const dash3 = line.indexOf(" - ");
      const sepIdx =
        colon !== -1 && dash3 !== -1 ? Math.min(colon, dash3) :
        colon !== -1 ? colon :
        dash3 !== -1 ? dash3 : -1;

      if (sepIdx !== -1)      label = line.slice(0, sepIdx);
      else if (pm)            label = line.slice(0, pm.index!).trim();
      else if (per100)        label = line.slice(0, per100.index!).trim();

      label = label.replace(/[–—-]\s*$/,"").trim() || "Metric";
      out.push({ label, value: `${valueNum}%` });
    }
    return out;
  }

  function parseParagraphs(lines: string[]): string[] {
    const paras: string[] = [];
    let buf: string[] = [];

    // locally share the same heading test used in splitSections
    const headings = {
      metrics: /performance\s*(metrics?|matrix|ratings?|breakdown|scores?)\b/i,
      overview: /(performance\s*overview|overall\s*performance|performance\s*summary|overall\s*summary)\b/i,
      resume: /(resume|cv)\s*(review|analysis|feedback|critique)\b/i,
      recs: /(recommendations?|suggestions?|next\s*steps|action\s*items?|improvements?|tips?)\b/i,
    };
    const isSectionHeading = (s: string) =>
      headings.metrics.test(s) ||
      headings.overview.test(s) ||
      headings.resume.test(s) ||
      headings.recs.test(s);

    const flush = () => {
      const txt = normalize(buf.join(" ").trim());
      if (txt && !isSectionHeading(txt)) paras.push(txt);
      buf = [];
    };

    for (const raw of lines) {
      const cleaned = normalize(
        raw
          .replace(/^\s*[-*•]\s+/, "") // bullets
          .replace(/^\s*\d+\.\s+/, "") // numbered
      );

      if (!cleaned || isSectionHeading(cleaned)) { flush(); continue; }

      // if original looked like a bullet/number, treat as its own para
      if (/^(-|\d+\.)\s+/.test(raw)) {
        flush();
        paras.push(cleaned);
      } else {
        buf.push(cleaned);
      }
    }

    flush();
    return paras;
  }

  function parseRecommendations(lines: string[]): string[] {
    const items: string[] = [];
    for (const raw of lines) {
      const line = normalize(raw);
      const m = line.match(/^(?:-|\d+\.)\s*(.+)$/);
      if (m) items.push(normalize(m[1]));
    }
    if (items.length) return items;
    return parseParagraphs(lines);
  }

  function parseGroupedResults(raw: string): GroupedResults {
    const sections = splitSections(raw);
    const metrics = parseMetrics(sections.metrics.length ? sections.metrics : sections.rest);
    const overview = parseParagraphs(sections.overview);
    const resume = parseParagraphs(sections.resume);
    const recommendations = parseRecommendations(sections.recs);
    return { metrics, overview, resume, recommendations };
  }

  /* ---------------------------------- Utils --------------------------------- */

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify({ sessionId, chatHistory, grouped }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-results-${sessionId || "unknown"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* --------------------------------- Render -------------------------------- */

  return (
    <div className="min-h-screen w-full bg-[#05081A] flex flex-col relative">
      {/* Full-screen neutral loading overlay */}
      {isLoading && (
        <div
          className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center"
          aria-live="assertive"
          aria-busy="true"
          role="alert"
        >
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-[#0b0f14]/80 border border-gray-800 px-8 py-6 shadow-2xl text-slate-200">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Loading your sessions…</p>
          </div>
        </div>
      )}

      {/* Everything beneath blurs & disables while loading */}
      <div className={isLoading ? "blur-sm opacity-70 pointer-events-none" : ""}>
        {/* Header */}
        <div className="w-full px-4 sm:px-6 pt-6 pb-4 flex flex-col sm:flex-row items-center justify-center ">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="font-bold text-xl sm:text-2xl text-white">My Sessions</span>
          </div>

          {/* Small controls row */}
          <div className="mt-3 sm:mt-0 sm:ml-4 flex items-center gap-2">
            <button
              onClick={refetch}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-800/60 border border-slate-700/70 text-slate-200 hover:bg-slate-700/60 transition"
              title="Refetch from API"
            >
              Refetch
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-800/60 border border-slate-700/70 text-slate-200 hover:bg-slate-700/60 transition inline-flex items-center gap-1"
              title="Download JSON"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          </div>
        </div>

        {/* Result Section UI */}
        <Button
          duration={15000}
          borderRadius="1.75rem"
          style={{
            background: "rgb(4,7,29)",
            backgroundColor: "linear-gradient(90deg, rgba(4,7,29,1) 0%, rgba(12,14,35,1) 100%)",
            borderRadius: `calc(1.75rem* 0.96)`,
          }}
          className="text-black dark:text-white border-neutral-200 dark:border-slate-800 h-auto min-h-[70vh] flex"
        >
          <div className="w-full h-[80vh] bg-[#10131f] border border-[#222444] rounded-2xl flex flex-col sm:flex-row gap-0 overflow-hidden">
            {/* Session list */}
            <div className="w-full sm:w-1/5 lg:w-1/6 flex flex-col items-center justify-start bg-[#0d1117]/50 border-r border-[#222444] p-4 text-center space-y-3">
              <p className="text-xs text-neutral-400">Your Sessions</p>
              {allSessions.length > 0 ? (
                allSessions.map((s, idx) => (
                  <button
                    key={s.session?.session_id || idx}
                    onClick={() => {
                      setSelectedSessionIndex(idx);
                      updateSessionData(s); // local swap, no API
                    }}
                    className={`w-full text-xs py-2 rounded-lg ${
                      idx === selectedSessionIndex
                        ? "bg-cyan-800 text-white font-semibold"
                        : "bg-slate-700/30 text-gray-300 hover:bg-slate-700/60"
                    }`}
                  >
                    {s.session?.session_id || `Session ${idx + 1}`}
                  </button>
                ))
              ) : (
                <span className="text-xs text-neutral-500">No sessions found.</span>
              )}
            </div>

            {/* Results (GROUPED like result.tsx) */}
            <div className="w-full h-full flex flex-col overflow-hidden">
              <h2 className="font-bold text-xl text-white p-4 border-b border-[#1b1f2f]">
                Result Summary
              </h2>

              <div
                className="
                  flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar
                  [&_p]:text-base [&_li]:text-base
                  md:[&_p]:text-xl md:[&_li]:text-xl md:[&_span.font-semibold]:text-2xl
                "
              >
                {/* Performance Metrics */}
                {(grouped.metrics?.length ?? 0) > 0 && (
                  <>
                    <div className="flex items-center justify-between bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <Percent className="w-5 h-5 text-cyan-400" />
                        <span className="font-semibold text-white">Performance Metrics</span>
                      </div>
                    </div>

                    <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-700/50">
                      <ul className="divide-y divide-slate-700/50">
                        {grouped.metrics.map((m, i) => {
                          const valueNum = parseInt(String(m.value).replace("%", "").trim(), 10);
                          const color =
                            valueNum > 70 ? "text-green-400" :
                            valueNum < 30 ? "text-red-400" :
                            "text-cyan-300";
                          return (
                            <li key={i} className="flex items-center justify-between py-3 px-2">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-slate-400" />
                                <span className="text-white font-medium">{m.label}</span>
                              </div>
                              <span className={`font-bold text-lg ${color}`}>{m.value}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </>
                )}

                {/* Performance Overview */}
                {(grouped.overview?.length ?? 0) > 0 && (
                  <>
                    <div className="flex items-center justify-between bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <ClipboardList className="w-5 h-5 text-yellow-400" />
                        <span className="font-semibold text-white">Performance Overview</span>
                      </div>
                    </div>

                    <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-700/50 space-y-3">
                      {grouped.overview.map((p, i) => (
                        <div key={i} className="flex items-start gap-3 bg-transparent p-2 rounded-lg">
                          <FileText className="w-5 h-5 text-slate-400 mt-1" />
                          <p className="text-slate-100 text-sm leading-relaxed">{p}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Resume Review */}
                {(grouped.resume?.length ?? 0) > 0 && (
                  <>
                    <div className="flex items-center justify-between bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-cyan-400" />
                        <span className="font-semibold text-white">Resume Review</span>
                      </div>
                    </div>

                    <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-700/50 space-y-3">
                      {grouped.resume.map((p, i) => (
                        <div key={i} className="flex items-start gap-3 bg-transparent p-2 rounded-lg">
                          <FileText className="w-5 h-5 text-slate-400 mt-1" />
                          <p className="text-slate-100 text-sm leading-relaxed">{p}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Recommendations */}
                {(grouped.recommendations?.length ?? 0) > 0 && (
                  <>
                    <div className="flex items-center justify-between bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <ListChecks className="w-5 h-5 text-green-400" />
                        <span className="font-semibold text-white">Recommendations</span>
                      </div>
                    </div>

                    <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-700/50">
                      <ol className="list-decimal ml-6 my-2 space-y-2">
                        {grouped.recommendations.map((r, i) => (
                          <li key={i} className="text-slate-100 text-sm leading-relaxed">{r}</li>
                        ))}
                      </ol>
                    </div>
                  </>
                )}

                {/* Fallback */}
                {(grouped.metrics.length +
                  grouped.overview.length +
                  grouped.resume.length +
                  grouped.recommendations.length === 0) && (
                  <span className="text-gray-400 text-sm font-semibold opacity-60 mt-10 block">
                    No results yet.
                  </span>
                )}
              </div>
            </div>

            {/* Chat */}
            <div className="w-full h-full sm:w-2/4 lg:w-2/5 flex flex-col border-r border-[#222444] overflow-hidden">
              <h2 className="font-bold text-sm text-white p-4 border-b border-[#1b1f2f]">
                Chat History
              </h2>
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
                {chatHistory.length > 0 ? (
                  chatHistory.map((msg, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      {msg.from === "AI" ? (
                        <Bot className="w-6 h-6 text-green-500 mt-1" />
                      ) : (
                        <User className="w-6 h-6 text-cyan-400 mt-1" />
                      )}
                      <div
                        className={`max-w-xs md:max-w-sm p-1 mx-3 rounded-xl ${
                          msg.from === "You"
                            ? "bg-cyan-900/50 rounded-bl-none"
                            : "bg-slate-800/60 rounded-bl-none"
                        }`}
                      >
                        <p className="text-sm text-slate-100 leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm opacity-50">No chat history.</span>
                )}
              </div>
            </div>
          </div>
        </Button>

        {/* Back button */}
        <div className="flex w-full justify-center pb-6 md:pb-10 px-2 mt-2">
          <button
            onClick={() => router.push("/")}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-cyan-600/20 hover:bg-cyan-600 text-cyan-400 border border-cyan-800 shadow hover:scale-105 transition"
            title="Back to Home"
            aria-label="Back to Home"
          >
            <Home className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Result;
