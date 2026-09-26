# Notifications — Design

Date: 2026-09-26
Status: Approved in brainstorming, pending spec review

## Goal

Cover the spec's notification requirements:

- Customers receive push notifications about delivery status (`Meal Order and Delivery Platform.md` → Notifications).
- Admins publish "important notices"; customers receive them (same file, customer + admin sections).

Out of scope for this spec: unpaid-order bulk notify (`Admin - Requirements.md` §Unpaid orders) — it will reuse the pieces built here in a follow-up.

## Decisions

| Topic | Decision | Why |
|---|---|---|
| Persistence | **Notices stored + pushed; order-status pushes fire-and-forget** | Order status already lives in `orders.status`, so a missed push loses nothing. A notice has no other home, so it must be stored. Same split as Uber Eats-style apps. |
| Notice audience | All accepted customers, **or** one `area_id` | Delays/closures are usually local; `users.area_id` already exists. |
| Cross-service push | order-service → user-service **internal HTTP** (`X-Internal-Key`) | Reuses the existing internal-API pattern (analytics). FCM credentials + `fcm_token` stay in user-service only. |
| Fan-out | `sendEachForMulticast`, chunks of 500 tokens | FCM limit. FCM topics rejected: would need per-area topic (un)subscribes on login/area change. |
| Unreachable customer | New status `delivery_failed` + `failure_reason`; payment stays unpaid | Industry standard: failed delivery ≠ cancellation; customer still owes. Existing unpaid-orders blocking rule then applies with no new code. |
| Cancel | Admin-only | Couriers get a narrow, logged action (`delivery_failed`), not cancel power. |

## Part 1 — Notices (user-service)

### Table `notices`

Schema is managed via SQL (no `sequelize.sync`, no migrations), so ship a `CREATE TABLE` script under `scripts/`.

| column | type | notes |
|---|---|---|
| `id` | BIGINT AUTO_INCREMENT PK | client stores "last seen id" for an unread badge |
| `title` | VARCHAR(150) NOT NULL | |
| `body` | TEXT NOT NULL | |
| `area_id` | BIGINT NULL, FK `areas.area_id` | `NULL` = all customers |
| `created_by` | CHAR(36) NOT NULL | admin user id (UUID) |
| `created_at`, `updated_at` | DATETIME | Sequelize `timestamps: true, underscored: true`, like `User` |

Model: `apps/user-service/src/models/Notice.js`.

### Endpoints — mounted at `/api/users/notices`

| Method | Path | Auth | Behaviour |
|---|---|---|---|
| POST | `/` | `checkRole(['admin','super_admin'])` | Validate `title`, `body` (required, trimmed, title ≤150); optional `area_id`. Save, then push to `role='customer' AND customer_status='accepted' AND fcm_token IS NOT NULL [AND area_id=?]`. Respond `201 { notice, push: { sent, failed } }`. |
| GET | `/` | any authenticated | Customer: `area_id IS NULL OR area_id = <customer's users.area_id>` (read from DB by `req.user.id`, not the JWT — the token may be stale after an area change). Admin/super_admin: all. Newest first. `?limit` (default 20, max 100), `?offset`. |
| DELETE | `/:id` | admin/super_admin | Hard delete. `404` if missing. |

Not included: edit, scheduling, per-user read tracking.

### `notificationService.js` changes

- `sendPushNotification(token, title, body)` **no longer throws**: logs and returns `false` on failure, `true` on success. On `messaging/registration-token-not-registered` it clears that user's `fcm_token`.
  - Fixes an existing bug: `user.controller.js` and `customer.controller.js` approval flows `await` it after `customer.save()`; a stale token currently throws → 500 and the approval email is never sent.
- New `sendToMany(tokens, title, body)` → `{ sent, failed }`. Chunks of 500 via `admin.messaging().sendEachForMulticast`; tokens that fail with `registration-token-not-registered` / `invalid-registration-token` are set to `NULL` in `users`.

## Part 2 — Order-status changes + push

### Status model (order-service)

- Add `delivery_failed` to `orders.status` ENUM; add `failure_reason` TEXT NULL. Ship an `ALTER TABLE` script under `scripts/`; update `Order.model.js`.
- Transition map (pure module, e.g. `src/utils/orderStatus.js`):

| from | to | roles | extra |
|---|---|---|---|
| pending | preparing | admin, super_admin, delivery_person | |
| preparing | delivering | admin, super_admin, delivery_person | |
| delivering | delivered | admin, super_admin, delivery_person | |
| delivering | delivery_failed | admin, super_admin, delivery_person | `failure_reason` required |
| pending, preparing | cancelled | admin, super_admin | |

`completed` is not set manually — existing semantics (delivered + paid, `order.controller.js` ~L605) are unchanged.

### Endpoints

- **order-service** `PUT /api/orders/:order_id/status` `{ status, failure_reason? }` — roles `delivery_person`, `admin`, `super_admin`. Validates via the transition map, saves, then triggers the push. Responses: `200` updated order; `400` missing reason / unknown status; `403` role not allowed for that transition; `404` order; `409 { from, to, allowed }` illegal transition.
- **delivery-service** `PUT /orders/:order_id/status` — proxy to order-service, copy of the existing `updatePaymentStatus` proxy (`orderServiceClient`).

### Push trigger

After a successful save, order-service calls `notifyUser(order.customer_id, title, body)` — new `src/services/userServiceClient.js` — **not awaited**; errors are logged only.

| status | title | body |
|---|---|---|
| preparing | Order update | Your {meal_time} order is being prepared |
| delivering | Order update | Your order is on the way |
| delivered | Order delivered | Your order has been delivered |
| delivery_failed | Delivery failed | We couldn't deliver your order: {failure_reason} |
| cancelled | Order cancelled | Your order {id} was cancelled |

### Internal notify endpoint (user-service)

- New router mounted at `/api/internal` behind the existing `internalAuthMiddleware`: `POST /notify { user_id, title, body }`.
- Looks up user; `404` if missing; `204` if no `fcm_token`; otherwise `sendPushNotification` → `204`.

### Config

- user-service: `INTERNAL_API_KEY` (must match order-service).
- order-service: `USER_SERVICE_URL`, `INTERNAL_API_KEY`.
- Add both to docker env files / compose.

## Error handling

| Failure | Behaviour |
|---|---|
| FCM / user-service down during status change | Status saved; push error logged; API returns 200. |
| Illegal transition | 409, nothing saved, no push. |
| Notice push partially fails | Notice saved; `{ sent, failed }` reported; dead tokens nulled. |
| Missing `INTERNAL_API_KEY` | Existing middleware → 503. |

## Testing

No test framework is set up in these services; use Node's built-in `node:test` (zero deps).

- `apps/order-service/src/utils/orderStatus.test.js` — every allowed transition passes; forbidden ones rejected; role checks; `delivery_failed` requires reason.
- `apps/user-service/src/services/notificationService.test.js` — chunking at 500; dead-token pruning; `sendPushNotification` returns `false` instead of throwing (stub `firebase-admin` messaging + `User.update`).
- `scripts/notifications-smoke.sh` — curl: create notice (all + area), list as customer, walk an order through statuses incl. an illegal move, hit `/api/internal/notify` without key → 403.

## Follow-ups (not in this spec)

- Unpaid-order bulk notify (admin) — reuse `sendToMany`.
- Multiple devices per user (`device_tokens` table) — currently one `fcm_token` per user; last login wins.
- Delivery wait timer / contact-attempt log — add if failed-delivery disputes appear.
- Bulk status updates per area.
