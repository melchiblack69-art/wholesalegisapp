const db           = require("../config/db");

const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../middleware/upload");
/* ================= HELPER: extract Cloudinary public_id from URL ========= */
const extractPublicId = (url) => {
  if (!url || !url.includes("cloudinary.com")) return null;
  try {
    const afterUpload = url.split("/upload/")[1];
    if (!afterUpload) return null;
    const withoutVersion = afterUpload.replace(/^v\d+\//, "");
    return withoutVersion.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
};

exports.getSystemDetails = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM system_details LIMIT 1"
    );

    if (!rows.length) {
      return res.status(404).json({ message: "System details not found" });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.addSystemDetails = async (req, res) => {
  try {
    const {
      system_name,
      other_name,
      system_logo,
      system_email,
      maintenance_mode,
      description
          } = req.body;

    const [exists] = await db.query(
      "SELECT id FROM system_details LIMIT 1"
    );

    if (exists.length) {
      return res.status(400).json({
        message: "System details already exist"
      });
    }

    const [result] = await db.query(
      `INSERT INTO system_details
      (
        system_name,
        tagline,
        system_logo,
        favicon,
        email,
        phone,
        address,
        maintenance_mode,
        booking_enabled,
        allow_registration,
        review_enabled,
        currency,
        facebook,
        instagram,
        twitter,
        website
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        system_name,
        tagline,
        system_logo,
        favicon,
        email,
        phone,
        address,
        maintenance_mode,
        booking_enabled,
        allow_registration,
        review_enabled,
        currency,
        facebook,
        instagram,
        twitter,
        website
      ]
    );

    res.status(201).json({
      message: "System details added successfully",
      id: result.insertId
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateSystemDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      system_name,
      other_name,
      system_email,
      description,
      maintenance_mode
    } = req.body;

    const [existing] = await db.query(
  `SELECT system_logo FROM system_details WHERE id = ?`,
  [id]
);

    
// Upload photo to Cloudinary if provided
let system_logo = existing[0]?.system_logo || null;
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "gis_system/logo",
        `logo_${id}_${Date.now()}`,
      );
      system_logo = result.secure_url;
    }

    const [result] = await db.query(
      `UPDATE system_details
      SET
      system_name=?,
      other_name=?,
      system_logo=?,
      system_email=?,
      description=?,
      maintenance_mode=? 
      WHERE id=?`,
      [
        system_name,
        other_name,
        system_logo, // Use new photo URL if uploaded, else keep existing
        system_email,
        description,
        maintenance_mode,
        id
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "System details not found"
      });
    }

    res.json({
      message: "System details updated successfully",
      system_logo,
      system_name,
      other_name,
      system_email
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getDatabaseSize = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        table_schema AS database_name,
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
      FROM information_schema.TABLES
      WHERE table_schema = DATABASE()
      GROUP BY table_schema
    `);

    res.json(rows[0] || {
      database_name: null,
      size_mb: 0
    });

  } catch (err) {
    console.error("Database Size Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove system logo — deletes from Cloudinary + sets system_logo. = NULL
exports.deleteLogo = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT id, system_logo FROM system_details WHERE id = ? LIMIT 1`, [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'No Logo' });

    const publicId = extractPublicId(rows[0].system_logo);

    // Delete from Cloudinary
    if (publicId) await deleteFromCloudinary(publicId);

    //Then clear the system_logo field in the database
    await db.query(`UPDATE system_details SET system_logo = NULL WHERE id = ?`, [id]);

    // Return updated user
    const [updated] = await db.query(
      `SELECT * FROM system_details WHERE id = ? LIMIT 1`,
      [id]
    );

    console.log(`[System-Logo] removed  id=${id}`);
    return res.json({ message: ' system logo removed', system_logo: updated[0] });
  } catch (err) {
    console.error('deleteSystemLogo error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getSystemDetail = async (req, res) =>{
  try {
    const [rows] = await db.query(
      "SELECT * FROM system_details LIMIT 1"
    );

    if (!rows.length) {
      return res.status(404).json({ message: "No system details found" });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}