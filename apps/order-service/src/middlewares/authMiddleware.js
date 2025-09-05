const jwt = require("jsonwebtoken");
const userServiceClient = require("../services/userServiceClient");

exports.authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user data from user-service
    const user = await userServiceClient.getUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: "Invalid token. User not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
