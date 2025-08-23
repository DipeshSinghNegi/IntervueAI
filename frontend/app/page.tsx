"use client";

import { useRef, useState, useEffect } from "react";

import { FaUserCircle, FaBolt } from 'react-icons/fa';
import { navItems } from "@/data";
import Hero from "@/components/Hero";
import Grid from "@/components/Grid";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import RecentProjects from "@/components/RecentProjects";
import { FloatingNav } from "@/components/ui/FloatingNavbar";
import DropdownPortal from "@/components/Dropdownportal";
import Image from "next/image";
import { Zap } from "lucide-react";

type GoogleTokenPayload = {
  name: string;
  email: string;
  picture: string;
};
const Home = () => {
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
 
  const [refreshKey, setRefreshKey] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<GoogleTokenPayload | null>(null);
    const [loading, setLoading] = useState(true);
  const projectRef = useRef<HTMLDivElement>(null);
const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const handleInterviewSubmitted = () => {
    setRefreshKey((prev) => prev + 1);
    projectRef.current?.scrollIntoView({ behavior: "smooth" });
  };


  useEffect(() => {
    const shouldShow = localStorage.getItem("showLoginSuccess");
    const message = localStorage.getItem("loginSuccessMessage");

    if (shouldShow === "true") {
      setNotificationMessage(message || "Signed in successfully!");
      setShowNotification(true);

      localStorage.removeItem("showLoginSuccess");
      localStorage.removeItem("loginSuccessMessage");

      setTimeout(() => {
        setShowNotification(false);
      }, 4000); // auto-dismiss after 4 seconds
    }
  }, []);

 

const handleLogout = () => {
  localStorage.removeItem("token");
  
  setToken(null);
  setUserInfo(null);
  setShowDropdown(false);
};
  useEffect(() => {
    if (!userInfo?.email) {
      console.log("No email available, skipping fetch");
      return;
    }

    console.log("Sending request to get_credits with email:", userInfo.email);

    fetch(`${API_BASE_URL}api/v1/get_credits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: userInfo.email }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("Credits response:", data);
        setCredits(data.credits);
        
      })
      .catch((err) => {
        console.error("Error fetching credits:", err);
      });
  }, [userInfo]);





useEffect(() => {
  const storedToken = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  if (storedToken && storedUser) {
    try {
setToken(storedToken);
setUserInfo(JSON.parse(storedUser)); 
    } catch (err) {
      console.error("Failed to parse stored user info", err);
    }
  }
  setLoading(false); 
}, []);

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const dropdown = document.getElementById("user-dropdown");
    if (dropdown && !dropdown.contains(event.target as Node)) {
      setShowDropdown(false);
    }
  };

  if (showDropdown) {
    document.addEventListener("mousedown", handleClickOutside);
  }

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [showDropdown]);


  return (

    
    <main className="relative bg-black-100 flex justify-center items-center flex-col   mx-auto sm:px-10 px-5 overflow-x-hidden">
      <div className="relative">
        {showNotification && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-8 py-3 rounded-lg shadow-lg transition-all duration-500 animate-slide-down z-[111111111111111]">
            {notificationMessage}
          </div>
        )}

        {/* Rest of your main page content */}
        
      </div>

  


<div className="w-full flex justify-between items-center px-4 sm:px-6 py-1 absolute top-0 z-[10000]">

  {/* Left Side - Logo */}
  <div>
    <span className="!font-bold !text-xl md:!text-2xl text-white">IntervueAI</span>
  </div>

 <div className="flex items-center gap-4">

{!loading && (
        !token ? (
          <button
            onClick={() => router.push("/signup")}
            className="border bg-transparent hover:border-2 text-white px-3 py-1 sm:py-2 rounded-xl text-sm shadow-md font-thin"
          >
            Sign In
          </button>
        ) : (

            <div className="relative text-white flex flex-row items-end gap-2 ">
              {/* Credits */}
             <div
  className="flex items-center gap-1 mb-[5px] mt-3  px-2  h-8 rounded-full 
             bg-[#0b0f14]/80 text-slate-200 border border-gray-800
             backdrop-blur-md shadow-2xl"
  title="Credits"
  aria-label={`Credits: ${credits !== null ? credits : '…'}`}
>
    <span className="tabular-nums ">{credits !== null ? credits : '…'}</span>
  <Zap className="text-[0.4rem] opacity-70 py-1 " />

</div>


              {/* Dashboard Button */}
            

 <div className="relative text-white">
  {/* Avatar trigger */}
  <button
    onClick={() => setShowDropdown((prev) => !prev)}
    className="w-8 h-8 rounded-full overflow-hidden border border-white/20 hover:border-white/40 transition"
    aria-haspopup="menu"
    aria-expanded={showDropdown}
  >
    <Image
      src={
        userInfo?.picture ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo?.name || "User")}`
      }
      alt="User Avatar"
      width={32}
      height={32}
      className="w-full h-full object-cover"
      unoptimized
    />
  </button>

  {showDropdown && (
    <div
      id="user-dropdown"
      className="absolute right-0 mt-2 w-64 
                 bg-[#0b0f14]/90 backdrop-blur-md 
                 border border-slate-600/50 
                 rounded-2xl shadow-2xl p-4 z-[11000] 
                 text-sm text-slate-200"
      style={{ top: "3rem" }}
      role="menu"
      aria-label="User menu"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Image
          src={
            userInfo?.picture ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo?.name || "User")}`
          }
          alt="avatar"
          width={40}
          height={40}
          className="w-10 h-10 rounded-full border border-white/10"
          unoptimized
        />
        <div className="min-w-0">
          <p className="font-medium truncate">{userInfo?.name}</p>
          <p className="text-xs text-slate-400 truncate">{userInfo?.email}</p>
        </div>
      </div>

      <div className="h-px w-full bg-white/5 my-2" />

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => {
            setShowDropdown(false);
            router.push("/dashboard");
          }}
          className="w-full text-left px-3 py-2 rounded-lg 
                     bg-white/0 hover:bg-white/5 
                     text-slate-200 hover:text-white 
                     border border-transparent hover:border-white/10
                     transition"
          role="menuitem"
        >
          My Sessions
        </button>

        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-lg 
                     bg-white/0 hover:bg-white/5 
                     text-slate-300 hover:text-white 
                     border border-transparent hover:border-white/10
                     transition"
          role="menuitem"
        >
          Logout
        </button>
      </div>
    </div>
  )}
</div>


</div>

        )
        )}

 </div>
      </div>
     
      <div className="max-w-7xl w-full">
        <FloatingNav navItems={navItems} />
        <Hero />
        <Grid
          onSuccess={handleInterviewSubmitted}
          credits={credits}
         
        />

      <div ref={projectRef}>
  <RecentProjects />
</div>

        <Footer />
      </div>
    </main>
  );
};

export default Home;
