const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const checkMaintenance = require("../middleware/checkMaintenance");
const { 
    getSystemDetails,
    addSystemDetails,
    updateSystemDetails,
    getDatabaseSize,
    deleteLogo,
    getSystemDetail
 } = require("../controller/systemController");
 const {upload} = require("../middleware/upload");

//router.get("/system-details", protect,checkMaintenance, getSystemDetails);
router.get("/database-size", protect,checkMaintenance, getDatabaseSize);
router.post("/system-details", protect,checkMaintenance, addSystemDetails);
router.delete('/logo/:id', protect,           checkMaintenance,              deleteLogo);
router.get('/sys-details',               getSystemDetail);

router.put("/system-details/:id", protect, checkMaintenance, upload.single("system_logo") , updateSystemDetails);

module.exports = router;
