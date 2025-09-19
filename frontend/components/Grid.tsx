"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BentoGrid, BentoGridItem } from "@/components/ui/BentoGrid";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { TextGenerateEffect } from "./ui/TextGenerateEffect";
import Image from "next/image";
import { Loader2 } from "lucide-react";

const Grid = ({
  onSuccess,
  credits,
}: {
  onSuccess: () => void;
  credits: number | null;
}) => {
  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const [scenario, setScenario] = useState("General Purpose");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [language, setLanguage] = useState("English");
  const [resume, setResume] = useState<File | null>(null);

  const [showConfetti, setShowConfetti] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // NEW: loader state

  const storedCredits =
    typeof window !== "undefined" ? Number(localStorage.getItem("credits")) : null;
  const availableCredits = credits ?? storedCredits ?? 0;

  const [email, setEmail] = useState("");

  const showMessage = (msg: string) => {
    setResultMsg(msg);
    const section = document.getElementById("Form");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (availableCredits <= 0) {
      showMessage("⚠️ You have no credits left. Please buy more credits to proceed or Sign In");
      return;
    }

    if (!email) {
      showMessage("❌ Invalid user session. Please login again.");
      return;
    }

    setIsLoading(true); // turn on loader as soon as we start

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("scenario", scenario);
      formData.append("company", company);
      formData.append("role", position);
      formData.append("language", language);
      if (resume) formData.append("resume", resume);

      const res = await fetch(`${API_BASE_URL}/session/start`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.session_id) {
        // stop loader, then show confetti/success
        setIsLoading(false);
        showMessage(`✅ Session created!`);
        setShowConfetti(true);

        // Save to localStorage
        localStorage.setItem("session_id", data.session_id);
        localStorage.setItem("session_email", email);

        // Optional: let parent know
        try {
          onSuccess?.();
        } catch {}

        setTimeout(() => {
          setShowConfetti(false);
          setResultMsg(null);
          router.push(`/start`);
        }, 1200);
      } else {
        setIsLoading(false);
        showMessage(`❌ Error: ${data.detail || "Unknown error"}`);
      }
    } catch (error: any) {
      setIsLoading(false);
      showMessage(`❌ Request failed: ${error.message}`);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser?.email) {
        setEmail(parsedUser.email);
      }
    }
  }, []);

  return (
    <section id="Form" className="relative">
      {/* Top, centered toast for results/errors */}
      {resultMsg && (
        <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-full max-w-md z-[50000] px-4">
          <div className="bg-gray-900 text-white rounded-lg px-5 py-3 text-center text-lg shadow-lg animate-fade-in">
            {resultMsg}
          </div>
        </div>
      )}

      {/* Full-screen loading overlay with blur (blocks UI while request is in flight) */}
      {isLoading && (
        <div
          className="fixed inset-0 z-[60000] bg-black/40 backdrop-blur-sm flex items-center justify-center"
          aria-live="assertive"
          aria-busy="true"
          role="alert"
        >
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-[#0b0f14]/80 border border-gray-800 px-8 py-6 shadow-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <p className="text-gray-200 text-sm">Creating your interview session…</p>
          </div>
        </div>
      )}

      {/* 🎉 Confetti Overlay on success (separate from loader) */}
      {showConfetti && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-[59999] bg-black bg-opacity-70">
          <Image
            src="/confetti.gif"
            alt="Success"
            width={300}
            height={300}
            className="w-[300px] h-[300px] object-contain"
          />
        </div>
      )}

      {/* Main content; blur & disable while loading */}
      <div className={isLoading ? "blur-sm opacity-70 pointer-events-none" : ""}>
        <BentoGrid className="w-full py-20">
          <BentoGridItem
            id={1}
            title="New Interview"
            className="col-span-full w-full min-h-[500px] bg-[#0d1117] border border-gray-700 rounded-xl shadow-md p-4"
            description={
              <div className="text-white w-full flex flex-col gap-2">
                <p className="uppercase tracking-widest text-sm text-center text-green-400">
                  Set Interview in 3 simple steps
                </p>
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-10"
                  encType="multipart/form-data"
                >
                  {/* Step 1 */}
                  <div className="flex items-center gap-2">
                    <div className="bg-cyan-500 text-black font-bold rounded-full px-3 text-sm">
                      S1
                    </div>
                    <TextGenerateEffect
                      words="Select  Parameters"
                      className="text-[20px] font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <Label className="text-sm text-gray-300">Choose Scenario</Label>
                      <select
                        value={scenario}
                        onChange={(e) => setScenario(e.target.value)}
                        required
                        className="bg-[#161b22] border border-gray-700 text-white rounded-md p-2 w-full"
                      >
                        <option value="">Select</option>
                        <option>General Purpose</option>
                        <option>Behavioral</option>
                        <option>Technical</option>
                        <option>Coding Challenge</option>
                         <option>Communication Skills</option>
                            <option>Leadership & Management</option>
                      </select>
                    </div>

                    

                    <div className="flex flex-col gap-1">
                      <Label className="text-sm text-gray-300">Company</Label>
                      <Input
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        required
                        placeholder="e.g. Google"
                        className="bg-[#161b22] border border-gray-700 text-white"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label className="text-sm text-gray-300">Role</Label>
                      <Input
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        required
                        placeholder="e.g. SDE"
                        className="bg-[#161b22] border border-gray-700 text-white"
                      />
                    </div>

                    {/* This dropdown label says Difficulty; your state var is 'language' per original code */}
                    <div className="flex flex-col gap-2">
                      <Label className="text-sm text-gray-300">Difficulty</Label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        required
                        className="bg-[#161b22] border border-gray-700 text-white rounded-md p-2 w-full"
                      >
                        <option value="">Select</option>
                        <option>Easy</option>
                        <option>Medium</option>
                        <option>Hard</option>
                      </select>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-center gap-2">
                    <div className="bg-cyan-500 text-black font-bold rounded-full px-3 py-1 text-sm">
                      S2
                    </div>
                    <TextGenerateEffect
                      words="Upload Resume"
                      className="text-[20px] font-semibold"
                    />
                  </div>

                  <div className="flex flex-col gap-1 mb-1">
                    <Label className="text-sm text-gray-300">Upload Resume</Label>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      required
                      onChange={(e) => setResume(e.target.files?.[0] || null)}
                      className="bg-[#161b22] border border-gray-700 text-white"
                    />
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-center gap-2 mb-1">
                    <div className="bg-cyan-500 text-black font-bold rounded-full px-3 py-1 text-sm">
                      S3
                    </div>
                    <TextGenerateEffect
                      words="Start Interview"
                      className="text-[20px] font-semibold"
                    />
                  </div>

                  <div className="flex justify-start mt-0">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-cyan-500 text-black font-bold hover:bg-cyan-600 w-full sm:w-fit"
                    >
                      {isLoading ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing…
                        </span>
                      ) : (
                        "GO"
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            }
          />
        </BentoGrid>
      </div>
    </section>
  );
};

export default Grid;
