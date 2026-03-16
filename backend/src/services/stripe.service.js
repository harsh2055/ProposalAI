/**
 * Stripe Subscription Service
 * Manages plan creation, checkout, webhooks, and billing portal
 */

const Stripe = require("stripe");
const prisma = require("../config/prisma");
const logger = require("../utils/logger");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// ─── Plan Configuration ───────────────────────────────────────────────────────
const PLANS = {
  FREE: {
    name: "Free",
    proposalLimit: 5,
    priceId: null,
    price: 0,
    features: [
      "5 proposals per month",
      "3 templates",
      "PDF export",
      "Basic editor",
    ],
  },
  PRO: {
    name: "Pro",
    proposalLimit: 100,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    price: 29,
    features: [
      "100 proposals per month",
      "All templates",
      "PDF export",
      "Advanced editor",
      "Proposal sharing",
      "Priority support",
    ],
  },
  AGENCY: {
    name: "Agency",
    proposalLimit: Infinity,
    priceId: process.env.STRIPE_AGENCY_PRICE_ID,
    price: 99,
    features: [
      "Unlimited proposals",
      "All templates",
      "PDF export",
      "Advanced editor",
      "Proposal sharing",
      "Team features (coming soon)",
      "Priority support",
      "Custom branding (coming soon)",
    ],
  },
};

/**
 * Get plan config by type
 */
function getPlanConfig(planType) {
  return PLANS[planType] || PLANS.FREE;
}

/**
 * Create Stripe checkout session for upgrade
 */
async function createCheckoutSession(userId, planType) {
  const plan = PLANS[planType];
  if (!plan || !plan.priceId) {
    throw new Error("Invalid or free plan selected");
  }

  // Get or create Stripe customer
  let subscription = await prisma.subscription.findUnique({ where: { userId } });
  const user = await prisma.user.findUnique({ where: { id: userId } });

  let customerId = subscription?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId },
    });
    customerId = customer.id;

    await prisma.subscription.update({
      where: { userId },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{ price: plan.priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${process.env.FRONTEND_URL}/dashboard?upgrade=success`,
    cancel_url: `${process.env.FRONTEND_URL}/pricing?upgrade=cancelled`,
    metadata: { userId, planType },
    subscription_data: {
      metadata: { userId, planType },
    },
  });

  return { sessionId: session.id, url: session.url };
}

/**
 * Create billing portal session
 */
async function createBillingPortalSession(userId) {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });

  if (!subscription?.stripeCustomerId) {
    throw new Error("No billing account found");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${process.env.FRONTEND_URL}/settings`,
  });

  return { url: session.url };
}

/**
 * Handle Stripe webhook events
 */
async function handleWebhook(rawBody, signature) {
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error("Webhook signature verification failed:", err.message);
    throw new Error("Webhook signature verification failed");
  }

  logger.info(`Stripe webhook received: ${event.type}`);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      await handleCheckoutCompleted(session);
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object;
      await handleSubscriptionUpdated(sub);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await handleSubscriptionDeleted(sub);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      await handlePaymentFailed(invoice);
      break;
    }

    default:
      logger.info(`Unhandled webhook event: ${event.type}`);
  }

  return { received: true };
}

async function handleCheckoutCompleted(session) {
  const { userId, planType } = session.metadata;
  if (!userId) return;

  const stripeSubscription = await stripe.subscriptions.retrieve(
    session.subscription
  );

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan: planType,
      status: "ACTIVE",
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      stripePriceId: stripeSubscription.items.data[0]?.price.id,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    },
    update: {
      plan: planType,
      status: "ACTIVE",
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      stripePriceId: stripeSubscription.items.data[0]?.price.id,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    },
  });

  logger.info(`Subscription upgraded to ${planType} for user ${userId}`);
}

async function handleSubscriptionUpdated(stripeSubscription) {
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: stripeSubscription.id },
  });
  if (!subscription) return;

  const status = mapStripeStatus(stripeSubscription.status);

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionDeleted(stripeSubscription) {
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: stripeSubscription.id },
  });
  if (!subscription) return;

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      plan: "FREE",
      status: "CANCELED",
      stripeSubscriptionId: null,
    },
  });

  logger.info(`Subscription canceled for user ${subscription.userId}`);
}

async function handlePaymentFailed(invoice) {
  if (!invoice.subscription) return;

  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: invoice.subscription },
  });
  if (!subscription) return;

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: "PAST_DUE" },
  });
}

function mapStripeStatus(stripeStatus) {
  const map = {
    active: "ACTIVE",
    canceled: "CANCELED",
    past_due: "PAST_DUE",
    trialing: "TRIALING",
    incomplete: "INCOMPLETE",
  };
  return map[stripeStatus] || "ACTIVE";
}

module.exports = {
  PLANS,
  getPlanConfig,
  createCheckoutSession,
  createBillingPortalSession,
  handleWebhook,
};
