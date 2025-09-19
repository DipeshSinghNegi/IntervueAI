const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const authRoutes = require("./routes/auth");
const sessionRoutes = require("./routes/session");
const interviewRoutes = require("./routes/interview");
const resultsRoutes = require("./routes/results");
const dbRoutes = require("./routes/db");

const db = require("./services/db");

const app = express();
const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection (simulate startup/shutdown)
(async () => {
  try {
    await db.connect?.(); // optional, if you implement db.connect()
    console.log("✅ Database connected");
  } catch (err) {
    console.error("❌ DB connection failed:", err);
  }
})();

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/session", sessionRoutes);
app.use("/api/v1/interview", interviewRoutes);
app.use("/api/v1/results", resultsRoutes);
app.use("/api/v1/db", dbRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "API is live master." });
});

module.exports = app;
