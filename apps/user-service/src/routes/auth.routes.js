const express = require('express');
const { login, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const rateLimiter = require('../middlewares/rateLimiter');

const router = express.Router();

// Login endpoint
router.post('/login', login);

// Forgot password endpoint with rate limiting (3 requests per 15 minutes per IP)
router.post('/forgot-password', rateLimiter(15 * 60 * 1000, 3), forgotPassword);

// Reset password endpoint
router.post('/reset-password', resetPassword);

module.exports = router;
