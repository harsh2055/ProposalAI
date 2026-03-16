/**
 * Subscription Routes
 */
const express = require("express");
const { authenticate } = require("../middleware/auth.middleware");
const { createCheckoutSession, createBillingPortalSession, PLANS } = require("../services/stripe.service");
const { getUsageSummary } = require("../services/usage.service");

const router = express.Router();
router.use(authenticate);

// Get plans info
router.get("/plans", (req, res) => {
  res.json({ plans: PLANS });
});

// Get current usage
router.get("/usage", async (req, res, next) => {
  try {
    const summary = await getUsageSummary(req.userId);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

// Create Stripe checkout
router.post("/checkout", async (req, res, next) => {
  try {
    const { plan } = req.body;
    if (!plan || !["PRO", "AGENCY"].includes(plan)) {
      return res.status(400).json({ error: "Invalid plan" });
    }
    const session = await createCheckoutSession(req.userId, plan);
    res.json(session);
  } catch (error) {
    next(error);
  }
});

// Billing portal
router.post("/portal", async (req, res, next) => {
  try {
    const session = await createBillingPortalSession(req.userId);
    res.json(session);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
