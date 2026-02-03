const { request, getInternalHeaders, DEFAULT_TIMEOUT_MS } = require('../utils/httpClient');

const host = process.env.LOCATIONS_SERVICE_HOST || 'locations-service';
const port = process.env.LOCATIONS_SERVICE_PORT || 4004;

/**
 * Fetch areas list (for area-metrics enrichment with area names).
 * Uses internal endpoint to avoid auth for service-to-service.
 */
async function getAreas() {
  const res = await request({
    hostname: host,
    port,
    path: '/api/internal/areas',
    method: 'GET',
    headers: getInternalHeaders(),
    timeoutMs: DEFAULT_TIMEOUT_MS,
  });
  return res;
}

async function getAreaById(areaId) {
  const res = await request({
    hostname: host,
    port,
    path: `/api/internal/areas/${areaId}`,
    method: 'GET',
    headers: getInternalHeaders(),
    timeoutMs: DEFAULT_TIMEOUT_MS,
  });
  return res;
}

module.exports = {
  getAreas,
  getAreaById,
};
