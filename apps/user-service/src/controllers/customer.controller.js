const User = require('../models/User');
const UserStatusLog = require('../models/UserStatusLog');
const { sendPushNotification } = require('../services/notificationService');
const { sendEmail } = require('../services/emailService');
const orderServiceClient = require('../services/orderServiceClient');

const VALID_STATUSES = new Set(['pending', 'accepted', 'rejected', 'disabled', 'blocked']);

async function logStatusChange(userId, previousStatus, newStatus, reason, performedBy) {
  await UserStatusLog.create({
    user_id: userId,
    previous_status: previousStatus || null,
    new_status: newStatus,
    reason: reason || null,
    performed_by: performedBy || null,
  });
}

/**
 * GET /api/users/customers?status=pending|accepted|rejected|disabled|blocked
 */
exports.listCustomers = async (req, res) => {
  try {
    const { status } = req.query;
    const where = { role: 'customer' };
    if (status && VALID_STATUSES.has(status)) {
      if (status === 'accepted') {
        const { Op } = require('sequelize');
        where[Op.or] = [
          { customer_status: 'accepted' },
          { approved: true, customer_status: null },
        ];
      } else {
        where.customer_status = status;
      }
    }
    const customers = await User.findAll({
      where,
      attributes: { exclude: ['password', 'refresh_token'] },
      order: [['created_at', 'DESC']],
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/users/customers/:id/profile (with order history)
 */
exports.getCustomerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await User.findByPk(id, {
      attributes: { exclude: ['password', 'refresh_token'] },
    });
    if (!customer || customer.role !== 'customer') {
      return res.status(404).json({ error: 'Customer not found' });
    }
    let orderHistory = [];
    try {
      const data = await orderServiceClient.getOrdersByCustomerId(id, 50);
      orderHistory = data.orders || [];
    } catch (e) {
      console.error('Order history fetch error:', e.message);
    }
    res.json({
      ...customer.toJSON(),
      order_history: orderHistory,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/users/customers/:id/approve (assign area in body)
 */
exports.approveCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { area_id } = req.body || {};
    const customer = await User.findByPk(id);
    if (!customer || customer.role !== 'customer') {
      return res.status(404).json({ error: 'Customer not found' });
    }
    const previousStatus = customer.customer_status || 'pending';
    customer.approved = true;
    customer.customer_status = 'accepted';
    customer.rejection_reason = null;
    customer.rejected_at = null;
    if (area_id != null) customer.area_id = area_id;
    await customer.save();

    await logStatusChange(id, previousStatus, 'accepted', null, req.user?.id);

    if (customer.fcm_token) {
      await sendPushNotification(
        customer.fcm_token,
        'Account Approved',
        'Your account has been approved. You can now log in.'
      );
    }
    await sendEmail(
      customer.email,
      'Account Approved',
      `Dear ${customer.full_name},\n\nYour account has been approved. You can now log in.\n\nBest regards,\nRC Team`
    );
    res.json({ message: 'Customer approved successfully', customer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/users/customers/:id/reject (with reason in body)
 */
exports.rejectCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const customer = await User.findByPk(id);
    if (!customer || customer.role !== 'customer') {
      return res.status(404).json({ error: 'Customer not found' });
    }
    const previousStatus = customer.customer_status || 'pending';
    customer.approved = false;
    customer.customer_status = 'rejected';
    customer.rejection_reason = reason || null;
    customer.rejected_at = new Date();
    await customer.save();

    await logStatusChange(id, previousStatus, 'rejected', reason, req.user?.id);
    res.json({ message: 'Customer rejected', customer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/users/customers/:id/assign-area
 */
exports.assignArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { area_id } = req.body || {};
    if (area_id == null) {
      return res.status(400).json({ error: 'area_id is required' });
    }
    const customer = await User.findByPk(id);
    if (!customer || customer.role !== 'customer') {
      return res.status(404).json({ error: 'Customer not found' });
    }
    customer.area_id = area_id;
    await customer.save();
    res.json({ message: 'Area assigned', customer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/users/customers/:id/disable
 */
exports.disableCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await User.findByPk(id);
    if (!customer || customer.role !== 'customer') {
      return res.status(404).json({ error: 'Customer not found' });
    }
    const previousStatus = customer.customer_status || 'accepted';
    customer.customer_status = 'disabled';
    customer.status = 'inactive';
    await customer.save();
    await logStatusChange(id, previousStatus, 'disabled', 'Disabled by admin', req.user?.id);
    res.json({ message: 'Customer disabled', customer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/users/customers/:id/enable
 */
exports.enableCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await User.findByPk(id);
    if (!customer || customer.role !== 'customer') {
      return res.status(404).json({ error: 'Customer not found' });
    }
    const previousStatus = customer.customer_status || 'disabled';
    customer.customer_status = 'accepted';
    customer.status = 'active';
    customer.blocked_at = null;
    customer.blocked_reason = null;
    await customer.save();
    await logStatusChange(id, previousStatus, 'accepted', 'Enabled by admin', req.user?.id);
    res.json({ message: 'Customer enabled', customer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/users/customers/:id/unlock (clear block; does not change disabled)
 */
exports.unlockCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await User.findByPk(id);
    if (!customer || customer.role !== 'customer') {
      return res.status(404).json({ error: 'Customer not found' });
    }
    if (customer.customer_status !== 'blocked') {
      return res.status(400).json({ error: 'Customer is not blocked' });
    }
    const previousStatus = 'blocked';
    customer.customer_status = 'accepted';
    customer.blocked_at = null;
    customer.blocked_reason = null;
    await customer.save();
    await logStatusChange(id, previousStatus, 'accepted', 'Unlocked by admin', req.user?.id);
    res.json({ message: 'Customer unlocked', customer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/users/customers/export?filters=... (e.g. status=accepted, limit=1000)
 * Returns JSON array of customers; for CSV you could add Accept: text/csv later.
 */
exports.exportCustomers = async (req, res) => {
  try {
    const { status, limit = 1000 } = req.query;
    const where = { role: 'customer' };
    if (status && VALID_STATUSES.has(status)) {
      where.customer_status = status;
    }
    const cap = Math.min(Number.parseInt(limit, 10) || 1000, 5000);
    const customers = await User.findAll({
      where,
      attributes: [
        'id',
        'full_name',
        'email',
        'phone',
        'address',
        'area_id',
        'customer_status',
        'approved',
        'created_at',
        'rejected_at',
        'rejection_reason',
        'blocked_at',
        'blocked_reason',
      ],
      order: [['created_at', 'DESC']],
      limit: cap,
      raw: true,
    });
    res.json({ count: customers.length, customers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
