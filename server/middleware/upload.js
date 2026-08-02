// middleware/upload.js
// multer stores file in memory (never touches Render disk).
// uploadToCloudinary() streams the Buffer directly to Cloudinary.

const multer     = require('multer');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

// ── multer — memory storage, 5 MB limit, images only ─────────────────────
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPEG, PNG and WebP images are allowed'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// ── Upload a Buffer to Cloudinary ─────────────────────────────────────────
// folder   — e.g. 'gis_system/company' or 'gis_system/profiles'
// publicId — e.g. 'company_1_abc123' (pass null to let Cloudinary auto-generate)
const uploadToCloudinary = (buffer, folder, publicId = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      folder,
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    };
    if (publicId) options.public_id = publicId;

    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) reject(err);
      else     resolve(result);
    });

    // Convert Buffer to readable stream and pipe to Cloudinary
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
};

// ── Delete a file from Cloudinary by public_id ────────────────────────────
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    // Log but don't throw — a failed delete shouldn't break the main request
    console.error('[cloudinary] delete failed for', publicId, err.message);
  }
};

module.exports = { upload, uploadToCloudinary, deleteFromCloudinary };