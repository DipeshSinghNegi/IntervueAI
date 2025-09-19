const express = require("express");
const { updateCredits } = require("../services/db");

const router = express.Router();

// GET /api/db/hello
router.get("/hello", (req, res) => {
  res.json({ message: "API is live master." });
});

// GET /api/db/setcredits
router.get("/setcredits", async (req, res, next) => {
  try {
    const { email, credits } = req.query;
    if (!email || !credits) {
      return res.status(400).json({ error: "Missing email or credits parameter" });
    }
    const newCredits = await updateCredits(email, parseInt(credits, 10));
    res.json({ status: `Credits for ${email} set to ${newCredits}` });
  } catch (err) {
    if (err instanceof Error && err.message.includes("Wrong request params")) {
      return res.status(400).json({ error: "Wrong request params" });
    }
    next(err);
  }
});

module.exports = router;
