// routes/healthRoutes.js
const express = require("express");
const router = express.Router();
const { checkHealth } = require("../controller/healthChecker");

router.get("/health", checkHealth);

module.exports = router;