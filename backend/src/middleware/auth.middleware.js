/**
 * Authentication Middleware
 * Verifies JWT tokens on protected routes
 */

const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

/**
 * Protect routes — require valid JWT
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== "access") {
      return res.status(401).json({ error: "Invalid token type." });
    }

    // Lightweight check: just verify user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found." });
    }

    req.userId = user.id;
    req.userRole = user.role;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token." });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired.", code: "TOKEN_EXPIRED" });
    }
    next(error);
  }
}

/**
 * Require admin role
 */
function requireAdmin(req, res, next) {
  if (req.userRole !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
