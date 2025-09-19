const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");
const OpenAI = require("openai");
const db = require("./db");
const { getSessionData, saveSessionData, deleteSession } = require("./sessionService");
const { generateAudio, isSpeakable } = require("./ttsService");
const { systemPrompt, resultsPrompt } = require("./prompts");

const DEEPINFRA_API_KEY = process.env.DEEPINFRA_API_KEY;
const MODEL_NAME = process.env.MODEL_NAME;

const client = new OpenAI({
  apiKey: DEEPINFRA_API_KEY,
  baseURL: "https://api.deepinfra.com/v1/openai",
});

function getMemoryPath(sessionId) {
  const dir = path.join(__dirname, "..", "sessions", sessionId, "memory");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getHistory(sessionId) {
  const file = path.join(getMemoryPath(sessionId), "conversation.json");
  if (!fs.existsSync(file)) return [];
  try {
    const data = fs.readFileSync(file, "utf-8");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function updateHistory(sessionId, history) {
  const file = path.join(getMemoryPath(sessionId), "conversation.json");
  fs.writeFileSync(file, JSON.stringify(history, null, 2));
}

async function startInterview(sessionId, email, userInput) {
  const session = getSessionData(sessionId);
  if (!session) throw new Error("Session not created");

  // Deduct credits
  const currentCredits = await db.getCredits(email);
  await db.updateCredits(email, Math.max(0, currentCredits - 1));

  // Decode resume (Base64 PDF → text)
  const resumeText = Buffer.from(session.resume_content, "base64").toString("utf-8");

  // System prompt
  let history = getHistory(sessionId);
  if (!history.length || history[0].role !== "system") {
    history.push({
      role: "system",
      content: systemPrompt(session.scenario, session.company, session.role, session.language, resumeText),
    });
    updateHistory(sessionId, history);
  }

  return streamLLM(sessionId, userInput);
}

function continueInterview(sessionId, userInput) {
  return streamLLM(sessionId, userInput);
}

function streamLLM(sessionId, userInput) {
  const history = getHistory(sessionId);
  history.push({ role: "user", content: userInput });
  updateHistory(sessionId, history);

  const stream = new Readable({ read() {} });

  (async () => {
    try {
      const completion = await client.chat.completions.create({
        model: MODEL_NAME,
        messages: history,
        stream: true,
      });

      let collected = "";
      let buffered = "";
      let chunkNum = 0;

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          if (content.includes("INTERVIEW_END")) {
            stream.push(JSON.stringify({ text: "INTERVIEW_END", audio: "INTERVIEW_END" }) + "\n");
            break;
          } else if (content !== "DONE") {
            collected += content;
            buffered += content;
            if (isSpeakable(content)) {
              const audio = await generateAudio(sessionId, chunkNum, buffered);
              stream.push(JSON.stringify({ chunk: chunkNum, text: buffered, audio }) + "\n");
              chunkNum++;
              buffered = "";
            }
          }
        }
      }

      history.push({ role: "assistant", content: collected });
      updateHistory(sessionId, history);
      stream.push(null);
    } catch (err) {
      stream.push(`# Error: ${err.message}`);
      stream.push(null);
    }
  })();

  return stream;
}

async function endInterview(sessionId, email) {
  let history = getHistory(sessionId);
  if (!history.length) return { message: "session is not created yet" };

  history.push({ role: "system", content: resultsPrompt() });

  const result = await client.chat.completions.create({
    model: MODEL_NAME,
    messages: history,
  });

  const content = result.choices[0].message.content;

  await db.saveHistory(sessionId, email, { chat_history: history }, { results: content });
  deleteSession(sessionId);

  return { status: true, message: "Show results now." };
}

async function showResults(email, sessionId) {
  const result = await db.showResults(email, sessionId);
  deleteSession(sessionId);
  return result;
}

module.exports = { startInterview, continueInterview, endInterview, showResults };
