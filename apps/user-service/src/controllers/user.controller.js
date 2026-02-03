const User = require('../models/User');
const { sendPushNotification } = require('../services/notificationService');
const { sendEmail } = require('../services/emailService');
const { verifyToken } = require('../utils/jwt');
const { hashPassword } = require('../utils/password');

exports.signup = async (req, res) => {
  try {
    const { full_name, email, password, role, address, phone, fcm_token } =
      req.body;

    const validRoles = ['customer', 'delivery_person', 'admin', 'super_admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      if (existingUser.status !== 'deleted') {
        return res.status(400).json({ error: 'Email already registered' });
      }
      existingUser.status = 'active';
      existingUser.deleted_at = null;
      existingUser.full_name = full_name;
      existingUser.password = await hashPassword(password);
      existingUser.role = role;
      existingUser.address = role === 'customer' ? address : null;
      existingUser.phone = phone;
      existingUser.fcm_token = fcm_token;
      await existingUser.save();

      return res.status(201).json({
        message: 'User registered successfully. Please log in',
        user: existingUser,
      });
    }

    const hashedPassword = await hashPassword(password);

    let isApproved = true;
    if (role === 'customer') {
      isApproved = false;
    }

    const newUser = await User.create({
      full_name,
      email,
      password: hashedPassword,
      role,
      address: role === 'customer' ? address : null,
      area_id: null,
      phone,
      approved: isApproved,
      fcm_token,
      created_at: new Date(),
      updated_at: new Date(),
      status: 'active',
    });

    res.status(201).json({
      message: 'User registered successfully. Please log in.',
      user: {
        id: newUser.id,
        full_name: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
        address: newUser.address,
        area_id: newUser.area_id,
        phone: newUser.phone,
        approved: newUser.approved,
        fcm_token: newUser.fcm_token,
        created_at: newUser.created_at,
        status: newUser.status,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.approveCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await User.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (customer.role !== 'customer') {
      return res.status(400).json({ error: 'Only customers require approval' });
    }

    customer.approved = true;
    await customer.save();

    if (customer.fcm_token) {
      await sendPushNotification(
        customer.fcm_token,
        'Account Approved 🎉',
        'Your account has been approved. You can now login to your account.'
      );
    }

    await sendEmail(
      customer.email,
      'Account Approved 🎉',
      `Dear ${customer.full_name},\n\nYour account has been approved! You can now log in to your account.\n\nBest regards,\nRC Team`
    );

    res.json({ message: 'Customer approved successfully', customer });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log(error);
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }

    if (user.unpaid_orders_count > 2) {
      return res.status(400).json({
        error:
          'You have unpaid orders. Please clear your orders before deleting your account',
      });
    }

    user.status = 'deleted';
    user.deleted_at = new Date();
    await user.save();

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ message: 'Refresh token required' });

    const payload = verifyToken(refresh_token);
    const user = await User.findByPk(payload.id);

    if (!user || user.refresh_token !== refresh_token) {
      return res.status(401).json({ message: 'Invalid or revoked refresh token' });
    }

    const newAccessToken = generateAccessToken(user);
    res.json({ access_token: newAccessToken });
  } catch (err) {
    console.error('Refresh token error:', err.message);
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

// get profiles for admin