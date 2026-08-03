const db = require("../config/db");

const checkMaintenance = async (req, res, next) => {
  try {

     // Allow Super Admin to bypass maintenance
    if (req.auth?.role === "super_admin") {
      return next();
    }

    if (req.originalUrl.startsWith("/api/auth/login")) { return next(); }
if (
  req.originalUrl.startsWith("/uploads") ||
  req.originalUrl.startsWith("/api/auth/forgot-password") ||
  req.originalUrl.startsWith("/api/auth/reset-password")  ||
  req.originalUrl.startsWith("/api/system/sys-details")
) {
  return next();
}


    const [rows] = await db.query(
      "SELECT maintenance_mode FROM system_details LIMIT 1"
    );

    if (rows.length && Number(rows[0].maintenance_mode) === 1) {
      console.log("[Maintenance Mode: ] - ON");
      return res.status(503).json({
        maintenance: true,
        message: "The system is currently under maintenance. Please try again later."
      });
    }
console.log("[Maintenance Mode: ] - OFF");
    next();

  } catch (err) {
    console.error("Maintenance middleware:", err);
    next();
  }
};

module.exports = checkMaintenance;