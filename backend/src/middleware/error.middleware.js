/**
 * Global Error Handler Middleware
 */

const logger = require("../utils/logger");

function errorHandler(err, req, res, next) {
  logger.error(`${req.method} ${req.url} — ${err.message}`, {
    stack: err.stack,
    userId: req.userId,
  });

  // Prisma errors
  if (err.code === "P2002") {
    return res.status(409).json({ error: "A record with this data already exists." });
  }
  if (err.code === "P2025") {
    return res.status(404).json({ error: "Record not found." });
  }

  // OpenAI errors
  if (err.status === 429) {
    return res.status(503).json({ error: "AI service is rate limited. Please try again shortly." });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "Internal server error."
      : err.message || "Internal server error.";

  return res.status(statusCode).json({ error: message });
}

module.exports = { errorHandler };
