const express = require("express"); 
const {
  login,
  getCompanyName,
  getMe,
  getDashboardDetails,
  getAllCompanyAdmins,
  getAllCompanies,
  getMyCompanyDetails,
  getAllAdmins,
  updateUser,
  deleteAdminPhoto,
  changePassword,
  getHelpMessages
} = require("../controller/adminController");
const protect = require("../middleware/auth");
const checkMaintenance = require("../middleware/checkMaintenance");
//const passwordResetRateLimit  = require("../../middleware/passwordResetRateLimit");
const {upload} =require('../middleware/upload');
const router  = express.Router(); // mergeParams to access :id from parent

//GENERAL
router.post("/login", login);
router.get("/me", protect, checkMaintenance,getMe);
router.get("/company-name", protect, checkMaintenance, getCompanyName);

//DISPLAY TO SUPER ADMINS
router.get("/dashboard", protect, checkMaintenance,getDashboardDetails);
router.get("/admins", protect, checkMaintenance, getAllAdmins);
router.get("/companies", protect, checkMaintenance, getAllCompanies);
router.get("/messages", protect, checkMaintenance, getHelpMessages);
//DISPLAY TO COMPANY ADMINS
router.get("/company-admins", protect, checkMaintenance, getAllCompanyAdmins);
router.put("/update/:id", protect, checkMaintenance, upload.single("photo"), updateUser);
router.delete("/admins/:id/photo", protect, checkMaintenance, deleteAdminPhoto);
router.get("/mycompany/:company_id", protect, checkMaintenance, getMyCompanyDetails);
router.put("/change-password/:id", protect, checkMaintenance, changePassword);

/*router.post("/register",protect, upload.single('photo'), register);
router.delete("/delete/:id", protect, deleteUser); 
router.get("/details/:id", protect, getAdminDetails);

router.post("/forgot-password", passwordResetRateLimit , forgotPassword);
router.post("/reset-password", resetPassword);
router.delete('/:id/photo', protect,                         deleteAdminPhoto);*/

module.exports = router;
