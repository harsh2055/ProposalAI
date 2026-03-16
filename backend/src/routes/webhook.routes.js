/**
 * Stripe Webhook Routes
 */
const express = require("express");
const { handleWebhook } = require("../services/stripe.service");
const router = express.Router();

router.post("/stripe", async (req, res, next) => {
  try {
    const signature = req.headers["stripe-signature"];
    await handleWebhook(req.body, signature);
    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
