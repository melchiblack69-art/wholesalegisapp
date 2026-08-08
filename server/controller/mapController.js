const db = require("../config/db");
const redis = require("../config/RedisClient");

exports.getMapCompanies = async (req, res) => {
  try {
    const cached = await redis.get(redis.KEYS.publicMap);
    if (cached) return res.json(cached);
    const [rows] = await db.query(`
      SELECT
        c.id, c.public_id,
        c.company_name,
        c.latitude,
        c.longitude,
        c.status,
        c.category_id, cat.public_id AS category_public_id,
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
        public_id: company.public_id,
        company_name: company.company_name || company.name,
        name: company.company_name || company.name,
        latitude: company.latitude,
        longitude: company.longitude,
        status: company.status,
        category_id: company.category_id,
        category_public_id: company.category_public_id,
        category_name: company.category_name,
        icon: company.icon || "default-icon.png",
        color: company.color || "#1c6b41",
        bg: "#e8f5ec",
      };
    });

    await redis.set(redis.KEYS.publicMap, companies, redis.TTL.publicMap);
    res.json(companies);
  } catch (error) {
    console.error("getMapCompanies error", error);
    res.status(500).json({ message: "Failed to load map companies" });
  }
};
