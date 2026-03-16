/**
 * User Routes — profile update, etc.
 */
const express = require("express");
const bcrypt = require("bcryptjs");
const { authenticate } = require("../middleware/auth.middleware");
const prisma = require("../config/prisma");
const router = express.Router();

router.use(authenticate);

// Update profile
router.patch("/profile", async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: { ...(name && { name }), ...(avatar && { avatar }) },
      select: { id: true, name: true, email: true, avatar: true },
    });
    res.json({ user: updated });
  } catch (error) {
    next(error);
  }
});

// Change password
router.patch("/password", async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: "Valid passwords required (min 8 chars)" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Current password incorrect." });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.userId }, data: { password: hashed } });
    res.json({ message: "Password updated." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
