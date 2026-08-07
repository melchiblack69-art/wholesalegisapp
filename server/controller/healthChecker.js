// controller/healthChecker.js
const db = require("../config/db");
const redis = require("../config/RedisClient");

exports.checkHealth = async (req, res) => {
  const result = {
    status: "ok",
    database: "unknown",
    redis: "unknown",
    timestamp: new Date().toISOString(),
  };

  let dbHealthy = false;

  // Check database — critical
  try {
    await db.query("SELECT 1");
    result.database = "connected";
    dbHealthy = true;
  } catch (error) {
    console.error("[Health Check] Database failed:", error.message);
    result.database = "unavailable";
  }

  // Check Redis — optional, degrades gracefully
  if (!process.env.REDIS_URL) {
    result.redis = "disabled";
  } else if (redis.isReady()) {
    const alive = await redis.ping();
    result.redis = alive ? "connected" : "unresponsive";
  } else {
    result.redis = "disconnected";
  }

  // Only DB failure makes the service "down"
  if (dbHealthy) {
    result.status = result.redis === "connected" || result.redis === "disabled" ? "ok" : "degraded";
    console.log("[Health Check]", result.status, "-", result);
    return res.status(200).json(result);
  } else {
    result.status = "error";
    console.log("[Health Check] Critical failure:", result);
    return res.status(503).json(result);
  }
};