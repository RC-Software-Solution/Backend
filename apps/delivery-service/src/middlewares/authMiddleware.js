const jwt = require("jsonwebtoken");
const fs = require("fs");
const { refreshAccessToken, getRefreshTokenFromRequest, sendTokenRefreshResponse } = require("../utils/auth-utils");

// Load RSA public key for JWT verification
const getPublicKey = () => {
  try {
    const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH || '/app/secrets/public.pem';
    return fs.readFileSync(publicKeyPath, 'utf8');
  } catch (error) {
    console.error("Error loading JWT public key:", error.message);
    throw new Error("JWT public key not found");
  }
};

exports.authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided" });
    }

    // Verify JWT with RSA public key
    const publicKey = getPublicKey();
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    
    // For delivery service, we can use the decoded token data directly
    // since it contains the user info we need
    req.user = {
      id: decoded.id,
      role: decoded.role,
      area_id: decoded.area_id
    };
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    
    if (error.name === 'TokenExpiredError') {
      // Try to refresh the token if refresh token is available
      const refreshToken = getRefreshTokenFromRequest(req);
      
      if (refreshToken) {
        try {
          const refreshResult = await refreshAccessToken(refreshToken);
          
          if (refreshResult.success) {
            return sendTokenRefreshResponse(res, refreshResult.accessToken);
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError.message);
        }
      }
      
      return res.status(401).json({ error: "Token has expired" });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: "Invalid token format" });
    } else if (error.name === 'NotBeforeError') {
      return res.status(401).json({ error: "Token not active yet" });
    }
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
