const jwt = require("jsonwebtoken");
const fs = require("fs");
const User = require("../models/User");
const { refreshAccessToken, getRefreshTokenFromRequest, sendTokenRefreshResponse } = require("../utils/auth-utils");

// Load RSA public key
let publicKey;
try {
  const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH || '/app/secrets/public.pem';
  publicKey = fs.readFileSync(publicKeyPath, "utf8");
} catch (err) {
  console.error("Failed to load public key:", err.message);
  throw new Error("JWT public key not found");
}

exports.authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    // Verify with RSA public key
    const decoded = jwt.verify(token, publicKey, { algorithms: ["RS256"] });

    // Fetch user from DB
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid token. User not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);

    if (error.name === "TokenExpiredError") {
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
    }
    
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token format" });
    }

    res.status(401).json({ error: "Invalid or expired token" });
  }
};
