const redis = require('../config/redis');

/**
 * Rate limiter middleware for forgot password requests
 * Limits requests per IP address to prevent abuse
 */
const rateLimiter = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  return async (req, res, next) => {
    try {
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      const key = `forgot_password:${clientIp}`;

      // Get current request count
      const current = await redis.get(key);

      if (current === null) {
        // First request from this IP, set counter with expiration
        await redis.setex(key, Math.floor(windowMs / 1000), '1');
        return next();
      }

      const count = parseInt(current, 10);

      if (count >= maxRequests) {
        return res.status(429).json({
          error: 'Too many password reset requests. Please try again later.',
          retryAfter: Math.floor(windowMs / 1000),
        });
      }

      // Increment counter
      await redis.incr(key);
      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // If Redis fails, allow the request to proceed (fail open)
      next();
    }
  };
};

module.exports = rateLimiter;
