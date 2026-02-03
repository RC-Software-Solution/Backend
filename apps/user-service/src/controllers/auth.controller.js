const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { comparePassword, hashPassword } = require('../utils/password');
const {
  generatePasswordResetToken,
  verifyResetToken,
  clearResetToken,
} = require('../services/passwordResetService');

/**
 * Enhanced login with validation
 * POST /api/users/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password, fcm_token } = req.body;

    // Enhanced validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
      });
    }

    // Password length validation
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long',
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status === 'deleted') {
      return res.status(403).json({
        message:
          'Your account has been deleted. Please re-register using your email',
      });
    }

    if (!user.approved) {
      return res.status(403).json({
        message:
          'Your account is pending approval. Please wait for an admin to approve your account.',
      });
    }

    if (fcm_token) {
      user.fcm_token = fcm_token;
      await user.save();
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in database
    user.refresh_token = refreshToken;
    await user.save();

    res.json({
      message: 'Login successful',
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        address: user.address,
        area_id: user.area_id,
        phone: user.phone,
        approved: user.approved,
        fcm_token: user.fcm_token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Forgot password endpoint
 * POST /api/users/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
      });
    }

    const result = await generatePasswordResetToken(email);

    if (result.success) {
      // Always return success message for security (don't reveal if email exists)
      res.status(200).json({
        message: result.message,
      });
    } else {
      res.status(400).json({
        error: result.message,
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'An error occurred while processing your request. Please try again later.',
    });
  }
};

/**
 * Reset password endpoint
 * POST /api/users/reset-password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validation
    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Token and new password are required',
      });
    }

    // Password strength validation
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long',
      });
    }

    // Verify token
    const tokenVerification = await verifyResetToken(token);

    if (!tokenVerification.valid) {
      return res.status(400).json({
        error: tokenVerification.message || 'Invalid or expired reset token',
      });
    }

    const user = tokenVerification.user;

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset token
    user.password = hashedPassword;
    await clearResetToken(user);

    res.json({
      message: 'Password reset successful. Please login with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'An error occurred while resetting your password. Please try again later.',
    });
  }
};
