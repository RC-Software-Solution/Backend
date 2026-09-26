# Notifications

Push notifications for customers, sent through Firebase Cloud Messaging (FCM) with `firebase-admin` in user-service.

| Feature | What happens | Stored? |
|---|---|---|
| **Important notices** | Admin posts a notice → pushed to all accepted customers, or to one area | Yes — `notices` table, listed in the app |
| **Order status** | Delivery person / admin moves an order forward → the order's customer gets a push | No — push only; the app reads the status from the order |
| **Failed delivery** | Delivery person marks an order `delivery_failed` with a reason → customer gets a push, payment becomes `unpaid` | Status + reason on the order |

Design: [superpowers/specs/2026-09-26-notifications-design.md](superpowers/specs/2026-09-26-notifications-design.md)

---

## 1. How it fits together

```
Admin ── POST /api/users/notices ──► user-service ──► notices table
                                          │
                                          └─► FCM (batches of 500) ──► customer phones

Delivery app ── PUT /api/delivery/orders/:id/status ──► delivery-service
                                                             │ (forwards the same request)
Admin ────────── PUT /api/orders/:id/status ─────────► order-service ──► orders table
                                                             │ (not awaited)
                                                             └─► user-service POST /api/internal/notify
                                                                        └─► FCM ──► customer phone
```

- A phone receives pushes only if the app sent its **FCM token** when logging in (`fcm_token` in the login body). It is stored in `users.fcm_token`. One token per user: the latest login wins.
- Push failures never fail an API request. Tokens that FCM reports as dead are set to `NULL` automatically.
- Only customers with `customer_status = 'accepted'`, `status = 'active'` and a token receive notices.

---

## 2. Setup (once per database)

Run from the repo root, with Docker running (`docker compose -f docker/docker-compose.yml up -d`):

```bash
# Only if orders.target_date is missing (check: SHOW COLUMNS FROM orders LIKE 'target_date';)
docker exec -i mysql_db mysql -uroot -proot rc < apps/order-service/add_target_date_migration.sql

# New for notifications — run each once (the second one fails if run twice)
docker exec -i mysql_db mysql -uroot -proot rc < scripts/sql/2026-09-26-notices.sql
docker exec -i mysql_db mysql -uroot -proot rc < scripts/sql/2026-09-26-order-delivery-failed.sql
```

Deploying: run the SQL **before** starting the new order-service code, or every order read fails.

Config (already in `docker/docker-compose.yml`, no changes needed locally):

| Variable | Service | Purpose |
|---|---|---|
| `INTERNAL_API_KEY` | user-service, order-service | Shared secret for `/api/internal/*`. Defaults to `internal-dev-key`. **Set a real value in production.** |
| `USER_SERVICE_HOST` | order-service | Where order-service reaches user-service |
| Firebase service account JSON | user-service | Mounted at `/app/secrets/rc-notification-52917-firebase-adminsdk-…json` |

---

## 3. API reference

Ports: user-service **4001**, order-service **4002**, delivery-service **4003**. All endpoints except `/api/internal/*` need `Authorization: Bearer <access_token>`.

### Notices — user-service

| Method | URL | Who | Body / query | Response |
|---|---|---|---|---|
| POST | `/api/users/notices` | admin, super_admin | `{ "title": "…", "body": "…", "area_id": 1 }` (`area_id` optional; omit or `null` = everyone) | `201 { notice, push: { sent, failed } }` |
| GET | `/api/users/notices?limit=20&offset=0` | anyone logged in | `limit` 1–100 (default 20) | `200 { notices, total, limit, offset }` — customers see global notices + their area's; admins see all. Newest first. |
| DELETE | `/api/users/notices/:id` | admin, super_admin | — | `200` / `404` |

Errors: `400` title/body missing, title over 150 characters, `area_id` not an integer, unknown `area_id`. `403` for non-admins.

### Order status — order-service (or via delivery-service)

| Method | URL | Who |
|---|---|---|
| PUT | `/api/orders/:order_id/status` (port 4002) | delivery_person, admin, super_admin |
| PUT | `/api/delivery/orders/:order_id/status` (port 4003) | same — forwards to order-service and returns its exact status + body |

Body: `{ "status": "preparing" }` or `{ "status": "delivery_failed", "failure_reason": "Customer unreachable" }`

Allowed moves:

| From | To | Who | Push the customer gets |
|---|---|---|---|
| pending | preparing | staff¹ | *Order update* — "Your lunch order is being prepared" |
| preparing | delivering | staff | *Order update* — "Your order is on the way" |
| delivering | delivered | staff | *Order delivered* — "Your order has been delivered" |
| delivering | delivery_failed | staff | *Delivery failed* — "We couldn't deliver your order: {reason}" |
| pending, preparing | cancelled | admin, super_admin | *Order cancelled* — "Your order {id} was cancelled" |

¹ staff = delivery_person, admin, super_admin. `completed` is never set here; it still means delivered + paid.

Responses:

| Code | When | Body |
|---|---|---|
| 200 | Updated | `{ message, order_id, status, failure_reason, payment_status }` |
| 400 | Unknown status; `delivery_failed` without a reason, or a reason over 500 characters | `{ message }` |
| 403 | Role can't make this move (e.g. a delivery person cancelling) | `{ message }` or `{ error }` |
| 404 | Order not found | `{ message }` |
| 409 | Move not allowed from the current status, or the order changed at the same moment | `{ message, from, to, allowed }` |

`delivery_failed` also sets `payment_status` from `pending` to `unpaid`, so the customer's existing "unpaid orders" limit applies.

### Payment — changed

`PUT /api/orders/:order_id/payment` now requires delivery_person, admin or super_admin (customers get `403`). This write previously never saved; it does now.

### Internal — service-to-service only

| Method | URL | Header | Body | Response |
|---|---|---|---|---|
| POST | `/api/internal/notify` (4001) | `X-Internal-Key: <INTERNAL_API_KEY>` | `{ "user_id", "title", "body" }` | `200 { sent: true/false }` · `403` wrong key · `404` user |

Useful for testing a push to one user without touching orders.

---

## 4. Testing with Postman

### Import

Import **[docs/postman/notifications.postman_collection.json](postman/notifications.postman_collection.json)**. Its collection variables are already set for local Docker:

| Variable | Default | Set it to |
|---|---|---|
| `userApi` / `orderApi` / `deliveryApi` | `http://localhost:4001` / `4002` / `4003/api/delivery` | Your LAN IP if Postman runs on another machine |
| `adminEmail`, `adminPassword` | empty | An admin account |
| `deliveryEmail`, `deliveryPassword` | empty | A delivery_person account |
| `customerEmail`, `customerPassword` | empty | An approved customer |
| `customerId` | empty | That customer's user id (for the internal notify test) |
| `orderId` | empty | A `pending` order id of that customer |
| `internalKey` | `internal-dev-key` | Your `INTERNAL_API_KEY` |

The three **Login** requests save `adminToken`, `deliveryToken` and `customerToken` automatically. **Create notice** saves `noticeId`.

### Prepare test data

1. **An approved customer.** Only approved users can log in, and only `accepted` customers get notices. Approve with the admin token: `POST {{userApi}}/api/users/customers/:id/approve` (the collection has it as *0. Setup → Approve customer*).
2. **A pending order** for that customer: create one in the app, or pick one:
   ```sql
   SELECT id, customer_id, status, payment_status FROM orders WHERE status = 'pending';
   ```
3. **Optional, a real push:** log in once from the Expo app (section 5) so the customer has an `fcm_token`. Without a token, everything still works, but `push.sent` is 0 and notify returns `sent: false`.

### Run the flow (folder order in the collection)

| # | Request | Expect |
|---|---|---|
| 1 | Login admin / delivery / customer | `200`, tokens saved |
| 2 | **Notices → Create global notice** (admin) | `201`, `push.sent` = number of customers with tokens |
| 3 | Create area notice (`area_id` = the customer's area) | `201` |
| 4 | Create notice as customer | `403` |
| 5 | List notices as customer | Both notices, newest first |
| 6 | **Order status → pending → delivered** (admin) | `409`, `allowed: ["preparing","cancelled"]` |
| 7 | Cancel as delivery person | `403` |
| 8 | pending → preparing (delivery) | `200`; phone gets "being prepared" |
| 9 | preparing → delivering (via delivery-service) | `200`; phone gets "on the way" |
| 10 | delivery_failed without reason | `400` |
| 11 | delivery_failed with reason | `200`, `payment_status: "unpaid"`; phone gets "couldn't deliver" |
| 12 | Payment as customer | `403` |
| 13 | **Internal → Notify without key** | `403` |
| 14 | Notify with key | `200 { sent: true/false }` |
| 15 | Delete notice | `200` (run again → `404`) |

To run it again, reset the order:

```sql
UPDATE orders SET status='pending', payment_status='pending', failure_reason=NULL WHERE id='<orderId>';
```

phpMyAdmin is at **http://localhost:8080** (logs in as root automatically) if you'd rather click than type SQL.

---

## 5. Testing on a phone with Expo

The backend sends through Firebase directly, so the app must send the **native FCM token**, not an Expo push token (`ExponentPushToken[…]`).

### Requirements

- **Android, development build.** Remote push doesn't work in Expo Go on Android from SDK 53. Build a dev client: `npx expo run:android`, or `eas build --profile development --platform android`.
- **The same Firebase project** as the backend (`rc-notification-52917`). Download `google-services.json` for your Android package from Firebase Console → Project settings, add it to the app, and point to it in `app.json`:
  ```json
  { "expo": { "android": { "googleServicesFile": "./google-services.json", "package": "<your.package>" } } }
  ```
- **iOS:** `getDevicePushTokenAsync()` returns an APNs token, which FCM can't use as-is. iOS needs `@react-native-firebase/messaging` to get an FCM token, plus APNs set up in Firebase. Test on Android first.

### Get the token and send it at login

```ts
import * as Notifications from 'expo-notifications';

// Show pushes while the app is open (by default they only appear in the background)
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

async function getFcmToken(): Promise<string | null> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;
  const token = await Notifications.getDevicePushTokenAsync(); // { type: 'android', data: '<FCM token>' }
  return token.data;
}

// Login — the backend stores fcm_token on the user
const fcm_token = await getFcmToken();
await fetch(`${API}/api/users/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, fcm_token }),
});
```

`API` must be your computer's **LAN IP** (e.g. `http://192.168.1.20:4001`), not `localhost`. The phone and the computer must be on the same Wi-Fi. On Windows, allow ports 4001–4003 through the firewall.

### Check the token was saved

```sql
SELECT email, customer_status, LEFT(fcm_token, 20) AS token FROM users WHERE email = '<customer email>';
```

### Trigger pushes

With the app in the background (or foreground, with the handler above):

1. **Notice:** Postman *Create global notice*. The notification should arrive within a few seconds.
2. **Order status:** Postman *pending → preparing* with that customer's order.
3. **Just a push:** Postman *Notify with key*, with `customerId` = that customer.

To check Firebase and the device on their own, without our backend: Firebase Console → Messaging → *Send test message* → paste the FCM token.

### Show notices in the app

`GET /api/users/notices` with the customer's token returns the list. For an unread badge, store the highest notice `id` seen on the device and count the notices with a higher id.

---

## 6. Automated checks

```bash
# Unit tests (Node 21+; the host has Node 24)
cd apps/user-service && npm test     # push sending: batching, dead-token cleanup, never throws (7 tests)
cd apps/order-service && npm test    # status rules, roles, reason checks, push text (8 tests)

# End-to-end against running Docker (writes data: creates a notice and moves ORDER_ID to delivery_failed)
ADMIN_TOKEN=… DELIVERY_TOKEN=… CUSTOMER_TOKEN=… ORDER_ID=<pending order> bash scripts/notifications-smoke.sh
# → 10 "ok" lines, "0 failure(s)"
```

Afterwards, clean up with the reset SQL from section 4 and delete the "Smoke test" notice.

---

## 7. Troubleshooting

| Symptom | Check |
|---|---|
| Every user-service request returns `401 Invalid token format` | user-service must use `secrets/public.pem`, matching `secrets/private.pem`. Recreate the container: `docker compose -f docker/docker-compose.yml up -d user-service` |
| `Unknown column 'target_date'` / `'failure_reason'` | Run the SQL in section 2 |
| `push.sent` is 0 | No accepted customer has an `fcm_token`. Log in from the device first, and check `customer_status = 'accepted'` |
| Notify returns `sent: false` | That user has no token, or FCM rejected it. `docker logs --tail 50 user-service` shows `error sending push notification` with the FCM error code |
| Token keeps disappearing | FCM reported it dead (app uninstalled or data cleared), so it was set to NULL. Log in again from the device |
| Push arrives in the background but not while the app is open | Add `Notifications.setNotificationHandler` (section 5) |
| No push at all on Android | Expo Go (use a dev build), wrong Firebase project in `google-services.json`, or notification permission denied |
| Status change returns `409` unexpectedly | Check `allowed` in the response; the order may already have moved. `delivery_failed` and `cancelled` are final |
| `/api/internal/notify` returns `503` | `INTERNAL_API_KEY` is not set on user-service |

Logs: `docker logs -f user-service` (notify calls, FCM errors) · `docker logs -f order-service` (`Push for order … failed`).

---

## 8. Known limitations

- **One device per user.** The token is only saved at login; if FCM rotates it, the backend isn't told until the next login.
- **Order-status pushes aren't stored.** No notification history; the order screen shows the current status.
- **Failed deliveries** don't appear in the `getOrders` type views (`current` / `pending` / `completed`). Filter by `status=delivery_failed`.
- **Cancel** doesn't return stock to the menu, and customers can still edit or delete an order after it moves past `pending`.
- **Couriers aren't limited to their area** when changing status.
