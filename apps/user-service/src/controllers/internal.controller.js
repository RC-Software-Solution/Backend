const User = require('../models/User');
const { sendPushNotification } = require('../services/notificationService');

// Returns 200 (not 204): order-service's HTTP client JSON-parses every response body.
exports.notifyUser = async (req, res) => {
  const { user_id, title, body } = req.body;
  if (!user_id || !title || !body) {
    return res.status(400).json({ message: 'user_id, title and body are required' });
  }

  try {
    const user = await User.findByPk(user_id, { attributes: ['id', 'fcm_token'] });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const sent = user.fcm_token ? await sendPushNotification(user.fcm_token, title, body) : false;
    res.json({ sent });
  } catch (error) {
    console.error('Error in internal notify:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
