"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Webcam from "react-webcam";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Video, VideoOff, Bot, User, Play, LogOut } from "lucide-react";
import { Button } from "./ui/MovingBorders";
import { motion, AnimatePresence } from "framer-motion";
import { Typewriter } from "@/components/Typerwriter";


/* ----------------------------- Types & Consts ----------------------------- */

type Msg = { from: "ai" | "user"; text: string };

enum Phase {
  IDLE = "IDLE",
  LISTEN_ARMED = "LISTEN_ARMED", // mic armed, waiting for voice
  CAPTURING = "CAPTURING", // user is speaking
  SENDING = "SENDING", // sending to server
  PLAYING = "PLAYING", // AI audio playing
  ENDED = "ENDED",
}

type ExperienceProps = { sessionId: string; email: string };

/* ------------------------- Speech + VAD (no library) ---------------------- */

function useVad(streamRef: React.MutableRefObject<MediaStream | null>) {
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!streamRef.current) return;
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        ctxRef.current = ctx;
        const src = ctx.createMediaStreamSource(streamRef.current!);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.2;
        src.connect(analyser);
        analyserRef.current = analyser;
        dataRef.current = new Uint8Array(analyser.frequencyBinCount);

        const SILENCE_HANG_MS = 1500;
        const THRESH = 0.012;
        let lastAbove = 0;

        const loop = () => {
          if (!mounted) return;
          rafRef.current = requestAnimationFrame(loop);
          const a = analyserRef.current;
          if (!a) return;
          const td = new Uint8Array(a.fftSize);
          a.getByteTimeDomainData(td);
          let sum = 0;
          for (let i = 0; i < td.length; i++) {
            const v = (td[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / td.length);
          const now = performance.now();
          if (rms > THRESH) {
            lastAbove = now;
            if (!speaking) {
              setSpeaking(true);
           
            }
          } else {
            if (speaking && now - lastAbove > SILENCE_HANG_MS) {
              setSpeaking(false);
           
            }
          }
        };
        loop();
      } catch (e) {
       
      }
    })();
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try { ctxRef.current?.close(); } catch {}
    };
  }, [streamRef]);

  return speaking;
}

/* ------------------------------ Main Component ---------------------------- */

export default function Experience({ sessionId, email }: ExperienceProps) {
  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/";

  // UI state
  const [phase, setPhase] = useState<Phase>(Phase.IDLE);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [videoOn, setVideoOn] = useState(true);
  const [muted, setMuted] = useState(false);
  const [clock, setClock] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [interim, setInterim] = useState("");
  const [manualText, setManualText] = useState("");

  // near other derived helpers
const aiSpeaking = phase === Phase.PLAYING;
const chatBoxRef = useRef<HTMLDivElement | null>(null);

  // Media & audio
  const micStreamRef = useRef<MediaStream | null>(null);
  const srRef = useRef<SpeechRecognition | null>(null);
  const srActiveRef = useRef(false);
  const interimRef = useRef<string>("");
  const sessionAccumRef = useRef<string>(""); // per-SR session finals
  const phaseRef = useRef<Phase>(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Playback scheduling
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioReadyRef = useRef(false);
  const scheduledAtRef = useRef(0);
  const activeSourcesRef = useRef(0);

  // Chunk ACK tracking
  const bufferedChunks = useRef<Set<number>>(new Set());
  const playedChunks = useRef<Set<number>>(new Set());

  const endedRef = useRef(false);
  const streamingRef = useRef(false);

  // Intake lock + pending submit
  const intakeLockedRef = useRef(false);
  const pendingSubmitRef = useRef<string | null>(null);

// abort in-flight fetch stream end interview
const streamAbortRef = useRef<AbortController | null>(null);
const activeNodesRef = useRef<Set<AudioBufferSourceNode>>(new Set());


  // --- Cross-pause accumulation ---
  const answerBufRef = useRef<string>(""); // whole answer across SR sessions
  const lastSpeechTsRef = useRef<number>(0); // last time we had speech
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const RESUME_GRACE_MS = 6000; // user can pause briefly and continue same answer
  function clearCommitTimer() {
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
  }

  function appendToAnswer(text: string) {
    if (!text || intakeLockedRef.current) return; // ignore while locked

    const stitched = (answerBufRef.current + " " + text).replace(/\s+/g, " ").trim();
    answerBufRef.current = stitched;

  }

  function scheduleCommit() {
    clearCommitTimer();
  

    commitTimerRef.current = setTimeout(() => {
      const finalText = answerBufRef.current.trim();

      if (!finalText) return;

      // Defer if AI is busy
      if (intakeLockedRef.current || phaseRef.current === Phase.SENDING || phaseRef.current === Phase.PLAYING) {
        pendingSubmitRef.current = finalText;

        return;
      }

      // Safe to send now
      submitUser(finalText);
      answerBufRef.current = "";
      setInterim("");
    }, RESUME_GRACE_MS);
  }



  // Auto-scroll

  const contentRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
  if (!chatBoxRef.current || !contentRef.current) return;
  const scroller = chatBoxRef.current;
  const ro = new ResizeObserver(() => {
    scroller.scrollTop = scroller.scrollHeight;
  });
  ro.observe(contentRef.current);
  return () => ro.disconnect();
}, []);


 const chatEndRef = useRef<HTMLDivElement | null>(null); 

useEffect(() => {
  if (!chatBoxRef.current) return;
  requestAnimationFrame(() => {
    const el = chatBoxRef.current!;
    el.scrollTop = el.scrollHeight;
  });
}, [messages, interim]);

  // Interview timer
  useEffect(() => {
    if (phase === Phase.ENDED || phase === Phase.IDLE) return;
    const id = setInterval(() => setClock((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // User gesture to unlock AudioContext
  useEffect(() => {
    const unlock = () => {
      if (!audioReadyRef.current) {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioCtxRef.current = ctx;
          scheduledAtRef.current = ctx.currentTime;
          audioReadyRef.current = true;
        } catch (e) {
       
        }
      }
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
    };
    document.addEventListener("click", unlock);
    document.addEventListener("touchstart", unlock);
    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
    };
  }, []);

  // Acquire mic stream once
  useEffect(() => {
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = s;
      } catch (e) {
       
      }
    })();
  }, []);

  // Simple format mm:ss
  const fmt = (n: number) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

  /* --------------------------- Native Web Speech --------------------------- */

  const speechSupported = typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  // Gate recognizer using VAD
  const speaking = useVad(micStreamRef);
  const speakingPrev = useRef(false);

  const startShortSR = () => {
    if (!speechSupported || srActiveRef.current) return;
 

    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec: SpeechRecognition = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;

    let silenceTimeout: NodeJS.Timeout | null = null;
    let lastInterimTime = Date.now();

    rec.onstart = () => {
      srActiveRef.current = true;
      sessionAccumRef.current = ""; // reset per-session finals
      interimRef.current = "";      // reset live interim
      setInterim("");
      setPhase(Phase.CAPTURING);
      
    };

    rec.onresult = (e: SpeechRecognitionEvent) => {
      if (intakeLockedRef.current) return; // ignore while AI busy
      let liveInterim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const seg = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          sessionAccumRef.current = (sessionAccumRef.current + " " + seg).replace(/\s+/g, " ").trim();
          appendToAnswer(seg);
          clearCommitTimer();
          scheduleCommit();
        } else {
          liveInterim += seg;
        }
      }

      interimRef.current = liveInterim;
      const preview = (
        (sessionAccumRef.current + " " + liveInterim)
          .replace(/\s+/g, " ")
          .trim()
      );
      setInterim(preview);
      setPhase(Phase.CAPTURING);

      lastInterimTime = Date.now();
      if (silenceTimeout) clearTimeout(silenceTimeout);
      silenceTimeout = setTimeout(() => { try { rec.stop(); } catch {} }, 3000);
    };

    rec.onerror = (e) => {
      if (intakeLockedRef.current) return;
    
      setPhase(Phase.LISTEN_ARMED);
    };

    rec.onend = () => {
      if (intakeLockedRef.current) return; // drop late finals after stop
      srActiveRef.current = false;
      if (silenceTimeout) { clearTimeout(silenceTimeout); silenceTimeout = null; }

      const leftover = (interimRef.current || "").trim();
      if (leftover) {
        sessionAccumRef.current = (sessionAccumRef.current + " " + leftover).replace(/\s+/g, " ").trim();
        appendToAnswer(leftover);
      }

    

      interimRef.current = "";
      setInterim("");
      lastSpeechTsRef.current = Date.now();
      setPhase(Phase.LISTEN_ARMED);
    };

    try {
      rec.start();
      srRef.current = rec;
    } catch (e) {

    }
  };

  // VAD-driven SR control
  useEffect(() => {
   

    if (phase === Phase.LISTEN_ARMED && speaking && !speakingPrev.current) {
      const sinceLast = Date.now() - lastSpeechTsRef.current;
      if (sinceLast < RESUME_GRACE_MS && answerBufRef.current.trim()) {
      
        clearCommitTimer();
        if (!srActiveRef.current) startShortSR();
      } else {
        startShortSR();
      }
    }

    speakingPrev.current = speaking;
  }, [speaking, phase]);

  const stopSR = () => {
    try { srRef.current?.stop(); } catch {}
    srRef.current = null;
    srActiveRef.current = false;

  };

  // Fallback: start SR after delay if VAD doesn't trigger
  useEffect(() => {
    if (phase === Phase.LISTEN_ARMED && speechSupported && !srActiveRef.current) {
      const fallbackTimer = setTimeout(() => {
        if (phase === Phase.LISTEN_ARMED && !srActiveRef.current) {
        
          startShortSR();
        }
      }, 2000);
      return () => clearTimeout(fallbackTimer);
    }
  }, [phase]);

  /* --------------------------- Server Interaction -------------------------- */

  const streamAI = async (endpoint: string, user_input: string, retryCount = 0) => {
    if (streamingRef.current || endedRef.current) return;
    streamingRef.current = true;

    // LOCK intake now; drop any late SR events from the previous turn
    intakeLockedRef.current = true;
    clearCommitTimer();
    stopSR();
    setPhase(Phase.SENDING);


    // create placeholder AI message
    let aiIdx = -1;
    setMessages((prev) => { aiIdx = prev.length; return [...prev, { from: "ai", text: "" }]; });

    try {
       const ac = new AbortController();
  streamAbortRef.current = ac;
  const res = await fetch(`${API_BASE_URL}api/v1/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: String(sessionId), user_input, email }),
   signal: ac.signal,

      });

      if (!res.ok) {
      
        const errorText = await res.text();
      
        throw new Error(`Server error: HTTP ${res.status} - ${errorText}`);
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
          if (endedRef.current) {
      try { reader.cancel(); } catch {}
     break;
    }
        buf += dec.decode(value, { stream: true });

        // process NDJSON
        let start = 0; let nl = 0;
        while ((nl = buf.indexOf("\n", start)) !== -1) {
          const line = buf.slice(start, nl).trim();
          start = nl + 1;
          if (!line) continue;
          try {
            const obj = JSON.parse(line);
            // text updates
            if (typeof obj.text === "string" && aiIdx >= 0) {
              const clean = obj.text.replace("INTERVIEW_END", "").replace("DONE", "");
              setMessages((prev) => prev.map((m, i) => (i === aiIdx ? { ...m, text: m.text + clean } : m)));
              if (obj.text.includes("INTERVIEW_END") || obj.text.includes("DONE")) {
                gracefulEnd();
              }
            }
            // audio chunks
            const chunkNum: number | undefined = typeof obj.chunk === "number" ? obj.chunk : obj.audio?.chunk_num;
            const base64 = typeof obj.audio === "string" ? obj.audio : obj.audio?.audio;
            if (base64) await playB64(base64, chunkNum);
          } catch {}
        }
        buf = buf.slice(start);
      }
  
        } catch (e: any) {
    if (e?.name === "AbortError") {
     
     return;
    }
      

      if (retryCount < 2 && e instanceof Error && e.message.includes("Server error")) {
       
        setMessages((p) => [...p, { from: "ai", text: `🔄 Retrying connection... (${retryCount + 1}/2)` }]);
        streamingRef.current = false;
        setTimeout(() => { streamAI(endpoint, user_input, retryCount + 1); }, 2000);
        return;
      }

      setMessages((p) => [...p, { from: "ai", text: "Sorry, I ran into a network error." }]);
   } finally {
   streamAbortRef.current = null;
      streamingRef.current = false;
      // If no audio queued/playing, unlock and re-arm listening
      if (activeSourcesRef.current === 0 && !endedRef.current) {
        intakeLockedRef.current = false; // UNLOCK here (no audio path)
        setPhase(Phase.LISTEN_ARMED);
     
        // Flush deferred commit if any
        if (pendingSubmitRef.current) {
          const toSend = pendingSubmitRef.current.trim();
          pendingSubmitRef.current = null;
          if (toSend) submitUser(toSend);
          answerBufRef.current = "";
          setInterim("");
        }
      }
    }
  };

  const ackChunk = async (n: number) => {
    try {
      await fetch(`${API_BASE_URL}api/v1/acknowledge_chunk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: String(sessionId), chunk: n }),
      });
    } catch {}
  };

const gracefulEnd = async () => {
   // Block any further intake/streams immediately
   endedRef.current = true;
   intakeLockedRef.current = true;
   clearCommitTimer();
   pendingSubmitRef.current = null;
   answerBufRef.current = "";
   setInterim("");

   // Stop SR and mic
   stopSR();
   try { micStreamRef.current?.getTracks().forEach(t => t.stop()); } catch {}

   // Abort in-flight streaming fetch (and prevent retries)
   try { streamAbortRef.current?.abort(); } catch {}
   streamAbortRef.current = null;
   streamingRef.current = false;

   // Hard-stop any scheduled/playing audio
   try {
     activeNodesRef.current.forEach(node => { try { node.stop(0); } catch {} });
     activeNodesRef.current.clear();
     activeSourcesRef.current = 0;
     if (audioCtxRef.current?.state === "running") {
       await audioCtxRef.current.suspend().catch(() => {});
     }
   } catch {}

   // Flip UI state last
   setPhase(Phase.ENDED);
   setShowResult(true);

   // Notify backend
   try {
     await fetch(`${API_BASE_URL}api/v1/end_interview`, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: String(sessionId), email }),
     });
   } catch {}
 };

  /* ------------------------------ Audio player ----------------------------- */

  const playB64 = async (b64: string, chunkNum?: number) => {
    if (!audioReadyRef.current || !audioCtxRef.current) return;
    try {
      // decode base64 → ArrayBuffer
      const bin = atob(b64);
      const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const ab = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);

      const ctx = audioCtxRef.current!;
      const buf = await ctx.decodeAudioData(ab);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      activeNodesRef.current.add(src);

      const now = ctx.currentTime;
      const t = Math.max(now, scheduledAtRef.current);
      src.start(t);
      scheduledAtRef.current = t + (buf.duration || 0.4);

      activeSourcesRef.current += 1;
      setPhase(Phase.PLAYING);

      src.onended = () => {
        activeSourcesRef.current -= 1;
        activeNodesRef.current.delete(src);
        if (typeof chunkNum === "number") {
          playedChunks.current.add(chunkNum);
          bufferedChunks.current.add(chunkNum);
        }
        if (activeSourcesRef.current === 0 && !endedRef.current) {
          // ACK all played
          const acks = Array.from(bufferedChunks.current);
          bufferedChunks.current.clear();
          playedChunks.current.clear();
          acks.forEach((n) => ackChunk(n));
          // UNLOCK and re-arm listening for next turn
          intakeLockedRef.current = false; // UNLOCK here (audio path)
          setPhase(Phase.LISTEN_ARMED);
      

          // Flush any deferred commit now
          if (pendingSubmitRef.current) {
            const toSend = pendingSubmitRef.current.trim();
            pendingSubmitRef.current = null;
            if (toSend) submitUser(toSend);
            answerBufRef.current = "";
            setInterim("");
          }
        }
      };
    } catch (e) {
   
    }
  };

  /* ------------------------------ User actions ----------------------------- */

  const onStart = async () => {
    if (endedRef.current) return;
    setPhase(Phase.LISTEN_ARMED);
    await streamAI("start_interview", "start");
  };

  const submitUser = async (text: string) => {
    if (!text.trim() || endedRef.current) return;
    setMessages((p) => [...p, { from: "user", text }]);
    setInterim("");
    await streamAI("continue_interview", text.trim());
  };

  const onLeave = () => {
  clearCommitTimer();
   pendingSubmitRef.current = null;
   answerBufRef.current = "";
   setInterim("");
   gracefulEnd();
 };

  /* ---------------------------------- UI ---------------------------------- */

  const workExperience = [{ id: 1, title: " Engineer", description: "React.js, Next.js, Tailwind..." }];
  const frontendExp = workExperience.find((c) => c.title.toLowerCase().includes("frontend"));

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-[#05081A] flex items-center justify-center flex-col pt-5">
     {showResult && (
  <div
    className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center"
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-modal-title"
      className="relative w-[92vw] max-w-md rounded-2xl border border-gray-800 bg-[#0b0f14]/80 p-6 shadow-2xl text-slate-200"
    >
      <button
        onClick={() => setShowResult(false)}
        className="absolute top-2 right-2 text-slate-400 hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-md px-1"
        aria-label="Close"
        title="Close"
      >
        ✕
      </button>

      <h2 id="result-modal-title" className="text-xl font-medium mb-4 text-center">
        Your interview has ended
      </h2>
      <div className="flex justify-center">
        <button
          onClick={() => router.push(`/result`)}
          className="px-4 py-2 rounded-lg border border-white/10 bg-white/0 hover:bg-white/5 hover:border-white/20 text-slate-200 hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          Show Result
        </button>
      </div>
    </div>
  </div>
)}


      <div className="w-full px-9 pl-14 sm:px-6 pb-4 flex flex-col sm:flex-row items-center justify-between">
        <div className="flex items-center md:gap-5 gap-2 md:ml-7 flex-wrap">
          <span className="!font-bold !text-xl md:!text-2xl text-white">IntervueAI</span>
          <span className="ml-2 text-gray-400 !text-xs border border-gray-700 bg-[#222444] rounded-full px-3 py-0.5">English</span>
          <span className="ml-2 text-green-400 !text-xs border border-gray-700 bg-[#18271A] rounded-full px-3 py-0.5">Hiring</span>
        </div>
        <div className="flex items-center gap-3 mt-3 sm:mt-0">
          <span className="text-slate-200/90 mr-1 md:!text-lg !text-sm">Interview Time</span>
          <span className="font-mono !text-sm md:!text-lg pt-1 font-semibold text-green-400">{fmt(clock)}</span>
        </div>
      </div>

      <Button duration={15000} borderRadius="1.75rem" className="text-black dark:text-white border-neutral-200 dark:border-slate-800 w-full max-w-none max-h-full min-h-[50vh] flex" containerClassName="w-full max-w-none">
        <div className="flex flex-row w-full max-w-full max-h-full min-h-[69vh] h-full gap-7 md:gap-8">
          {/* Left: Camera card */}
          <div className="relative w-full min-w-[50vw] p-9 my-5 sm:my-0 max-w-[50vw] md:flex-1 rounded-3xl bg-[#0c1327] flex flex-col shadow-md mb-4 md:mb-0">
            <div className="relative flex-1 w-full min-h-[200px] justify-center items-center sm:aspect-video max-w-[50vw] md:flex-1 rounded-3xl bg-black flex flex-col shadow-md mb-4 md:mb-0">
              {videoOn ? (
                <Webcam audio={false} mirrored className="w-full h-full object-cover rounded-2xl transition-all duration-300" />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-white text-2xl">📷 Video Off</div>
              )}
              <div className="absolute top-3 right-3 bg-red-500/90 !text-sm md:!text-lg text-white px-3 py-1 rounded-full shadow font-bold select-none">Rec</div>
              <div className="absolute top-3 left-3 bg-black/30 text-white text-xs rounded px-3 py-0.5 select-none">{frontendExp?.title ?? "You"}</div>

              {/* Speaking light */}
              <div className="absolute bottom-3 left-4 flex items-center">
                <div className={`md:w-10 w-5 h-5 md:h-10 rounded-full ring-2 ring-white transition-all duration-300 ${
                  phase === Phase.CAPTURING ? "bg-green-400 animate-pulse ring-green-300" :
                  interim ? "bg-yellow-400 ring-yellow-300" :
                  phase === Phase.LISTEN_ARMED ? "bg-blue-400 ring-blue-300 animate-pulse" :
                  phase === Phase.PLAYING ? "bg-purple-400 ring-purple-300" :
                  "bg-gray-500 ring-gray-400"
                }`} />
                <span className="ml-2 text-xs text-white/60 hidden md:inline">
                  {phase === Phase.CAPTURING ? "Speaking..." :
                   interim ? "💭 Processing your answer..." :
                   phase === Phase.LISTEN_ARMED ? "💬 Ready to speak..." :
                   phase === Phase.PLAYING ? "AI speaking..." : ""}
                </span>
              </div>

              {/* Controls */}
              <div className="absolute bottom-3 right-4 flex items-center gap-2">
                <button
                  onClick={() => {
                    const s = micStreamRef.current; if (!s) return;
                    s.getAudioTracks().forEach((t) => (t.enabled = !muted));
                    setMuted((m) => !m);
                  }}
                  className={`md:w-10 md:h-10 h-6 w-6 flex items-center justify-center rounded-full ${muted ? "bg-gray-700/40 border border-gray-700" : "bg-green-600/20 border border-green-600"} hover:bg-green-500/20 shadow hover:scale-105 transition`}
                  title={muted ? "Unmute" : "Mute"}
                  aria-label={muted ? "Unmute" : "Mute"}
                  disabled={phase === Phase.ENDED}
                >
                  {muted ? <MicOff className="md:w-6 h-3 w-3 md:h-6 text-gray-400" /> : <Mic className="md:w-6 md:h-6 h-3 w-3 text-green-400" />}
                </button>
                <button
                  onClick={() => setVideoOn((v) => !v)}
                  className={`md:w-10 md:h-10 h-6 w-6 flex items-center justify-center rounded-full ${videoOn ? "bg-blue-600/20 border border-blue-600" : "bg-gray-700/40 border border-gray-700"} hover:bg-blue-600/30 shadow hover:scale-105 transition`}
                  title={videoOn ? "Turn off video" : "Turn on video"}
                  aria-label={videoOn ? "Turn off video" : "Turn on video"}
                  disabled={phase === Phase.ENDED}
                >
                  {videoOn ? <Video className="md:w-6 md:h-6 h-3 w-3 text-blue-400" /> : <VideoOff className="w-3 h-3 md:h-6 md:w-6 text-gray-400" />}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Chat panel */}
          <div className="w-full p-6 pl-8 md:py-10 py-20 flex flex-col gap-3 md:gap-5">
            <div  ref={chatBoxRef} className="bg-[#151a2b] rounded-2xl border border-[#333955] shadow p-3 md:p-6 overflow-y-auto text-[0.8rem] h-[250px] min-h-[30vh] md:min-h-[40vh] font-light">
              <div ref={contentRef} className="p-4 space-y-6 custom-scrollbar">
                {messages.map((m, i) => (
                  <div key={i} className="flex items-start gap-2 w-full">
                    <div className="flex-shrink-0 w-9 flex justify-center mt-0.5">
                      <span className={`flex items-center justify-center rounded-full w-6 h-6 ${m.from === "ai" ? "bg-[#181e27]" : "bg-transparent"}`}>
                        {m.from === "ai" ? <Bot className="text-white w-5 h-5" /> : <User className="text-cyan-300 w-5 h-5" />}
                      </span>
                    </div>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i, duration: 0.1 }} className="px-2 py-1 rounded-2xl max-w-[85%] text-[0.6rem] font-normal text-white" style={{ backgroundColor: m.from === "ai" ? "#202733" : "#17313a", borderTopLeftRadius: m.from === "ai" ? "0.25rem" : "1rem", borderTopRightRadius: m.from === "ai" ? "1rem" : "0.25rem", wordBreak: "break-word" }}>
                      {m.from === "ai" ? <Typewriter text={m.text} speed={55} /> : m.text}
                    </motion.div>
                  </div>
                ))}

                <AnimatePresence>
                  {interim && phase !== Phase.PLAYING && (
                    <motion.div key="interim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex items-start justify-end gap-2 w-full">
                      <div className="bg-[#14333d] text-white/90 px-2 py-1 rounded-2xl rounded-tr-md max-w-[100%] text-[1rem] font-normal border border-blue-400/30" style={{ wordBreak: "break-word" }}>
                        <div className="flex items-center gap-2">
                          <span className="text-blue-400">🎤</span>
                          <span>{interim}</span>
                          <span className="text-blue-400 animate-pulse">...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Manual text fallback (only shows if SR unsupported) */}
            {!speechSupported && phase !== Phase.ENDED && (
              <div className="flex gap-2">
                <input value={manualText} onChange={(e) => setManualText(e.target.value)} placeholder="Type your answer…" className="flex-1 bg-[#0f1426] border border-[#333955] rounded-lg px-3 py-2 text-white" />
                <button onClick={() => { if (manualText.trim()) { const t = manualText.trim(); setManualText(""); submitUser(t); } }} className="px-3 py-2 rounded-lg bg-emerald-600 text-white">Send</button>
              </div>
            )}

          {/* === AI speaking status box (green) === */}
<div
  className={[
    "relative rounded-xl shadow min-h-[100px] h-[35%] px-3 py-2",
    "flex items-center justify-center border transition-all duration-300",
    aiSpeaking
      ? "bg-emerald-900/10 border-emerald-600 ring-1 ring-emerald-400/40 shadow-[0_0_16px_rgba(16,185,129,0.28)]"
      : "bg-green-50/10 border-green-700"
  ].join(" ")}
  aria-live="polite"
  aria-atomic="true"
>
  <div className="flex items-center gap-2">
    <Bot className="w-5 h-5 text-emerald-300" />
    <span className="text-emerald-300 font-semibold !text-lg md:!text-2xl">
      IntervueAI
    </span>
  </div>

  <div
    className={[
      "absolute bottom-2 right-2",
      "transition-all duration-300",
      aiSpeaking ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
    ].join(" ")}
  >
    <div className="bg-emerald-950/90 border border-emerald-700 text-emerald-300 rounded-full px-3 py-1 shadow flex items-center gap-2">
      <span className="flex gap-1 ml-1">
        <span className="w-1.5 h-1.5 rounded-full animate-bounce bg-emerald-400" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 rounded-full animate-bounce bg-emerald-400" style={{ animationDelay: "200ms" }} />
        <span className="w-1.5 h-1.5 rounded-full animate-bounce bg-emerald-400" style={{ animationDelay: "400ms" }} />
      </span>
    </div>
  </div>
</div>




          </div>
        </div>
      </Button>
      {/* Footer Start / End buttons */}
<div className="flex w-full justify-center pb-6 md:pb-4 px-2">
  <div className="mt-5">
    {phase === Phase.IDLE ? (
      <button
        onClick={onStart}
        className="mt-4 p-2 px-3 flex items-center gap-2 justify-center rounded-full border text-lg font-bold transition shadow bg-green-600/20 text-green-400 border-green-800 hover:bg-green-700/80 hover:scale-105 disabled:opacity-60"
        title="Start Interview"
        aria-label="Start Interview"
      >
        <Play className="w-5 h-5" />
        <span className="hidden md:inline">Start Interview</span>
      </button>
    ) : phase !== Phase.ENDED ? (
      <button
        onClick={onLeave}
        className="mt-4 p-2 px-3 flex items-center gap-2 justify-center rounded-full bg-red-700/10 hover:bg-red-700/30 shadow hover:scale-105 transition text-red-400 border border-red-800 disabled:opacity-60"
        title="End Interview"
        aria-label="End Interview"
      >
        <LogOut className="w-5 h-5" />
        <span className="hidden md:inline">End Interview</span>
      </button>
    ) : null}
  </div>
</div>
    </div>
  );
}
 