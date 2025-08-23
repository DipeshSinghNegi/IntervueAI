"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Download, Bot, User, FileText, Star, Home, Loader2 } from "lucide-react";
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

/* --------------------------------- UI ------------------------------------ */

const Result = () => {
  const router = useRouter();
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(0);

  const [chatHistory, setChatHistory] = useState<{ from: string; text: string }[]>([]);
  const [resultData, setResultData] = useState<
    { label: string; value: string; icon: JSX.Element }[]
  >([]);

  const [sessionId, setSessionId] = useState("");
  const [email, setEmail] = useState("");
  const fetchedRef = useRef(false);

  // Overlay shown ONLY during the actual API call
  const [isLoading, setIsLoading] = useState(false);

  const updateSessionData = (sessionData: any) => {
    const sid = sessionData?.session?.session_id || "";
    const chat =
      sessionData?.history?.map((item: any) => ({
        from: item.role === "user" ? "You" : "AI",
        text: item.content,
      })) || [];
    const parsedResults = sessionData?.results ? parseResults(sessionData.results) : [];
    setSessionId(sid);
    setChatHistory(chat);
    setResultData(parsedResults);
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
      console.warn("No 'user' in localStorage; skipping results fetch.");
      setAllSessions([]);
      setSessionId("");
      setChatHistory([]);
      setResultData([]);
      return;
    }

    let userEmail = "";
    try {
      const parsed = JSON.parse(storedUser);
      if (typeof parsed === "string") userEmail = parsed;
      else if (parsed && typeof parsed === "object" && parsed.email) userEmail = parsed.email;
    } catch {
      userEmail = storedUser; // raw string fallback
    }
    if (!userEmail) {
      console.warn("No email found inside 'user'; skipping results fetch.");
      setAllSessions([]);
      setSessionId("");
      setChatHistory([]);
      setResultData([]);
      return;
    }

    setEmail(userEmail);
    setIsLoading(true);

    try {
      const endpoint = api("/api/v1/show_results");
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // credentials: "include", // uncomment if your backend uses cookies/sessions
        body: JSON.stringify({ email: userEmail }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error(`❌ ${res.status} ${res.statusText} @ ${endpoint}`, errText);
        throw new Error(`Server error ${res.status}`);
      }

      let data: unknown = null;
      try {
        data = await res.json();
      } catch (e) {
        console.error("❌ Failed to parse JSON response:", e);
      }

      const sessions = Array.isArray(data) ? data : [];
      setAllSessions(sessions);

      if (sessions.length > 0) {
        setSelectedSessionIndex(0);
        updateSessionData(sessions[0]);
      } else {
        setSessionId("");
        setChatHistory([]);
        setResultData([]);
      }
    } catch (err) {
      console.error("❌ Fetch failed:", err);
      // Clear visible state on hard failure (optional)
      setAllSessions([]);
      setSessionId("");
      setChatHistory([]);
      setResultData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const parseResults = (raw: string) => {
    const lines = raw.split("\n").filter(Boolean);
    return lines.map((line) => {
      const [label, value] = line.split(":").map((str) => str.trim());
      let icon;
      switch ((label || "").toLowerCase()) {
        case "resume score":
          icon = <FileText className="w-5 h-5 text-cyan-400" />;
          break;
        case "overall performance":
          icon = <Star className="w-5 h-5 text-yellow-400" />;
          break;
        case "communication":
          icon = <Bot className="w-5 h-5 text-purple-400" />;
          break;
        default:
          icon = <FileText className="w-5 h-5 text-slate-400" />;
      }
      return { label, value, icon };
    });
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify({ sessionId, chatHistory, resultData }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-results-${sessionId || "unknown"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

            {/* Results */}
            <div className="w-full h-full flex flex-col overflow-hidden">
              <h2 className="font-bold text-xl text-white p-4 border-b border-[#1b1f2f]">
                Result Summary
              </h2>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {resultData.length ? (
                  resultData.map((row, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-slate-800/40 p-4 rounded-lg border border-slate-700/50 transition-all hover:border-cyan-500/50 hover:bg-slate-800/60"
                    >
                      <div className="flex items-center gap-3">
                        {row.icon}
                        <span className="font-semibold text-white">{row.label}</span>
                      </div>
                      <span className="font-bold text-cyan-300 text-lg">{row.value}</span>
                    </div>
                  ))
                ) : (
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
