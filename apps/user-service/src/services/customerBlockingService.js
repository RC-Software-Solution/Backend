const User = require('../models/User');
const UserStatusLog = require('../models/UserStatusLog');
const orderServiceClient = require('./orderServiceClient');

const UNPAID_THRESHOLD = 2;
const AUTO_BLOCK_REASON = 'Auto-blocked: 2 or more unpaid orders';

/**
 * Get unpaid orders count for a customer from order-service.
 * @param {string} customerId - User UUID (role must be customer)
 * @returns {Promise<number>}
 */
async function getUnpaidCountForCustomer(customerId) {
  try {
    const { count } = await orderServiceClient.getUnpaidOrdersCount(customerId);
    return typeof count === 'number' ? count : 0;
  } catch (err) {
    console.error('customerBlockingService getUnpaidCountForCustomer error:', err.message);
    return 0;
  }
}

/**
 * Auto-block a customer and log the status change.
 * Idempotent: if already blocked (by us or manually), no-op.
 * @param {Object} customer - Sequelize User instance (role=customer)
 * @returns {Promise<boolean>} true if block was applied, false if skipped
 */
async function autoBlockCustomerIfNeeded(customer) {
  if (!customer || customer.role !== 'customer') return false;
  if (customer.customer_status === 'blocked') return false;

  const count = await getUnpaidCountForCustomer(customer.id);
  if (count < UNPAID_THRESHOLD) return false;

  const previousStatus = customer.customer_status || 'accepted';
  customer.customer_status = 'blocked';
  customer.blocked_at = new Date();
  customer.blocked_reason = AUTO_BLOCK_REASON;
  await customer.save();

  await UserStatusLog.create({
    user_id: customer.id,
    previous_status: previousStatus,
    new_status: 'blocked',
    reason: AUTO_BLOCK_REASON,
    performed_by: null,
  });
  return true;
}

/**
 * Check a single customer by id and auto-block if unpaid count >= 2.
 * @param {string} customerId - User UUID
 * @returns {Promise<{ blocked: boolean, unpaidCount?: number }>}
 */
async function checkAndBlockCustomerById(customerId) {
  const customer = await User.findByPk(customerId);
  if (!customer || customer.role !== 'customer') {
    return { blocked: false };
  }
  const unpaidCount = await getUnpaidCountForCustomer(customerId);
  const blocked = await autoBlockCustomerIfNeeded(customer);
  return { blocked, unpaidCount };
}

/**
 * Scan all accepted (active) customers and auto-block those with unpaid count >= 2.
 * Suitable for a background job / cron.
 * @returns {Promise<{ checked: number, blocked: number }>}
 */
async function checkAllAcceptedCustomers() {
  const customers = await User.findAll({
    where: { role: 'customer', customer_status: ['accepted', null] },
  });
  let blocked = 0;
  for (const c of customers) {
    const didBlock = await autoBlockCustomerIfNeeded(c);
    if (didBlock) blocked += 1;
  }
  return { checked: customers.length, blocked };
}

module.exports = {
  getUnpaidCountForCustomer,
  autoBlockCustomerIfNeeded,
  checkAndBlockCustomerById,
  checkAllAcceptedCustomers,
  UNPAID_THRESHOLD,
};
