/**
 * Usage Service
 * Tracks proposal usage against subscription limits
 */

const prisma = require("../config/prisma");
const { getPlanConfig } = require("./stripe.service");

/**
 * Count proposals created this calendar month by user
 */
async function getMonthlyUsage(userId) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  return prisma.usageLog.count({
    where: {
      userId,
      action: "proposal_created",
      createdAt: { gte: startOfMonth },
    },
  });
}

/**
 * Check if user can create another proposal this month
 */
async function checkUsageLimit(userId) {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  const plan = subscription?.plan || "FREE";
  const config = getPlanConfig(plan);

  // Unlimited plan
  if (config.proposalLimit === Infinity) return true;

  const used = await getMonthlyUsage(userId);
  return used < config.proposalLimit;
}

/**
 * Get usage summary for dashboard
 */
async function getUsageSummary(userId) {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  const plan = subscription?.plan || "FREE";
  const config = getPlanConfig(plan);

  const used = await getMonthlyUsage(userId);
  const limit = config.proposalLimit;
  const unlimited = limit === Infinity;

  return {
    plan,
    used,
    limit: unlimited ? null : limit,
    unlimited,
    remaining: unlimited ? null : Math.max(0, limit - used),
    percentage: unlimited ? 0 : Math.round((used / limit) * 100),
  };
}

/**
 * Log a user action for usage tracking
 */
async function incrementUsage(userId, action, metadata = {}) {
  await prisma.usageLog.create({
    data: {
      userId,
      action,
      metadata,
    },
  });
}

module.exports = { checkUsageLimit, getUsageSummary, incrementUsage, getMonthlyUsage };
