const db = require("../config/db");
const bcrypt = require("bcryptjs");

const generateToken = require("../config/jwt");

const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../middleware/upload");

const URL = process.env.REACT_APP_URL;

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

/* ================= REGISTER ================= */
// Route must use: upload.single('photo') middleware before this handler
exports.register = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (
      req.user?.role !== "user" 
    )
      return res.status(403).json({ message: "Not authorized" });

    const { name, phone, email, role, password } = req.body;

    const [exists] = await db.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (exists.length)
      return res.status(400).json({ message: "Email already exists" });

    if (!name  || !password)
      return res.status(400).json({ message: "Some fields are missing" });

    const hashed = await bcrypt.hash(password, 10);

    // Upload photo to Cloudinary if provided
    let photoUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "gis_system/profiles",
        `user_${userId}_${Date.now()}`,
      );
      photoUrl = result.secure_url;
    }

    await db.query(
      `INSERT INTO users
       (name, phone, 
        email, password, photo)
       VALUES (?,?,?,?,?)`,
      [
        name,
        phone,
        email,
        hashed,
        photoUrl,
      ],
    );

    res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ================= LOGIN ================= */
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({
        message: "Authentication field and password are required.",
      });
    }
    // ── 1. Check Admin ──────────────────────────────────────────
    const [rows] = await db.query(
      `SELECT id, name, email,  phone, password, role, photo FROM users
WHERE email = ? OR phone = ? AND role = "user"
LIMIT 1`,
      [email, email],
    );

    if (!rows.length)
      return res.status(401).json({ message: "Invalid credentials" });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });
    await db.query("UPDATE users SET last_login = NOW() WHERE id = ?", [
      user.id,
    ]);
    const token = generateToken({
      id: user.id,
      role: user.role,
    });

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        photo: user.photo ?? null,
        phone: user.phone,
        lastLogin: user.last_login,
      },
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/* ================= CHANGE PASSWORD ======================================= */
exports.changePassword = async (req, res) => {
  try {
    const adminId = req?.user?.id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "All fields are required" });

    const [rows] = await db.execute("SELECT password FROM users WHERE id = ? AND role='user'", [
      adminId,
    ]);

    if (!rows.length)
      return res
        .status(404)
        .json({
          message: "We couldn't find an account associated with this user.",
        });

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch)
      return res.status(400).json({ message: "Old password is incorrect" });

    const isSame = await bcrypt.compare(newPassword, rows[0].password);
    if (isSame)
      return res
        .status(400)
        .json({ message: "New password cannot be same as old password" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.execute("UPDATE users SET password = ? WHERE id = ?", [
      hashed,
      adminId,
    ]);

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error ⚠️" });
  }
};

/* ================= UPDATE USER ============================================
   Handles text fields + optional photo in one FormData request.
   Route: PUT /api/auth/update/:id  (upload.single('photo') middleware)       */
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params?.id;
    if (String(req.user?.id) !== String(userId))
      return res
        .status(403)
        .json({ message: "You can only update your own profile" });

    // Verify admin exists + get current photo for cleanup
    const [rows] = await db.query("SELECT id, photo FROM users WHERE id = ?", [
      userId,
    ]);
    if (!rows.length)
      return res.status(404).json({ message: "Record not found" });

    const fields = [];
    const values = [];

    // Text fields
    ["name", "phone", "email"].forEach((key) => {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    });

    // Photo — only if a new file was uploaded
    let newPhotoUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "gis_system/profiles",
        `user_${userId}_${Date.now()}`,
      );
      newPhotoUrl = result.secure_url;
      fields.push("photo = ?");
      values.push(newPhotoUrl);
    }

    if (!fields.length) return res.json({ message: "Nothing to update" });

    await db.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, [
      ...values,
      userId,
    ]);

    // Delete old photo from Cloudinary AFTER successful DB save
    if (req.file && rows[0].photo) {
      const oldPublicId = extractPublicId(rows[0].photo);
      if (oldPublicId) await deleteFromCloudinary(oldPublicId).catch(() => {});
    }

    // Return updated admin so frontend can sync immediately
    const [updated] = await db.query(
      `SELECT id, name,phone,
              email, role, photo
       FROM users WHERE id = ?`,
      [userId],
    );

    res.json({ message: "Record updated successfully", user: updated[0] });
  } catch (err) {
    console.error("updateUser error:", err);
    res.status(500).json({ error: "Server Error ⚠️" });
  }
};

/* ================= UPLOAD ADMIN PHOTO =====================================
   PUT /api/auth/admins/:id/photo
   Expects: upload.single('photo') middleware on the route               */
exports.uploadAdminPhoto = async (req, res) => {
  try {
    const userId = req.params?.id;
    if (!req.file)
      return res.status(400).json({ message: "No image provided" });

    // Get current photo to delete from Cloudinary after upload
    const [rows] = await db.query(
      "SELECT photo FROM users WHERE id = ? LIMIT 1",
      [userId],
    );
    if (!rows.length)
      return res.status(404).json({ message: "Record not found" });

    const oldPublicId = extractPublicId(rows[0].photo);

    // Upload new photo
    const result = await uploadToCloudinary(
      req.file.buffer,
      "gis_system/profiles",
      `user_${userId}_${Date.now()}`,
    );

    // Save new URL
    await db.query("UPDATE users SET photo = ? WHERE id = ?", [
      result.secure_url,
      userId,
    ]);

    // Delete old from Cloudinary after successful DB save
    if (oldPublicId) await deleteFromCloudinary(oldPublicId);

    // Return updated admin
    const [updated] = await db.query(
      `SELECT id, name, phone,
              email, role, photo
       FROM users WHERE id = ? LIMIT 1`,
      [userId],
    );

    console.log(
      `[user-photo] uploaded user=${userId} public_id=${result.public_id}`,
    );
    res.json({ message: "Photo updated", user: updated[0] });
  } catch (err) {
    console.error("uploadUserPhoto Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= DELETE ADMIN PHOTO =====================================
   DELETE /api/auth/admins/:id/photo                                      */
exports.deleteAdminPhoto = async (req, res) => {
  try {
    const userId = req.params?.id;

    const [rows] = await db.query(
      "SELECT photo FROM users WHERE id = ? LIMIT 1",
      [userId],
    );
    if (!rows.length)
      return res.status(404).json({ message: "Record not found" });

    const publicId = extractPublicId(rows[0].photo);

    // Clear from DB first
    await db.query("UPDATE users SET photo = NULL WHERE id = ?", [userId]);

    // Then delete from Cloudinary
    if (publicId) await deleteFromCloudinary(publicId);

    const [updated] = await db.query(
      `SELECT id, name, phone,
              email, role, photo
       FROM users WHERE id = ? LIMIT 1`,
      [userId],
    );

    console.log(`[user-photo] removed user=${userId}`);
    res.json({ message: "Photo removed", user: updated[0] });
  } catch (err) {
    console.error("deleteUserPhoto Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= DELETE ADMIN (COMPANY) ========================================== */
exports.deleteUserAccount = async (req, res) => {
  try {
    const targetId = req.params.id;
    const requesterId = req.user?.id;
    const requesterRole = req.user?.role;
    if (!requesterId)
      return res.status(403).json({ message: "Access required" });
    if (
      requesterRole !== "user"
    ) {
      return res
        .status(403)
        .json({ message: "Only account owner can delete " });
    }

    const [rows] = await db.query("SELECT photo FROM users WHERE id = ?", [
      targetId,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Account does not exist" });
    }
    if (rows[0].photo) {
      await deleteFromCloudinary(extractPublicId(rows[0].photo));
    }

    await db.query("DELETE FROM users WHERE id = ?", [targetId]);
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= GET BY COMPANIES (USER) ======================================= */
exports.getCompanies = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, company_id, name,username, phone,
              email, role, photo, created_at
       FROM users WHERE id = ?`,
    );
    if (!rows.length)
      return res.status(404).json({ message: "Admin not found" });

    res.json(rows[0]); // photo is already a Cloudinary URL or null
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= GET SINGLE COMPANY (USER) ======================================== */
exports.getSingleCompany = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, company_id, name,username, phone,
              email, role, photo, last_login, created_at
       FROM users WHERE company_id = ?`,
      [req.auth?.company_id],
    );
    res.json(rows); // photos are already Cloudinary URLs or null
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= GET ALL COMPANIES (USER) ======================================== */
exports.getAllCompanies = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.id, c.company_name, c.phone,
              c.email, c.address, c.latitude, c.longitude,c.working_hours, c.description, c.status, c.created_at,
              g.category_name AS category_name, g.id AS cat_id, g.color AS category_color,
              (
                SELECT COUNT(*) FROM products
                WHERE company_id = c.id
              ) AS total_products
       FROM companies c
       LEFT JOIN categories g ON c.category_id = g.id
       ORDER BY c.created_at DESC`,
    );

    return res.json(rows);
  } catch (err) {
    console.error("getCompanies error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
/* ================= GET MY COMPANY DETAILS (COMPANY ADMIN) ======================================== */
exports.getMyCompanyDetails = async (req, res) => {
  try {
    const admin_id = req.auth?.id;
    const company_id = req.params.company_id;
    const userRole = req.auth?.role;
    const userCompanyId = req.auth?.company_id;

    if (!admin_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (
      userRole &&
      !["super_admin", "warehouse_manager", "warehouse_user"].includes(userRole)
    ) {
      return res.status(403).json({ message: "Unauthorized role" });
    }

    if (
      (userRole === "warehouse_manager" || userRole === "warehouse_user") &&
      String(userCompanyId) !== String(company_id)
    ) {
      return res
        .status(403)
        .json({ message: "You can only view your own company" });
    }

    const [company] = await db.query(
      `
      SELECT
        c.id,
        c.company_name,
        c.phone,
        c.email,
        c.address,
        c.latitude,
        c.longitude,
        c.working_hours,
        c.description,
        c.status,
        c.created_at,
        g.id AS cat_id,
        g.category_name, g.color AS category_color
      FROM companies c
      LEFT JOIN categories g
        ON c.category_id = g.id
      WHERE c.id = ?
      `,
      [company_id],
    );

    if (!company.length) {
      return res.status(404).json({ message: "Company not found" });
    }

    const [products] = await db.query(
      `
      SELECT
        id,
        product_name
      FROM products
      WHERE company_id = ?
      ORDER BY product_name
      `,
      [company_id],
    );

    company[0].products = products;
    company[0].total_products = products.length;
    res.json(company[0]);
  } catch (err) {
    console.error("getMyCompanyDetails error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// ================= GET ALL ADMINS (SUPER ADMIN) ======================================== */
exports.getAllAdmins = async (req, res) => {
  try {
    if (req.auth?.role !== "super_admin")
      return res.status(403).json({ message: "Super admin access required" });
    const [rows] = await db.query(
      `SELECT id, company_id, name,username, phone,
              email, role, photo, created_at, last_login
       FROM users WHERE role IN ('super_admin', 'warehouse_manager', 'warehouse_user','user')`,
    );
    res.json(rows); // photos are already Cloudinary URLs or null
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= GET ME ================================================ */
exports.getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, email, phone, role, photo
       FROM users WHERE id = ?`,
      [req.auth?.id],
    );
    if (!rows.length)
      return res.status(404).json({ message: "Invalid credentials" });

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= GET COMPANY DETAIL (PUBLIC USER VIEW) ================= */
exports.getCompanyDetail = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.id, c.company_name, c.phone, c.email, c.address,
              c.latitude, c.longitude, c.working_hours, c.description,
              c.status, c.created_at, g.category_name, g.id AS cat_id, g.color AS category_color,
              (SELECT COUNT(*) FROM products WHERE company_id = c.id) AS total_products
       FROM companies c
       LEFT JOIN categories g ON c.category_id = g.id
       WHERE c.id = ?`,
      [req.params.id],
    );

    if (!rows.length) return res.status(404).json({ message: "Company not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("getCompanyDetail error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= CONTACT / HELP ================= */
exports.help = async (req, res) => {
  const { name, email, message } = req.body?.form ?? req.body ?? {};

  if (!name || !email || !message) {
    return res.status(400).json({ message: "Name, email, and message are required" });
  }

  res.status(201).json({ message: "Contact form received" });
};

