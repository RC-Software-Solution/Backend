/**
 * Protects internal endpoints. Only allows requests with valid X-Internal-Key.
 */
exports.internalAuthMiddleware = (req, res, next) => {
  const key = process.env.INTERNAL_API_KEY;
  if (!key) {
    return res.status(503).json({ message: 'Internal API key not configured' });
  }
  const provided = req.header('X-Internal-Key');
  if (provided !== key) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};
