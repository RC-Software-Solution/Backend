#!/usr/bin/env node
/**
 * Generates the API reference and the Postman collection from the Express route files.
 *
 *   node scripts/gen-postman.js            write the artifacts
 *   node scripts/gen-postman.js --check    exit 1 if they are out of date (CI, hooks)
 *
 * Method, path and allowed roles are PARSED from apps/<svc>/src/routes/*.js, so
 * adding a route and re-running is enough to pick it up. Bodies, query params and
 * descriptions cannot be inferred from a route line — they live in OVERRIDES below
 * and are keyed by "METHOD <mounted path>", so regenerating never loses them.
 *
 * Writes:
 *   docs/API.md                                        human-readable reference
 *   docs/postman/rc-backend.postman_collection.json
 *   docs/postman/rc-backend.postman_environment.json   (credentials only, no URLs)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'postman');
const CHECK_ONLY = process.argv.includes('--check');

// Service → host port → route files, mirroring each apps/<svc>/index.js.
// `params` maps an Express param name to the collection variable substituted for it.
const SERVICES = [
  {
    name: 'user-service',
    apiVar: 'userApi',
    port: 4001,
    mounts: [
      { prefix: '/api/users', file: 'user-service/src/routes/auth.routes.js', folder: 'Auth' },
      { prefix: '/api/users', file: 'user-service/src/routes/user.routes.js', folder: 'Users', params: { userId: 'user_id', customerId: 'customer_id' } },
      { prefix: '/api/users/customers', file: 'user-service/src/routes/customer.routes.js', folder: 'Customers', params: { id: 'customer_id' } },
      { prefix: '/api/users/notices', file: 'user-service/src/routes/notice.routes.js', folder: 'Notices', params: { id: 'notice_id' } },
      { prefix: '/api/internal', file: 'user-service/src/routes/internal.routes.js', folder: 'Internal' },
      { prefix: '/api/internal/analytics', file: 'user-service/src/routes/internalAnalytics.routes.js', folder: 'Internal' },
    ],
  },
  {
    name: 'order-service',
    apiVar: 'orderApi',
    port: 4002,
    mounts: [
      { prefix: '/api/orders', file: 'order-service/src/routes/order.routes.js', folder: 'Orders', params: { order_id: 'order_id' } },
      { prefix: '/api/internal/analytics', file: 'order-service/src/routes/internalAnalytics.routes.js', folder: 'Internal' },
    ],
  },
  {
    name: 'delivery-service',
    apiVar: 'deliveryApi',
    port: 4003,
    mounts: [
      { prefix: '/api/delivery', file: 'delivery-service/src/routes/delivery.routes.js', folder: 'Delivery', params: { order_id: 'order_id' } },
    ],
  },
  {
    name: 'locations-service',
    apiVar: 'locationsApi',
    port: 4004,
    mounts: [
      { prefix: '/api/areas', file: 'locations-service/src/routes/area.routes.js', folder: 'Areas', params: { id: 'area_id' } },
      { prefix: '/api/internal/areas', file: 'locations-service/src/routes/internal.routes.js', folder: 'Internal', params: { id: 'area_id' } },
    ],
  },
  {
    name: 'menu-service',
    apiVar: 'menuApi',
    port: 4005,
    mounts: [
      { prefix: '/api/food-items', file: 'menu-service/src/routes/foodItem.routes.js', folder: 'Food Items', params: { id: 'food_item_id' } },
      { prefix: '/api/meal-sessions', file: 'menu-service/src/routes/mealSession.routes.js', folder: 'Meal Sessions', params: { id: 'meal_session_id' } },
      { prefix: '/api/meal-session-items', file: 'menu-service/src/routes/mealSessionItem.routes.js', folder: 'Meal Session Items', params: { id: 'meal_session_item_id', meal_session_id: 'meal_session_id' } },
      { prefix: '/api/inventory', file: 'menu-service/src/routes/inventory.routes.js', folder: 'Inventory' },
    ],
  },
  {
    name: 'analytics-service',
    apiVar: 'analyticsApi',
    port: 4006,
    mounts: [
      { prefix: '/api/analytics', file: 'analytics-service/src/routes/analytics.routes.js', folder: 'Analytics' },
    ],
  },
];

// Services exposing GET /health (analytics and menu only — verified in their index.js).
const HEALTH = [
  { name: 'analytics-service', apiVar: 'analyticsApi' },
  { name: 'menu-service', apiVar: 'menuApi' },
];

// Numeric ids must interpolate UNQUOTED, or Postman sends "53" and order-service's
// `new Map(sessionItems.map(si => [si.food_item_id, si]))` lookup misses on the type.
// numVar() marks such a field; serializeBody() emits {{var}} bare for Postman, and the
// Markdown renderer substitutes `example` so the documented body stays valid JSON.
const numVar = (name, example) => ({ __raw: `{{${name}}}`, __example: example });

function serializeBody(body, mode) {
  const json = JSON.stringify(
    body,
    (_k, v) => (v && v.__raw ? (mode === 'postman' ? `__RAW__${v.__raw}` : v.__example) : v),
    2
  );
  return mode === 'postman' ? json.replace(/"__RAW__([^"]*)"/g, '$1') : json;
}

// Captures an id from a create response into a collection variable for later requests.
const captureId = (varName, ...jsonPaths) => `const j = pm.response.json();
const id = ${jsonPaths.map((p) => `j?.${p}`).join(' ?? ')};
if (id !== undefined && id !== null) pm.collectionVariables.set('${varName}', id);`;

// Same, but never clobbers a value a create request already set. LIST endpoints use this:
// otherwise running a folder top to bottom would capture a PRE-EXISTING row's id and the
// folder's own PUT/DELETE would then modify or destroy real data instead of the test row.
const captureIdIfUnset = (varName, ...jsonPaths) => `const j = pm.response.json();
const id = ${jsonPaths.map((p) => `j?.${p}`).join(' ?? ')};
if (id !== undefined && id !== null && !pm.collectionVariables.get('${varName}')) {
  pm.collectionVariables.set('${varName}', id);
}`;

// Per-route detail the parser cannot know. Keys are "METHOD <mounted path>".
// body: JSON request body | query: [{key, value, disabled?}] | token: force a specific
// auth variable | desc: request description shown in Postman.
const OVERRIDES = {
  'POST /api/users/login': {
    body: { email: '{{adminEmail}}', password: '{{adminPassword}}' },
    desc: 'Returns access_token + refresh_token. Optional `fcm_token` in the body registers the device for push. Use the _Setup folder logins instead of this one — they save tokens automatically.',
  },
  'POST /api/users/forgot-password': {
    body: { email: '{{customerEmail}}' },
    desc: 'Rate limited to 3 requests per 15 minutes per IP. Emails a reset token.',
  },
  'POST /api/users/reset-password': {
    body: { token: 'PASTE_TOKEN_FROM_EMAIL', newPassword: 'NewPassw0rd!' },
    desc: 'Consumes the token emailed by forgot-password.',
  },
  'POST /api/users/signup': {
    body: {
      full_name: 'Test Customer',
      email: 'test.customer@example.com',
      password: 'Passw0rd!',
      role: 'customer',
      address: '12 Test Lane',
      phone: '0770000000',
    },
    desc: 'role must be one of customer | delivery_person | admin | super_admin. `address` is stored only for customers. New customers land unapproved — approve them before they can log in. Optional `fcm_token` registers the device for push.',
    test: captureId('user_id', 'user?.id', 'id', 'user_id'),
  },
  'POST /api/users/refresh-token': {
    body: { refresh_token: '{{refresh_token}}' },
    desc: 'Exchanges a refresh token for a new access token.',
  },
  'GET /api/users/profile': { desc: 'Profile of the token holder.' },
  'GET /api/users/:userId': {
    desc: 'Service-to-service lookup used by order, menu, locations and analytics to resolve a user\'s area_id. Requires X-Internal-Key — it was unauthenticated until 2026-09-26.',
  },
  'PUT /api/users/approve/:customerId': { desc: 'Legacy approve route. The Customers folder equivalent (POST /api/users/customers/:id/approve) is the one the admin UI uses.' },
  'PUT /api/users/delete/:userId': { desc: 'Soft delete — sets status to `deleted`. The email can be reused by signing up again.' },

  'GET /api/users/customers': {
    query: [{ key: 'status', value: 'pending', disabled: true }],
    desc: 'status filter accepts the User.status values (e.g. pending, active, deleted).',
    test: captureIdIfUnset('customer_id', 'customers?.[0]?.id', 'data?.[0]?.id', '[0]?.id'),
  },
  'GET /api/users/customers/export': {
    query: [
      { key: 'status', value: 'active', disabled: true },
      { key: 'limit', value: '1000', disabled: true },
    ],
    desc: 'CSV export. limit defaults to 1000.',
  },
  'GET /api/users/customers/:id/profile': { desc: 'Full customer record including area assignment.' },
  'POST /api/users/customers/:id/approve': { body: { area_id: numVar('area_id', 1) }, desc: 'area_id is optional; approving without it leaves the customer unassigned.' },
  'POST /api/users/customers/:id/reject': { body: { reason: 'Incomplete registration details' }, desc: 'reason is optional and stored with the rejection.' },
  'PUT /api/users/customers/:id/assign-area': { body: { area_id: numVar('area_id', 1) } },
  'PUT /api/users/customers/:id/disable': { desc: 'No body. Blocks the customer from logging in.' },
  'PUT /api/users/customers/:id/enable': { desc: 'No body. Reverses disable.' },
  'PUT /api/users/customers/:id/unlock': { desc: 'No body. Clears a lockout from failed login attempts.' },

  'GET /api/users/notices': {
    query: [
      { key: 'limit', value: '20', disabled: true },
      { key: 'offset', value: '0', disabled: true },
    ],
    desc: 'limit is clamped to 1..100 (default 20). Customers see notices for their own area plus global ones.',
    test: captureIdIfUnset('notice_id', 'notices?.[0]?.id', 'data?.[0]?.id', '[0]?.id'),
  },
  'POST /api/users/notices': {
    body: { title: 'Kitchen closed tomorrow', body: 'No dinner service on the 30th.', area_id: null },
    desc: 'area_id null targets every user; set it to an area id to target one area. Sends a push to the matching users.',
    test: captureId('notice_id', 'notice?.id', 'id'),
  },
  'DELETE /api/users/notices/:id': {},

  'POST /api/internal/notify': {
    body: { user_id: '{{user_id}}', title: 'Test push', body: 'Sent via the internal notify endpoint' },
    desc: 'Service-to-service push. Requires the X-Internal-Key header, not a bearer token.',
  },

  'GET /api/orders': {
    query: [
      { key: 'type', value: 'current' },
      { key: 'status', value: 'pending', disabled: true },
      { key: 'meal_type', value: 'lunch', disabled: true },
      { key: 'payment_status', value: 'pending', disabled: true },
      { key: 'customer_id', value: '{{customer_id}}', disabled: true },
      { key: 'area_id', value: '{{area_id}}', disabled: true },
      { key: 'date_range', value: '', disabled: true },
      { key: 'start_date', value: '2026-09-01', disabled: true },
      { key: 'end_date', value: '2026-09-30', disabled: true },
      { key: 'limit', value: '20', disabled: true },
      { key: 'offset', value: '0', disabled: true },
    ],
    desc: '`type` is REQUIRED — one of `current`, `pending` or `completed`; anything else returns 400. A delivery_person must also pass `area_id`. status: pending | preparing | delivering | delivered | completed | cancelled | delivery_failed. payment_status: pending | paid | unpaid | ignored.',
    test: captureIdIfUnset('order_id', 'orders?.[0]?.id', 'data?.[0]?.id', '[0]?.id'),
  },
  'POST /api/orders': {
    body: {
      customer_id: '{{customer_id}}',
      items: [{ food_item_id: numVar('food_item_id', 53), quantity: 2 }],
      meal_time: 'lunch',
      target_date: '{{today}}',
    },
    desc: 'meal_time: breakfast | lunch | dinner. target_date is the delivery date (pre-orders). Decrements menu-service inventory, so the food item must already be attached to a meal session that is open right now and still has stock. Run the menu-service folder first — see the seeding order in the README.',
    test: captureId('order_id', 'order?.id', 'id', 'order_id'),
  },
  'PUT /api/orders/:order_id': { body: { items: [{ food_item_id: numVar('food_item_id', 53), quantity: 3 }] }, desc: 'Replaces the order items. Only allowed while the order is still pending.' },
  'PUT /api/orders/:order_id/payment': { body: { payment_status: 'paid' }, desc: 'payment_status: pending | paid | unpaid | ignored. An order becomes `completed` when it is both delivered and paid.' },
  'PUT /api/orders/:order_id/status': {
    body: { status: 'preparing' },
    desc: 'Allowed transitions: pending→preparing|cancelled, preparing→delivering|cancelled, delivering→delivered|delivery_failed. Cancelling is admin/super_admin only. `delivery_failed` additionally requires a non-empty `failure_reason` of 500 chars or fewer. `completed` is derived, never set directly. Each transition fires a push to the customer.',
  },
  'DELETE /api/orders/:order_id': {},

  'GET /api/delivery/orders/area': {
    query: [
      { key: 'area_id', value: '{{area_id}}' },
      { key: 'meal_time', value: 'lunch', disabled: true },
      { key: 'date', value: '{{today}}', disabled: true },
      { key: 'payment_status', value: 'pending', disabled: true },
    ],
    desc: 'payment_status defaults to `pending` when omitted.',
  },
  'GET /api/delivery/orders/my-area': { desc: "Orders for the area assigned to the logged-in delivery person. No query params — the area comes from the token holder's profile." },
  'PUT /api/delivery/orders/:order_id/payment': { body: { payment_status: 'paid' }, desc: 'Proxies to order-service and returns its response body unchanged.' },
  'PUT /api/delivery/orders/:order_id/status': {
    body: { status: 'delivering' },
    desc: 'Proxies to order-service. Same transition rules and the same `failure_reason` requirement for `delivery_failed`.',
  },

  // Areas use `area_id` as the primary key, not `id` — verified against the live response.
  'POST /api/areas': { body: { area_name: 'Hostel Block A' }, test: captureId('area_id', 'area_id') },
  'GET /api/areas': {
    desc: 'Readable by admin, super_admin and delivery_person. Returns a bare array of { area_id, area_name }.',
    test: captureIdIfUnset('area_id', '[0]?.area_id'),
  },
  'GET /api/areas/:id': {},
  'PUT /api/areas/:id': { body: { area_name: 'Hostel Block A (renamed)' } },
  'DELETE /api/areas/:id': {},
  'GET /api/internal/areas': { desc: 'Unauthenticated-by-bearer area list for other services. Requires X-Internal-Key.' },
  'GET /api/internal/areas/:id': {},

  'POST /api/food-items': {
    body: { name: 'Chicken Rice', description: 'Rice with grilled chicken', price: 450, meal_type: 'non-veg', image_url: 'https://example.com/chicken-rice.jpg' },
    desc: 'meal_type is the DIETARY enum: veg | non-veg | other. It is NOT a meal time — meal times (breakfast/lunch/dinner) live on meal sessions.',
    test: captureId('food_item_id', 'foodItem?.id', 'data?.id', 'id'),
  },
  'GET /api/food-items': {
    query: [
      { key: 'page', value: '1', disabled: true },
      { key: 'limit', value: '10', disabled: true },
      { key: 'meal_type', value: 'non-veg', disabled: true },
    ],
    desc: 'meal_type filter: veg | non-veg | other.',
    test: captureIdIfUnset('food_item_id', 'foodItems?.[0]?.id', 'data?.[0]?.id', '[0]?.id'),
  },
  'GET /api/food-items/:id': {},
  'PUT /api/food-items/:id': { body: { name: 'Chicken Rice (large)', description: 'Larger portion', price: 550, meal_type: 'non-veg', image_url: 'https://example.com/chicken-rice.jpg' } },
  'DELETE /api/food-items/:id': {},

  'POST /api/meal-sessions': {
    body: { date: '{{today}}', meal_time: 'lunch', start_time: '00:00:00', end_time: '23:59:00' },
    desc: "Ordering is allowed only while the clock (Asia/Colombo) is inside this window — see isOrderingAllowed in order.controller.js. The window here is deliberately the whole day so ordering works whenever you run the collection; narrow it to real service hours (e.g. 11:30:00–14:00:00) when testing the rejection path.\n\nIf end_time < start_time the session is treated as crossing midnight and ordering opens the PREVIOUS day — that is how pre-orders work.",
    test: captureId('meal_session_id', 'mealSession?.id', 'data?.id', 'id'),
  },
  'GET /api/meal-sessions': {
    query: [
      { key: 'page', value: '1', disabled: true },
      { key: 'limit', value: '10', disabled: true },
      { key: 'meal_time', value: 'lunch', disabled: true },
      { key: 'date', value: '{{today}}', disabled: true },
    ],
    test: captureIdIfUnset('meal_session_id', 'mealSessions?.[0]?.id', 'data?.[0]?.id', '[0]?.id'),
  },
  'GET /api/meal-sessions/:id': {},
  'PUT /api/meal-sessions/:id': { body: { date: '{{today}}', meal_time: 'lunch', start_time: '00:00:00', end_time: '23:00:00' } },
  'DELETE /api/meal-sessions/:id': {},
  'POST /api/meal-sessions/:id/items': {
    body: { food_items: [{ food_item_id: numVar('food_item_id', 53), available_quantity: 50 }] },
    desc: 'Bulk-attaches food items to the session with their starting stock.',
  },

  'POST /api/meal-session-items': {
    body: { meal_session_id: numVar('meal_session_id', 4), food_item_id: numVar('food_item_id', 53), available_quantity: 50 },
    test: captureId('meal_session_item_id', 'mealSessionItem?.id', 'data?.id', 'id'),
  },
  'GET /api/meal-session-items/by-session': {
    query: [
      { key: 'meal_time', value: 'lunch' },
      { key: 'date', value: '{{today}}' },
      { key: 'check_availability', value: 'true', disabled: true },
    ],
    desc: 'BOTH meal_time and date are REQUIRED — omitting either returns 400. Resolves the session from meal_time/date rather than an id. This is the endpoint the customer app uses to render a menu.',
  },
  'GET /api/meal-session-items/:meal_session_id': { test: captureIdIfUnset('meal_session_item_id', 'items?.[0]?.id', 'data?.[0]?.id', '[0]?.id') },
  'PUT /api/meal-session-items/:id': { body: { available_quantity: 40 } },
  'DELETE /api/meal-session-items/:id': {},

  'POST /api/inventory/decrement': {
    body: { meal_session_id: numVar('meal_session_id', 4), food_item_id: numVar('food_item_id', 53), quantity: 1 },
    desc: 'Order creation calls this internally. Broadcasts a `mealSessionItemUpdate` socket.io event on menu-service (port 4005).',
  },
  'POST /api/inventory/increment': {
    body: { meal_session_id: numVar('meal_session_id', 4), food_item_id: numVar('food_item_id', 53), quantity: 1 },
    desc: 'Order cancellation calls this internally. Also broadcasts `mealSessionItemUpdate`.',
  },

  'GET /api/analytics/sales-totals': { query: [{ key: 'period', value: 'weekly', disabled: true }], desc: 'period defaults to `weekly`.' },
  'GET /api/analytics/orders-metrics': { query: [{ key: 'period', value: 'weekly', disabled: true }], desc: 'period defaults to `weekly`.' },
  'GET /api/analytics/blocked-users-count': {},
  'GET /api/analytics/unpaid-orders-count': { query: [{ key: 'customer_id', value: '{{customer_id}}', disabled: true }] },
  'GET /api/analytics/top-selling-items': {
    query: [
      { key: 'startDate', value: '2026-09-01', disabled: true },
      { key: 'endDate', value: '2026-09-30', disabled: true },
      { key: 'limit', value: '10', disabled: true },
    ],
  },
  'GET /api/analytics/session-performance': {
    query: [
      { key: 'sessionType', value: 'lunch' },
      { key: 'startDate', value: '2026-09-01', disabled: true },
      { key: 'endDate', value: '2026-09-30', disabled: true },
    ],
    desc: 'sessionType is REQUIRED and must be breakfast | lunch | dinner — omitting it returns 400, not an unfiltered result.',
  },
  'GET /api/analytics/area-metrics': {
    query: [
      { key: 'areaId', value: '{{area_id}}', disabled: true },
      { key: 'startDate', value: '2026-09-01', disabled: true },
      { key: 'endDate', value: '2026-09-30', disabled: true },
    ],
  },
  'GET /api/analytics/areas': {},

  'GET /api/internal/analytics/sales-totals': { query: [{ key: 'period', value: 'weekly', disabled: true }] },
  'GET /api/internal/analytics/orders-metrics': { query: [{ key: 'period', value: 'weekly', disabled: true }] },
  'GET /api/internal/analytics/unpaid-orders-count': { query: [{ key: 'customer_id', value: '{{customer_id}}', disabled: true }] },
  'GET /api/internal/analytics/orders-by-customer': {
    query: [
      { key: 'customer_id', value: '{{customer_id}}' },
      { key: 'limit', value: '50', disabled: true },
    ],
  },
  'GET /api/internal/analytics/top-selling-items': {
    query: [
      { key: 'startDate', value: '2026-09-01', disabled: true },
      { key: 'endDate', value: '2026-09-30', disabled: true },
      { key: 'limit', value: '10', disabled: true },
    ],
  },
  'GET /api/internal/analytics/session-performance': {
    query: [
      { key: 'sessionType', value: 'lunch' },
      { key: 'startDate', value: '2026-09-01', disabled: true },
      { key: 'endDate', value: '2026-09-30', disabled: true },
    ],
    desc: 'sessionType is REQUIRED and must be breakfast | lunch | dinner — omitting it returns 400.',
  },
  'GET /api/internal/analytics/area-metrics': {
    query: [
      { key: 'areaId', value: '{{area_id}}', disabled: true },
      { key: 'startDate', value: '2026-09-01', disabled: true },
      { key: 'endDate', value: '2026-09-30', disabled: true },
    ],
  },
  'GET /api/internal/analytics/blocked-users-count': {},
};

// ---------------------------------------------------------------- parsing

const ROUTE_RE = /^\s*router\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]*)['"`]\s*,?([^\n]*)$/;

function parseRouteFile(absPath) {
  const src = fs.readFileSync(absPath, 'utf8');

  // Resolve `const adminRoles = ['admin', 'super_admin']` style role arrays so a
  // checkRole(adminRoles) or checkRole([...adminRoles, 'customer']) can be expanded.
  const arrays = {};
  for (const m of src.matchAll(/const\s+(\w+)\s*=\s*\[([^\]]*)\]/g)) {
    arrays[m[1]] = [...m[2].matchAll(/['"`]([^'"`]+)['"`]/g)].map((q) => q[1]);
  }
  const resolve = (expr) => {
    if (!expr) return [];
    const out = [];
    for (const tok of expr.replace(/^\s*\[|\]\s*$/g, '').split(',')) {
      const t = tok.trim();
      if (!t) continue;
      const lit = t.match(/^['"`]([^'"`]+)['"`]$/);
      if (lit) out.push(lit[1]);
      else out.push(...(arrays[t.replace(/^\.\.\./, '')] || []));
    }
    return out;
  };

  // `const adminOnly = checkRole([...])` used later as router.use(adminOnly)
  const roleFns = {};
  for (const m of src.matchAll(/const\s+(\w+)\s*=\s*checkRole\(\s*(\[[^\]]*\]|\w+)\s*\)/g)) {
    roleFns[m[1]] = resolve(m[2]);
  }

  const rolesOn = (chain) => {
    const direct = chain.match(/checkRole\(\s*(\[[^\]]*\]|\w+)\s*\)/);
    if (direct) return resolve(direct[1]);
    for (const [name, roles] of Object.entries(roleFns)) {
      if (new RegExp(`\\b${name}\\b`).test(chain)) return roles;
    }
    return [];
  };

  // Middleware applied to the whole router via router.use(...)
  const uses = [...src.matchAll(/router\.use\(([^\n]*)\)/g)].map((m) => m[1]).join(' ; ');
  const fileAuth = /\bauthMiddleware\b/.test(uses);
  const fileInternal = /\binternalAuthMiddleware\b/.test(uses);
  const fileRoles = rolesOn(uses);

  const routes = [];
  for (const line of src.split('\n')) {
    const m = line.match(ROUTE_RE);
    if (!m) continue;
    const [, method, routePath, chain] = m;
    routes.push({
      method: method.toUpperCase(),
      routePath,
      internal: fileInternal || /\binternalAuthMiddleware\b/.test(chain),
      auth: fileAuth || /\bauthMiddleware\b/.test(chain),
      roles: [...new Set([...fileRoles, ...rolesOn(chain)])],
    });
  }
  return routes;
}

// ---------------------------------------------------------------- building

// Which saved token a request should use, given the roles the route accepts.
// Least-privileged role that can actually call it, so a 403 means a real bug.
function tokenFor(roles) {
  if (roles.length === 0 || roles.includes('customer')) return 'customerToken';
  if (roles.some((r) => r === 'delivery_person' || r === 'delivery-person')) return 'deliveryToken';
  return 'adminToken';
}

function joinPath(prefix, routePath) {
  const joined = `${prefix}${routePath === '/' ? '' : routePath}`;
  return joined || '/';
}

// Normalized view of one endpoint. Both the Postman builder and the Markdown writer
// render from this, so the collection and the reference can never disagree.
function describeRoute(mount, service, route) {
  const full = joinPath(mount.prefix, route.routePath);
  const o = OVERRIDES[`${route.method} ${full}`] || {};

  // Swap :params for collection variables so a Runner pass chains end to end.
  const segments = full.split('/').filter(Boolean).map((seg) => {
    if (!seg.startsWith(':')) return seg;
    const mapped = (mount.params || {})[seg.slice(1)];
    return `{{${mapped || seg.slice(1)}}}`;
  });

  let auth;
  if (route.internal) auth = { kind: 'internal' };
  else if (route.auth) auth = { kind: 'bearer', token: o.token || tokenFor(route.roles), roles: route.roles };
  else auth = { kind: 'none' };

  return {
    method: route.method,
    full,
    segments,
    pathParams: full.split('/').filter((s) => s.startsWith(':')).map((s) => s.slice(1)),
    auth,
    body: o.body || null,
    query: o.query || [],
    desc: o.desc || '',
    test: o.test || null,
    service,
    mount,
  };
}

function buildRequest(ep) {
  const url = {
    raw: `{{${ep.service.apiVar}}}/${ep.segments.join('/')}`,
    host: [`{{${ep.service.apiVar}}}`],
    path: ep.segments,
  };
  if (ep.query.length) {
    url.query = ep.query.map((q) => ({ key: q.key, value: q.value, disabled: q.disabled === true }));
    const on = ep.query.filter((q) => q.disabled !== true);
    if (on.length) url.raw += `?${on.map((q) => `${q.key}=${q.value}`).join('&')}`;
  }

  const header = [];
  const request = { method: ep.method, header, url };

  if (ep.auth.kind === 'internal') {
    header.push({ key: 'X-Internal-Key', value: '{{internalKey}}' });
    request.auth = { type: 'noauth' };
  } else if (ep.auth.kind === 'bearer') {
    request.auth = { type: 'bearer', bearer: [{ key: 'token', value: `{{${ep.auth.token}}}`, type: 'string' }] };
  } else {
    request.auth = { type: 'noauth' };
  }

  if (ep.body) {
    header.push({ key: 'Content-Type', value: 'application/json' });
    request.body = { mode: 'raw', raw: serializeBody(ep.body, 'postman'), options: { raw: { language: 'json' } } };
  }

  const notes = [];
  if (ep.desc) notes.push(ep.desc);
  if (ep.auth.kind === 'bearer' && ep.auth.roles.length) notes.push(`Roles allowed: ${ep.auth.roles.join(', ')}.`);
  else if (ep.auth.kind === 'internal') notes.push('Internal: requires the X-Internal-Key header.');
  else if (ep.auth.kind === 'none') notes.push('No authentication middleware on this route.');
  notes.push(`Source: apps/${ep.mount.file}`);
  request.description = notes.join('\n\n');

  const item = { name: `${ep.method} ${ep.full}`, request, response: [] };
  if (ep.test) item.event = [{ listen: 'test', script: { type: 'text/javascript', exec: ep.test.split('\n') } }];
  return item;
}

function loginRequest(label, tokenVar, emailVar, passwordVar) {
  return {
    name: `Login as ${label}`,
    event: [{
      listen: 'test',
      script: {
        type: 'text/javascript',
        exec: [
          `pm.test('${label} login succeeded', () => pm.response.to.have.status(200));`,
          'const j = pm.response.json();',
          `if (j.access_token) pm.collectionVariables.set('${tokenVar}', j.access_token);`,
          "if (j.refresh_token) pm.collectionVariables.set('refresh_token', j.refresh_token);",
          `if (j.user?.id) pm.collectionVariables.set('${label === 'customer' ? 'customer_id' : `${label}_user_id`}', j.user.id);`,
        ],
      },
    }],
    request: {
      auth: { type: 'noauth' },
      method: 'POST',
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: {
        mode: 'raw',
        raw: JSON.stringify({ email: `{{${emailVar}}}`, password: `{{${passwordVar}}}` }, null, 2),
        options: { raw: { language: 'json' } },
      },
      url: { raw: '{{userApi}}/api/users/login', host: ['{{userApi}}'], path: ['api', 'users', 'login'] },
      description: `Saves access_token to {{${tokenVar}}}. Run this before the folders that need a ${label} token.`,
    },
    response: [],
  };
}

// ---------------------------------------------------------------- markdown

const ENV_FOR_TOKEN = { adminToken: '$ADMIN_TOKEN', deliveryToken: '$DELIVERY_TOKEN', customerToken: '$CUSTOMER_TOKEN' };

// `{{area_id}}` reads fine in Postman but not in a shell, so the docs show <area_id>.
const forShell = (s) => s.replace(/{{(\w+)}}/g, '<$1>');

function authLabel(ep) {
  if (ep.auth.kind === 'internal') return '`X-Internal-Key` header (service-to-service)';
  if (ep.auth.kind === 'none') return 'None — open endpoint';
  const roles = ep.auth.roles.length ? ep.auth.roles.join(', ') : 'any authenticated user';
  return `Bearer token — ${roles}`;
}

function curlFor(ep) {
  const base = `http://localhost:${ep.service.port}`;
  let url = `${base}/${forShell(ep.segments.join('/'))}`;
  const on = ep.query.filter((q) => q.disabled !== true);
  if (on.length) url += `?${on.map((q) => `${q.key}=${forShell(q.value)}`).join('&')}`;

  const lines = [`curl -X ${ep.method} "${url}"`];
  if (ep.auth.kind === 'internal') lines.push(`  -H "X-Internal-Key: $INTERNAL_KEY"`);
  else if (ep.auth.kind === 'bearer') lines.push(`  -H "Authorization: Bearer ${ENV_FOR_TOKEN[ep.auth.token] || '$TOKEN'}"`);
  if (ep.body) {
    lines.push(`  -H "Content-Type: application/json"`);
    const json = forShell(JSON.stringify(ep.body)).replace(/'/g, `'\\''`);
    lines.push(`  -d '${json}'`);
  }
  return lines.join(' \\\n');
}

function renderEndpoint(ep) {
  const out = [`#### \`${ep.method} ${ep.full}\``, ''];
  out.push(`**URL** &nbsp; \`http://localhost:${ep.service.port}${ep.full}\`  `);
  out.push(`**Auth** &nbsp; ${authLabel(ep)}  `);
  out.push(`**Source** &nbsp; [\`apps/${ep.mount.file}\`](../apps/${ep.mount.file})`);
  out.push('');

  if (ep.desc) out.push(ep.desc.split('\n\n').join('\n\n'), '');

  if (ep.pathParams.length) {
    out.push('| Path param | Stands for |', '|---|---|');
    for (const p of ep.pathParams) {
      out.push(`| \`:${p}\` | ${(ep.mount.params || {})[p] || p} |`);
    }
    out.push('');
  }

  if (ep.query.length) {
    out.push('| Query param | Example | Required |', '|---|---|---|');
    for (const q of ep.query) {
      out.push(`| \`${q.key}\` | \`${q.value || '—'}\` | ${q.disabled === true ? 'optional' : '**yes**'} |`);
    }
    out.push('');
  }

  if (ep.body) {
    // <name> placeholders read better in a doc than Postman's {{name}}.
    out.push('**Body**', '', '```json', forShell(serializeBody(ep.body, 'markdown')), '```', '');
  }

  out.push('<details><summary>curl</summary>', '', '```bash', curlFor(ep), '```', '', '</details>', '');
  return out.join('\n');
}

function renderMarkdown(byService, count) {
  const all = byService.flatMap(({ groups }) => [...groups.values()].flat());
  const out = [];

  out.push('# RC Backend — API Reference', '');
  out.push('<!-- GENERATED FILE — DO NOT EDIT BY HAND.');
  out.push('     Written by scripts/gen-postman.js from the Express route files.');
  out.push('     Refresh with:  npm run docs:api  -->', '');
  out.push(`**${count} endpoints** across ${byService.length} services. Generated from the route files — see [Keeping this current](#keeping-this-current).`, '');
  out.push('For click-and-run testing, import the Postman collection instead: [docs/postman/](postman/README.md). Same source, same bodies.', '');

  out.push('## Base URLs', '');
  out.push('Requests go straight to each service port. The api-gateway only proxies `/users` and `/api/analytics`, so it is not used here.', '');
  out.push('| Service | Port | Base URL |', '|---|---|---|');
  for (const { service } of byService) {
    out.push(`| ${service.name} | ${service.port} | \`http://localhost:${service.port}\` |`);
  }
  out.push('');

  out.push('## Authentication', '');
  out.push('Three kinds of endpoint, and the reference says which for every one:', '');
  out.push('- **Bearer token** — most routes. Get one from `POST /api/users/login`, then send `Authorization: Bearer <token>`. Tokens are RS256, valid 7 days, and carry `id`, `role` and `area_id`.');
  out.push('- **`X-Internal-Key`** — service-to-service routes under `/api/internal`. The key is `INTERNAL_API_KEY`, defaulting to `internal-dev-key` in `docker/docker-compose.yml`.');
  out.push('- **None** — signup, login, the password-reset pair, and the health probes.', '');
  out.push('The curl blocks below assume these shell variables:', '');
  out.push('```bash');
  out.push('export ADMIN_TOKEN=$(curl -s -X POST http://localhost:4001/api/users/login \\');
  out.push('  -H "Content-Type: application/json" \\');
  out.push(`  -d '{"email":"admin@example.com","password":"..."}' | jq -r .access_token)`);
  out.push('# …same for DELIVERY_TOKEN and CUSTOMER_TOKEN');
  out.push('export INTERNAL_KEY=internal-dev-key');
  out.push('```', '');
  out.push('Roles are `customer`, `delivery_person`, `admin`, `super_admin`. Where a route lists roles, `checkRole` does an exact string match against the token\'s `role`.', '');

  out.push('## All endpoints', '');
  out.push('| Method | Path | Service | Auth |', '|---|---|---|---|');
  for (const ep of all) {
    const a = ep.auth.kind === 'internal' ? 'internal key' : ep.auth.kind === 'none' ? 'none' : (ep.auth.roles.length ? ep.auth.roles.join(', ') : 'any logged in');
    out.push(`| \`${ep.method}\` | [\`${ep.full}\`](#${anchor(ep)}) | ${ep.service.name} | ${a} |`);
  }
  out.push('');

  for (const { service, groups } of byService) {
    out.push(`## ${service.name} — port ${service.port}`, '');
    for (const [folder, eps] of groups) {
      out.push(`### ${folder}`, '');
      for (const ep of eps) out.push(renderEndpoint(ep));
    }
  }

  out.push('## Not covered here', '');
  out.push('- **payment-service** — `apps/payment-service/` holds only a `package.json`. No routes.');
  out.push('- **websocket-service** (`:4008`) and menu-service\'s socket.io server (`:4005`) — event streams, not REST. menu-service emits `mealSessionItemUpdate` on inventory change; websocket-service rebroadcasts the Redis `order_updates` channel.');
  out.push('- **api-gateway** (`:4000`) — mostly unwired, `/orders` is commented out.', '');

  out.push('## Keeping this current', '');
  out.push('This file is generated. Editing it by hand means losing the edit on the next run.', '');
  out.push('Method, path and allowed roles are **parsed** from `apps/*/src/routes/*.js`, so a new route appears automatically. Request bodies, query params and prose cannot be inferred from a route line — they live in the `OVERRIDES` map in `scripts/gen-postman.js`, keyed by `"METHOD /mounted/path"`.', '');
  out.push('```bash');
  out.push('npm run docs:api      # regenerate this file and the Postman collection');
  out.push('npm run docs:api:check  # exit 1 if they are out of date (used by CI)');
  out.push('```', '');
  out.push('A pre-commit hook in `.githooks/` runs the generator whenever a route file is staged and adds the result to the commit. Enable it once per clone:', '');
  out.push('```bash');
  out.push('git config core.hooksPath .githooks');
  out.push('```', '');
  out.push('If you add a route without an `OVERRIDES` entry, the generator prints it under *No OVERRIDES entry* and documents it with no body — so it is visible, not silently missing.', '');

  return out.join('\n');
}

// GitHub's heading-slug rule: lowercase, delete everything that is not a letter,
// digit, space, hyphen or underscore (so `/` and `:` vanish rather than becoming
// dashes), then spaces to hyphens. Backticks in the heading are stripped too.
function anchor(ep) {
  return `${ep.method} ${ep.full}`
    .toLowerCase()
    .replace(/[^a-z0-9 _-]/g, '')
    .replace(/ /g, '-');
}

function build() {
  const folders = [{
    name: '_Setup',
    description: 'Run these first — they save the bearer tokens every other folder reads. Fill in the credentials in the environment file before running.',
    item: [
      loginRequest('admin', 'adminToken', 'adminEmail', 'adminPassword'),
      loginRequest('delivery', 'deliveryToken', 'deliveryEmail', 'deliveryPassword'),
      loginRequest('customer', 'customerToken', 'customerEmail', 'customerPassword'),
    ],
  }];

  let count = 0;
  const byService = []; // feeds the Markdown reference
  for (const service of SERVICES) {
    const sub = new Map();
    const groups = new Map();
    for (const mount of service.mounts) {
      const abs = path.join(ROOT, 'apps', mount.file);
      for (const route of parseRouteFile(abs)) {
        const ep = describeRoute(mount, service, route);
        if (!sub.has(mount.folder)) sub.set(mount.folder, []);
        if (!groups.has(mount.folder)) groups.set(mount.folder, []);
        sub.get(mount.folder).push(buildRequest(ep));
        groups.get(mount.folder).push(ep);
        count++;
      }
    }
    byService.push({ service, groups });
    const health = HEALTH.find((h) => h.name === service.name);
    if (health) {
      sub.set('Health', [{
        name: 'GET /health',
        request: {
          auth: { type: 'noauth' },
          method: 'GET',
          header: [],
          url: { raw: `{{${service.apiVar}}}/health`, host: [`{{${service.apiVar}}}`], path: ['health'] },
          description: 'Liveness probe. No auth.',
        },
        response: [],
      }]);
      groups.set('Health', [{
        method: 'GET', full: '/health', segments: ['health'], pathParams: [],
        auth: { kind: 'none' }, body: null, query: [], desc: 'Liveness probe. No auth.', test: null,
        service, mount: { file: `${service.name}/index.js` },
      }]);
      count++;
    }
    folders.push({
      name: `${service.name} (:${service.port})`,
      description: `Base URL variable: {{${service.apiVar}}}`,
      item: [...sub.entries()].map(([name, item]) => ({ name, item })),
    });
  }

  const collection = {
    info: {
      name: 'RC Backend — All Services',
      description: [
        'Every REST endpoint across the six RC Backend services, generated from the Express route files by scripts/gen-postman.js.',
        '',
        'Quick start: import the environment file alongside this collection, select it, fill in the six credential fields, then run the _Setup folder. Every other request picks up its token automatically.',
        '',
        'Requests go straight to service ports (4001-4006). The api-gateway only proxies /users and /api/analytics, so it is not used here.',
        '',
        'See docs/postman/README.md for the known issues this collection surfaces.',
      ].join('\n'),
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{adminToken}}', type: 'string' }] },
    event: [
      {
        listen: 'prerequest',
        script: {
          type: 'text/javascript',
          exec: [
            '// Meal sessions and orders are date-sensitive, and the ordering window is',
            '// checked against the current Asia/Colombo time — so dates cannot be hardcoded',
            '// or the collection goes stale overnight.',
            "const colombo = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString();",
            "pm.collectionVariables.set('today', colombo.slice(0, 10));",
          ],
        },
      },
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            '// Collection-level check applied to every request.',
            "pm.test('status is not a server error', () => pm.expect(pm.response.code).to.be.below(500));",
            "pm.test('responded under 5s', () => pm.expect(pm.response.responseTime).to.be.below(5000));",
          ],
        },
      },
    ],
    variable: [
      { key: 'userApi', value: 'http://localhost:4001' },
      { key: 'orderApi', value: 'http://localhost:4002' },
      { key: 'deliveryApi', value: 'http://localhost:4003' },
      { key: 'locationsApi', value: 'http://localhost:4004' },
      { key: 'menuApi', value: 'http://localhost:4005' },
      { key: 'analyticsApi', value: 'http://localhost:4006' },
      // Filled in at runtime by the _Setup logins and the create requests.
      { key: 'adminToken', value: '' },
      { key: 'deliveryToken', value: '' },
      { key: 'customerToken', value: '' },
      { key: 'refresh_token', value: '' },
      { key: 'user_id', value: '' },
      { key: 'customer_id', value: '' },
      { key: 'area_id', value: '' },
      { key: 'food_item_id', value: '' },
      { key: 'meal_session_id', value: '' },
      { key: 'meal_session_item_id', value: '' },
      { key: 'order_id', value: '' },
      { key: 'notice_id', value: '' },
      { key: 'today', value: '' },
    ],
    item: folders,
  };

  const environment = {
    name: 'RC Backend — local',
    values: [
      { key: 'adminEmail', value: '', type: 'default', enabled: true },
      { key: 'adminPassword', value: '', type: 'secret', enabled: true },
      { key: 'deliveryEmail', value: '', type: 'default', enabled: true },
      { key: 'deliveryPassword', value: '', type: 'secret', enabled: true },
      { key: 'customerEmail', value: '', type: 'default', enabled: true },
      { key: 'customerPassword', value: '', type: 'secret', enabled: true },
      { key: 'internalKey', value: 'internal-dev-key', type: 'secret', enabled: true },
    ],
    _postman_variable_scope: 'environment',
  };

  const artifacts = [
    [path.join(OUT_DIR, 'rc-backend.postman_collection.json'), JSON.stringify(collection, null, 2) + '\n'],
    [path.join(OUT_DIR, 'rc-backend.postman_environment.json'), JSON.stringify(environment, null, 2) + '\n'],
    [path.join(ROOT, 'docs', 'API.md'), renderMarkdown(byService, count) + '\n'],
  ];

  // --check compares instead of writing, so CI can fail on a route added without regenerating.
  if (CHECK_ONLY) {
    // Git rewrites LF to CRLF on Windows checkout, so compare on normalized endings
    // or this reports drift on every Windows machine.
    const lf = (s) => s.replace(/\r\n/g, '\n');
    const stale = artifacts
      .filter(([file, content]) => !fs.existsSync(file) || lf(fs.readFileSync(file, 'utf8')) !== lf(content))
      .map(([file]) => path.relative(ROOT, file));
    if (stale.length) {
      console.error(`Out of date:\n  ${stale.join('\n  ')}\n\nRun: npm run docs:api`);
      process.exit(1);
    }
    console.log(`Up to date (${count} endpoints).`);
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const [file, content] of artifacts) fs.writeFileSync(file, content);

  // Report routes with no OVERRIDES entry so new ones are not silently shipped bare.
  const missing = [];
  for (const service of SERVICES) {
    for (const mount of service.mounts) {
      for (const route of parseRouteFile(path.join(ROOT, 'apps', mount.file))) {
        const key = `${route.method} ${joinPath(mount.prefix, route.routePath)}`;
        if (!(key in OVERRIDES)) missing.push(key);
      }
    }
  }
  console.log(`Wrote ${count} endpoints to docs/API.md and docs/postman/rc-backend.postman_collection.json`);
  if (missing.length) console.log(`No OVERRIDES entry (documented with no body/query):\n  ${missing.join('\n  ')}`);
}

build();
