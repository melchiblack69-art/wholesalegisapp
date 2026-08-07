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
    const { name, email, phone, password } = req.body;

    // ── 1. Validate required fields ───────────────────────────
    if (!name || !phone || !password) {
      return res.status(400).json({
        message: "All fields are required.",
      });
    }

    // ── 2. Check if email or phone already exists ─────────────
    const [exists] = await db.query(
      `SELECT id
       FROM users
       WHERE (email = ? OR phone = ?)
       AND role = "user"
       LIMIT 1`,
      [email, phone]
    );

    if (exists.length) {
      return res.status(400).json({
        message: "Email or phone already exists.",
      });
    }

    // ── 3. Hash password ──────────────────────────────────────
    const hashed = await bcrypt.hash(password, 10);

    // ── 4. Create user ────────────────────────────────────────
    await db.query(
      `INSERT INTO users
       (name, phone, email, password, role)
       VALUES (?, ?, ?, ?, ?)`,
      [
        name,
        phone,
        email,
        hashed,
        "user",
      ]
    );

    // ── 5. Response ───────────────────────────────────────────
    return res.status(201).json({
      message: "Account created successfully",
    });

  } catch (err) {
    console.error("register error:", err);

    return res.status(500).json({
      error: err.message,
    });
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

    // ── 1. Check user ──────────────────────────────────────────
    const [rows] = await db.query(
      `SELECT 
        id,
        name,
        email,
        phone,
        password,
        role,
        photo,
        last_login
       FROM users
       WHERE (email = ? OR phone = ?)
       AND role = "user"
       LIMIT 1`,
      [email, email]
    );

    if (!rows.length) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const user = rows[0];

    // ── 2. Check password ─────────────────────────────────────
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // ── 3. Update last login ──────────────────────────────────
    await db.query(
      "UPDATE users SET last_login = NOW() WHERE id = ?",
      [user.id]
    );

    // ── 4. Generate JWT ───────────────────────────────────────
    const token = generateToken({
      id: user.id,
      role: user.role,
    });

    // ── 5. Return response ────────────────────────────────────
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
        lastLogin: new Date(),
      },
    });

  } catch (err) {
    console.error("login error:", err);

    return res.status(500).json({
      error: err.message,
    });
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
   Route: PUT /api/user/update/:id  (upload.single('photo') middleware)       */
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params?.id;

    // ── 1. Make sure user can only update their own profile ───
    if (String(req.user?.id) !== String(userId)) {
      return res.status(403).json({
        message: "You can't update this profile",
      });
    }

    // ── 2. Verify user exists ─────────────────────────────────
    const [rows] = await db.query(
      `SELECT id, name, email, phone, photo FROM users WHERE id = ? AND role = 'user' `,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    const fields = [];
    const values = [];

    // ── 3. Only update fields supplied by the user ────────────
    const allowedFields = ["name", "phone", "email"];

    allowedFields.forEach((key) => {
      if (
        req.body[key] !== undefined &&
        req.body[key] !== null
      ) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    });

    // ── 4. Nothing to update ──────────────────────────────────
    if (!fields.length) {
      return res.status(400).json({
        message: "Nothing to update",
      });
    }

    // ── 5. Update user ────────────────────────────────────────
    await db.query(
      `UPDATE users
       SET ${fields.join(", ")}
       WHERE id = ?`,
      [...values, userId]
    );

    // ── 6. Return updated user ────────────────────────────────
    const [updated] = await db.query(
      `SELECT
        id,
        name,
        phone,
        email,
        role,
        photo
       FROM users
       WHERE id = ?`,
      [userId]
    );

    return res.json({
      message: "Account updated successfully",
      user: updated[0],
    });

  } catch (err) {
    console.error("updateUser error:", err);

    return res.status(500).json({
      error: "Server Error ⚠️",
    });
  }
};

/* ================= UPLOAD ADMIN PHOTO =====================================
   PUT /api/user/:id/photo
   Expects: upload.single('photo') middleware on the route               */
exports.uploadUserPhoto = async (req, res) => {
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

/* ================= DELETE USER PHOTO =====================================
   DELETE /api/user/:id/photo                                      */
exports.deleteUserPhoto = async (req, res) => {
  try {
    const userId = req.params?.id;

    const [rows] = await db.query(
      "SELECT photo FROM users WHERE id = ? LIMIT 1",
      [userId],
    );
    if (!rows.length)
      return res.status(404).json({ message: "Record not found" });

    const publicId = extractPublicId(rows[0].photo);

    // Delete from first Cloudinary
    if (publicId) await deleteFromCloudinary(publicId);

    // Then clear from DB 
    await db.query("UPDATE users SET photo = NULL WHERE id = ?", [userId]);

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

/* ================= DELETE USER ACCOUNT (BY USER) ========================================== */
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
              ) AS total_products,
              COALESCE((SELECT JSON_ARRAYAGG(product_name) FROM products p2 WHERE p2.company_id = c.id), JSON_ARRAY()) AS products
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

/* ================= GET ME ================================================ */
exports.getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, email, phone, role, photo
       FROM users WHERE id = ?`,
      [req.user?.id],
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
              (SELECT COUNT(*) FROM products) AS total_products
       FROM companies c
       LEFT JOIN categories g ON c.category_id = g.id
       WHERE c.id = ?`,
      [req.params.id],
    );
  const [products] = await db.query(
  `SELECT id, product_name
   FROM products
   WHERE company_id = ?`,
  [req.params.id]
);

    if (!rows.length) return res.status(404).json({ message: "Company not found" });

    res.json({
  ...rows[0],
  products,
});
  } catch (err) {
    console.error("getCompanyDetail error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= CONTACT / HELP ================= */
exports.help = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: "Name, email, and message are required" });
  }

  await db.query("INSERT INTO help (name, email, message) VALUES(?,?,?)", [
    name, email, message
  ]);

  res.status(201).json({ message: "Contact form received" });
};

//get all categories (SUPER ADMIN)
exports.getCategories = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        c.id,
        c.category_name,
        c.icon,
        c.color,
        COUNT(co.id) AS company_count
      FROM categories c
      LEFT JOIN companies co ON co.category_id = c.id
      GROUP BY c.id, c.category_name, c.icon
      ORDER BY c.id DESC
    `);

    const categories = rows.map((row) => {
      return {
        id: row.id,
        category_name: row.category_name,
        icon: row.icon || "bi-grid-fill",
        color: row.color || "#1c6b41",
        bg: "#e8f5ec",
        company_count: Number(row.company_count || 0),
      };
    });

    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
// ──User:  stats ─────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        (SELECT COUNT(*) FROM companies) AS total_companies,
        (SELECT COUNT(*) FROM products) AS total_products,
        (SELECT COUNT(*) FROM categories) AS total_categories`,
    );

    const payload = rows[0];
    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getCompaniesByCategory = async (req, res) => {
    const categoryId = req.params.categoryId;
    try {
    const [rows] = await db.query(
      `SELECT c.id, c.company_name, c.phone, c.email, c.address,
              c.latitude, c.longitude, c.working_hours, c.description,
              c.status, c.created_at, g.category_name, g.id AS cat_id, g.color AS category_color,
              (SELECT COUNT(*) FROM products WHERE company_id = c.id) AS total_products,
              COALESCE((SELECT JSON_ARRAYAGG(product_name) FROM products p2 WHERE p2.company_id = c.id), JSON_ARRAY()) AS products
       FROM companies c
       LEFT JOIN categories g ON c.category_id = g.id
       WHERE c.category_id = ?`,
      [categoryId],
    );

    if (!rows.length) return res.status(404).json({ message: "Companies not found" });
    res.json(rows);
  } catch (err) {
    console.error("getCompanyDetail error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

//get all products for a company
exports.getProducts = async (req, res) => {
  try {
    const company_id = req.params?.id;
    const [rows] = await db.query(`
      SELECT * FROM products 
      WHERE company_id = ?
      `, [company_id]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  };
}
