"use client";

import { useState,useEffect } from "react";
import { useRouter } from "next/navigation";
import { BentoGrid, BentoGridItem } from "@/components/ui/BentoGrid";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { TextGenerateEffect } from "./ui/TextGenerateEffect";
import Image from "next/image";
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



  const [position, setPosition] = useState(""); // 'position' input but backend wants 'role'
  
  const [language, setLanguage] = useState("English"); // add language, default is English
  const [resume, setResume] = useState<File | null>(null);

  const [showConfetti, setShowConfetti] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const storedCredits = typeof window !== "undefined" ? Number(localStorage.getItem("credits")) : null;
  const availableCredits = credits ?? storedCredits ?? 0;

  const showMessage = (msg: string) => {
    setResultMsg(msg);
    const section = document.getElementById("Form");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

const [email, setEmail] = useState("");





 


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

  try {
    const formData = new FormData();
    formData.append("email", email);
    formData.append("scenario", scenario);
    formData.append("company", company);
    formData.append("role", position);
    formData.append("language", language);
    if (resume) formData.append("resume", resume);

    const res = await fetch(`${API_BASE_URL}api/v1/create_session`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (res.ok && data.session_id) {
      showMessage(`✅ Session created!`);
      setShowConfetti(true);

      // Save to localStorage
      localStorage.setItem('session_id', data.session_id);
      localStorage.setItem('session_email', email);

      setTimeout(() => {
        setShowConfetti(false);
        setResultMsg(null);
        router.push(`/start`); // No email in URL
      }, 1200);
    } else {
      showMessage(`❌ Error: ${data.detail || "Unknown error"}`);
    }
  } catch (error: any) {
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

      {resultMsg && (
        <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-full max-w-md z-[50000] px-4">
          <div className="bg-gray-900 text-white rounded-lg px-5 py-3 text-center text-lg shadow-lg animate-fade-in">
            {resultMsg}
          </div>
        </div>
      )}


      {/* 🎉 Confetti Overlay */}
      {showConfetti && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-[9999] bg-black bg-opacity-70">
        <Image
  src="/confetti.gif"
  alt="Success"
  width={300}
  height={300}
  className="w-[300px] h-[300px] object-contain"
/>

        </div>
      )}
      {/* Result/Errors */}
 
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
              <form onSubmit={handleSubmit} className="flex flex-col gap-10" encType="multipart/form-data">
                {/* Step 1 */}
                <div className="flex items-center gap-2">
                  <div className="bg-cyan-500 text-black font-bold rounded-full px-3 text-sm">S1</div>
                  <TextGenerateEffect words="New Interview" className="text-[20px] font-semibold" />
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
                    </select>
                  </div>
       <div className="flex flex-col gap-1">
                    <Label className="text-sm text-gray-300">Email</Label>
                    <Input
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      readOnly
                      placeholder="e.g. Google"
                      className="bg-[#161b22] border border-gray-700 text-white opacity-60 cursor-not-allowed"
                    />
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
                      placeholder="e.g. SWE"
                      className="bg-[#161b22] border border-gray-700 text-white"
                    />
                  </div>
                  {/* NEW: Language Dropdown */}
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
                      
                      {/* Add more languages as needed */}
                    </select>
                  </div>
                
                </div>
                {/* Step 2 */}
                <div className="flex items-center gap-2">
                  <div className="bg-cyan-500 text-black font-bold rounded-full px-3 py-1 text-sm">S2</div>
                  <TextGenerateEffect words="Upload Resume" className="text-[20px] font-semibold" />
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
                  <div className="bg-cyan-500 text-black font-bold rounded-full px-3 py-1 text-sm">S3</div>
                  <TextGenerateEffect words="Start Simulation" className="text-[20px] font-semibold" />
                </div>
                <div className="flex justify-start mt-0">
                  <Button
                    type="submit"
                    className="bg-cyan-500 text-black font-bold hover:bg-cyan-600 w-full sm:w-fit"
                  >
                    GO
                  </Button>
                </div>
              </form>
            </div>
          }
        />
      </BentoGrid>
    </section>
  );
};

export default Grid;