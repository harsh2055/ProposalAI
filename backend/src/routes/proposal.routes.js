/**
 * Proposal Routes
 * IMPORTANT: Specific named routes must come BEFORE /:id wildcard routes
 */
const express = require("express");
const { body } = require("express-validator");
const {
  getProposals,
  getProposal,
  getSharedProposal,
  generateProposal,
  createProposal,
  updateProposal,
  deleteProposal,
  duplicateProposal,
  toggleShare,
  downloadPDF,
  getStats,
} = require("../controllers/proposal.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

// ── Public (no auth) ──────────────────────────────────────────────────────────
router.get("/share/:token", getSharedProposal);

// ── All routes below require authentication ───────────────────────────────────
router.use(authenticate);

// ── Named routes FIRST (before /:id wildcard) ────────────────────────────────
router.get("/stats", getStats);

router.post(
  "/generate",
  [
    body("clientName").trim().notEmpty().withMessage("Client name required"),
    body("projectDescription").trim().notEmpty().withMessage("Project description required"),
  ],
  generateProposal
);

// ── Collection routes ─────────────────────────────────────────────────────────
router.get("/", getProposals);
router.post(
  "/",
  [body("title").trim().notEmpty().withMessage("Title required")],
  createProposal
);

// ── ID-based routes LAST ──────────────────────────────────────────────────────
router.get("/:id/pdf", downloadPDF);
router.post("/:id/duplicate", duplicateProposal);
router.post("/:id/share", toggleShare);
router.get("/:id", getProposal);
router.patch("/:id", updateProposal);
router.delete("/:id", deleteProposal);

module.exports = router;
