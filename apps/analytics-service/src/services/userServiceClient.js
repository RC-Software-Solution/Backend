const { request, DEFAULT_TIMEOUT_MS } = require('../utils/httpClient');

const host = process.env.USER_SERVICE_HOST || 'user-service';
const port = process.env.USER_SERVICE_PORT || 4001;

async function getUserById(userId) {
  const res = await request({
    hostname: host,
    port,
    path: `/api/users/${userId}`,
    method: 'GET',
    timeoutMs: DEFAULT_TIMEOUT_MS,
  });
  return res;
}

module.exports = { getUserById };
