/**
 * RedisClient.js — CommonJS, graceful fallback
 *
 * If Redis is unavailable (no REDIS_URL, connection failure) the client
 * degrades silently — all cache operations become no-ops and the server
 * continues serving requests directly from the DB.
 *
 * redis v5 API: createClient(), client.connect(), client.get/set/del/keys
 */
const { createClient } = require('redis');

let client   = null;
let ready    = false;

// ── Connect ──────────────────────────────────────────────────────────────────
async function connect() {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.log('[redis] REDIS_URL not set — caching disabled');
    return;
  }

  try {
    client = createClient({ url });

    client.on('error',        (err) => {
      // Only log once when it first goes offline — not every retry
      if (ready) console.warn('[redis] connection lost:', err.message);
      ready = false;
    });
    client.on('ready',        () => { ready = true;  console.log('[redis] ✅ Connected'); });
    client.on('reconnecting', () => console.log('[redis] reconnecting…'));

    await client.connect();
  } catch (err) {
    console.warn('[redis] Could not connect:', err.message, '— caching disabled');
    client = null;
    ready  = false;
  }
}

// Add near the top with other state
function isReady() {
  return ready;
}

async function ping() {
  if (!ready || !client) return false;
  try {
    const pong = await client.ping();
    return pong === 'PONG';
  } catch (err) {
    console.warn('[redis] ping error:', err.message);
    return false;
  }
}


// ── Safe wrappers — all return null / false on error ─────────────────────────
async function get(key) {
  if (!ready || !client) return null;
  try {
    const val = await client.get(key);
    return val ? JSON.parse(val) : null;
  } catch (err) {
    console.warn('[redis] get error:', err.message);
    return null;
  }
}

async function set(key, value, ttlSeconds = 300) {
  if (!ready || !client) return false;
  try {
    await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
    return true;
  } catch (err) {
    console.warn('[redis] set error:', err.message);
    return false;
  }
}

// Set only if key does NOT exist — returns true if the lock was acquired
// Used for stampede prevention: only one request fetches from DB, others wait
async function setNX(key, value, ttlSeconds = 10) {
  if (!ready || !client) return false;
  try {
    const result = await client.set(key, JSON.stringify(value), {
      EX:  ttlSeconds,
      NX:  true,       // Only set if Not eXists
    });
    return result === 'OK';
  } catch (err) {
    console.warn('[redis] setNX error:', err.message);
    return false;
  }
}

async function del(...keys) {
  if (!ready || !client) return false;
  try {
    await Promise.all(keys.map(k => client.del(k)));
    return true;
  } catch (err) {
    console.warn('[redis] del error:', err.message);
    return false;
  }
}

// Delete all keys matching a pattern — used for bulk invalidation
async function delPattern(pattern) {
  if (!ready || !client) return false;
  try {
    const keys = await client.keys(pattern);
    if (keys.length) await Promise.all(keys.map(k => client.del(k)));
    return true;
  } catch (err) {
    console.warn('[redis] delPattern error:', err.message);
    return false;
  }
}

// ── Cache key constants ───────────────────────────────────────────────────────
const KEYS = {
  publicCompanies: 'public:companies',
  publicCompany: (id) => `public:company:${id}`,
  publicProducts: (id) => `public:company:${id}:products`,
  publicCategories: 'public:categories',
  publicStats: 'public:stats',
  publicMap: 'public:map',
  publicCategoryCompanies: (id) => `public:category:${id}:companies`,
  // Company
  company: (id) => `company:${id}`,

  // Company Images
  companyImages: (companyId) => `company:${companyId}:images`,

  // Dashboard
  dashboard: (companyId) => `dashboard:${companyId}`,
  dashboardAll: 'dashboard:super_admin',
};

// TTLs in seconds
const TTL = {
  publicCompanies: 3 * 60,
  publicCompany: 5 * 60,
  publicProducts: 10 * 60,
  publicCategories: 15 * 60,
  publicStats: 5 * 60,
  publicMap: 3 * 60,
  publicCategoryCompanies: 3 * 60,
  companyImages:  20  * 60,   // 20 minutes
  company:      5  * 60,   // 5 minutes
  dashboard: 2  * 60,   // 2 minutes
  dashboardAll: 2  * 60,   // 2 minutes
};

module.exports = { connect, get, set, setNX, del, delPattern, KEYS, TTL,isReady, ping };
