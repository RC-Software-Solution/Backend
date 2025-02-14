const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.authMiddleware = async (req, res, next) => {
    // const token = req.header("Authorization")?.split(" ")[1];
    // if(!token) return res.status(401).json({ error: "Unauthorized" });

    // try {
    //     req.user = jwt.verify(token, process.env.JWT_SECRET);
    //     next();
    // } catch (error) {
    //     res.status(403).json({ error: "Invalid token" });
    // }
    try {
        const token = req.header("Authorization")?.split(" ")[1];
        if(!token) {
            return res.status(401).json({ error: "Acces denied. No token Provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);

        if(!user) {
            return res.status(401).json({ error: "Invalid token. User not found." });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid or expired token" });
    }
};

// for now I think we can perform findByPk query on every request without any performance issue. but if performance declines, 
// Store User Data in the JWT (Except Password)
// Use a Caching Layer (e.g., Redis)
// Optimize Database Queries with Indexing ( pk is already indexed)