const crypto = require("crypto");

function newPublicId() {
  return crypto.randomUUID();
}

async function resolveInternalId(db, table, value) {
  const allowed = new Set(["users", "companies", "categories", "products", "company_images"]);
  if (!allowed.has(table)) throw new Error("Invalid public ID table");
  const [rows] = await db.query(`SELECT id FROM ${table} WHERE public_id = ? OR id = ? LIMIT 1`, [value, value]);
  return rows[0]?.id || null;
}

module.exports = { newPublicId, resolveInternalId };
