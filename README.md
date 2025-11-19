IntervueAI — AI-Powered Interview Simulator

IntervueAI is a real-time, AI-driven mock interview platform designed to help candidates practice behavioral, technical, and HR interviews. It provides instant feedback on answers, evaluates performance, and gives resume suggestions.


Demo

Live Demo: https://intervue-ai-ii.vercel.app/

Features

AI-driven interviews: Behavioral, technical, and HR questions in real time.

Speech-to-text & text-to-speech: Talk naturally, and the AI responds dynamically.

Google OAuth: Secure login and session management.

Dashboard: View past interview sessions, metrics, feedback, and recommendations.

Resume review: AI provides feedback on uploaded or input resume information.

Session management: Users can save and continue multiple interview sessions.

Tech Stack

Frontend: Next.js, React, TypeScript, TailwindCSS, WebRTC, Web Speech API
Backend: Node.js (Express), PostgreSQL, Supabase (for storage and auth)
AI Integration: Large Language Models (LLMs - DeepInfra)

Architecture & Workflow

High-level workflow:

Login: User authenticates via Google OAuth.

Form Fill: User selects role, company, and interview preferences.

Interview Session:

User answers via microphone.

Frontend converts voice → text (STT).

Backend sends text + session context → LLM → AI response.

Frontend plays AI’s response (TTS) and animates text using Typewriter.

End of Interview: Backend generates performance metrics, summary, and recommendations.

Results Dashboard: Users view scores, feedback, chat history, and resume analysis.

Installation

Clone the repository:

git clone https://github.com/DipeshSinghNegi/IntervueAI.git
cd IntervueAI


Install dependencies:

npm install


Setup environment variables (.env.local):

NEXT_PUBLIC_API_BASE_URL=<your_backend_url>
GOOGLE_CLIENT_ID=<your_google_oauth_client_id>


Start the development server:

npm run dev


Open http://localhost:3000
 in your browser.

Usage

Login with Google.

Fill in your role and company.

Start the interview — speak naturally.

View AI feedback and recommendations.

Download session results as JSON for record-keeping.

Project Screenshots

![IntervuAi](https://github.com/user-attachments/assets/8113433a-ccb1-4ef1-aafb-416346315f9d)
![intervuesi](https://github.com/user-attachments/assets/15cbf78a-0514-4b44-bbc7-7cbb03536ddf)




🧑‍💻 Author

Dipesh Singh Negi
Ansh Agnihotri
Creator of IntervueAI
Full-Stack Developer | AI Enthusiast

⭐ Support

If you like this project, please give it a ⭐ on GitHub!
