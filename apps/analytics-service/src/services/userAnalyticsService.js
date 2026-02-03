const { request, getInternalHeaders, DEFAULT_TIMEOUT_MS } = require('../utils/httpClient');

const host = process.env.USER_SERVICE_HOST || 'user-service';
const port = process.env.USER_SERVICE_PORT || 4001;
const basePath = '/api/internal/analytics';

async function getBlockedUsersCount() {
  const res = await request({
    hostname: host,
    port,
    path: `${basePath}/blocked-users-count`,
    method: 'GET',
    headers: getInternalHeaders(),
    timeoutMs: DEFAULT_TIMEOUT_MS,
  });
  return res;
}

module.exports = {
  getBlockedUsersCount,
};
