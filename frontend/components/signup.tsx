'use client';

import { useEffect, useState } from 'react';
import { BentoGrid, BentoGridItem } from '@/components/ui/BentoGrid';
import { UserPlus, Sparkles, Shield, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    google: any;
  }
}

export default function Signup() {
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
3
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id:
            '972013465129-qdbier183udsv2p3fdiqlf07n7q3as26.apps.googleusercontent.com',
          callback: (response: any) => {
            // Start the loader immediately
            setIsLoading(true);

            // Your existing artificial delay (optional)
            setTimeout(() => {
              fetch(`${API_BASE_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: response.credential }),
              })
                .then((res) => {
                  if (!res.ok) throw new Error('Server response was not ok');
                  return res.json();
                })
                .then((data) => {
                  localStorage.setItem('token', String(data.token));

                  // Save user info (kept your behavior—trimmed profile)
                  localStorage.setItem(
                    'user',
                    JSON.stringify({
                      name: data.name,
                      email: data.email,
                      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        data.name
                      )}`,
                    })
                  );

                  localStorage.setItem('showLoginSuccess', 'true');
                  localStorage.setItem(
                    'loginSuccessMessage',
                    data.mssg || 'Signed in successfully!'
                  );

                  // Keep loader until navigation completes
                  window.location.href = '/';
                })
                .catch((err) => {
                  console.error('Backend error:', err);
                  setErrorMessage('Login failed. Please try again.');
                  setShowError(true);
                  setIsLoading(false);
                  setTimeout(() => setShowError(false), 4000);
                });
            }, 1000);
          },
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
    <>
      {/* Error toast */}
      {showError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-8 py-3 rounded-lg shadow-lg transition-all duration-500 animate-slide-down z-[9999]">
          {errorMessage}
        </div>
      )}

      {/* Full-screen loading overlay with blur */}
      {isLoading && (
        <div
          className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm flex items-center justify-center"
          aria-live="assertive"
          aria-busy="true"
          role="alert"
        >
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-slate-800/70 border border-slate-700/50 px-8 py-6 shadow-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <p className="text-slate-200 text-sm">Verifying your Google account…</p>
          </div>
        </div>
      )}

      <section id="Form" className="relative max-h-screen bg-white-100 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-100 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-100 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-100 animate-blob animation-delay-4000"></div>
        </div>

        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-3xl"></div>

        {/* Content wrapper gets blurred/disabled when loading */}
        <div className={isLoading ? 'blur-sm opacity-70 pointer-events-none' : ''}>
          <BentoGrid className="w-full py-1 flex justify-center mx-5 items-center relative z-10 min-h-screen">
            <BentoGridItem
              id={1}
              title="New Interview"
              className="group col-span-full md:max-w-[40vw] sm:max-w-[60vw] max-w-[80vw] bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 hover:scale-105 p-2 md:p-8 mt-10 mb-10 relative overflow-hidden"
              description={
                <div className="flex flex-col items-center justify-center h-full relative z-10">
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
                      <div
                        id="google-signin-div"
                        className="w-[20vw] max-w-xs [&>div]:!bg-transparent [&>div]:!border-slate-600 [&>div]:hover:!bg-slate-700/30 [&>div]:!transition-all [&>div]:!duration-300"
                      ></div>
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
        </div>

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

          @keyframes slide-down {
            from {
              transform: translate(-50%, -100%);
              opacity: 0;
            }
            to {
              transform: translate(-50%, 0);
              opacity: 1;
            }
          }
          .animate-slide-down {
            animation: slide-down 0.3s ease-out;
          }
        `}</style>
      </section>
    </>
  );
}
