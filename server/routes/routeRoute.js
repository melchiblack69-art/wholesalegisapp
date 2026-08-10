const express = require("express");
const { getRoute } = require("../controller/routeController");

const router = express.Router();
router.post("/", getRoute);

module.exports = router;
