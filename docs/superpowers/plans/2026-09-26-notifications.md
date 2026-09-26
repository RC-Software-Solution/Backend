# Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin-authored notices (stored + pushed) and order-status push notifications, including a new `delivery_failed` status.

**Architecture:** user-service owns FCM, `fcm_token`, and the new `notices` table. order-service owns order status; after a status change it calls a new user-service internal endpoint (`POST /api/internal/notify`, `X-Internal-Key`) without awaiting it. delivery-service proxies the new status endpoint exactly like its existing payment proxy.

**Tech Stack:** Node 24, Express 4, Sequelize 6 (MySQL 8), firebase-admin 13, `node:test` (built-in, no new deps). Services run in Docker with source bind-mounted + nodemon, so code edits hot-reload.

**Spec:** `docs/superpowers/specs/2026-09-26-notifications-design.md`

## Global Constraints

- No new npm dependencies. Tests use `node:test` + `node:assert/strict`.
- Schema is SQL-managed (no `sequelize.sync`, no migrations). New schema goes in `scripts/sql/*.sql`, applied with: `docker exec -i mysql_db mysql -uroot -proot rc < <file>`.
- Code style: CommonJS, match surrounding file (user-service uses double quotes in models/services, single quotes in routes/controllers; order-service/delivery-service use single quotes).
- Order-status pushes are fire-and-forget: a push/notify failure must never fail the HTTP request.
- `INTERNAL_API_KEY` and `USER_SERVICE_HOST` are already configured in `docker/docker-compose.yml`; do not add config.
- Ports: user-service 4001, order-service 4002, delivery-service 4003.

## Prerequisite

The local DB may be missing `orders.target_date` (model has it; every full `Order` read fails with `Unknown column 'target_date'`). Check and apply the existing migration before Task 4:

```bash
docker exec mysql_db mysql -uroot -proot rc -e "SHOW COLUMNS FROM orders LIKE 'target_date';"
# empty result → apply:
docker exec -i mysql_db mysql -uroot -proot rc < apps/order-service/add_target_date_migration.sql
```

## File Map

| File | Change | Responsibility |
|---|---|---|
| `apps/user-service/src/services/notificationService.js` | modify | FCM send (single + multicast), dead-token pruning, never throws |
| `apps/user-service/src/services/notificationService.test.js` | create | unit tests with stubbed firebase-admin + User |
| `apps/user-service/src/controllers/internal.controller.js` | create | `notifyUser` for service-to-service push |
| `apps/user-service/src/routes/internal.routes.js` | create | `/api/internal/notify` behind `internalAuthMiddleware` |
| `scripts/sql/2026-09-26-notices.sql` | create | `notices` table |
| `apps/user-service/src/models/Notice.js` | create | Sequelize model |
| `apps/user-service/src/controllers/notice.controller.js` | create | create / list / delete notices |
| `apps/user-service/src/routes/notice.routes.js` | create | `/api/users/notices` |
| `apps/user-service/index.js` | modify | mount notice + internal routers |
| `apps/user-service/package.json` | modify | `"test": "node --test"` |
| `scripts/sql/2026-09-26-order-delivery-failed.sql` | create | enum + `failure_reason` |
| `apps/order-service/src/models/Order.model.js` | modify | enum + `failure_reason` |
| `apps/order-service/src/utils/orderStatus.js` | create | transition map + push copy (pure) |
| `apps/order-service/src/utils/orderStatus.test.js` | create | unit tests |
| `apps/order-service/src/services/userServiceClient.js` | modify | add `notifyUser` |
| `apps/order-service/src/controllers/order.controller.js` | modify | add `updateOrderStatus` |
| `apps/order-service/src/routes/order.routes.js` | modify | `PUT /:order_id/status` |
| `apps/order-service/package.json` | modify | `"test": "node --test"` |
| `apps/delivery-service/src/services/orderServiceClient.js` | modify | add `updateOrderStatus`; explicit auth header wins |
| `apps/delivery-service/src/controllers/delivery.controller.js` | modify | proxy handler |
| `apps/delivery-service/src/routes/delivery.routes.js` | modify | `PUT /orders/:order_id/status` |
| `scripts/notifications-smoke.sh` | create | end-to-end curl check |

---

### Task 1: Non-throwing push + multicast in notificationService

Fixes the existing bug where approval flows (`user.controller.js` ~L131, `customer.controller.js` ~L97) `await sendPushNotification(...)` after `customer.save()`; a stale token throws → 500 and the approval email is never sent. No caller changes needed — they already `await` and ignore the return value.

**Files:**
- Modify: `apps/user-service/src/services/notificationService.js` (replace whole file)
- Create: `apps/user-service/src/services/notificationService.test.js`
- Modify: `apps/user-service/package.json` (scripts)

**Interfaces:**
- Produces: `sendPushNotification(fcm_token: string, title: string, message: string): Promise<boolean>` and `sendToMany(tokens: string[], title: string, message: string): Promise<{ sent: number, failed: number }>`

- [ ] **Step 1: Add the test script** — in `apps/user-service/package.json`, change `"scripts"` to:

```json
  "scripts": {
    "start": "nodemon --legacy-watch index.js",
    "test": "node --test"
  },
```

- [ ] **Step 2: Write the failing tests** — create `apps/user-service/src/services/notificationService.test.js`:

```js
const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { Op } = require("sequelize");

// Stub firebase-admin and the User model before loading the service,
// so no Firebase credentials or DB connection are needed.
const calls = { send: [], multicast: [], update: [] };
let sendImpl;
let multicastImpl;

const fakeAdmin = {
    apps: [{}], // non-empty: skip initializeApp
    messaging: () => ({
        send: async (msg) => { calls.send.push(msg); return sendImpl(msg); },
        sendEachForMulticast: async (msg) => { calls.multicast.push(msg); return multicastImpl(msg); },
    }),
};
const fakeUser = { update: async (values, opts) => { calls.update.push({ values, opts }); } };

function stub(id, exports) {
    require.cache[id] = { id, filename: id, loaded: true, exports };
}
stub(require.resolve("firebase-admin"), fakeAdmin);
stub(path.join(__dirname, "..", "models", "User.js"), fakeUser);

const { sendPushNotification, sendToMany } = require("./notificationService");

const fcmError = (code) => Object.assign(new Error(code), { code });

beforeEach(() => {
    calls.send.length = 0;
    calls.multicast.length = 0;
    calls.update.length = 0;
    sendImpl = async () => "msg-id";
    multicastImpl = async ({ tokens }) => ({
        successCount: tokens.length,
        failureCount: 0,
        responses: tokens.map(() => ({ success: true })),
    });
});

test("sendPushNotification returns true on success", async () => {
    assert.equal(await sendPushNotification("tok", "T", "B"), true);
    assert.deepEqual(calls.send[0], { notification: { title: "T", body: "B" }, token: "tok" });
});

test("sendPushNotification returns false instead of throwing, and clears a dead token", async () => {
    sendImpl = async () => { throw fcmError("messaging/registration-token-not-registered"); };
    assert.equal(await sendPushNotification("dead", "T", "B"), false);
    assert.equal(calls.update.length, 1);
    assert.deepEqual(calls.update[0].values, { fcm_token: null });
    assert.deepEqual(calls.update[0].opts.where.fcm_token[Op.in], ["dead"]);
});

test("sendPushNotification keeps the token on transient errors", async () => {
    sendImpl = async () => { throw fcmError("messaging/internal-error"); };
    assert.equal(await sendPushNotification("tok", "T", "B"), false);
    assert.equal(calls.update.length, 0);
});

test("sendToMany sends in batches of 500", async () => {
    const tokens = Array.from({ length: 1201 }, (_, i) => `t${i}`);
    const result = await sendToMany(tokens, "T", "B");
    assert.deepEqual(calls.multicast.map((m) => m.tokens.length), [500, 500, 201]);
    assert.deepEqual(result, { sent: 1201, failed: 0 });
    assert.deepEqual(calls.multicast[0].notification, { title: "T", body: "B" });
});

test("sendToMany clears only dead tokens", async () => {
    multicastImpl = async ({ tokens }) => ({
        successCount: 1,
        failureCount: 2,
        responses: [
            { success: true },
            { success: false, error: fcmError("messaging/invalid-registration-token") },
            { success: false, error: fcmError("messaging/internal-error") },
        ].slice(0, tokens.length),
    });
    const result = await sendToMany(["ok", "dead", "flaky"], "T", "B");
    assert.deepEqual(result, { sent: 1, failed: 2 });
    assert.deepEqual(calls.update[0].opts.where.fcm_token[Op.in], ["dead"]);
});

test("sendToMany counts a failed batch and continues", async () => {
    let n = 0;
    multicastImpl = async ({ tokens }) => {
        if (n++ === 0) throw new Error("network");
        return { successCount: tokens.length, failureCount: 0, responses: tokens.map(() => ({ success: true })) };
    };
    const tokens = Array.from({ length: 600 }, (_, i) => `t${i}`);
    assert.deepEqual(await sendToMany(tokens, "T", "B"), { sent: 100, failed: 500 });
});

test("sendToMany with no tokens does nothing", async () => {
    assert.deepEqual(await sendToMany([], "T", "B"), { sent: 0, failed: 0 });
    assert.equal(calls.multicast.length, 0);
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd apps/user-service && npm test`
Expected: FAIL — `sendToMany is not a function` and `sendPushNotification` tests fail (current version throws and loads a key file at require time).

- [ ] **Step 4: Replace `apps/user-service/src/services/notificationService.js`** with:

```js
const admin = require("firebase-admin");
const path = require("path");
const { Op } = require("sequelize");
const User = require("../models/User");

const FCM_BATCH_LIMIT = 500;
const DEAD_TOKEN_CODES = new Set([
    "messaging/registration-token-not-registered",
    "messaging/invalid-registration-token",
]);

let messaging;
function getMessaging() {
    if (!messaging) {
        if (!admin.apps.length) {
            // process.cwd() is /app inside the container
            const keyPath = path.join(process.cwd(), "secrets", "rc-notification-52917-firebase-adminsdk-fbsvc-d9174cc5ec.json");
            admin.initializeApp({ credential: admin.credential.cert(require(keyPath)) });
        }
        messaging = admin.messaging();
    }
    return messaging;
}

async function clearTokens(tokens) {
    if (!tokens.length) return;
    try {
        await User.update({ fcm_token: null }, { where: { fcm_token: { [Op.in]: tokens } } });
    } catch (error) {
        console.log("error clearing dead fcm tokens", error);
    }
}

// Never throws: callers have usually already committed a DB change.
const sendPushNotification = async (fcm_token, title, message) => {
    try {
        await getMessaging().send({ notification: { title, body: message }, token: fcm_token });
        return true;
    } catch (error) {
        console.log("error sending push notification", error);
        if (DEAD_TOKEN_CODES.has(error.code)) await clearTokens([fcm_token]);
        return false;
    }
};

const sendToMany = async (tokens, title, message) => {
    let sent = 0;
    let failed = 0;
    for (let i = 0; i < tokens.length; i += FCM_BATCH_LIMIT) {
        const batch = tokens.slice(i, i + FCM_BATCH_LIMIT);
        try {
            const res = await getMessaging().sendEachForMulticast({ notification: { title, body: message }, tokens: batch });
            sent += res.successCount;
            failed += res.failureCount;
            await clearTokens(batch.filter((_, j) => DEAD_TOKEN_CODES.has(res.responses[j].error?.code)));
        } catch (error) {
            console.log("error sending multicast batch", error);
            failed += batch.length;
        }
    }
    return { sent, failed };
};

module.exports = { sendPushNotification, sendToMany };
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd apps/user-service && npm test`
Expected: 7 tests pass, 0 fail.

- [ ] **Step 6: Commit**

```bash
git add apps/user-service/src/services/notificationService.js apps/user-service/src/services/notificationService.test.js apps/user-service/package.json
git commit -m "feat(user-service): non-throwing push, multicast sends and dead-token pruning"
```

---

### Task 2: Internal notify endpoint (user-service)

**Files:**
- Create: `apps/user-service/src/controllers/internal.controller.js`
- Create: `apps/user-service/src/routes/internal.routes.js`
- Modify: `apps/user-service/index.js`

**Interfaces:**
- Consumes: `sendPushNotification` from Task 1.
- Produces: `POST /api/internal/notify` — header `X-Internal-Key: $INTERNAL_API_KEY`, body `{ user_id: string, title: string, body: string }` → `200 { sent: boolean }` | `400` | `403` | `404` | `503` (key not configured). Used by Task 5.

- [ ] **Step 1: Create `apps/user-service/src/controllers/internal.controller.js`**

```js
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
```

- [ ] **Step 2: Create `apps/user-service/src/routes/internal.routes.js`**

```js
const express = require('express');
const { notifyUser } = require('../controllers/internal.controller');
const { internalAuthMiddleware } = require('../middlewares/internalAuthMiddleware');

const router = express.Router();
router.use(internalAuthMiddleware);

router.post('/notify', notifyUser);

module.exports = router;
```

- [ ] **Step 3: Mount it in `apps/user-service/index.js`** — add the require next to the others:

```js
const internalRoutes = require("./src/routes/internal.routes");
```

and after the existing `app.use("/api/internal/analytics", internalAnalyticsRoutes);` line:

```js
// Internal service-to-service actions (push notify)
app.use("/api/internal", internalRoutes);
```

- [ ] **Step 4: Verify** (containers running: `docker compose -f docker/docker-compose.yml up -d`)

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:4001/api/internal/notify -H 'Content-Type: application/json' -d '{"user_id":"x","title":"t","body":"b"}'
# Expected: 403
curl -s -X POST localhost:4001/api/internal/notify -H 'Content-Type: application/json' -H 'X-Internal-Key: internal-dev-key' -d '{"user_id":"does-not-exist","title":"t","body":"b"}'
# Expected: {"message":"User not found"}
curl -s -X POST localhost:4001/api/internal/notify -H 'Content-Type: application/json' -H 'X-Internal-Key: internal-dev-key' -d '{"title":"t"}'
# Expected: {"message":"user_id, title and body are required"}
curl -s localhost:4001/api/internal/analytics/blocked-users-count -H 'X-Internal-Key: internal-dev-key'
# Expected: still works (existing analytics mount unaffected)
```

- [ ] **Step 5: Commit**

```bash
git add apps/user-service/src/controllers/internal.controller.js apps/user-service/src/routes/internal.routes.js apps/user-service/index.js
git commit -m "feat(user-service): internal push notify endpoint"
```

---

### Task 3: Notices (user-service)

**Files:**
- Create: `scripts/sql/2026-09-26-notices.sql`
- Create: `apps/user-service/src/models/Notice.js`
- Create: `apps/user-service/src/controllers/notice.controller.js`
- Create: `apps/user-service/src/routes/notice.routes.js`
- Modify: `apps/user-service/index.js`

**Interfaces:**
- Consumes: `sendToMany` from Task 1.
- Produces: `POST /api/users/notices` (admin) `{ title, body, area_id? }` → `201 { notice, push: { sent, failed } }`; `GET /api/users/notices?limit&offset` → `{ notices, total, limit, offset }`; `DELETE /api/users/notices/:id` (admin).

- [ ] **Step 1: Create `scripts/sql/2026-09-26-notices.sql`**

```sql
CREATE TABLE IF NOT EXISTS `notices` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `body` text NOT NULL,
  `area_id` bigint DEFAULT NULL,
  `created_by` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notices_area_id` (`area_id`),
  CONSTRAINT `fk_notices_area` FOREIGN KEY (`area_id`) REFERENCES `areas` (`area_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

- [ ] **Step 2: Apply it and verify**

```bash
docker exec -i mysql_db mysql -uroot -proot rc < scripts/sql/2026-09-26-notices.sql
docker exec mysql_db mysql -uroot -proot rc -e "DESCRIBE notices;"
```
Expected: 7 columns listed.

- [ ] **Step 3: Create `apps/user-service/src/models/Notice.js`**

```js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// area_id NULL = visible to all customers
const Notice = sequelize.define("Notice", {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING(150), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    area_id: { type: DataTypes.BIGINT, allowNull: true },
    created_by: { type: DataTypes.STRING, allowNull: false },
}, {
    tableName: "notices",
    timestamps: true,
    underscored: true,
});

module.exports = Notice;
```

- [ ] **Step 4: Create `apps/user-service/src/controllers/notice.controller.js`**

```js
const { Op } = require('sequelize');
const Notice = require('../models/Notice');
const User = require('../models/User');
const { sendToMany } = require('../services/notificationService');

const ADMIN_ROLES = ['admin', 'super_admin'];

exports.createNotice = async (req, res) => {
  const title = req.body.title?.trim();
  const body = req.body.body?.trim();
  const area_id = req.body.area_id ?? null;

  if (!title || !body) {
    return res.status(400).json({ message: 'title and body are required' });
  }
  if (title.length > 150) {
    return res.status(400).json({ message: 'title must be 150 characters or less' });
  }

  try {
    // Save first: if the push fails, the notice is still listed in the app.
    const notice = await Notice.create({ title, body, area_id, created_by: req.user.id });

    const where = { role: 'customer', customer_status: 'accepted', fcm_token: { [Op.ne]: null } };
    if (area_id) where.area_id = area_id;
    const recipients = await User.findAll({ where, attributes: ['fcm_token'] });
    const push = await sendToMany(recipients.map((u) => u.fcm_token), title, body);

    res.status(201).json({ notice, push });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ message: 'Unknown area_id' });
    }
    console.error('Error creating notice:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listNotices = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

  // req.user is loaded from the DB by authMiddleware, so area_id is current.
  const where = ADMIN_ROLES.includes(req.user.role)
    ? {}
    : { [Op.or]: [{ area_id: null }, { area_id: req.user.area_id }] };

  try {
    const { rows, count } = await Notice.findAndCountAll({ where, order: [['id', 'DESC']], limit, offset });
    res.json({ notices: rows, total: count, limit, offset });
  } catch (error) {
    console.error('Error listing notices:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteNotice = async (req, res) => {
  try {
    const deleted = await Notice.destroy({ where: { id: req.params.id } });
    if (!deleted) {
      return res.status(404).json({ message: 'Notice not found' });
    }
    res.json({ message: 'Notice deleted' });
  } catch (error) {
    console.error('Error deleting notice:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
```

- [ ] **Step 5: Create `apps/user-service/src/routes/notice.routes.js`**

```js
const express = require('express');
const { createNotice, listNotices, deleteNotice } = require('../controllers/notice.controller');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

const router = express.Router();
const adminOnly = checkRole(['admin', 'super_admin']);

router.use(authMiddleware);

router.get('/', listNotices);
router.post('/', adminOnly, createNotice);
router.delete('/:id', adminOnly, deleteNotice);

module.exports = router;
```

- [ ] **Step 6: Mount in `apps/user-service/index.js` BEFORE the auth/user routers** — `user.routes.js` has `GET /:userId`, which would otherwise catch `GET /api/users/notices`. Add the require:

```js
const noticeRoutes = require("./src/routes/notice.routes");
```

and insert directly above `// Authentication routes (login, forgot-password, reset-password)`:

```js
// Notices — must be mounted before userRoutes (its GET /:userId would swallow /notices)
app.use("/api/users/notices", noticeRoutes);

```

- [ ] **Step 7: Verify** — get tokens by logging in (`POST localhost:4001/api/users/login` with `{ "email", "password" }`; use `access_token` from the response). Set `ADMIN_TOKEN`, `CUSTOMER_TOKEN` and the customer's `AREA_ID`, then:

```bash
curl -s -X POST localhost:4001/api/users/notices -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' -d '{"title":"Kitchen closed","body":"No dinner on Friday"}'
# Expected: 201 {"notice":{...,"area_id":null},"push":{"sent":N,"failed":M}}
curl -s -X POST localhost:4001/api/users/notices -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' -d "{\"title\":\"Area delay\",\"body\":\"30 min late\",\"area_id\":$AREA_ID}"
# Expected: 201, area_id set
curl -s -X POST localhost:4001/api/users/notices -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' -d '{"title":"x","body":"y","area_id":999999}'
# Expected: 400 {"message":"Unknown area_id"}
curl -s -X POST localhost:4001/api/users/notices -H "Authorization: Bearer $CUSTOMER_TOKEN" -H 'Content-Type: application/json' -d '{"title":"x","body":"y"}'
# Expected: 403
curl -s "localhost:4001/api/users/notices?limit=5" -H "Authorization: Bearer $CUSTOMER_TOKEN"
# Expected: both notices above (global + own area), newest first
```

- [ ] **Step 8: Commit**

```bash
git add scripts/sql/2026-09-26-notices.sql apps/user-service/src/models/Notice.js apps/user-service/src/controllers/notice.controller.js apps/user-service/src/routes/notice.routes.js apps/user-service/index.js
git commit -m "feat(user-service): admin notices with area targeting and push fan-out"
```

---

### Task 4: Order status transition rules (order-service, pure logic + schema)

**Files:**
- Create: `scripts/sql/2026-09-26-order-delivery-failed.sql`
- Modify: `apps/order-service/src/models/Order.model.js` (status enum, new column)
- Create: `apps/order-service/src/utils/orderStatus.js`
- Create: `apps/order-service/src/utils/orderStatus.test.js`
- Modify: `apps/order-service/package.json` (scripts)

**Interfaces:**
- Produces:
  - `checkTransition(from: string, to: string, role: string, failureReason?: string): null | { code: 400|403|409, message: string, from?: string, to?: string, allowed?: string[] }` — `null` means allowed.
  - `pushMessageFor(order: { id, meal_time, status, failure_reason }): { title: string, body: string } | null`

- [ ] **Step 1: Create `scripts/sql/2026-09-26-order-delivery-failed.sql`**

```sql
ALTER TABLE `orders`
  MODIFY `status` enum('pending','preparing','delivering','delivered','completed','cancelled','delivery_failed') NOT NULL DEFAULT 'pending',
  ADD COLUMN `failure_reason` text NULL AFTER `status`;
```

- [ ] **Step 2: Apply and verify**

```bash
docker exec -i mysql_db mysql -uroot -proot rc < scripts/sql/2026-09-26-order-delivery-failed.sql
docker exec mysql_db mysql -uroot -proot rc -e "SHOW COLUMNS FROM orders LIKE 'status'; SHOW COLUMNS FROM orders LIKE 'failure_reason';"
```
Expected: enum includes `delivery_failed`; `failure_reason` is `text`, nullable.

- [ ] **Step 3: Update `apps/order-service/src/models/Order.model.js`** — replace the `status` attribute with:

```js
      status: {
        type: DataTypes.ENUM(
          'pending',
          'preparing',
          'delivering',
          'delivered',
          'completed',
          'cancelled',
          'delivery_failed'
        ),
        defaultValue: 'pending',
        allowNull: false,
      },
      failure_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Set when status is delivery_failed',
      },
```

- [ ] **Step 4: Set the test script** — in `apps/order-service/package.json` replace the `"test"` script:

```json
    "test": "node --test"
```

- [ ] **Step 5: Write the failing tests** — create `apps/order-service/src/utils/orderStatus.test.js`:

```js
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
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `cd apps/order-service && npm test`
Expected: FAIL — `Cannot find module './orderStatus'`.

- [ ] **Step 7: Create `apps/order-service/src/utils/orderStatus.js`**

```js
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
  if (to === 'delivery_failed' && !failureReason?.trim()) {
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
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `cd apps/order-service && npm test`
Expected: 8 tests pass, 0 fail.

- [ ] **Step 9: Commit**

```bash
git add scripts/sql/2026-09-26-order-delivery-failed.sql apps/order-service/src/models/Order.model.js apps/order-service/src/utils/orderStatus.js apps/order-service/src/utils/orderStatus.test.js apps/order-service/package.json
git commit -m "feat(order-service): order status transition rules and delivery_failed status"
```

---

### Task 5: Status endpoint + push trigger (order-service)

**Files:**
- Modify: `apps/order-service/src/services/userServiceClient.js` (add method before the closing `}` of the class)
- Modify: `apps/order-service/src/controllers/order.controller.js` (new require + new handler at end of file)
- Modify: `apps/order-service/src/routes/order.routes.js`

**Interfaces:**
- Consumes: `checkTransition`, `pushMessageFor` (Task 4); `POST /api/internal/notify` (Task 2).
- Produces: `PUT /api/orders/:order_id/status` `{ status, failure_reason? }` → `200 { message, order_id, status, failure_reason }` | `400` | `403` | `404` | `409 { message, from, to, allowed }`. Used by Task 6.

- [ ] **Step 1: Add `notifyUser` to `apps/order-service/src/services/userServiceClient.js`**, after `getUserById` inside the class:

```js
  /**
   * Ask user-service to push a notification to a user (internal call)
   * @param {string} userId - User ID
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @returns {Promise<Object>} { sent: boolean }
   */
  async notifyUser(userId, title, body) {
    return this.makeRequest('/api/internal/notify', 'POST', { user_id: userId, title, body }, {
      'X-Internal-Key': process.env.INTERNAL_API_KEY,
    });
  }
```

- [ ] **Step 2: Add the handler to `apps/order-service/src/controllers/order.controller.js`** — add to the requires at the top:

```js
const { checkTransition, pushMessageFor } = require('../utils/orderStatus');
```

and append after `exports.updatePaymentStatus`:

```js
exports.updateOrderStatus = async (req, res) => {
  const { order_id } = req.params;
  const { status, failure_reason } = req.body;

  try {
    const order = await Order.findByPk(order_id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const rejection = checkTransition(order.status, status, req.user.role, failure_reason);
    if (rejection) {
      const { code, ...body } = rejection;
      return res.status(code).json(body);
    }

    const changes = { status };
    if (status === 'delivery_failed') changes.failure_reason = failure_reason.trim();
    await order.update(changes);

    // Fire-and-forget: a push failure must not fail the status change.
    const push = pushMessageFor(order);
    if (push) {
      userServiceClient
        .notifyUser(order.customer_id, push.title, push.body)
        .catch((error) => console.error(`Push for order ${order_id} failed:`, error.message));
    }

    res.status(200).json({
      message: 'Order status updated successfully',
      order_id,
      status,
      failure_reason: changes.failure_reason ?? null,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
```

- [ ] **Step 3: Add the route in `apps/order-service/src/routes/order.routes.js`** — add `updateOrderStatus` to the destructured require from `../controllers/order.controller`, then below the payment route:

```js
router.put('/:order_id/status', checkRole(['delivery_person', 'admin', 'super_admin']), updateOrderStatus);
```

- [ ] **Step 4: Verify** — pick a `pending` order: `docker exec mysql_db mysql -uroot -proot rc -e "SELECT id, customer_id, status FROM orders WHERE status='pending' LIMIT 1;"` → set `ORDER_ID`. With `ADMIN_TOKEN` and `DELIVERY_TOKEN` (login as a delivery person):

```bash
S=localhost:4002/api/orders/$ORDER_ID/status
curl -s -X PUT $S -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' -d '{"status":"delivered"}'
# Expected: 409 {"message":"Cannot change status from pending to delivered",...,"allowed":["preparing","cancelled"]}
curl -s -X PUT $S -H "Authorization: Bearer $DELIVERY_TOKEN" -H 'Content-Type: application/json' -d '{"status":"cancelled"}'
# Expected: 403
curl -s -X PUT $S -H "Authorization: Bearer $DELIVERY_TOKEN" -H 'Content-Type: application/json' -d '{"status":"preparing"}'
# Expected: 200 {"status":"preparing",...}
docker exec mysql_db mysql -uroot -proot rc -e "SELECT id, status FROM orders WHERE id='$ORDER_ID';"
# Expected: same id, status = preparing (confirms the row was updated in place)
docker logs --tail 20 user-service
# Expected: a POST /api/internal/notify 200 line from morgan
```

- [ ] **Step 5: Commit**

```bash
git add apps/order-service/src/services/userServiceClient.js apps/order-service/src/controllers/order.controller.js apps/order-service/src/routes/order.routes.js
git commit -m "feat(order-service): order status endpoint with customer push notifications"
```

---

### Task 6: Delivery-service status proxy

**Files:**
- Modify: `apps/delivery-service/src/services/orderServiceClient.js`
- Modify: `apps/delivery-service/src/controllers/delivery.controller.js`
- Modify: `apps/delivery-service/src/routes/delivery.routes.js`

**Interfaces:**
- Consumes: `PUT /api/orders/:order_id/status` (Task 5).
- Produces: `PUT /api/delivery/orders/:order_id/status` — same body and status codes as order-service (4xx forwarded, not turned into 500).

- [ ] **Step 1: Make an explicit auth header win in `makeRequest`** — `orderServiceClient` is a shared singleton and `setAuthHeader` stores the last request's token on it, which would override the header we pass explicitly. In `apps/delivery-service/src/services/orderServiceClient.js` change:

```js
    if (this.authHeader) {
      headers['Authorization'] = this.authHeader;
    }
```

to:

```js
    if (this.authHeader && !headers['Authorization']) {
      headers['Authorization'] = this.authHeader;
    }
```

- [ ] **Step 2: Add the client method** after `updatePaymentStatus` in the same class:

```js
  /**
   * Update delivery status of an order
   * @param {string} orderId - Order ID
   * @param {string} status - New order status
   * @param {string} failureReason - Required when status is delivery_failed
   * @param {string} authHeader - Caller's Authorization header (forwarded)
   * @returns {Promise<Object>} Update response
   */
  async updateOrderStatus(orderId, status, failureReason, authHeader) {
    return this.makeRequest(
      `/api/orders/${orderId}/status`,
      'PUT',
      { status, failure_reason: failureReason },
      { Authorization: authHeader }
    );
  }
```

- [ ] **Step 3: Add the controller** — append to `apps/delivery-service/src/controllers/delivery.controller.js`:

```js
/**
 * Update order status (proxied to order-service, which validates and sends the push)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateOrderStatus = async (req, res) => {
  const { order_id } = req.params;
  const { status, failure_reason } = req.body;

  try {
    const result = await orderServiceClient.updateOrderStatus(order_id, status, failure_reason, req.header('Authorization'));
    res.status(200).json(result);
  } catch (error) {
    // makeRequest rejects with "HTTP <code>: <message>"; forward order-service's 4xx as-is
    const code = Number(error.message.match(/^HTTP (\d{3})/)?.[1]) || 500;
    res.status(code).json({ message: error.message });
  }
};
```

- [ ] **Step 4: Add the route** — in `apps/delivery-service/src/routes/delivery.routes.js`, add `updateOrderStatus` to the destructured require, then below the payment route:

```js
// Update delivery status of an order (preparing / delivering / delivered / delivery_failed)
router.put('/orders/:order_id/status', checkRole(['delivery_person', 'admin', 'super_admin']), updateOrderStatus);
```

- [ ] **Step 5: Verify** — delivery routes are mounted at `/api/delivery` (`apps/delivery-service/index.js`). Using the order from Task 5 (now `preparing`):

```bash
D=localhost:4003/api/delivery/orders/$ORDER_ID/status
curl -s -w "\n%{http_code}\n" -X PUT $D -H "Authorization: Bearer $DELIVERY_TOKEN" -H 'Content-Type: application/json' -d '{"status":"delivered"}'
# Expected: 409 (forwarded, not 500)
curl -s -X PUT $D -H "Authorization: Bearer $DELIVERY_TOKEN" -H 'Content-Type: application/json' -d '{"status":"delivering"}'
# Expected: 200
curl -s -w "\n%{http_code}\n" -X PUT $D -H "Authorization: Bearer $DELIVERY_TOKEN" -H 'Content-Type: application/json' -d '{"status":"delivery_failed"}'
# Expected: 400 failure_reason is required
curl -s -X PUT $D -H "Authorization: Bearer $DELIVERY_TOKEN" -H 'Content-Type: application/json' -d '{"status":"delivery_failed","failure_reason":"Customer unreachable"}'
# Expected: 200, failure_reason echoed
```

- [ ] **Step 6: Commit**

```bash
git add apps/delivery-service/src/services/orderServiceClient.js apps/delivery-service/src/controllers/delivery.controller.js apps/delivery-service/src/routes/delivery.routes.js
git commit -m "feat(delivery-service): proxy order status updates to order-service"
```

---

### Task 7: End-to-end smoke script

**Files:**
- Create: `scripts/notifications-smoke.sh`

**Interfaces:**
- Consumes: all endpoints from Tasks 2–6.

- [ ] **Step 1: Create `scripts/notifications-smoke.sh`**

```bash
#!/usr/bin/env bash
# End-to-end check for notices + order status pushes.
# Usage: ADMIN_TOKEN=.. DELIVERY_TOKEN=.. CUSTOMER_TOKEN=.. ORDER_ID=<a pending order> scripts/notifications-smoke.sh
set -u
: "${ADMIN_TOKEN:?}" "${DELIVERY_TOKEN:?}" "${CUSTOMER_TOKEN:?}" "${ORDER_ID:?}"
USER_API=${USER_API:-http://localhost:4001}
ORDER_API=${ORDER_API:-http://localhost:4002}
DELIVERY_API=${DELIVERY_API:-http://localhost:4003/api/delivery}
fails=0

check() { # name expected_code method url token [json]
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -X "$3" "$4" -H "Authorization: Bearer $5" -H 'Content-Type: application/json' ${6:+-d "$6"})
  if [ "$code" = "$2" ]; then echo "ok   $1"; else echo "FAIL $1 (expected $2, got $code)"; fails=$((fails+1)); fi
}

check "internal notify rejects missing key" 403 POST "$USER_API/api/internal/notify" "" '{"user_id":"x","title":"t","body":"b"}'
check "admin creates global notice"         201 POST "$USER_API/api/users/notices" "$ADMIN_TOKEN" '{"title":"Smoke test","body":"Ignore this notice"}'
check "customer cannot create notice"       403 POST "$USER_API/api/users/notices" "$CUSTOMER_TOKEN" '{"title":"x","body":"y"}'
check "customer lists notices"              200 GET  "$USER_API/api/users/notices" "$CUSTOMER_TOKEN"
check "illegal jump is rejected"            409 PUT  "$ORDER_API/api/orders/$ORDER_ID/status" "$ADMIN_TOKEN" '{"status":"delivered"}'
check "delivery person cannot cancel"       403 PUT  "$ORDER_API/api/orders/$ORDER_ID/status" "$DELIVERY_TOKEN" '{"status":"cancelled"}'
check "pending -> preparing"                200 PUT  "$ORDER_API/api/orders/$ORDER_ID/status" "$DELIVERY_TOKEN" '{"status":"preparing"}'
check "preparing -> delivering (proxy)"     200 PUT  "$DELIVERY_API/orders/$ORDER_ID/status" "$DELIVERY_TOKEN" '{"status":"delivering"}'
check "delivery_failed needs reason"        400 PUT  "$DELIVERY_API/orders/$ORDER_ID/status" "$DELIVERY_TOKEN" '{"status":"delivery_failed"}'
check "delivering -> delivery_failed"       200 PUT  "$DELIVERY_API/orders/$ORDER_ID/status" "$DELIVERY_TOKEN" '{"status":"delivery_failed","failure_reason":"Customer unreachable"}'

echo "$fails failure(s)"
exit $fails
```

- [ ] **Step 2: Run it** against a fresh `pending` order (the one from Tasks 5–6 is now `delivery_failed`):

Run: `bash scripts/notifications-smoke.sh` with the four env vars set.
Expected: 10 `ok` lines, `0 failure(s)`, exit code 0. Also run both unit suites: `(cd apps/user-service && npm test) && (cd apps/order-service && npm test)` → all pass.

- [ ] **Step 3: Commit**

```bash
git add scripts/notifications-smoke.sh
git commit -m "test: add notifications end-to-end smoke script"
```
