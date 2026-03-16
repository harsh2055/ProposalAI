/**
 * Proposal Controller
 * CRUD operations + AI generation + PDF export
 */

const { validationResult } = require("express-validator");
const prisma = require("../config/prisma");
const aiService = require("../services/ai.service");
const pdfService = require("../services/pdf.service");
const { checkUsageLimit, incrementUsage } = require("../services/usage.service");
const logger = require("../utils/logger");

/**
 * GET /api/proposals
 * List all proposals for the authenticated user
 */
async function getProposals(req, res, next) {
  try {
    const { page = 1, limit = 20, clientId, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId: req.userId,
      ...(clientId && { clientId }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { projectOverview: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, company: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.proposal.count({ where }),
    ]);

    return res.json({
      proposals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/proposals/:id
 */
async function getProposal(req, res, next) {
  try {
    const proposal = await prisma.proposal.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        client: true,
      },
    });

    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found." });
    }

    return res.json({ proposal });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/proposals/share/:token
 * Public share endpoint — no auth required
 */
async function getSharedProposal(req, res, next) {
  try {
    const proposal = await prisma.proposal.findFirst({
      where: {
        shareToken: req.params.token,
        isPublic: true,
      },
      include: {
        client: { select: { name: true, company: true } },
        user: { select: { name: true } },
      },
    });

    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found or not public." });
    }

    return res.json({ proposal });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/proposals/generate
 * Generate a new proposal using AI
 */
async function generateProposal(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check usage limits
    const canGenerate = await checkUsageLimit(req.userId);
    if (!canGenerate) {
      return res.status(403).json({
        error: "Monthly proposal limit reached. Upgrade your plan to continue.",
        code: "USAGE_LIMIT_EXCEEDED",
      });
    }

    const {
      clientId,
      clientName,
      company,
      projectDescription,
      projectType,
      timeline,
      estimatedBudget,
      additionalNotes,
      template,
      title,
    } = req.body;

    logger.info(`Generating proposal for user ${req.userId}, client: ${clientName}`);

    // Generate proposal content via OpenAI
    const generatedContent = await aiService.generateProposal({
      clientName,
      company,
      projectDescription,
      projectType,
      timeline,
      estimatedBudget,
      additionalNotes,
      template,
    });

    // Save proposal to database
    const proposal = await prisma.proposal.create({
      data: {
        userId: req.userId,
        clientId: clientId || null,
        title: title || `Proposal for ${company || clientName}`,
        template: template || "CUSTOM",
        status: "DRAFT",
        projectOverview: generatedContent.projectOverview,
        scopeOfWork: generatedContent.scopeOfWork,
        deliverables: generatedContent.deliverables,
        timeline: generatedContent.timeline,
        pricing: generatedContent.pricing,
        terms: generatedContent.terms,
        closingStatement: generatedContent.closingStatement,
        projectDescription,
        estimatedBudget,
        projectTimeline: timeline,
        additionalNotes,
        aiModel: generatedContent.model,
        tokensUsed: generatedContent.tokensUsed,
      },
      include: {
        client: true,
      },
    });

    // Track usage
    await incrementUsage(req.userId, "proposal_created", { proposalId: proposal.id });

    return res.status(201).json({
      message: "Proposal generated successfully.",
      proposal,
    });
  } catch (error) {
    logger.error("Proposal generation failed:", error);
    next(error);
  }
}

/**
 * POST /api/proposals
 * Create a blank/manual proposal
 */
async function createProposal(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, clientId, template } = req.body;

    const proposal = await prisma.proposal.create({
      data: {
        userId: req.userId,
        clientId: clientId || null,
        title,
        template: template || "CUSTOM",
        status: "DRAFT",
      },
    });

    return res.status(201).json({ proposal });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/proposals/:id
 * Update proposal sections
 */
async function updateProposal(req, res, next) {
  try {
    const proposal = await prisma.proposal.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found." });
    }

    const allowedFields = [
      "title",
      "status",
      "projectOverview",
      "scopeOfWork",
      "deliverables",
      "timeline",
      "pricing",
      "terms",
      "closingStatement",
      "isPublic",
      "clientId",
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const updated = await prisma.proposal.update({
      where: { id: req.params.id },
      data: updateData,
      include: { client: true },
    });

    return res.json({ proposal: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/proposals/:id
 */
async function deleteProposal(req, res, next) {
  try {
    const proposal = await prisma.proposal.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found." });
    }

    await prisma.proposal.delete({ where: { id: req.params.id } });
    return res.json({ message: "Proposal deleted." });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/proposals/:id/duplicate
 */
async function duplicateProposal(req, res, next) {
  try {
    const original = await prisma.proposal.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!original) {
      return res.status(404).json({ error: "Proposal not found." });
    }

    const { id, shareToken, createdAt, updatedAt, ...rest } = original;

    const duplicate = await prisma.proposal.create({
      data: {
        ...rest,
        title: `${original.title} (Copy)`,
        status: "DRAFT",
        isPublic: false,
        shareToken: undefined,
      },
    });

    return res.status(201).json({ proposal: duplicate });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/proposals/:id/share
 * Toggle public sharing and return share URL
 */
async function toggleShare(req, res, next) {
  try {
    const proposal = await prisma.proposal.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found." });
    }

    const isPublic = !proposal.isPublic;
    const updated = await prisma.proposal.update({
      where: { id: req.params.id },
      data: { isPublic },
    });

    const shareUrl = isPublic
      ? `${process.env.FRONTEND_URL}/share/${updated.shareToken}`
      : null;

    return res.json({
      isPublic,
      shareToken: updated.shareToken,
      shareUrl,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/proposals/:id/pdf
 * Generate and stream PDF
 */
async function downloadPDF(req, res, next) {
  try {
    const proposal = await prisma.proposal.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { client: true, user: { select: { name: true, email: true } } },
    });

    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found." });
    }

    const pdfBuffer = await pdfService.generatePDF(proposal);

    const filename = `proposal-${proposal.title.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);

    await incrementUsage(req.userId, "pdf_exported", { proposalId: proposal.id });
    return res.end(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/proposals/stats
 * Dashboard statistics
 */
async function getStats(req, res, next) {
  try {
    const userId = req.userId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, thisMonth, byStatus, clients] = await Promise.all([
      prisma.proposal.count({ where: { userId } }),
      prisma.proposal.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
      prisma.proposal.groupBy({
        by: ["status"],
        where: { userId },
        _count: true,
      }),
      prisma.client.count({ where: { userId } }),
    ]);

    return res.json({
      totalProposals: total,
      proposalsThisMonth: thisMonth,
      clientCount: clients,
      byStatus: byStatus.reduce((acc, s) => {
        acc[s.status] = s._count;
        return acc;
      }, {}),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
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
};
