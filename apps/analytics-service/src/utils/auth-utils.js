const http = require('http');

const userServiceHost = process.env.USER_SERVICE_HOST || 'user-service';
const userServicePort = process.env.USER_SERVICE_PORT || 4001;
const baseUrl = `http://${userServiceHost}:${userServicePort}`;

async function refreshAccessToken(refreshToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: userServiceHost,
      port: userServicePort,
      path: '/api/users/refresh-token',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200 && parsed.access_token) {
            resolve({ success: true, accessToken: parsed.access_token });
          } else {
            resolve({ success: false, error: parsed.message || 'Invalid response' });
          }
        } catch (e) {
          resolve({ success: false, error: e.message });
        }
      });
    });
    req.on('error', (e) => resolve({ success: false, error: e.message }));
    req.write(JSON.stringify({ refresh_token: refreshToken }));
    req.end();
  });
}

function getRefreshTokenFromRequest(req) {
  const authHeader = req.header('Authorization');
  if (authHeader && authHeader.startsWith('Refresh ')) return authHeader.split(' ')[1];
  return req.header('X-Refresh-Token') || null;
}

function sendTokenRefreshResponse(res, newAccessToken) {
  res.status(401).json({
    error: 'Token has expired',
    refresh_required: true,
    new_access_token: newAccessToken,
    message: 'Please retry the request with the new access token',
  });
}

module.exports = {
  refreshAccessToken,
  getRefreshTokenFromRequest,
  sendTokenRefreshResponse,
};
