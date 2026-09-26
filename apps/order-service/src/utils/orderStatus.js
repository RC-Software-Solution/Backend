const STATUSES = ['pending', 'preparing', 'delivering', 'delivered', 'completed', 'cancelled', 'delivery_failed'];
const STAFF = ['delivery_person', 'admin', 'super_admin'];
const ADMINS = ['admin', 'super_admin'];

// from -> { to: roles allowed }. 'completed' is derived (delivered + paid), never set here.
const TRANSITIONS = {
  pending: { preparing: STAFF, cancelled: ADMINS },
  preparing: { delivering: STAFF, cancelled: ADMINS },
  delivering: { delivered: STAFF, delivery_failed: STAFF },
};

// Returns null when allowed, otherwise { code, message, ... } for the HTTP response.
function checkTransition(from, to, role, failureReason) {
  if (!STATUSES.includes(to)) {
    return { code: 400, message: `Invalid status. Must be one of: ${STATUSES.join(', ')}` };
  }
  const allowed = Object.keys(TRANSITIONS[from] || {});
  if (!allowed.includes(to)) {
    return { code: 409, message: `Cannot change status from ${from} to ${to}`, from, to, allowed };
  }
  if (!TRANSITIONS[from][to].includes(role)) {
    return { code: 403, message: `Role ${role} cannot set status ${to}` };
  }
  if (to === 'delivery_failed' && (typeof failureReason !== 'string' || !failureReason.trim())) {
    return { code: 400, message: 'failure_reason is required for delivery_failed' };
  }
  return null;
}

const PUSH_MESSAGES = {
  preparing: (o) => ({ title: 'Order update', body: `Your ${o.meal_time} order is being prepared` }),
  delivering: () => ({ title: 'Order update', body: 'Your order is on the way' }),
  delivered: () => ({ title: 'Order delivered', body: 'Your order has been delivered' }),
  delivery_failed: (o) => ({ title: 'Delivery failed', body: `We couldn't deliver your order: ${o.failure_reason}` }),
  cancelled: (o) => ({ title: 'Order cancelled', body: `Your order ${o.id} was cancelled` }),
};

function pushMessageFor(order) {
  return PUSH_MESSAGES[order.status]?.(order) ?? null;
}

module.exports = { checkTransition, pushMessageFor };
