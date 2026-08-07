// cron/healthPing.js
const cron = require('node-cron');
const axios = require('axios');

const HEALTH_URL = process.env.HEALTH_CHECK_URL || 'http://localhost:8000/api/health';
console.log("[HEALTH URL ] - ", HEALTH_URL);
function startHealthCheckCron() {
  cron.schedule('*/1 * * * *', async () => {
    try {
      const res = await axios.get(HEALTH_URL, { timeout: 8000 });
      console.log(`[Cron Health Ping] ${res.status} - ${res.data.status}`);
    } catch (err) {
      console.error('[Cron Health Ping] Failed:', err.message);
    }
  });

  console.log('Health check cron scheduled: every 10 minutes');
}

module.exports = startHealthCheckCron;