// controller/healthChecker.js
const db = require("../config/db");
const redis = require("../config/RedisClient");
const { sendHealthAlert } = require("../service/mailer");

// Extracts the most useful message from a DB/Redis error, regardless of driver shape
function extractErrorMessage(error) {
  if (!error) return "Unknown error";
  return (
    error.sqlMessage ||   // mysql2 — actual DB-side message (e.g. access denied, syntax)
    error.code ||         // mysql2/network — e.g. ETIMEDOUT, ECONNREFUSED, ER_ACCESS_DENIED_ERROR
    error.message ||      // generic JS Error
    (typeof error === "string" ? error : null) ||
    (() => {
      try {
        return JSON.stringify(error);
      } catch {
        return "Unserializable error object";
      }
    })() ||
    "Unknown error"
  );
}

exports.checkHealth = async (req, res) => {
  const result = {
    status: "ok",
    database: "unknown",
    redis: "unknown",
    timestamp: new Date().toISOString(),
    errors: {},
  };

  let dbHealthy = false;

  // ── Database check ──────────────────────────────────────
  try {
    await db.query("SELECT 1");
    result.database = "connected";
    dbHealthy = true;
  } catch (error) {
    console.error("[Health Check] Database failed:", error); // full object, not error.message
    result.database = "unavailable";
    result.errors.database = extractErrorMessage(error);
  }

  // ── Redis check ──────────────────────────────────────────
  if (!process.env.REDIS_URL) {
    result.redis = "disabled";
  } else if (redis.isReady()) {
    try {
      const alive = await redis.ping();
      result.redis = alive ? "connected" : "unresponsive";
      if (!alive) result.errors.redis = "Ping did not return PONG";
    } catch (error) {
      console.error("[Health Check] Redis failed:", error);
      result.redis = "unresponsive";
      result.errors.redis = extractErrorMessage(error);
    }
  } else {
    result.redis = "disconnected";
    result.errors.redis = "Client not in ready state (check REDIS_URL / connection)";
  }

  const redisOk = result.redis === "connected" || result.redis === "disabled";

  // ── Healthy path ─────────────────────────────────────────
  if (dbHealthy && redisOk) {
    result.status = "ok";
    return res.status(200).json({
      status: result.status,
      database: result.database,
      redis: result.redis,
      timestamp: result.timestamp,
    }); // no errors object needed when everything's fine
  }

  // ── Unhealthy path ───────────────────────────────────────
  result.status = dbHealthy ? "degraded" : "error";
  console.log("[Health Check] Issue detected:", JSON.stringify(result));

  sendHealthAlert(result).catch((err) =>
    console.error("[Health Alert] Failed to send email:", err.message)
  );

  // Public response stays clean — no internal error details leaked to callers
  return res.status(dbHealthy ? 200 : 503).json({
    status: result.status,
    database: result.database,
    redis: result.redis,
    timestamp: result.timestamp,
  });
};