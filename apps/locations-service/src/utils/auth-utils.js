const axios = require('axios');

async function refreshAccessToken(refreshToken, userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:4001') {
  try {
    const response = await axios.post(`${userServiceUrl}/refresh-token`, {
      refresh_token: refreshToken
    }, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.status === 200 && response.data.access_token) {
      return { success: true, accessToken: response.data.access_token };
    }
    return { success: false, error: 'Invalid response from refresh token endpoint' };
  } catch (error) {
    console.error('Token refresh error:', error.message);
    return { success: false, error: error.response?.data?.message || 'Failed to refresh token' };
  }
}

function getRefreshTokenFromRequest(req) {
  const authHeader = req.header("Authorization");
  if (authHeader && authHeader.startsWith("Refresh ")) {
    return authHeader.split(" ")[1];
  }
  const refreshToken = req.header("X-Refresh-Token");
  if (refreshToken) {
    return refreshToken;
  }
  return null;
}

function sendTokenRefreshResponse(res, newAccessToken) {
  res.status(401).json({
    error: "Token expired",
    refresh_required: true,
    new_access_token: newAccessToken,
    message: "Please retry the request with the new access token"
  });
}

module.exports = {
  refreshAccessToken,
  getRefreshTokenFromRequest,
  sendTokenRefreshResponse
};


