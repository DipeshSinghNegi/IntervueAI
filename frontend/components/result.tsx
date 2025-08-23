"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { Download, Bot, User, FileText, Star, Home, Loader2, Percent, ClipboardList, ListChecks } from "lucide-react";
import { Button } from "./ui/MovingBorders";

/* ----------------------------- Types ----------------------------- */
type ChatMsg = { from: string; text: string };

type Metric = { label: string; value: string };
type GroupedResults = {
  metrics: Metric[];
  overview: string[];        // paragraphs
  resume: string[];          // paragraphs (often 1+)
  recommendations: string[]; // bullets / numbered
};

const Result = () => {
  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
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
  const searchParams = useSearchParams();

  const [userMeta, setUserMeta] = useState<{
    name: string;
    email: string;
    job_role: string;
    company: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || fetchedRef.current) return;
    fetchedRef.current = true;

    const localSessionId = localStorage.getItem("session_id");
    const localEmail = localStorage.getItem("session_email");

    if (localSessionId && localEmail) {
      setSessionId(localSessionId);
      setEmail(localEmail);
      fetchData(localSessionId, localEmail);
    } else {
    
      setIsLoading(false);
      router.push("/");
    }
  }, []);

  const fetchData = async (session_id: string, email: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}api/v1/show_results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id, email }),
      });

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        setIsLoading(false);
        return;
      }

      const response = data[0];
      setSessionId(response.session?.session_id || session_id);
      setUserMeta({
        name: response.session?.user_email || "N/A",
        email: response.session?.user_email || "N/A",
        job_role: response.session?.role || "N/A",
        company: response.session?.company || "N/A",
      });

     const hist = Array.isArray(response.history) ? response.history : [];

const chat: ChatMsg[] = hist
  // drop the lone "start" message
  .filter((item: any) => String(item?.content ?? "").trim().toLowerCase() !== "start")
  .map((item: any) => ({
    from: item.role === "user" ? "You" : "AI",
    text: item.content,
  }));

setChatHistory(chat);


      const raw = response.results || "";
      setGrouped(parseGroupedResults(raw));
    } catch (err) {
     
    } finally {
      setIsLoading(false);
    }
  };

  /* ----------------------- Robust results parser ----------------------- */
  function normalize(s: string) {
    return s.replace(/\*\*/g, "").replace(/\*/g, "").trim();
  }

  function splitSections(raw: string) {
    // Split by lines, keep non-empty
    const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);

    // Identify headings by common keywords (case-insensitive)
    const headings = {
      metrics: /performance\s*metrics?/i,
      overview: /performance\s*overview/i,
      resume: /resume\s*review/i,
      recs: /recommendations?/i,
    };

    const buckets: { [k: string]: string[] } = {
      metrics: [],
      overview: [],
      resume: [],
      recs: [],
      rest: [],
    };

    let current: keyof typeof buckets = "rest";
    for (const line of lines) {
      const plain = normalize(line);

      if (headings.metrics.test(plain)) { current = "metrics"; continue; }
      if (headings.overview.test(plain)) { current = "overview"; continue; }
      if (headings.resume.test(plain)) { current = "resume"; continue; }
      if (headings.recs.test(plain)) { current = "recs"; continue; }

      buckets[current].push(plain);
    }
    return buckets;
  }

  function parseMetrics(lines: string[]): Metric[] {
    // Accept formats like:
    //  * "Technical Knowledge" 60%
    //  * Technical Knowledge: 60%
    //  * Technical Knowledge - 60%
    //  * "Communication Proficiency" : 50 %
    const out: Metric[] = [];
    const rx = /^"?\*?\s*"?([^"%:–-]+?)"?\s*[:–-]?\s*(\d{1,3})\s*%$/i;

    for (const line of lines) {
      // Skip any intro sentences that often appear under "Based on our mock interview..."
      if (/based on|summary of your performance/i.test(line)) continue;

      const m = line.match(rx);
      if (m) {
        out.push({ label: m[1].trim().replace(/^"|"$/g, ""), value: `${m[2]}%` });
      }
    }
    return out;
  }

  function parseParagraphs(lines: string[]): string[] {
    // Merge wrapped lines into paragraphs while preserving bullets like "- ..." or "1. ...".
    const paras: string[] = [];
    let buf: string[] = [];

    const flush = () => {
      const txt = buf.join(" ").trim();
      if (txt) paras.push(txt);
      buf = [];
    };

    for (const line of lines) {
      // If it's a bullet/numbered line, treat as its own paragraph
      if (/^(-|\d+\.)\s+/.test(line)) {
        flush();
        paras.push(line.replace(/^(-|\d+\.)\s+/, "").trim());
      } else {
        buf.push(line);
      }
    }
    flush();
    return paras;
  }

  function parseRecommendations(lines: string[]): string[] {
    // Prefer numbered/bulleted; otherwise fallback to paragraphs
    const items: string[] = [];
    for (const line of lines) {
      const m = line.match(/^(?:-|\d+\.)\s*(.+)$/);
      if (m) items.push(m[1].trim());
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

  /* ----------------------- Download helper (unchanged) ----------------------- */
  const handleDownload = () => {
    const blob = new Blob(
      [JSON.stringify({ sessionId, chatHistory, grouped }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-results-${sessionId}.json`;
    a.click();
  };

  /* ----------------------------- Render ----------------------------- */
  return (
    <div className="min-h-screen pt-7 w-full gap-0 bg-[#05081A] flex flex-col relative">
      {isLoading && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center" aria-live="assertive" aria-busy="true" role="alert">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-[#0b0f14]/80 border border-gray-800 px-8 py-6 shadow-2xl text-slate-200">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Fetching your results…</p>
          </div>
        </div>
      )}

      <div className={isLoading ? "blur-sm opacity-70 pointer-events-none" : ""}>
        {/* Header */}
        <div className="w-full px-4 sm:px-6 pt-2 pb-2 flex flex-col sm:flex-row items-center justify-center ">
          <div className="w-full px-4 sm:px-6 pt-3 pb-2 flex flex-col items-center text-center gap-2">
            <span className="font-bold text-xl sm:text-2xl text-white">Interview Results</span>
            <pre className="text-white text-xs">
              {userMeta && (
                <div className=" gap-2 font-light flex-wrap w/full px-4 sm:px-6 pt-2 pb-1 flex flex-row items-center justify-between">
                  <span className="ml-2 text-green-200 border border-gray-700 bg-[#18271A] text-xs rounded-full px-2 py-0.5 font-light ">
                    {userMeta.email}
                  </span>
                  <span className="ml-2 text-gray-400 text-xs border border-gray-700 bg-[#222444] rounded-full px-2 py-0.5 font-light">
                    English
                  </span>
                  <span className="ml-2 text-violet-200 border border-gray-700 bg-[#1d1827] text-xs rounded-full px-2 py-0.5">
                    {userMeta.company}
                  </span>
                  <span className="ml-2 text-violet-200 border border-gray-700 bg-[#1d1827] text-xs rounded-full px-2 py-0.5">
                    {userMeta.job_role}
                  </span>
                </div>
              )}
            </pre>
          </div>
        </div>

        {/* Result Section UI (unchanged wrapper) */}
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
          <div className="w-full h-[80vh]  bg-[#10131f] border border-[#222444] rounded-2xl flex flex-col sm:flex-row gap-0 overflow-hidden">
            {/* Session */}
            <div className="w-full sm:w-1/5 lg:w-1/6 flex flex-col items-center justify-start bg-[#0d1117]/50 border-r border-[#222444] p-4 text-center">
              <p className="mt-2 text-xs ml-2 text-green-400 px-2 py-0.5">Your unique session</p>
              <div className="text-xs font-light bg-clip-text text-transparent bg-gradient-to-b from-neutral-100 to-green-200 py-4">
                {sessionId || "Loading..."}
              </div>
            </div>

            {/* Results (GROUPED) */}
            <div className="w-full h-full  flex flex-col overflow-hidden">
              <h2 className="font-bold text-xl text-white p-4 border-b border-[#1b1f2f]">Result Summary</h2>
<div
  className="
    flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar
    [&_p]:text-base [&_li]:text-base
    md:[&_p]:text-xl md:[&_li]:text-xl md:[&_span.font-semibold]:text-2xl
  "
>

                {/* Performance Metrics (one box) */}
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
      "text-cyan-300"; // mid-range

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

                {/* Performance Overview (one box) */}
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

                {/* Resume Review (one box) */}
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

                {/* Recommendations (one box) */}
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

            {/* Chat (unchanged) */}
            <div className="w-full h-full sm:w-2/4 lg:w-2/5  flex flex-col border-r border-[#222444] overflow-hidden">
              <h2 className="font-bold text-sm text-white p-4 border-b border-[#1b1f2f]">Chat History</h2>
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
                          msg.from === "You" ? "bg-cyan-900/50 rounded-bl-none" : "bg-slate-800/60 rounded-bl-none"
                        }`}
                      >
                        <p className="text-sm  text-slate-100 leading-relaxed">{msg.text}</p>
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
            onClick={() => {
              localStorage.removeItem("session_id");
              router.push("/");
            }}
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
