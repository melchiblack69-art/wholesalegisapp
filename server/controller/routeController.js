const axios = require("axios");
const redis = require("../config/RedisClient");

const memoryCache = new Map();
const requestWindows = new Map();
const CACHE_TTL_MS = 30 * 1000;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT = 30;

function validPoint(point) {
  return Array.isArray(point) && point.length === 2 && point.every((value) => Number.isFinite(Number(value)));
}

function routeKey(origin, destination, mode) {
  return `route:${mode}:${origin.map((v) => Number(v).toFixed(4)).join(",")}:${destination.map((v) => Number(v).toFixed(5)).join(",")}`;
}

async function getRoute(req, res) {
  const now = Date.now();
  const clientKey = req.ip || req.socket.remoteAddress || "unknown";
  const window = requestWindows.get(clientKey);
  if (!window || now - window.startedAt >= RATE_WINDOW_MS) {
    requestWindows.set(clientKey, { startedAt: now, count: 1 });
  } else {
    window.count += 1;
    if (window.count > RATE_LIMIT) {
      return res.status(429).json({ message: "Too many route requests. Please try again shortly." });
    }
  }

  const { origin, destination, mode = "driving" } = req.body || {};
  const profiles = { driving: "car", cycling: "bike", walking: "foot" };

  if (!validPoint(origin) || !validPoint(destination) || !profiles[mode]) {
    return res.status(400).json({ message: "Valid origin, destination, and travel mode are required." });
  }

  const key = process.env.GRAPHHOPPER_API_KEY;
  if (!key) return res.status(503).json({ message: "Routing service is not configured." });

  const cacheKey = routeKey(origin, destination, mode);
  const memoryHit = memoryCache.get(cacheKey);
  if (memoryHit && memoryHit.expiresAt > Date.now()) return res.json(memoryHit.value);
  memoryCache.delete(cacheKey);

  const redisHit = await redis.get(cacheKey);
  if (redisHit) {
    memoryCache.set(cacheKey, { value: redisHit, expiresAt: Date.now() + CACHE_TTL_MS });
    console.log("[Route Cache] Redis hit for key:", cacheKey);
    return res.json(redisHit);
  }

  try {
    const params = new URLSearchParams({ profile: profiles[mode], points_encoded: "false", instructions: "true", key });
    params.append("point", `${Number(origin[0])},${Number(origin[1])}`);
    params.append("point", `${Number(destination[0])},${Number(destination[1])}`);
    const response = await axios.get(`https://graphhopper.com/api/1/route?${params.toString()}`, { timeout: 15000 });
    const path = response.data?.paths?.[0];
    if (!path) return res.status(404).json({ message: "No route found." });

    const result = {
      points: path.points?.coordinates?.map(([lng, lat]) => [lat, lng]) || [],
      distance: path.distance,
      time: path.time,
      instructions: path.instructions || [],
    };
    memoryCache.set(cacheKey, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
    await redis.set(cacheKey, result, 60);
    return res.json(result);
  } catch (error) {
    console.error("Routing service error:", error.response?.data || error.message);
    return res.status(error.response?.status === 429 ? 429 : 502).json({ message: "Unable to load route." });
  }
}

module.exports = { getRoute };
