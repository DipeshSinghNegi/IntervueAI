
"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import Webcam from "react-webcam";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Mic, MicOff, Video, VideoOff, LogOut, Play, Bot, User } from "lucide-react";
import { Button } from "./ui/MovingBorders";
import { motion, AnimatePresence } from "framer-motion";
import { Typewriter } from "@/components/Typerwriter";





declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}
type Chunk = {
  chunk_num: number;
  role: string;
  text: string;
  status?: string; 
};
type MySpeechRecognitionEvent = Event & { results: SpeechRecognitionResultList };

const workExperience = [
  { id: 1, title: " Engineer", description: "React.js, Next.js, Tailwind..." }
];

  
 type ExperienceProps = {
  sessionId: string;
  email: string;
};
 



export default function Experience({ sessionId, email }: ExperienceProps) {
  // --- MSE streaming setup ---
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const allChunks = useMemo(() => [...chunks], [chunks]);
            const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

  const sessionEndedRef = useRef(false);

 
  const activeAudioSourcesRef = useRef(0);

  const [showResultPopup, setShowResultPopup] = useState(false);

  const params = useParams();

  const searchParams = useSearchParams();

let longPauseCount = 0;

  const currentAIChunkNumsRef = useRef<number | null>(null); 

  const bufferedChunkNumsRef = useRef<Set<number>>(new Set()); 
  const playedChunkNumsRef = useRef<Set<number>>(new Set());   


  const [interimVisible, setInterimVisible] = useState(false);
  const [showInterim, setShowInterim] = useState(false);



  const [messages, setMessages] = useState<
    { from: "ai" | "user"; text: string; audio?: string[] }[]
  >([]);
  const [muted, setMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const [timerActive, setTimerActive] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [aiStreaming, setAiStreaming] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [liveInterim, setLiveInterim] = useState("");
  const [speaking, setSpeaking] = useState<"ai" | "student" | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const recognitionRef = useRef<any>(null);
  const pendingMicResumeRef = useRef(false);

 
  const frontendExp = workExperience.find((card) =>
    card.title.toLowerCase().includes("frontend")
  );

// Add these refs and state
  const micRunningRef = useRef(false);

  const isRecognizingRef = useRef(false); 

const [isContextReady, setIsContextReady] = useState(false);
const audioContextRef = useRef<AudioContext | null>(null);
const scheduledTimeRef = useRef<number>(0); 
const chunkDurationRef = useRef<number>(0.4); 

const mediaSourceRef = useRef<MediaSource | null>(null);
const sourceBufferRef = useRef<SourceBuffer | null>(null);
const audioChunkQueueRef = useRef<Uint8Array[]>([]);
const audioElementRef = useRef<HTMLAudioElement | null>(null);
const [audioUrl, setAudioUrl] = useState<string | null>(null);
const [isSourceBufferReady, setIsSourceBufferReady] = useState(false);
 const MAX_QUEUE_SIZE = 100;
let throttleTimeout: ReturnType<typeof setTimeout> | null = null;
const isStreamingRef = useRef(false);           // prevents overlap
const [aiSpeaking, setAiSpeaking] = useState(false); 
  const [isRecognizing, setIsRecognizing] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);



  let restartLock = false;

const resumeMicWhenSafe = () => {
  if (restartLock) return;
  restartLock = true;
  
  const interval = setInterval(() => {
    if (
      !aiSpeaking &&
      recognitionRef.current &&
      !micRunningRef.current &&
      pendingMicResumeRef.current
    ) {
      try {
        // Line 149 - Add state validation before start()
        if (recognitionRef.current.readyState !== 'running') {
          recognitionRef.current.start();
          micRunningRef.current = true;
          pendingMicResumeRef.current = false;
 
          console.log("🎤 Mic resumed safely after AI finished.");
        } else {
          // Recognition is already running, just sync flags
          micRunningRef.current = true;
          pendingMicResumeRef.current = false;
                
          console.log("🎤 Recognition already running - synced flags");
        }
      } catch (err) {
         const errorMessage = err instanceof Error ? err.message : String(err);
  const errorName = err instanceof Error ? err.name : 'UnknownError';
        if (errorName === 'InvalidStateError' && errorMessage.includes('already started')) {
    micRunningRef.current = true;
    pendingMicResumeRef.current = false;
    console.log("🎤 Recognition was already running - state corrected");
  } else {
    console.warn("Mic restart failed:", errorMessage);
  }
      }
      clearInterval(interval);
      restartLock = false;
    }
  }, 400);
};


//new
useEffect(() => {
  const context = new AudioContext();
  audioContextRef.current = context;
  scheduledTimeRef.current = context.currentTime;

  document.body.addEventListener(
    "click",
    () => {
      context.resume();
    },
    { once: true }
  );

  return () => {
    // Cleanup safely, without returning a Promise
    context.close().catch((err) => {
      console.error("Failed to close AudioContext", err);
    });
  };
}, []);



 
  const acknowledgeAIResponseComplete = async (chunkNum: number) => {
    if (!sessionId || typeof chunkNum !== "number") {
      console.warn("Skipping ACK – invalid chunk or sessionId", { chunkNum });
      return;
    }

    const payload = {
      session_id: String(sessionId),
      chunk: chunkNum, 
    };

  

    try {
      const res = await fetch(`${API_BASE_URL}api/v1/acknowledge_chunk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
    

      if (!res.ok) {
        console.error("❌ ACK failed for chunkNum", chunkNum);
      }
    } catch (err) {
      console.error("🔥 ACK request error:", err);
    }
  };




  useEffect(() => {
    sessionEndedRef.current = sessionEnded;
  }, [sessionEnded]);








// Setup MediaSource for streaming audio
useEffect(() => {
  if (!audioUrl) {
    const mediaSource = new MediaSource();
    mediaSourceRef.current = mediaSource;
    const url = URL.createObjectURL(mediaSource);
    setAudioUrl(url);

    mediaSource.addEventListener("sourceopen", () => {
      try {
        const mime = "audio/webm; codecs=opus";
        if (MediaSource.isTypeSupported(mime)) {
          const sourceBuffer = mediaSource.addSourceBuffer(mime);
          sourceBufferRef.current = sourceBuffer;
          setIsSourceBufferReady(true);

          sourceBuffer.addEventListener("updateend", () => {
            processAudioChunkQueue();
          });
        } else {
          console.error("MIME type not supported:", mime);
        }
      } catch (error) {
        console.error("SourceBuffer setup error:", error);
      }
  
    });
  }

  return () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  };
}, [audioUrl]);
 
// Process queued audio chunks

 const processAudioChunkQueue = () => {
  if (
    !isSourceBufferReady ||
    !sourceBufferRef.current ||
    sourceBufferRef.current.updating ||
    audioChunkQueueRef.current.length === 0
  ) {
    return;
  }

  if (throttleTimeout) return;

  throttleTimeout = setTimeout(() => {
    throttleTimeout = null;

    try {
      const chunk = audioChunkQueueRef.current.shift()!;
      sourceBufferRef.current!.appendBuffer(chunk);
   

    } catch (error) {
      console.error("Error appending audio chunk:", error);
    }
  }, 20); 
};

// Convert and stream base64 audio chunk

  const streamBase64AudioChunk = async (base64Chunk: string,
    chunkNum?: number,
    
    onComplete?: () => void
  ) => {
    try {
 



      if (typeof chunkNum === "number") {
        bufferedChunkNumsRef.current.add(chunkNum);
        console.log("📥 Buffered chunkNum:", chunkNum);
      }
      const binary = atob(base64Chunk);
      const buffer = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        buffer[i] = binary.charCodeAt(i);
      }

      const audioContext = audioContextRef.current;
      if (!audioContext) return;

      const audioBuffer = await audioContext.decodeAudioData(buffer.buffer);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
    

      

      


      const now = audioContext.currentTime;
      const playTime = Math.max(now, scheduledTimeRef.current);
      source.start(playTime);

      const duration = audioBuffer.duration || chunkDurationRef.current;
      scheduledTimeRef.current = playTime + duration;

      setAiSpeaking(true);
      activeAudioSourcesRef.current += 1;
    


     

      source.onended = async() => {
        if (typeof chunkNum === "number") {
          playedChunkNumsRef.current.add(chunkNum);
          console.log("✅ Played chunkNum:", chunkNum);
        }
        activeAudioSourcesRef.current -= 1;
       

        if (typeof chunkNum === "number" && currentAIChunkNumsRef.current !== chunkNum) {
        
          console.log("✅ Actually played and pushed chunkNum:", chunkNum);
        }

       

        
    

          if (activeAudioSourcesRef.current === 0) {
            setAiSpeaking(false);
     

            const toAck = Array.from(bufferedChunkNumsRef.current).filter((n) =>
              playedChunkNumsRef.current.has(n)
            );
        

            for (const chunkNum of toAck) {
              await acknowledgeAIResponseComplete(chunkNum); 
            }


            // Reset sets after ACK
            bufferedChunkNumsRef.current.clear();
            playedChunkNumsRef.current.clear();

            pendingMicResumeRef.current = true;
            resumeMicWhenSafe();
          }




 
        if (onComplete) onComplete();



  pendingMicResumeRef.current = true;


  
       
      };
    } catch (err) {
      console.error("Audio decode/play error:", err);
    }
  };











useEffect(() => {
  const unlockAudio = () => {
    const audio = audioElementRef.current;
    if (audio) {
      audio.play().catch(() => {});
    }
  };

  document.body.addEventListener("click", unlockAudio, { once: true });
  return () => document.body.removeEventListener("click", unlockAudio);
}, []);



  const aiResponseChunkMap = useRef<Map<number, { played: boolean; onPlayed: () => void }>>(new Map());
  let currentAIChunkNums: number[] = []; 



 
  const streamAIReply = async (apiUrl: string, userInput: string) => {
  
// STOP MIC as soon as AI reply starts
  if (recognitionRef.current && micRunningRef.current) {
    try {
      recognitionRef.current.abort();
      micRunningRef.current = false;
      console.log('🔇 Mic stopped - AI about to speak');
    } catch (err) {
      // (safe to ignore)
    }
  }
  setAiStreaming(true);

    if (!sessionId || !userInput || sessionEndedRef.current) {
      console.warn("Skipping stream – session ended or invalid input");
      return;
    }
    console.log("streamAIReply triggered, sessionEnded:", sessionEnded);



    
    if (!sessionId || !userInput) {
      console.warn("Missing sessionId or userInput for streaming");
      return;
    }
   


    if (isStreamingRef.current) {
      console.warn("Already streaming — skipping");
      return;
    }

    isStreamingRef.current = true;

    try {
      recognitionRef.current?.stop(); 
      setAiStreaming(true);

     
      let aiMsgIndex = -1;
      setMessages((prev) => {
        aiMsgIndex = prev.length;
        return [...prev, { from: "ai", text: "" }];
      });

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          user_input: userInput,
          email:email
        }),
      }
    
    
    );

      if (!response.ok) {
        isStreamingRef.current = false;
        setAiStreaming(false);
        setMessages((prev) => [
          ...prev,
          { from: "ai", text: `API Error: ${response.status}` },
        ]);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let rawBuffer = "";

      if (!reader) throw new Error("No response body for streaming.");

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        if (value) {
          rawBuffer += decoder.decode(value, { stream: true });
          let start = 0,
            idx;

          while ((idx = rawBuffer.indexOf("\n", start)) >= 0) {
            const jsonLine = rawBuffer.slice(start, idx).trim();
            start = idx + 1;

            if (jsonLine) {
              try {
                const jsonChunk = JSON.parse(jsonLine);

               
                if (typeof jsonChunk.text === "string" && aiMsgIndex >= 0) {
                  const cleanText = jsonChunk.text.replace("INTERVIEW_END", "").replace("DONE", "");

                  setMessages((prev) =>
                    prev.map((msg, idx) =>
                      idx === aiMsgIndex
                        ? { ...msg, text: msg.text + jsonChunk.text }
                        : msg
                    )
                  );


                  if (
                    jsonChunk.text.includes("INTERVIEW_END") ||
                    jsonChunk.text.includes("DONE")
                  ) {
                    console.log("🚪 Detected end of interview signal.");

                    setTimerActive(false);
                    setSessionEnded(true);
                    React.startTransition(() => {
                      setShowResultPopup(true);
                    });


            
                    try {
                      await fetch(`${API_BASE_URL}api/v1/end_interview`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          session_id: String(sessionId),
                          email: email,
                        }),
                      });
                    } catch (err) {
                      console.error("Failed to send end_interview request:", err);
                    }

                    return; 
                  }

                }


                if (
                  typeof jsonChunk.chunk === "number" &&
                  typeof jsonChunk.audio === "string"
                ) {
                  const chunkNum = jsonChunk.chunk;
                  const base64Audio = jsonChunk.audio;


                  streamBase64AudioChunk(base64Audio, chunkNum);
                }


      



                // Play audio chunk
                if (
                  jsonChunk.audio &&
                  typeof jsonChunk.audio.audio === "string"
                ) 
                 {
                  const chunkNum = jsonChunk.chunk ?? jsonChunk.audio?.chunk_num;
                  const base64Audio = jsonChunk.audio?.audio ?? jsonChunk.audio;

                  if (typeof chunkNum === "number") {
                    currentAIChunkNumsRef.current = chunkNum; 
                    aiResponseChunkMap.current.set(chunkNum, { played: false, onPlayed: () => { } });
                  }

                 

                  streamBase64AudioChunk(jsonChunk.audio.audio, chunkNum);
              
                  if (typeof base64Audio === "string") {
             
                   
                  }
                }
                
              } catch (err) {
                console.warn("Failed to parse JSON line:", jsonLine, err);
              }
            }
          }

          rawBuffer = rawBuffer.slice(start);
        }
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { from: "ai", text: "Sorry, I could not get a response." },
      ]);
    } finally {
      isStreamingRef.current = false;
      setAiStreaming(false);
    }
  };






  
useEffect(() => {
  const audio = audioElementRef.current;
  if (!audio) return;

  const handleTimeUpdate = () => {
    const sourceBuffer = sourceBufferRef.current;
    if (!sourceBuffer || sourceBuffer.updating || sourceBuffer.buffered.length === 0) return;

    try {
      const currentTime = audio.currentTime;
      const bufferedEnd = sourceBuffer.buffered.end(0);

   
      if (bufferedEnd - currentTime > 10 && currentTime > 1) {
        sourceBuffer.remove(0, currentTime - 1);
      }
    } catch (e) {
      console.warn("Buffer cleanup failed:", e);
    }
  };

  audio.addEventListener("timeupdate", handleTimeUpdate);
  return () => {
    audio.removeEventListener("timeupdate", handleTimeUpdate);
  };
}, []);


  useEffect(() => {
    if (liveInterim) {
      setShowInterim(true);
      setInterimVisible(true);

      const fadeTimeout = setTimeout(() => {
        setInterimVisible(false); 
      }, 1500); 

      const clearTimeoutId = setTimeout(() => {
        setShowInterim(false); 
      }, 2000); 

      return () => {
        clearTimeout(fadeTimeout);
        clearTimeout(clearTimeoutId);
      };
    }
  }, [liveInterim]);



  // --- Timers and session end (unchanged) ---
  useEffect(() => {
    if (!timerActive || sessionEnded) return;

    const interval = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, sessionEnded]);


  // --- Speech recognition responding (unchanged) ---
  useEffect(() => {
    setMounted(true);
    if (!("webkitSpeechRecognition" in window)) return;

    const SpeechRecognitionClass =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionClass) return;

const startRecognition = () => {
  if (!isRecognizingRef.current && timerActive && !sessionEnded) {
    try {
      recognition.start();
      isRecognizingRef.current = true;
      micRunningRef.current = true;
      console.log("🎤 Mic started initially");
    } catch (err) {
      console.warn("Safe mic start failed:", err);
    }
  }
};


  


    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      isRecognizingRef.current = true;
    };

    recognition.onend = () => {
  isRecognizingRef.current = false;

  // Let resumeMicWhenSafe handle restarts
  if (mounted && timerActive && !sessionEnded && !aiSpeaking) {
    if (!micRunningRef.current && pendingMicResumeRef.current) {
      console.log("⏳ Mic will resume via resumeMicWhenSafe");
      return; // prevent double start
    }

    // Fallback if AI is not speaking and no pending resume
    if (!micRunningRef.current) {
      try {
        recognition.start();
        isRecognizingRef.current = true;
        micRunningRef.current = true;
        console.log("🎤 Mic restarted directly via onend fallback");
      } catch (err) {
        console.warn("Fallback mic start failed:", err);
      }
    }
  }
};


   let finalTranscriptBuffer = "";
let finalTranscriptTimer: ReturnType<typeof setTimeout> | null = null;
interface MySpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

// --- existing ---
let speechTimeout: ReturnType<typeof setTimeout> | null = null;   // soft deadline
let confirmTimeout: ReturnType<typeof setTimeout> | null = null;  // short confirm
let awaitingConfirm = false;

let accumulatedTranscript = "";
let lastSpeechTime = Date.now();

const DEADLINE_MS = 4000;  // wait longer to allow natural pauses
const CONFIRM_MS = 1000;   // confirm window
const MIN_WORDS  = 1;

// NEW: keep latest interim outside closures so timeouts read fresh text
let interimCache = "";

// --- NEW helpers ---
function armSoftDeadline() {
  if (speechTimeout) clearTimeout(speechTimeout);
  speechTimeout = setTimeout(openConfirmStage, DEADLINE_MS);
}

function cancelConfirmStage() {
  if (!awaitingConfirm) return;
  awaitingConfirm = false;
  if (confirmTimeout) { clearTimeout(confirmTimeout); confirmTimeout = null; }
}

function openConfirmStage() {
  awaitingConfirm = true;
  confirmTimeout = setTimeout(checkAndMaybeSend, CONFIRM_MS);
}

async function checkAndMaybeSend() {
  awaitingConfirm = false;

  // Critical: only proceed if it’s actually been silent long enough right now
  const silentFor = Date.now() - lastSpeechTime;
  if (silentFor < DEADLINE_MS) {
    // We detected recent speech (maybe results were slow). Push the deadline out.
    armSoftDeadline();
    return;
  }

  if (!micRunningRef.current || aiSpeaking) return;

  const fullTranscript = (accumulatedTranscript + interimCache).trim();
  const wordCount = fullTranscript.split(/\s+/).filter(Boolean).length;
  if (wordCount < MIN_WORDS) {
    // Too short—wait again
    armSoftDeadline();
    return;
  }

  // Commit + send
  accumulatedTranscript = "";
  interimCache = "";
  setLiveInterim("");

  recognitionRef.current?.stop();
  setMessages(prev => [...prev, { from: "user", text: fullTranscript }]);
  await streamAIReply(`${API_BASE_URL}api/v1/continue_interview`, fullTranscript);
}

// --- your existing onresult, with 3 small changes ---
recognition.onresult = async (event: MySpeechRecognitionEvent) => {
  if (!micRunningRef.current || aiSpeaking) return;

  let interimTranscript = "";

  for (let i = event.resultIndex; i < event.results.length; ++i) {
    const transcript = event.results[i][0].transcript;

    // 1) refresh lastSpeechTime on any result activity
    lastSpeechTime = Date.now();

    if (event.results[i].isFinal) {
      accumulatedTranscript += transcript + " ";
    } else {
      interimTranscript += transcript;
    }
  }

  // 2) cache interim globally for timeouts
  interimCache = interimTranscript;
  setLiveInterim(interimTranscript);

  // 3) cancel confirm if we were about to send, then push the deadline out
  cancelConfirmStage();
  armSoftDeadline();
};

// --- NEW: cancel/extend timers the moment speech resumes (faster than onresult) ---
recognition.onspeechstart = () => {
  if (!micRunningRef.current) return;
  lastSpeechTime = Date.now();
  cancelConfirmStage();
  armSoftDeadline();
};

recognition.onsoundstart = () => {
  if (!micRunningRef.current) return;
  lastSpeechTime = Date.now();
  cancelConfirmStage();
  armSoftDeadline();
};

// Optional: if you want, mark the start of silence (not required)
// recognition.onsoundend = () => { /* could set a flag if you need */ };

// Cleanup when mic stops/unmounts
function clearAllTimers() {
  if (speechTimeout) { clearTimeout(speechTimeout); speechTimeout = null; }
  if (confirmTimeout) { clearTimeout(confirmTimeout); confirmTimeout = null; }
  awaitingConfirm = false;
}

recognition.onresult = async (event: MySpeechRecognitionEvent) => {
  // IMPORTANT: don’t gate on activeAudioSourcesRef here
  if (!micRunningRef.current || aiSpeaking) return;

  let interimTranscript = "";
  for (let i = event.resultIndex; i < event.results.length; ++i) {
    const transcript = event.results[i][0].transcript;
    if (event.results[i].isFinal) {
      accumulatedTranscript += transcript + " ";
    } else {
      interimTranscript += transcript;
    }
  }

  interimCache = interimTranscript;      // keep snapshot for timeouts
  setLiveInterim(interimTranscript);

  // If we were about to send but the user resumed, cancel the confirm stage
  if (awaitingConfirm) {
    awaitingConfirm = false;
    if (confirmTimeout) { clearTimeout(confirmTimeout); confirmTimeout = null; }
  }

  // Reset the soft deadline on any new speech
  if (speechTimeout) clearTimeout(speechTimeout);
  speechTimeout = setTimeout(() => {
    // Stage 1: we think the user paused. Don’t send yet—wait a short confirm window.
    awaitingConfirm = true;

    confirmTimeout = setTimeout(async () => {
      awaitingConfirm = false;
      if (!micRunningRef.current || aiSpeaking) return;

      const fullTranscript = (accumulatedTranscript + interimCache).trim();
      const wordCount = fullTranscript.split(/\s+/).filter(Boolean).length;
      if (wordCount < MIN_WORDS) return;

  longPauseCount += 1;

if (longPauseCount < 2) {
  // 👉 Instead of waiting for 2nd full DEADLINE, 
  // give the user a grace period to continue speaking
  if (speechTimeout) clearTimeout(speechTimeout);

  speechTimeout = setTimeout(() => {
    awaitingConfirm = true;

    confirmTimeout = setTimeout(async () => {
      awaitingConfirm = false;
      if (!micRunningRef.current || aiSpeaking) return;

      const fullTranscript = (accumulatedTranscript + interimCache).trim();
      const wordCount = fullTranscript.split(/\s+/).filter(Boolean).length;
      if (wordCount < MIN_WORDS) return;

      // ✅ After grace pause → commit once
      longPauseCount = 0;
      accumulatedTranscript = "";
      interimCache = "";
      setLiveInterim("");

      recognitionRef.current?.stop();
      setMessages(prev => [...prev, { from: "user", text: fullTranscript }]);
      await streamAIReply(`${API_BASE_URL}api/v1/continue_interview`, fullTranscript);
    }, CONFIRM_MS);
  }, DEADLINE_MS);

  return; // don’t send yet (let them continue if they resume)
}

      // Second confirmed long pause → send
      longPauseCount = 0;
      accumulatedTranscript = "";
      interimCache = "";
      setLiveInterim("");

      recognitionRef.current?.stop();
      setMessages(prev => [...prev, { from: "user", text: fullTranscript }]);
      await streamAIReply(`${API_BASE_URL}api/v1/continue_interview`, fullTranscript);
    }, CONFIRM_MS);
  }, DEADLINE_MS);
};




    recognition.onerror = () => { };

    if (timerActive && !sessionEnded && !isRecognizingRef.current) {
      try {
        recognition.start();
      } catch (err) {
        console.warn("Mic start failed:", err);
      }
    }

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch { }
      isRecognizingRef.current = false;
    };
  }, [timerActive, sessionEnded, mounted, interviewStarted]);


  useEffect(() => {
    if (liveInterim) {
      setShowInterim(true);
      setInterimVisible(true);

      const fadeTimer = setTimeout(() => {
        setInterimVisible(false);
      }, 1200); 

      const clearTimer = setTimeout(() => {
        setShowInterim(false);
      }, 1800); 

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [liveInterim]);


  // --- Microphone and speaking detection (unchanged) ---
  useEffect(() => {
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(stream);
        const audioContext = new window.AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        detectSpeaking();
      } catch {}
    };
    initAudio();
  }, []);
  const detectSpeaking = () => {
    const check = () => {
      if (analyserRef.current && dataArrayRef.current && !muted) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const volume =
          dataArrayRef.current.reduce((a, b) => a + b, 0) /
          dataArrayRef.current.length;
        setSpeaking(volume > 20 ? "student" : null);
      } else {
        setSpeaking(null);
      }
      requestAnimationFrame(check);
    };
    check();
  };

 

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, liveInterim ,aiStreaming]);


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };
  const handleLeave = async () => {
    setTimerActive(false);
    setSessionEnded(true);
    setShowResultPopup(true); // Just show the popup

    try {
     
      await fetch(`${API_BASE_URL}api/v1/end_interview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: String(sessionId),
          email: email ,
        }),
      });
    } catch (err) {
      console.error("Failed to send end_interview request:", err);
    }
  };


  if (!mounted) return null;


  

return (
 
    
  <div className="min-h-screen  bg-[#05081A] flex items-center justify-center flex-col pt-5">
    <audio
      ref={audioElementRef}
      src={audioUrl || undefined}
      autoPlay
      muted={false}
      style={{ display: 'none' }}
      playsInline
    />
    {showResultPopup && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-80">
        <div className="bg-[#131419] p-8 rounded-2xl shadow-lg flex flex-col items-center border-2 border-gray-600 relative">
          <button
            onClick={() => setShowResultPopup(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-white transition"
            title="Close"
          >
            ✕
          </button>
          <h2 className="text-xl  mb-4 text-white text-center">Your interview has ended</h2>
          <button
            title="Show Result"
            onClick={() => {
              router.push(`/result`);
            }}
            className="text-white bg-gray-600 border border-green-200 hover:bg-green-500 px-3 py-3 rounded-full text-lg "
          >
            Show Result
          </button>
        </div>
      </div>
    )}
    <div className="w-full px-9 pl-14 sm:px-6  pb-4 flex flex-col sm:flex-row items-center justify-between">
      <div className="flex items-center md:gap-5 gap-2 md:ml-7 flex-wrap">
        <span className="!font-bold !text-xl md:!text-2xl  text-white">IntervueAI</span>
        <span className="ml-2 text-gray-400 !text-xs border border-gray-700 bg-[#222444] rounded-full px-3 py-0.5">English</span>
        <span className="ml-2 text-green-400 !text-xs border border-gray-700 bg-[#18271A] rounded-full px-3 py-0.5">Hiring</span>
      </div>
      <div className="flex items-center gap-3 mt-3 sm:mt-0">
        <span className="text-slate-200/90 mr-1 md:!text-lg !text-sm">Interview Time</span>
        <span className="font-mono !text-sm md:!text-lg pt-1 font-semibold text-green-400">{formatTime(timeElapsed)}</span>
      </div>
    </div>
    <Button
      key={frontendExp?.id}
      duration={15000}
      borderRadius="1.75rem"
      className="text-black dark:text-white  border-neutral-200 dark:border-slate-800 w-full max-w-none max-h-full  min-h-[50vh] flex  "
     containerClassName="w-full max-w-none"
    >
      <div  className="flex flex-row w-full max-w-full max-h-full   min-h-[69vh]
         h-full gap-7 md:gap-8     ">
        <div className="relative w-full min-w-[50vw] p-9 my-5 sm:my-0 max-w-[50vw] md:flex-1  rounded-3xl bg-[#0c1327] flex flex-col shadow-md mb-4 md:mb-0">
          <div className="relative flex-1 w-full min-h-[200px] justify-center items-center sm:aspect-video max-w-[50vw] md:flex-1 rounded-3xl bg-black flex flex-col shadow-md mb-4 md:mb-0 ">
            {videoOn ? ( 
              <Webcam audio={false} mirrored className="w-full h-full object-cover rounded-2xl transition-all duration-300" />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-white text-2xl">📷 Video Off</div>
            )}
            <div className="absolute top-3 right-3 bg-red-500/90 !text-sm md:!text-lg text-white px-3 py-1 rounded-full shadow font-bold select-none">Rec</div>
            <div className="absolute top-3 left-3 bg-black/30 text-white text-xs rounded px-3 py-1 select-none">{frontendExp?.title ?? "You"}</div>
            <div className="absolute bottom-3 left-4 flex items-center">
              <div className={`md:w-10 w-5 h-5 md:h-10 rounded-full ring-2 ring-white ${speaking === "student" ? "bg-green-400 animate-pulse" : "bg-gray-500"}`}></div>
              <span className="ml-2 text-xs text-white/40 hidden md:inline">{speaking === "student" ? "Speaking..." : ""}</span>
            </div>
            <div className="absolute bottom-3 right-4 flex items-center gap-2">
              <button
                onClick={() => {
                  if (audioStream) {
                    audioStream.getAudioTracks().forEach(track => {
                      track.enabled = !muted;
                    });
                  }
                  setMuted(!muted);
                }}
                className={`md:w-10 md:h-10 h-6 w-6 flex items-center justify-center rounded-full ${muted ? "bg-gray-700/40 border border-gray-700" : "bg-green-600/20 border border-green-600"} hover:bg-green-500/20 shadow hover:scale-105 transition`}
                title={muted ? "Unmute" : "Mute"}
                aria-label={muted ? "Unmute" : "Mute"}
                disabled={sessionEnded}
              >
                {muted ? <MicOff className="md:w-6 h-3 w-3 md:h-6 text-gray-400" /> : <Mic className="md:w-6 md:h-6 h-3 w-3 text-green-400" />}
              </button>
              <button
                onClick={() => setVideoOn(!videoOn)}
                className={`md:w-10 md:h-10 h-6 w-6 flex items-center justify-center rounded-full ${videoOn ? "bg-blue-600/20 border border-blue-600" : "bg-gray-700/40 border border-gray-700"} hover:bg-blue-600/30 shadow hover:scale-105 transition`}
                title={videoOn ? "Turn off video" : "Turn on video"}
                aria-label={videoOn ? "Turn off video" : "Turn on video"}
                disabled={sessionEnded}
              >
                {videoOn ? <Video className="md:w-6 md:h-6 h-3 w-3 text-blue-400" /> : <VideoOff className="w-3 h-3 md:h-6 md:w-6 text-gray-400" />}
              </button>
            </div>
          </div>
        </div>
        <div className="w-full p-6 pl-8 md:py-10 py-20   flex flex-col gap-3 md:gap-5">
          <div className="bg-[#151a2b] rounded-2xl border border-[#333955] shadow p-3 md:p-6 overflow-y-auto text-[0.8rem] h-[250px] min-h-[30vh] md:min-h-[40vh] font-light" ref={chatContainerRef}>
            <div className="p-4 space-y-6 custom-scrollbar"> 
              {messages.map((msg, idx) => (
                <div key={idx} className="flex items-start gap-2 w-full">
                  {/* Icon on the left */}
                  <div className="flex-shrink-0 w-9 flex justify-center mt-0.5">
                    <span className={`flex items-center justify-center rounded-full w-6 h-6 ${msg.from === "ai" ? "bg-[#181e27]" : "bg-transparent"}`}>
                      {msg.from === "ai" ? (
                        <Bot className="text-white w-5 h-5" />
                      ) : (
                        <User className="text-cyan-300 w-5 h-5" />
                      )}
                    </span>
                  </div>
                  {/* Message bubble */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx, duration: 0.1, ease: "easeOut" }}
                    className={`px-2 py-1 rounded-2xl max-w-[85%] text-[0.6rem] font-normal text-white`}
                    style={{
                      backgroundColor: msg.from === "ai" ? "#202733" : "#17313a",
                      borderTopLeftRadius: msg.from === "ai" ? "0.25rem" : "1rem",
                      borderTopRightRadius: msg.from === "ai" ? "1rem" : "0.25rem",
                      wordBreak: "break-word",
                    }}
                  >
                    {msg.from === "ai" ? <Typewriter text={msg.text} speed={55} /> : msg.text}
                  </motion.div>
                </div>
              ))}
              <AnimatePresence>
                {showInterim && (
                  <motion.div
                    key="interim"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: interimVisible ? 1 : 0.2 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex items-start justify-end gap-2 w-full"
                  >
                    <div className="bg-[#14333d] text-white/90 px-2 py-1 rounded-2xl rounded-tr-md max-w-[100%] text-[1rem] font-normal" style={{ wordBreak: "break-word" }}>
                      {liveInterim}
                    </div>
                    <div className="flex-shrink-0 w-9 flex justify-center mt-0.5">
                      <span className="flex items-center justify-center rounded-full bg-transparent w-7 h-7">
                        <User className="text-green-300 w-5 h-5 opacity-50" />
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={chatEndRef}></div>
            </div>
          </div>
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
  {/* Centered title */}
  <div className="flex items-center gap-2">
    <Bot className="w-5 h-5 text-emerald-300" />
    <span className="text-emerald-300 font-semibold !text-lg md:!text-2xl">
      IntervueAI
    </span>
  </div>

  {/* Bottom-right speaking pill */}
  <div
    className={[
      "absolute bottom-2 right-2",
      "transition-all duration-300",
      aiSpeaking ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
    ].join(" ")}
  >
    <div className="bg-emerald-950/90 border border-emerald-700 text-emerald-300 rounded-full px-3 py-1 shadow flex items-center gap-2">
     
      <span className="flex gap-1 ml-1">
        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "200ms" }} />
        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "400ms" }} />
      </span>
    </div>
  </div>
</div>
        </div>
      </div>
    </Button>
    <div className="flex w-full justify-center pb-6 md:pb-4 px-2">
      <div className="mt-5">
        {!timerActive ? (
          <button
            onClick={async () => {
              setTimerActive(true);
              setInterviewStarted(true);
              await streamAIReply(`${API_BASE_URL}api/v1/start_interview`, "start");
            }}
            className={`md:w-12 md:h-12 w-8 h-8 mt-4 flex items-center justify-center rounded-full border text-lg font-bold transition shadow
              ${aiStreaming ? "bg-gray-400 text-white cursor-not-allowed" : "bg-green-600/20 text-green-400 border-green-800 hover:bg-green-700/80 hover:scale-105"}
            `}
            title="Start Interview"
            aria-label="Start Interview"
            disabled={sessionEnded || aiStreaming}
          >
            <Play className="w-5 h-5 " />
          </button>
        ) : (
          <button
            onClick={handleLeave}
            className="md:w-12 md:h-12 w-8 h-8 mt-4 flex items-center justify-center rounded-full bg-red-700/10 hover:bg-red-700/30 shadow hover:scale-105 transition text-red-400 border border-red-800"
            title="Leave Interview"
            aria-label="Leave Interview"
            disabled={sessionEnded}
          ><LogOut className="w-5 h-5" /></button>
        )}
      </div>
    </div>
  </div>

);
}
