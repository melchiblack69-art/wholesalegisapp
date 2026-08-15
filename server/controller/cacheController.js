const redis = require("../config/RedisClient");

exports.getPublicCatalogVersion = async (req, res) => {
  const version = await redis.get(redis.KEYS.publicCatalogVersion);
  res.set("Cache-Control", "no-store").json({ version: version || 0 });
};
