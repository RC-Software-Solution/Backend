const { request, getInternalHeaders, DEFAULT_TIMEOUT_MS } = require('../utils/httpClient');

const host = process.env.MENU_SERVICE_HOST || 'menu-service';
const port = process.env.MENU_SERVICE_PORT || 4005;

/**
 * Fetch meal sessions (for enrichment or session list).
 * Uses internal analytics endpoint if available, otherwise not used for core analytics.
 */
async function getMealSessions(params = {}) {
  const search = new URLSearchParams(params).toString();
  const path = search ? `/api/meal-sessions?${search}` : '/api/meal-sessions';
  const res = await request({
    hostname: host,
    port,
    path,
    method: 'GET',
    headers: getInternalHeaders(),
    timeoutMs: DEFAULT_TIMEOUT_MS,
  });
  return res;
}

module.exports = {
  getMealSessions,
};
