// controller/healthChecker.js
const db = require("../config/db");
const redis = require("../config/RedisClient");

// Safely parse REDIS_URL to get host/port without exposing credentials
function getRedisConnectionInfo() {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port || "6379",
    };
  } catch {
    return { host: "unparseable" };
  }
}

exports.checkHealth = async (req, res) => {
  const result = {
    status: "ok",
    database: {
      status: "unknown",
      host: process.env.DB_HOST || "unknown",
      name: process.env.DB_NAME || "unknown",
    },
    redis: {
      status: "unknown",
      ...getRedisConnectionInfo(),
    },
    timestamp: new Date().toISOString(),
  };

  let dbHealthy = false;

  // Check database — critical
  try {
    await db.query("SELECT 1");
    result.database.status = "connected";
    dbHealthy = true;
  } catch (error) {
    console.error("[Health Check] Database failed:", error.message);
    result.database.status = "unavailable";
  }

  // Check Redis — optional, degrades gracefully
  if (!process.env.REDIS_URL) {
    result.redis.status = "disabled";
  } else if (redis.isReady()) {
    const alive = await redis.ping();
    result.redis.status = alive ? "connected" : "unresponsive";
  } else {
    result.redis.status = "disconnected";
  }

  if (dbHealthy) {
    result.status = (result.redis.status === "connected" || result.redis.status === "disabled") ? "ok" : "degraded";
    console.log("[Health Check]", result.status, "-", JSON.stringify(result));
    return res.status(200).json(result);
  } else {
    result.status = "error";
    console.log("[Health Check] Critical failure:", JSON.stringify(result));
    return res.status(503).json(result);
  }
};