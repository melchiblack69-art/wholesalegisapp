// routes/imageRoute.js
const express = require('express');
const router  = express.Router({ mergeParams: true }); // mergeParams to access :id from parent
const adminAuth = require('../middleware/auth'); // your existing admin middleware
const { upload } = require('../middleware/upload');
const checkMaintenance = require("../middleware/checkMaintenance");
const {
  getCompanyImages,
  uploadCompanyImages,
  setCompanyCover,
  deleteCompanyImage,
  deleteAllCompanyImages
} = require('../controller/imageController');

// GET /api/company/:id/images — public, anyone can view
router.get('/',                        getCompanyImages);

// POST /api/company/:id/images — admin only, upload up to 10 images at once
router.post('/',  upload.array('images', 10), uploadCompanyImages);

// PUT /api/company/:id/images/:imageId/cover — admin only, set cover image
router.put('/:imageId/cover', adminAuth,checkMaintenance, setCompanyCover);

// DELETE /api/company/:id/images/:imageId — admin only, delete one image
router.delete('/:imageId', adminAuth, checkMaintenance, deleteCompanyImage);

// DELETE /api/company/:id/images/:imageId — admin only, delete all images
// Company-wide image deletion is handled by the company deletion flow.

module.exports = router;
