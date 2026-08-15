const express = require("express");
const { getPublicCatalogVersion } = require("../controller/cacheController");
const router = express.Router();
router.get("/version", getPublicCatalogVersion);
module.exports = router;
