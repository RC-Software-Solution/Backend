const crypto = require('crypto');
const { Op } = require('sequelize');
const User = require('../models/User');
const { sendEmail } = require('./emailService');

/**
 * Generate a secure random token for password reset
 * @returns {string} Reset token
 */
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Send password reset email to user
 * @param {string} email - User's email address
 * @param {string} resetToken - Password reset token
 * @param {string} userName - User's full name
 */
const sendPasswordResetEmail = async (email, resetToken, userName) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  const emailSubject = 'Password Reset Request';
  const emailText = `
Dear ${userName},

You have requested to reset your password. Please click on the following link to reset your password:

${resetUrl}

This link will expire in 1 hour.

If you did not request this password reset, please ignore this email and your password will remain unchanged.

Best regards,
RC Team
  `;

  await sendEmail(email, emailSubject, emailText);
};

/**
 * Generate and save password reset token for user
 * @param {string} email - User's email address
 * @returns {Promise<{success: boolean, message: string, token?: string}>}
 */
const generatePasswordResetToken = async (email) => {
  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if email exists or not for security
      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }

    if (user.status === 'deleted') {
      return {
        success: false,
        message: 'Account not found.',
      };
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Token expires in 1 hour

    // Save token to database
    user.password_reset_token = resetToken;
    user.password_reset_expires = resetTokenExpiry;
    await user.save();

    // Send email
    try {
      await sendPasswordResetEmail(email, resetToken, user.full_name);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Clear the token if email fails so user can try again
      user.password_reset_token = null;
      user.password_reset_expires = null;
      await user.save();
      throw new Error('Failed to send password reset email. Please try again later.');
    }

    return {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  } catch (error) {
    console.error('Password reset token generation error:', error);
    throw error;
  }
};

/**
 * Verify password reset token
 * @param {string} token - Password reset token
 * @returns {Promise<{valid: boolean, user?: User, message?: string}>}
 */
const verifyResetToken = async (token) => {
  try {
    const user = await User.findOne({
      where: {
        password_reset_token: token,
        password_reset_expires: {
          [Op.gt]: new Date(), // Token not expired
        },
      },
    });

    if (!user) {
      return {
        valid: false,
        message: 'Invalid or expired reset token.',
      };
    }

    return {
      valid: true,
      user,
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return {
      valid: false,
      message: 'Error verifying reset token.',
    };
  }
};

/**
 * Clear password reset token from user
 * @param {User} user - User instance
 */
const clearResetToken = async (user) => {
  user.password_reset_token = null;
  user.password_reset_expires = null;
  await user.save();
};

module.exports = {
  generatePasswordResetToken,
  verifyResetToken,
  clearResetToken,
};
