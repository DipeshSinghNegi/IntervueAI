"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { Download, Bot, User, FileText, Star, Home } from "lucide-react";
import { Button } from "./ui/MovingBorders";




const Result = () => {
  const router = useRouter();
 
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const [chatHistory, setChatHistory] = useState<{ from: string; text: string }[]>([]);
  const [resultData, setResultData] = useState<
    { label: string; value: string; icon: JSX.Element }[]
  >([]);

  // Fetch data from backend
  const [sessionId, setSessionId] = useState("");
  const [email, setEmail] = useState("");
  const fetchedRef = useRef(false);
  const searchParams = useSearchParams();

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
    console.warn("Missing session_id or email in localStorage");
    router.push("/"); // or show error
  }
}, []);

  const [userMeta, setUserMeta] = useState<{
    name: string;
    email: string;
    job_role: string;
    company: string;
  } | null>(null);




  const fetchData = async (session_id: string, email: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}api/v1/show_results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id,
          email,
        }),
      });
  

      const data = await res.json();
      console.log("API response:", data);

      if (!Array.isArray(data) || data.length === 0) return;

      const response = data[0];
      setSessionId(response.session?.session_id || session_id);
      setUserMeta({
        name: response.session?.user_email || "N/A",
        email: response.session?.user_email || "N/A",
        job_role: response.session?.role || "N/A",
        company: response.session?.company || "N/A"
      });
      const chat = response.history?.map((item: any) => ({
        from: item.role === "user" ? "You" : "AI",
        text: item.content,
      })) || [];

      setChatHistory(chat);

      const parsedResults = response.results ? parseResults(response.results) : [];
      setResultData(parsedResults);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  };



  const parseResults = (raw: string) => {
    const lines = raw.split("\n").filter(Boolean);
    return lines.map((line) => {
      const [label, value] = line.split(":").map((str) => str.trim());
      let icon;
      switch (label.toLowerCase()) {
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
    a.download = `interview-results-${sessionId}.json`;
    a.click();
  };


  return (
    <div className="min-h-screen pt-7 w-full gap-0 bg-[#05081A] flex flex-col">
      {/* Header */}
      <div className="w-full px-4 sm:px-6 pt-2 pb-2 flex flex-col sm:flex-row items-center justify-center ">
        <div className="w-full px-4 sm:px-6 pt-3 pb-2 flex flex-col items-center text-center gap-2">
          <span className="font-bold text-xl sm:text-2xl text-white">Interview Results</span>
          <pre className="text-white text-xs">
           
            {userMeta && (
              <div className=" gap-2 font-light flex-wrap w-full px-4 sm:px-6 pt-2 pb-1 flex flex-row items-center justify-between">
                <span className="ml-2 text-green-200 border border-gray-700 bg-[#18271A] text-xs rounded-full px-2 py-0.5 font-light "> {userMeta.email}</span  > 


                <span className="ml-2 text-gray-400 text-xs border border-gray-700 bg-[#222444] rounded-full px-2 py-0.5 font-light">English</span>
         
                <span className="ml-2 text-violet-200 border border-gray-700 bg-[#1d1827] text-xs rounded-full px-2 py-0.5" >{userMeta.company}</span> 
       
                <span className="ml-2 text-violet-200 border border-gray-700 bg-[#1d1827] text-xs rounded-full px-2 py-0.5"> {userMeta.job_role}</span>
        </div>

           
            )}
          </pre>


      
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
        <div className="w-full h-[80vh]  bg-[#10131f] border border-[#222444] rounded-2xl flex flex-col sm:flex-row gap-0 overflow-hidden">

          {/* Session */}
          <div className="w-full sm:w-1/5 lg:w-1/6 flex flex-col items-center justify-start bg-[#0d1117]/50 border-r border-[#222444] p-4 text-center">
            <p className="mt-2 text-xs ml-2 text-green-400     px-2 py-0.5">Your unique session</p>
            <div className="text-xs font-light bg-clip-text text-transparent bg-gradient-to-b from-neutral-100 to-green-200 py-4">
              {sessionId || "Loading..."}
            </div>
           
          </div>

  

          {/* Results */}
          <div className="w-full h-full  flex flex-col overflow-hidden">
            <h2 className="font-bold text-xl text-white p-4 border-b border-[#1b1f2f]">Result Summary</h2>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {resultData.length ? (
                resultData.map((row, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-800/40 p-4 rounded-lg border border-slate-700/50 transition-all hover:border-cyan-500/50 hover:bg-slate-800/60">
                    <div className="flex items-center gap-3">
                      {row.icon}
                      <span className="font-semibold text-white">{row.label}</span>
                    </div>
                    <span className="font-bold text-cyan-300 text-lg">{row.value}</span>
                  </div>
                ))
              ) : (
                <span className="text-gray-400 text-sm font-semibold opacity-60 mt-10 block">No results yet.</span>
              )}
            </div>
          </div>


          {/* Chat */}
          <div className="w-full h-full sm:w-2/4 lg:w-2/5  flex flex-col border-r border-[#222444] overflow-hidden">
            <h2 className="font-bold text-sm text-white p-4 border-b border-[#1b1f2f]">Chat History</h2>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
              {chatHistory.length > 0 ? (
                chatHistory.map((msg, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    {/* Icon always first */}
                    {msg.from === "AI" ? (
                      <Bot className="w-6 h-6 text-green-500 mt-1" />
                    ) : (
                      <User className="w-6 h-6 text-cyan-400 mt-1" />
                    )}

                    {/* Message */}
                    <div
                      className={`max-w-xs md:max-w-sm p-1 mx-3 rounded-xl ${msg.from === "You"
                        ? "bg-cyan-900/50 rounded-bl-none"
                        : "bg-slate-800/60 rounded-bl-none"
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
  localStorage.removeItem("session_id");     // ✅ clear session
  // ✅ clear email (optional but recommended)
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
  );
};

export default Result;
