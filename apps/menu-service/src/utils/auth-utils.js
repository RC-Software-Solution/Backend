const axios = require('axios');

/**
 * Attempts to refresh an access token using a refresh token
 * @param {string} refreshToken - The refresh token
 * @param {string} userServiceUrl - The user service URL for token refresh
 * @returns {Promise<{success: boolean, accessToken?: string, error?: string}>}
 */
async function refreshAccessToken(refreshToken, userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001') {
  try {
    const response = await axios.post(`${userServiceUrl}/refresh-token`, {
      refresh_token: refreshToken
    }, {
      timeout: 5000, // 5 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200 && response.data.access_token) {
      return {
        success: true,
        accessToken: response.data.access_token
      };
    }
    
    return {
      success: false,
      error: 'Invalid response from refresh token endpoint'
    };
  } catch (error) {
    console.error('Token refresh error:', error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to refresh token'
    };
  }
}

/**
 * Checks if a request contains a refresh token in headers
 * @param {Object} req - Express request object
 * @returns {string|null} - The refresh token if found, null otherwise
 */
function getRefreshTokenFromRequest(req) {
  // Check for refresh token in Authorization header (alternative format)
  const authHeader = req.header("Authorization");
  if (authHeader && authHeader.startsWith("Refresh ")) {
    return authHeader.split(" ")[1];
  }
  
  // Check for refresh token in custom header
  const refreshToken = req.header("X-Refresh-Token");
  if (refreshToken) {
    return refreshToken;
  }
  
  return null;
}

/**
 * Sends a token refresh response to the client
 * @param {Object} res - Express response object
 * @param {string} newAccessToken - The new access token
 */
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
