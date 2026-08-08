const db           = require("../config/db");
const { newPublicId, resolveInternalId } = require("../utils/publicId");
const redis = require("../config/RedisClient");

const invalidatePublicCatalog = () => Promise.all([
  redis.del(redis.KEYS.publicCompanies, redis.KEYS.publicCategories, redis.KEYS.publicStats, redis.KEYS.publicMap),
  redis.delPattern("public:company:*") ,
  redis.delPattern("public:category:*:companies"),
]);

//========== CATEGORY MANAGEMENT ENDPOINTS (add, update, delete) ============================
//add a new category
exports.addCategory = async (req, res) => {
  try {
    const categoryName = req.body.category_name ?? req.body.name;
    const categoryIcon = req.body.category_icon ?? req.body.icon;
    const categoryColor = req.body.category_color ?? req.body.color ?? "#1c6b41";

    if (!categoryName) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const [exists] = await db.query(
      "SELECT id FROM categories WHERE category_name = ?",
      [categoryName]
    );

    if (exists.length) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const categoryPublicId = newPublicId();
    const [result] = await db.query(
      "INSERT INTO categories (public_id, category_name, icon, color) VALUES (?, ?, ?, ?)",
      [categoryPublicId, categoryName, categoryIcon, categoryColor]
    );

    res.status(201).json({
      message: "Category added successfully",
      id: result.insertId,
      category: { id: result.insertId, public_id: categoryPublicId, category_name: categoryName, icon: categoryIcon, color: categoryColor }
    });
    await invalidatePublicCatalog();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

//update an existing category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const categoryId = await resolveInternalId(db, "categories", id);
    if (!categoryId) return res.status(404).json({ message: "Category not found" });
    const categoryName = req.body.category_name ?? req.body.name;
    const categoryIcon = req.body.category_icon ?? req.body.icon;
    const categoryColor = req.body.category_color ?? req.body.color ?? "#1c6b41";

    const [result] = await db.query(
      "UPDATE categories SET category_name=?, icon=?, color=? WHERE id=?",
      [categoryName, categoryIcon, categoryColor, categoryId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({
      message: "Category updated successfully",
      category: { id, category_name: categoryName, icon: categoryIcon, color: categoryColor }
    });
    await invalidatePublicCatalog();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

//delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const categoryId = await resolveInternalId(db, "categories", id);
    if (!categoryId) return res.status(404).json({ message: "Category not found" });

    const [result] = await db.query(
      "DELETE FROM categories WHERE id=?",
      [categoryId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category deleted successfully" });
    await invalidatePublicCatalog();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

//get all categories (SUPER ADMIN)
exports.getCategories = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        c.id, c.public_id,
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
        public_id: row.public_id,
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

//========== COMPANY MANAGEMENT ENDPOINTS (add, update, delete) FOR SUPER ADMINS ============================
//add a new company
exports.addCompany = async (req, res) => {
  try {
    const {
      company_name,
      phone,
      email,
      address,
      latitude,
      longitude,
      description,
      working_hours,
      category_id
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO companies
      (public_id, company_name, phone, email, address, latitude, longitude, description, working_hours, category_id)
      VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        newPublicId(),
        company_name,
        phone,
        email,
        address,
        latitude,
        longitude,
        description,
        working_hours || null,
        category_id ? await resolveInternalId(db, "categories", category_id) : null
      ]
    );

    res.status(201).json({
      message: "Company added successfully",
      id: result.insertId
    });
    await invalidatePublicCatalog();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
//update an existing company
exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = await resolveInternalId(db, "companies", id);
    if (!companyId) return res.status(404).json({ message: "Company not found" });
    const categoryId = category_id ? await resolveInternalId(db, "categories", category_id) : null;

    const {
      company_name,
      phone,
      email,
      address,
      latitude,
      longitude,
      description,
      working_hours,
      status,
      category_id
    } = req.body;

    const [result] = await db.query(
      `UPDATE companies
      SET
      company_name=?,
      phone=?,
      email=?,
      address=?,
      latitude=?,
      longitude=?,
      description=?,
      working_hours=?,
      status=?,
      category_id=?
      WHERE id=?`,
      [
        company_name,
        phone,
        email,
        address,
        latitude,
        longitude,
        description,
        working_hours ?? null,
        status,
        categoryId,
        companyId
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json({ message: "Company updated successfully" });
    await invalidatePublicCatalog();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

//delete a company
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM companies WHERE id=?",
      [companyId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json({ message: "Company deleted successfully" });
    await invalidatePublicCatalog();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// PRODUCT MANAGEMENT ENDPOINTS (add, update, delete) FOR A COMPANY
//add a new product
exports.addProduct = async (req, res) => {
  try {
    const { company_id, product_name, quantity = 0, unit = "" } = req.body;
    const companyId = await resolveInternalId(db, "companies", company_id);
    if (!companyId) return res.status(404).json({ message: "Company not found" });

    const [result] = await db.query(
      "INSERT INTO products (public_id, company_id, product_name, quantity, unit) VALUES (?,?,?,?,?)",
      [newPublicId(), companyId, product_name, quantity, unit]
    );

    res.status(201).json({
      message: "Product added successfully",
      id: result.insertId
    });
    await invalidatePublicCatalog();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

//update an existing product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id, product_name, quantity = 0 , unit = ""} = req.body;
    const productId = await resolveInternalId(db, "products", id);
    const companyId = await resolveInternalId(db, "companies", company_id);
    if (!productId || !companyId) return res.status(404).json({ message: "Product or company not found" });

    const [result] = await db.query(
      `UPDATE products
      SET company_id=?, product_name=?, quantity=?, unit=?
      WHERE id=?`,
      [companyId, product_name, quantity, unit, productId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product updated successfully" });
    await invalidatePublicCatalog();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
//get all products for a company
exports.getProducts = async (req, res) => {
  try {
    const company_id = await resolveInternalId(db, "companies", req.params?.company_id);
    if (!company_id) return res.status(404).json({ message: "Company not found" });
    const [rows] = await db.query(`
      SELECT p.*, p.public_id
      FROM products p
      WHERE company_id = ?
      `, [company_id]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM products WHERE id=?",
      [await resolveInternalId(db, "products", id)]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
    await invalidatePublicCatalog();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
