const db           = require("../config/db");

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

    const [result] = await db.query(
      "INSERT INTO categories (category_name, icon, color) VALUES (?, ?, ?)",
      [categoryName, categoryIcon, categoryColor]
    );

    res.status(201).json({
      message: "Category added successfully",
      id: result.insertId,
      category: { id: result.insertId, category_name: categoryName, icon: categoryIcon, color: categoryColor }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

//update an existing category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const categoryName = req.body.category_name ?? req.body.name;
    const categoryIcon = req.body.category_icon ?? req.body.icon;
    const categoryColor = req.body.category_color ?? req.body.color ?? "#1c6b41";

    const [result] = await db.query(
      "UPDATE categories SET category_name=?, icon=?, color=? WHERE id=?",
      [categoryName, categoryIcon, categoryColor, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({
      message: "Category updated successfully",
      category: { id, category_name: categoryName, icon: categoryIcon, color: categoryColor }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

//delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM categories WHERE id=?",
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category deleted successfully" });
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
      (company_name, phone, email, address, latitude, longitude, description, working_hours, category_id)
      VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        company_name,
        phone,
        email,
        address,
        latitude,
        longitude,
        description,
        working_hours || null,
        category_id ?? null
      ]
    );

    res.status(201).json({
      message: "Company added successfully",
      id: result.insertId
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
//update an existing company
exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;

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
        category_id ?? null,
        id
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json({ message: "Company updated successfully" });

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
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json({ message: "Company deleted successfully" });

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

    const [result] = await db.query(
      "INSERT INTO products (company_id, product_name, quantity, unit) VALUES (?,?,?,?)",
      [company_id, product_name, quantity, unit]
    );

    res.status(201).json({
      message: "Product added successfully",
      id: result.insertId
    });

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

    const [result] = await db.query(
      `UPDATE products
      SET company_id=?, product_name=?, quantity=?, unit=?
      WHERE id=?`,
      [company_id, product_name, quantity, unit, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
//get all products for a company
exports.getProducts = async (req, res) => {
  try {
    const company_id = req.params?.company_id;
    const [rows] = await db.query(`
      SELECT * FROM products 
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
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
