const db = require("../config/db");

exports.getMapCompanies = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        c.id,
        c.company_name,
        c.latitude,
        c.longitude,
        c.status,
        c.category_id,
        cat.category_name,
        cat.icon,
        cat.color
      FROM companies c
      LEFT JOIN categories cat ON cat.id = c.category_id
      WHERE c.status IS NOT NULL
      ORDER BY c.company_name ASC
    `);

    const companies = rows.map((company) => {
      return {
        id: company.id,
        company_name: company.company_name || company.name,
        name: company.company_name || company.name,
        latitude: company.latitude,
        longitude: company.longitude,
        status: company.status,
        category_id: company.category_id,
        category_name: company.category_name,
        icon: company.icon || "default-icon.png",
        color: company.color || "#1c6b41",
        bg: "#e8f5ec",
      };
    });

    res.json(companies);
  } catch (error) {
    console.error("getMapCompanies error", error);
    res.status(500).json({ message: "Failed to load map companies" });
  }
};
