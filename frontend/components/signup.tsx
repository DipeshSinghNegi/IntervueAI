
'use client';

import { useEffect } from 'react';
import { BentoGrid, BentoGridItem } from '@/components/ui/BentoGrid';
import { UserPlus, Sparkles, Shield, ArrowRight, ArrowUp } from 'lucide-react';

declare global {
  interface Window {
    google: any;
  }
}

export default function Signup() {
  useEffect(() => {
    
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: '972013465129-qdbier183udsv2p3fdiqlf07n7q3as26.apps.googleusercontent.com',
          callback: (response) => {
            console.log("Google Response:", response);
            console.log('Script loaded. window.google:', window.google);

            fetch(`${API_BASE_URL}api/v1/gauth`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: response.credential }),
            })
                .then((res) => {
                  if (!res.ok) throw new Error('Server response was not ok');
                  return res.json();
                })
                .then((data) => {
                  console.log("Raw data:", data);
                  console.log("Response from backend:", data);
                  localStorage.setItem("token", String(data.token));
                  localStorage.setItem("user", JSON.stringify(data));
                  localStorage.setItem("user", JSON.stringify({
                    name: data.name,
                    email: data.email,
                    picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}`
                  }));
                  // ✅ Save backend message (e.g. "Registered successfully" or "Login successful")
                  localStorage.setItem("showLoginSuccess", "true");
                  localStorage.setItem("loginSuccessMessage", data.mssg || "Signed in successfully!");
                  window.location.href = "/";
                })
                .catch((err) => {
                  console.error('Backend error:', err);
                  alert('Login failed. Check console for details.');
                });
            }, 1000);
          }
        });

        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-div'),
          { theme: 'outline', size: 'large' }
        );
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <section id="Form" className="relative max-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-3xl"></div>

      <BentoGrid className="w-full py-1 flex justify-center mx-5 items-center relative z-10 min-h-screen">
        <BentoGridItem
          id={1}
          title="New Interview"
          className="group col-span-full md:max-w-[40vw] sm:max-w-[60vw]  max-w-[80vw]    bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 hover:scale-105 p-2 md:p-8 mt-10 mb-10 relative overflow-hidden"
          description={
            <div className="flex flex-col items-center  justify-center h-full relative z-10">
              {/* Decorative elements */}
              <div className="absolute top-4 left-4 text-purple-400/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="absolute top-4 right-4 text-cyan-400/30">
                <Shield className="w-6 h-6" />
              </div>

              {/* Header with icon */}
              <div className="flex items-center gap-3 mb-8 group-hover:scale-110 transition-transform duration-300">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-2xl shadow-lg">
                  <UserPlus className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                  Continue with Google
                </h2>
              </div>

              {/* Subtitle */}
              <p className="text-slate-300 text-md mb-8 text-center leading-relaxed">
                Join thousands of professionals mastering their interviews
              </p>

              {/* Google Sign-in Container */}
              <div className="relative group/button mb-6">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl blur opacity-30 group-hover/button:opacity-60 transition duration-300"></div>
                <div className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-xl p-4 hover:bg-slate-700/50 transition-all duration-300">
                  <div id="google-signin-div" className="w-[20vw] max-w-xs [&>div]:!bg-transparent [&>div]:!border-slate-600 [&>div]:hover:!bg-slate-700/30 [&>div]:!transition-all [&>div]:!duration-300"></div>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center w-full max-w-xs mb-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                <span className="px-4 text-slate-400 text-sm font-medium">IntervueAI</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
              </div>

        
          

              {/* Bottom decorative gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 rounded-b-3xl opacity-60"></div>
            </div>
          }
        />
      </BentoGrid>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </section>
  );
}

