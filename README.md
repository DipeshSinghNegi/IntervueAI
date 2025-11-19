🔥 IntervueAI — AI-Powered Mock Interview Simulator

Practice real interviews with AI. Improve faster. Get job-ready.

An AI-powered mock interview platform that simulates HR, Behavioral, and Technical interviews in real time.
Speak naturally → AI listens → evaluates → responds → scores your performance → gives improvement recommendations.

Perfect for candidates preparing for real interviews.

🚀 Features

🎙 Real-time AI Interviewer (voice-based)

🗣 Speech-to-Text + Text-to-Speech

🤖 LLM-powered dynamic questioning (DeepInfra)

📊 Performance Metrics (communication, clarity, domain)

📝 Interview Summary + Recommendations

🔐 Google OAuth Login

💾 Session-based storage (PostgreSQL)

📚 Downloadable chat history & results

📱 Responsive UI (Next.js + Tailwind)

🛠️ Tech Stack
Frontend

Next.js 14 + React + TypeScript

Tailwind CSS

WebRTC Microphone Capture

Web Speech API (STT & TTS)

Typewriter Animation Component

Backend

Node.js (Express)

PostgreSQL

Supabase (DB hosting)

DeepInfra LLM API

JWT-based auth session



⚙️ How It Works — System Workflow

A simple breakdown of how the whole platform runs end-to-end.

1️⃣ Login & User Authentication (Google OAuth)

User clicks “Continue with Google” → Frontend gets token → Backend verifies → Creates/stores user in DB.

Frontend → Google Token → Backend → Verify → Create User → Return auth session


Stored in DB:
✔ email
✔ name
✔ user_id

2️⃣ User Form (Role + Company + Job Type)

User enters:

Role → e.g., “Frontend Developer”

Company → e.g., “Google”

Interview Type → “Technical / HR / Behavioral”

Frontend sends this to backend → backend creates a new session.

POST /session/create
{
  role: "...",
  company: "...",
  email: "..."
}


Backend stores:
✔ session_id
✔ role
✔ company
✔ email

3️⃣ AI Interview Loop (Main Interaction)

The MOST important part of your project.

✔ Step 1: User speaks

Frontend records audio → converts to text (STT).

✔ Step 2: Frontend sends text answer to backend
POST /interview/answer
{ session_id, user_answer }

✔ Step 3: Backend LLM logic

Backend sends to DeepInfra LLM:

role

company

previous chat history

latest user answer

LLM returns:

next question

brief analysis

✔ Step 4: Backend returns both to frontend

Frontend plays audio (TTS) + animates text via Typewriter component.

AI Question (audio + animated text)

4️⃣ Ending the Interview

Frontend calls:

POST /interview/end


Backend processes:

Calculates performance metrics

Generates summary

Creates recommendations

Stores result in DB

5️⃣ Results Dashboard

Frontend fetches:

POST /interview/results


Displays:

Performance Metrics

Overview

Resume notes

Recommendations

Full chat history

Users can download JSON of the results.

🧱 System Architecture Diagram

<img width="385" height="546" alt="Screenshot 2025-11-19 at 6 20 55 PM" src="https://github.com/user-attachments/assets/2ae27c17-602e-4ce5-975e-06bd009f9fc7" />

🧑‍💻 Getting Started
Clone Repo
git clone https://github.com/DipeshSinghNegi/IntervueAI.git
cd IntervueAI

Install dependencies (frontend + backend)
cd frontend && npm install
cd backend && npm install


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
