/**
 * Admin Routes — User management, analytics
 */
const express = require("express");
const { authenticate, requireAdmin } = require("../middleware/auth.middleware");
const prisma = require("../config/prisma");
const router = express.Router();

router.use(authenticate, requireAdmin);

// List all users with subscription info
router.get("/users", async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          subscription: true,
          _count: { select: { proposals: true, clients: true } },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
    ]);

    res.json({ users, total });
  } catch (error) {
    next(error);
  }
});

// Platform analytics
router.get("/analytics", async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalProposals,
      activeSubscriptions,
      planBreakdown,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.proposal.count(),
      prisma.subscription.count({ where: { status: "ACTIVE", plan: { not: "FREE" } } }),
      prisma.subscription.groupBy({ by: ["plan"], _count: true }),
    ]);

    res.json({
      totalUsers,
      totalProposals,
      activeSubscriptions,
      planBreakdown: planBreakdown.reduce((acc, p) => {
        acc[p.plan] = p._count;
        return acc;
      }, {}),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
