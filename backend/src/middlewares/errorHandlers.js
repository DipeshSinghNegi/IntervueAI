// src/middlewares/errorHandler.js
function errorHandler(err, req, res, next) {
  console.error("🔥 Error:", err);
  res.status(500).json({
    error: err.message || "Internal Server Error",
  });
}

module.exports = errorHandler;
