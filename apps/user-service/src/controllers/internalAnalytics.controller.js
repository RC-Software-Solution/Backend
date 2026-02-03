const User = require('../models/User');

/**
 * GET /api/internal/analytics/blocked-users-count
 * Counts users with status 'inactive' (blocked). Optionally includes 'deleted' if desired.
 */
exports.getBlockedUsersCount = async (req, res) => {
  try {
    const count = await User.count({
      where: { status: 'inactive' },
    });
    res.status(200).json({ count });
  } catch (error) {
    console.error('Internal analytics getBlockedUsersCount error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
