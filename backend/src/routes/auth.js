const express = require("express");
const { googleAuth, getCredits } = require("../services/authService");
const router = express.Router();

// POST /api/auth/gauth
router.post("/gauth", async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(401).json({ error: "Token is missing" });
    }
    const result = await googleAuth(token);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/get_credits
router.post("/get_credits", async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await getCredits(email);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
