const express = require("express");
const { startInterview, continueInterview, endInterview, showResults } = require("../services/llmService");

const router = express.Router();

// GET /api/interview/
router.get("/", (req, res) => {
  res.json({ message: "live" });
});

// POST /api/interview/start
router.post("/start_interview", async (req, res, next) => {
  try {
    const { session_id, email, user_input } = req.body;
    if (!session_id) return res.status(400).json({ message: "session_id is missing" });

    const stream = await startInterview(session_id, email, user_input);
    res.setHeader("Content-Type", "text/plain");
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
});

// POST /api/interview/continue
router.post("/continue_interview", async (req, res, next) => {
  try {
    const { session_id, user_input } = req.body;
    if (!session_id) return res.status(400).json({ message: "session_id is missing" });

    const stream = await continueInterview(session_id, user_input);
    res.setHeader("Content-Type", "text/plain");
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
});

// POST /api/interview/end
router.post("/end_interview", async (req, res, next) => {
  try {
    const { session_id, email } = req.body;
    if (!session_id) return res.status(400).json({ message: "session_id is missing" });

    const result = await endInterview(session_id, email);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/interview/show_results
router.post("/show_results", async (req, res, next) => {
  try {
    const { session_id, email } = req.body;
    const results = await showResults(email, session_id);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
