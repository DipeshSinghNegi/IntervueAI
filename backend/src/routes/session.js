const express = require("express");
const multer = require("multer");
const { createSession, acknowledgeChunk } = require("../services/sessionService");

const router = express.Router();
const upload = multer();

// POST /api/session/acknowledge_chunk
router.post("/acknowledge_chunk", async (req, res, next) => {
  try {
    const { session_id, chunk } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: "Missing session_id or chunk" });
    }

    await acknowledgeChunk(session_id, chunk);
    res.json({ message: "chunk deleted from buffer." });
  } catch (err) {
    next(err);
  }
});

// POST /api/session/create_session
router.post("/create_session", upload.single("resume"), async (req, res, next) => {
  try {
    const { email, scenario, company, role, language } = req.body;
    const resumeFile = req.file;

    if (!resumeFile) {
      return res.status(400).json({ error: "Resume file is required" });
    }

    const result = await createSession(email, scenario, company, role, language, resumeFile);
    res.json(result);
  } catch (err) {
    console.error("Error creating session:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
