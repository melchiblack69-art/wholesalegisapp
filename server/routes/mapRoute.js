const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const { getMapCompanies } = require("../controller/mapController");
const checkMaintenance = require("../middleware/checkMaintenance");

router.get("/companies", protect, checkMaintenance, getMapCompanies);

module.exports = router;
