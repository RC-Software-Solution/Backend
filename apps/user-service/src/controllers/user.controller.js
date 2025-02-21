const User = require('../models/User');
const { sendPushNotification } = require('../services/notificationService');
const { sendEmail } = require('../services/emailService');
const { generateToken } = require('../utils/jwt');
const { hashPassword, comparePassword } = require('../utils/password');

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
      return res.status(400).json({ error: 'Email already registered' });
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

exports.login = async (req, res) => {
  try {
    const { email, password, fcm_token } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(404).json({ message: 'Invalid credentials' });
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

    const token = generateToken(user);

    res.json({
      message: 'login successful',
      token,
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
    res.status(500).json({ error: error.message });
    console.log(error);
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

// exports.deleteAccount = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const user = await User.findByPk(userId);

//     if(!user){
//       return res.status(404).json({ error: "user not found"});
//     }
    
//   } catch (error) {
    
//   }
// }