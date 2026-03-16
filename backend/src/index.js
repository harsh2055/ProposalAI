/**
 * ProposalAI — Backend API Entry Point
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const authRoutes        = require("./routes/auth.routes");
const clientRoutes      = require("./routes/client.routes");
const proposalRoutes    = require("./routes/proposal.routes");
const subscriptionRoutes = require("./routes/subscription.routes");
const userRoutes        = require("./routes/user.routes");
const adminRoutes       = require("./routes/admin.routes");
const webhookRoutes     = require("./routes/webhook.routes");
const { errorHandler }  = require("./middleware/error.middleware");
const logger            = require("./utils/logger");

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ─── Rate limiting ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Too many authentication attempts." },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "AI generation rate limit exceeded. Please wait a moment." },
});

app.use(globalLimiter);

// ─── Stripe webhook (raw body BEFORE json parser) ─────────────────────────────
app.use("/api/webhooks", express.raw({ type: "application/json" }), webhookRoutes);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", version: "1.0.0", timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",          authLimiter, authRoutes);
app.use("/api/users",         userRoutes);
app.use("/api/clients",       clientRoutes);
app.use("/api/proposals",     proposalRoutes);         // AI limiter is inside the route
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/admin",         adminRoutes);

// Apply AI limiter specifically to the generate endpoint
app.use("/api/proposals/generate", aiLimiter);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🚀 ProposalAI API running on port ${PORT}`);
  logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`🤖 AI Provider: Google Gemini`);
});

module.exports = app;
