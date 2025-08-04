"use client";

import { useRef, useState, useEffect } from "react";
import jwtDecode from "jwt-decode";
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
        <h1 className="text-3xl font-bold">Welcome to the main page!</h1>
      </div>

  <div className="absolute sm:top-4 top-2 right-4 sm:right-6 z-[10000]">
        {!token ? (
          <button
            onClick={() => router.push("/signup")}
            className="border bg-transparent hover:border-2 text-white px-3 py-1 sm:py-2 rounded-xl text-sm shadow-md font-thin"
          >
            Sign In
          </button>
        ) : (

            <div className="relative text-white flex flex-row items-end gap-2 ">
              {/* Credits */}
              <div className="flex items-center gap-1 mb-[5px] text-yellow-400 mt-3 px-1  w-full h-8 py-1 rounded-full text-sm shadow-sm bg-gray-700 border border-yellow-400">
                <FaBolt className="text-sm" />
                <span className=" text-white">{credits !== null ? credits : '...'}</span>
              </div>

              {/* Dashboard Button */}
            

        <div className="relative text-white">
          
  <button
    onClick={() => setShowDropdown(prev => !prev)}
    className="w-8 h-8 rounded-full overflow-hidden border border-white"
  >
<Image
  src={userInfo?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo?.name || "User")}`}
  alt="User Avatar"
  width={32} // or appropriate size
  height={32}
  className="w-full h-full object-cover"
  unoptimized // necessary for external URLs unless you configure next.config.js
/>

  </button>


  {showDropdown && (
 

                  <div id="user-dropdown" className="absolute right-0 mt-2 w-64 bg-gray-800 border border-green-700 rounded-xl shadow-md p-4 z-[11000]  text-sm" 
                    style={{ top: '3rem' }}
                  >
                    
      <div className="flex items-center gap-3 mb-3">
<Image
  src={userInfo?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo?.name || "User")}`}
  alt="avatar"
  width={40}
  height={40}
  className="w-10 h-10 rounded-full"
  unoptimized
/>

        <div>
          <p className="font-medium">{userInfo?.name}</p>
          <p className="text-xs text-green-200">{userInfo?.email}</p>
        </div>
      </div>
                    <button
                      onClick={() => router.push("/dashboard")}
                      className="mb-2 ml-2 text-green-400 hover:text-green-200 border border-green-300 bg-[#18271A] text-xs hover:border-green-500 rounded-md  px-3 py-3"
                    >
                     My Sessions
                    </button>
      <hr className="border-gray-600 my-2" />
      <button
        onClick={handleLogout}
        className="text-red-400 hover:underline text-left w-full"
      >
        Logout
      </button>
    </div>
                 
  )}
</div>

</div>


        )}
      </div>

      <div className="max-w-7xl w-full">
        <FloatingNav navItems={navItems} />
        <Hero />
        <Grid
          onSuccess={handleInterviewSubmitted}
          credits={credits}
          userEmail={userInfo?.email || ""}
        />

        <div ref={projectRef}>
          <RecentProjects refreshTrigger={refreshKey} />
        </div>
     
        <Footer />
      </div>
    </main>
  );
};

export default Home;
