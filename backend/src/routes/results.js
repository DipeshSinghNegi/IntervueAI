const express = require("express");
const { showResults } = require("../services/resultsService");

const router = express.Router();

// POST /api/results
router.post("/", async (req, res, next) => {
  try {
    const { email, session_id } = req.body;
    const results = await showResults(email, session_id || "");
    res.json(results);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
