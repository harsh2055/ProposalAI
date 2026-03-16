/**
 * Client Controller
 * CRUD operations for client management
 */

const { validationResult } = require("express-validator");
const prisma = require("../config/prisma");

/**
 * GET /api/clients
 */
async function getClients(req, res, next) {
  try {
    const { search } = req.query;

    const clients = await prisma.client.findMany({
      where: {
        userId: req.userId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { company: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        _count: { select: { proposals: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ clients });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/clients/:id
 */
async function getClient(req, res, next) {
  try {
    const client = await prisma.client.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        proposals: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          },
        },
        _count: { select: { proposals: true } },
      },
    });

    if (!client) {
      return res.status(404).json({ error: "Client not found." });
    }

    return res.json({ client });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/clients
 */
async function createClient(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, company, email, phone, projectType, budget, notes } = req.body;

    const client = await prisma.client.create({
      data: {
        userId: req.userId,
        name,
        company,
        email,
        phone,
        projectType,
        budget,
        notes,
      },
    });

    return res.status(201).json({ client });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/clients/:id
 */
async function updateClient(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const client = await prisma.client.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!client) {
      return res.status(404).json({ error: "Client not found." });
    }

    const { name, company, email, phone, projectType, budget, notes } = req.body;

    const updated = await prisma.client.update({
      where: { id: req.params.id },
      data: { name, company, email, phone, projectType, budget, notes },
    });

    return res.json({ client: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/clients/:id
 */
async function deleteClient(req, res, next) {
  try {
    const client = await prisma.client.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!client) {
      return res.status(404).json({ error: "Client not found." });
    }

    await prisma.client.delete({ where: { id: req.params.id } });
    return res.json({ message: "Client deleted." });
  } catch (error) {
    next(error);
  }
}

module.exports = { getClients, getClient, createClient, updateClient, deleteClient };
