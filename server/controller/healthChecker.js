// controller/healthChecker.js
const db = require("../config/db");
const redis = require("../config/RedisClient");
const { sendHealthAlert } = require("../service/mailer");

exports.checkHealth = async (req, res) => {
  const result = {
    status: "ok",
    database: "unknown",
    redis: "unknown",
    timestamp: new Date().toISOString(),
  };

  let dbHealthy = false;

  try {
    await db.query("SELECT 1");
    result.database = "connected";
    dbHealthy = true;
  } catch (error) {
    console.error("[Health Check] Database failed:", error.message);
    result.database = "unavailable";
  }

  if (!process.env.REDIS_URL) {
    result.redis = "disabled";
  } else if (redis.isReady()) {
    const alive = await redis.ping();
    result.redis = alive ? "connected" : "unresponsive";
  } else {
    result.redis = "disconnected";
  }

  const redisOk = result.redis === "connected" || result.redis === "disabled";

  if (dbHealthy && redisOk) {
    result.status = "ok";
    return res.status(200).json(result);
  }

  result.status = dbHealthy ? "degraded" : "error";
  console.log("[Health Check] Issue detected:", JSON.stringify(result));

  // Fire alert email — don't block the response on it
  sendHealthAlert(result).catch((err) =>
    console.error("[Health Alert] Failed to send email:", err.message)
  );

  return res.status(dbHealthy ? 200 : 503).json(result);
};