const { test } = require('node:test');
const assert = require('node:assert/strict');
const { checkTransition, pushMessageFor } = require('./orderStatus');

const STAFF = ['delivery_person', 'admin', 'super_admin'];

test('staff can move orders forward one step', () => {
  for (const role of STAFF) {
    assert.equal(checkTransition('pending', 'preparing', role), null);
    assert.equal(checkTransition('preparing', 'delivering', role), null);
    assert.equal(checkTransition('delivering', 'delivered', role), null);
  }
});

test('skipping or reversing steps is a 409 listing allowed moves', () => {
  assert.deepEqual(checkTransition('pending', 'delivered', 'admin'), {
    code: 409,
    message: 'Cannot change status from pending to delivered',
    from: 'pending',
    to: 'delivered',
    allowed: ['preparing', 'cancelled'],
  });
  assert.equal(checkTransition('delivered', 'preparing', 'admin').code, 409);
  assert.deepEqual(checkTransition('completed', 'cancelled', 'admin').allowed, []);
});

test('completed is never set manually', () => {
  assert.equal(checkTransition('delivered', 'completed', 'super_admin').code, 409);
});

test('unknown status is a 400', () => {
  assert.equal(checkTransition('pending', 'teleported', 'admin').code, 400);
  assert.equal(checkTransition('pending', undefined, 'admin').code, 400);
});

test('only admins can cancel, and only before delivering', () => {
  assert.equal(checkTransition('pending', 'cancelled', 'admin'), null);
  assert.equal(checkTransition('preparing', 'cancelled', 'super_admin'), null);
  assert.equal(checkTransition('pending', 'cancelled', 'delivery_person').code, 403);
  assert.equal(checkTransition('delivering', 'cancelled', 'admin').code, 409);
});

test('customers cannot change status', () => {
  assert.equal(checkTransition('pending', 'preparing', 'customer').code, 403);
});

test('delivery_failed only from delivering and needs a reason', () => {
  assert.equal(checkTransition('delivering', 'delivery_failed', 'delivery_person', 'Customer unreachable'), null);
  assert.equal(checkTransition('delivering', 'delivery_failed', 'delivery_person').code, 400);
  assert.equal(checkTransition('delivering', 'delivery_failed', 'delivery_person', '   ').code, 400);
  assert.equal(checkTransition('delivering', 'delivery_failed', 'delivery_person', 5).code, 400);
  assert.equal(checkTransition('preparing', 'delivery_failed', 'delivery_person', 'x').code, 409);
});

test('push copy per status', () => {
  const order = { id: 'ORD-1', meal_time: 'lunch' };
  assert.deepEqual(pushMessageFor({ ...order, status: 'preparing' }), { title: 'Order update', body: 'Your lunch order is being prepared' });
  assert.deepEqual(pushMessageFor({ ...order, status: 'delivering' }), { title: 'Order update', body: 'Your order is on the way' });
  assert.deepEqual(pushMessageFor({ ...order, status: 'delivered' }), { title: 'Order delivered', body: 'Your order has been delivered' });
  assert.deepEqual(pushMessageFor({ ...order, status: 'delivery_failed', failure_reason: 'Customer unreachable' }), { title: 'Delivery failed', body: "We couldn't deliver your order: Customer unreachable" });
  assert.deepEqual(pushMessageFor({ ...order, status: 'cancelled' }), { title: 'Order cancelled', body: 'Your order ORD-1 was cancelled' });
  assert.equal(pushMessageFor({ ...order, status: 'pending' }), null);
});
