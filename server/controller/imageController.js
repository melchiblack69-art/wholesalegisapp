// controllers/ImageController.js
const db = require("../config/db");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../middleware/upload");
const redis = require("../config/RedisClient");
const { resolveInternalId } = require("../utils/publicId");

// ── GET /api/company/:id/images ──────────────────────────────────────────────
// Returns all images for a company ordered by sort_order
const getCompanyImages = async (req, res) => {
  const company_id = await resolveInternalId(db, "companies", req.params.id);
  if (!company_id) return res.status(404).json({ message: "Company not found" });
  const cacheKey = redis.KEYS.companyImages(company_id);
  // ── Cache check ───────────────────────────────────────────────────────
  const cached = await redis.get(cacheKey);

  if (cached) {
    console.log(`[cache] HIT Images company=${company_id}`);
    return res.json({ images: cached });
  }

  // ── Stampede prevention ───────────────────────────────────────────────
  // Under heavy load, many requests can miss the cache simultaneously and
  // all hit MySQL at once. We use a short-lived Redis lock so only ONE
  // request fetches from the DB — all others wait and then serve from cache.
  const lockKey = `lock:company:${company_id}:images`;
  const isLeader = await redis.setNX(lockKey, "1", 10); // 10s lock TTL

  if (!isLeader) {
    // Another request is already fetching — poll until cache is populated
    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 100)); // wait 100ms per attempt
      const retried = await redis.get(cacheKey);

      if (retried) {
        console.log(
          `[cache] STAMPEDE resolved company=${company_id} server from cache after wait`,
        );
        return res.json({ images: retried });
      }
    }
    // Fallback: if cache never populated after 2.5s, fetch directly
    console.warn(
      "[cache] STAMPEDE fallback — fetching directly after wait timeout",
    );
  }

  try {
    const [rows] = await db.query(
      `SELECT id, url, public_id, is_cover, sort_order
       FROM company_images
       WHERE company_id = ?
       ORDER BY is_cover DESC, sort_order ASC`,
      [company_id],
    );

    // ── Cache store ───────────────────────────────────────────────────────
    await redis.set(cacheKey, rows, redis.TTL.companyImages);
    // release lock early so waiters can proceed
    console.log("[cache] MISS Images:all — cached");

    return res.json({ images: rows });
  } catch (err) {
    console.error("getCompanyImages error:", err);
    return res.status(500).json({ message: "Server error" });
  } finally {
    await redis.del(lockKey);
  }
};

// ── POST /api/company/:id/images ─────────────────────────────────────────────
// Upload one or more images for a company (multipart/form-data, field: images)
// First upload auto-sets is_cover = 1 if company has no cover yet
const uploadCompanyImages = async (req, res) => {
  try {
    const company_id = await resolveInternalId(db, "companies", req.params.id);
    if (!company_id) return res.status(404).json({ message: "Company not found" });

    if (!req.files || req.files.length === 0)
      return res.status(400).json({ message: "No images provided" });

    // Check if company already has a cover image
    const [existing] = await db.query(
      `SELECT COUNT(*) AS total, SUM(is_cover) AS covers
       FROM company_images WHERE company_id = ?`,
      [company_id],
    );
    let hasCover = existing[0].covers > 0;
    const uploaded = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const publicId = `company_${company_id}_${Date.now()}_${i}`;

      const result = await uploadToCloudinary(
        file.buffer,
        "gis_system/company",
        publicId,
      );

      // First image becomes cover if none exists
      const isCover = !hasCover && i === 0 ? 1 : 0;
      if (isCover) hasCover = true;

      const [insertResult] = await db.query(
        `INSERT INTO company_images (company_id, url, public_id, is_cover, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
        [
          company_id,
          result.secure_url,
          result.public_id,
          isCover,
          existing[0].total + i,
        ],
      );

      uploaded.push({
        id: insertResult.insertId,
        url: result.secure_url,
        public_id: result.public_id,
        is_cover: isCover,
        sort_order: existing[0].total + i,
      });

      console.log(
        `[company-image] uploaded company=${company_id} public_id=${result.public_id} cover=${isCover}`,
      );
      await redis.del(
        redis.KEYS.company(company_id),
        redis.KEYS.companyImages(company_id),
      );
    }
    // ── Invalidate cache for this turf and the all-turfs list ─────────────
    console.log(
      `[cache] Invalidated Images ${company_id} images=${uploaded.map((i) => i.public_id).join(", ")} after update`,
    );

    return res
      .status(201)
      .json({ message: "Images uploaded", images: uploaded });
  } catch (err) {
    console.error("uploadCompanyImages error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── PUT /api/company/:id/images/:imageId/cover ───────────────────────────────
// Set a specific image as the cover (unsets all others for this company)
const setCompanyCover = async (req, res) => {
  try {
    const company_id = await resolveInternalId(db, "companies", req.params.id);
    if (!company_id) return res.status(404).json({ message: "Company not found" });
    const imageKey = req.params.imageId;

    // Verify image belongs to this company
    const [rows] = await db.query(
      `SELECT id FROM company_images WHERE (id = ? OR public_id = ?) AND company_id = ? LIMIT 1`,
      [imageKey, imageKey, company_id],
    );
    if (!rows.length)
      return res
        .status(404)
        .json({ message: "Image not found for this company" });

    // Unset all covers for this turf then set the new one
    await db.query(
      `UPDATE company_images SET is_cover = 0 WHERE company_id = ?`,
      [company_id],
    );
    const image_id = rows[0].id;
    await db.query(`UPDATE company_images SET is_cover = 1 WHERE id = ?`, [
      image_id,
    ]);
    await redis.del(
      redis.KEYS.company(company_id),
      redis.KEYS.companyImages(company_id),
    );
    // ── Invalidate cache for this turf and the all-turfs list ─────────────
    console.log(
      `[cache] Invalidated Images company=${company_id} image=${image_id} after update`,
    );

    console.log(
      `[company-image] cover set company=${company_id} image=${image_id}`,
    );
    return res.json({ message: "Cover image updated" });
  } catch (err) {
    console.error("setCompanyCover error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── DELETE /api/company/:id/images/:imageId ──────────────────────────────────
// Delete one image — also deletes from Cloudinary
// If deleted image was the cover, promotes the next image to cover
const deleteCompanyImage = async (req, res) => {
  try {
    const company_id = await resolveInternalId(db, "companies", req.params.id);
    if (!company_id) return res.status(404).json({ message: "Company not found" });
    const imageKey = req.params.imageId;

    // Fetch the image to get public_id and is_cover
    const [rows] = await db.query(
      `SELECT id, public_id, is_cover FROM company_images
       WHERE (id = ? OR public_id = ?) AND company_id = ? LIMIT 1`,
      [imageKey, imageKey, company_id],
    );
    if (!rows.length)
      return res
        .status(404)
        .json({ message: "Image not found for this Company" });

    const image = rows[0];
    const image_id = image.id;

    // Delete from Cloudinary first
    await deleteFromCloudinary(image.public_id);

    // Delete from DB
    await db.query(`DELETE FROM company_images WHERE id = ?`, [image_id]);

    // If deleted image was the cover, promote the next image
    if (image.is_cover) {
      const [remaining] = await db.query(
        `SELECT id FROM company_images WHERE company_id = ? ORDER BY sort_order ASC LIMIT 1`,
        [company_id],
      );
      if (remaining.length) {
        await db.query(`UPDATE company_images SET is_cover = 1 WHERE id = ?`, [
          remaining[0].id,
        ]);
      }
    }
    await redis.del(
      redis.KEYS.company(company_id),
      redis.KEYS.companyImages(company_id),
    );
    console.log(
      `[cache] Invalidated Images company=${company_id} image=${image_id} after delete`,
    );
    console.log(
      `[company-image] deleted company=${company_id} image=${image_id} public_id=${image.public_id}`,
    );
    return res.json({ message: "Image deleted" });
  } catch (err) {
    console.error("deleteComapnyImage error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── DELETE /api/company/:id/images ───────────────────────────────────────────
// Delete ALL images for a company (used when deleting the company itself)
const deleteAllCompanyImages = async (company_id) => {
  try {
    const [rows] = await db.query(
      `SELECT public_id FROM company_images WHERE company_id = ?`,
      [company_id],
    );
    // Delete all from Cloudinary in parallel
    await Promise.all(rows.map((r) => deleteFromCloudinary(r.public_id)));
    // DB rows deleted automatically via ON DELETE CASCADE on company's table
    console.log(
      `[company-image] deleted all ${rows.length} images for company=${company_id}`,
    );
  } catch (err) {
    console.error("deleteAllCompanyImages error:", err);
  }
};

module.exports = {
  getCompanyImages,
  uploadCompanyImages,
  setCompanyCover,
  deleteCompanyImage,
  deleteAllCompanyImages,
};
