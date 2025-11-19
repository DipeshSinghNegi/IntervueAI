IntervueAI – Real-Time AI Mock Interview Platform

IntervueAI is a full-stack AI-powered mock interview platform that simulates real interviews using voice, live LLM streaming, and performance analytics.
Users speak naturally, the system listens, generates follow-up questions, and produces a detailed interview report.

This project combines Next.js, Express.js, PostgreSQL, DeepInfra/OpenAI LLMs, Speech-to-Text, and Text-to-Speech streaming to deliver a realistic interview experience.

⭐ Features

🔐 Google OAuth Login

📝 Interview form (Role, Company, Domain, Difficulty)

🎙 Real-time voice interview

⚡ AI streaming responses (text + audio chunks)

🧠 Context-aware LLM interviewer

💾 Session-based history tracking

📊 AI-generated results (Metrics, Overview, Resume Review, Recommendations)

🎛 Beautiful dashboard UI

🏗️ Architecture
[Frontend: Next.js + Tailwind]
        |
        v
(1) Google OAuth → [Auth API] → [users table]

        |
        v
(2) Interview Form → [POST /interview/start] → [sessions table]

        |
        v
(3) Real-time Q/A
    STT → /interview/answer → Save user message
                      ↓
                Call LLM (DeepInfra/OpenAI)
                      ↓
    STREAM back AI text chunks + TTS audio chunks
                      ↓
           Save AI reply → [history table]

        |
        v
(4) End Interview
    Fetch full history → LLM Analysis
    → Save in [results table]

        |
        v
(5) Results Page
    Fetch results → show Metrics, Overview, Resume Review, Recommendations

⚙️ Tech Stack
Frontend

Next.js 14

Tailwind CSS

Web Speech API (Speech-to-Text)

Web Audio API (TTS decoding & playback)

Streaming text UI (Typewriter effect)

Backend

Node.js + Express.js

Chunked streaming responses (res.write())

DeepInfra/OpenAI Chat Completions

Google OAuth token verification

Session management

REST APIs

Database

PostgreSQL

Tables: users, sessions, history, results

🔥 Core Workflow Explained
1. Authentication (Google OAuth)

User logs in via Google

Frontend receives Google token

Sends token → /auth/google

Backend verifies using Google API

Stores/updates user → users table

Sends JWT + user info back

Frontend stores email + token in localStorage

2. Start Interview Session

User fills interview details → frontend calls:

POST /interview/start


Backend:

Creates session

Generates session_id

Stores in sessions table

Sends session_id back

3. Real-Time Interview (LLM Streaming)

This is the main engine 🧠⚡

Frontend

Records user voice

Converts speech → text

Sends answer → /interview/answer

Backend

Saves user answer into history table

Sends answer + conversation history → LLM

Receives LLM response as a stream:

Text chunks

Audio chunks (Base64)

Writes chunks to frontend as soon as they arrive

Once full answer is received → store AI reply in DB

Frontend receives stream

Displays text chunk-by-chunk

Decodes audio → plays via Web Audio API

Looks like a real interviewer speaking live

4. End Interview → AI Analysis

When user ends the session:

Backend fetches entire history

Sends full transcript → LLM

LLM generates:

Performance Metrics (%)

Performance Overview

Resume Feedback

Improvement Recommendations

Stored in results table

5. Results Dashboard

Frontend calls:

POST /interview/results


Displays:

📊 Metrics

📝 Overview

📄 Resume Review

💡 Recommendations

🗄️ Database Schema
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT
);

CREATE TABLE sessions (
  session_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT REFERENCES users(email),
  role TEXT,
  company TEXT,
  language TEXT,
  difficulty TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE history (
  id SERIAL PRIMARY KEY,
  session_id UUID REFERENCES sessions(session_id),
  role TEXT,       -- 'user' or 'ai'
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE results (
  id SERIAL PRIMARY KEY,
  session_id UUID REFERENCES sessions(session_id),
  analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

🔌 API Endpoints
Auth
POST /auth/google

Interview
POST /interview/start
POST /interview/answer        ← Streaming response
POST /interview/end
POST /interview/results

🤖 LLM Integration (Streaming)
const response = await axios({
  method: "post",
  url: "https://api.deepinfra.com/v1/chat/completions",
  data: payload,
  responseType: "stream",
  headers: { Authorization: `Bearer ${API_KEY}` }
});

response.data.on("data", (chunk) => {
  const parsed = parseStreamChunk(chunk);
  res.write(parsed); // send text/audio chunks to frontend
});

▶️ Running the Project
Backend Setup
cd backend
npm install
npm run dev

Frontend Setup
cd frontend
npm install
npm run dev


📸 Screenshots 
![IntervuAi](https://github.com/user-attachments/assets/8113433a-ccb1-4ef1-aafb-416346315f9d)
![intervuesi](https://github.com/user-attachments/assets/15cbf78a-0514-4b44-bbc7-7cbb03536ddf)




🧑‍💻 Author

Dipesh Singh Negi
Creator of IntervueAI
Full-Stack Developer | AI Enthusiast

⭐ Support

If you like this project, please give it a ⭐ on GitHub!
