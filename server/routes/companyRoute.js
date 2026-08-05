const express = require("express");
const router  = express.Router({ mergeParams: true }); // mergeParams to access :id from parent

const protect = require("../middleware/auth");
//const passwordResetRateLimit  = require("../../middleware/passwordResetRateLimit");
const {upload} =require('../middleware/upload');
const {
 getCompanyImages,
  uploadCompanyImages,
  setCompanyCover,
  deleteCompanyImage,
  deleteAllCompanyImages,
} = require('../controller/imageController');


const {
  addCategory,
  updateCategory,
  deleteCategory,
  addCompany,
  updateCompany,
  deleteCompany,
  addProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getCategories
} = require("../controller/companyController");
const checkMaintenance = require("../middleware/checkMaintenance");

router.get("/categories", protect, checkMaintenance, getCategories);
router.post("/categories", protect,checkMaintenance, addCategory);
router.put("/categories/:id", protect, checkMaintenance,updateCategory);
router.delete("/categories/:id", protect, checkMaintenance, deleteCategory);

router.post("/companies", protect, checkMaintenance, addCompany);
router.put("/companies/:id", protect, checkMaintenance, updateCompany);
router.delete("/del-company/:id", protect, checkMaintenance, deleteCompany);

router.post("/new-product", protect, checkMaintenance,addProduct);
router.get("/products/:company_id", protect,checkMaintenance, getProducts);
router.put("/products/:id", protect, checkMaintenance, updateProduct);
router.delete("/products/:id", protect, checkMaintenance, deleteProduct);



module.exports = router;
