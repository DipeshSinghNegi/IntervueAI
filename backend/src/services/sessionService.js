const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const db = require("./db");

const BASE_DIR = path.join(__dirname, "..", "sessions");

// Ensure directory exists
function getMetaPath(sessionId) {
  const metaDir = path.join(BASE_DIR, sessionId, "metainfo");
  fs.mkdirSync(metaDir, { recursive: true });
  return metaDir;
}

function saveSessionData(sessionId, data) {
  const metaPath = getMetaPath(sessionId);
  const filePath = path.join(metaPath, "metadata.json");
  data.session_id = sessionId;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function deleteChunk(sessionId, chunkNum) {
  const chunkPath = path.join(BASE_DIR, sessionId, "audio", `chunk${chunkNum}.webm`);
  if (fs.existsSync(chunkPath)) {
    fs.unlinkSync(chunkPath);
  }
}

async function createSession(email, scenario, company, role, language, resumeFile) {
  const sessionId = uuidv4();
  const resumeB64 = resumeFile.buffer.toString("base64");

  const data = {
    session_id: sessionId,
    email,
    scenario,
    company,
    role,
    language,
    resume_content: resumeB64,
  };

  saveSessionData(sessionId, data);

  await db.createSession(sessionId, email, scenario, company, role, language);

  return {
    message: "Session created successfully",
    session_id: sessionId,
  };
}

async function acknowledgeChunk(sessionId, chunkId) {
  deleteChunk(sessionId, chunkId);
  return true;
}

module.exports = {
  createSession,
  acknowledgeChunk,
  saveSessionData,
  deleteChunk,
};
