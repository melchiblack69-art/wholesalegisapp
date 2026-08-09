const express = require("express");
const router = express.Router();

const { login, getMe, getAllCompanies, getCompanyDetail, help,
   getCategories,getStats,
    getCompaniesByCategory, getProducts,
    register,
    deleteUserPhoto,
    deleteUserAccount,
    updateUser,
   uploadUserPhoto
   ,getFavorites, addFavorite, removeFavorite
   } = require("../controller/userController");
const { getMapCompanies } = require("../controller/mapController");
const { getCompanyImages } = require("../controller/imageController");
const protect = require("../middleware/user");
const checkMaintenance = require("../middleware/checkMaintenance");
const {upload} = require("../middleware/upload");

router.post("/login", login);
router.get("/me", protect, checkMaintenance, getMe);
router.post("/register", checkMaintenance, register);
router.put("/update/:id", protect, checkMaintenance, updateUser);
router.delete("/:id/photo", protect, checkMaintenance,deleteUserPhoto);
router.put("/:id/photo", protect, checkMaintenance, upload.single("photo"), uploadUserPhoto);
router.delete("/delete-account/:id", protect, checkMaintenance, deleteUserAccount);
router.get("/favorites", protect, checkMaintenance, getFavorites);
router.post("/favorites", protect, checkMaintenance, addFavorite);
router.delete("/favorites/:companyId", protect, checkMaintenance, removeFavorite);
//
router.get("/company-product/:id", getProducts);
router.get("/categories",  getCategories);
router.get("/companies",  getAllCompanies);
router.get("/companies/:id",  getCompanyDetail);
router.get("/company-detail/:id",  getCompanyDetail);
router.get("/map",  getMapCompanies);
router.get("/category/:categoryId", getCompaniesByCategory);
router.get("/company/:id/images", getCompanyImages);

router.post("/help", help);
router.get("/stats", getStats);

module.exports = router;
