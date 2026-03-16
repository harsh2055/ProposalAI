/**
 * Client Routes
 */
const express = require("express");
const { body } = require("express-validator");
const { getClients, getClient, createClient, updateClient, deleteClient } = require("../controllers/client.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();
router.use(authenticate);

router.get("/", getClients);
router.get("/:id", getClient);

router.post(
  "/",
  [
    body("name").trim().notEmpty(),
    body("company").trim().notEmpty(),
    body("email").isEmail().normalizeEmail(),
  ],
  createClient
);

router.put("/:id", updateClient);
router.delete("/:id", deleteClient);

module.exports = router;
