# RC Backend — API Reference

<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     Written by scripts/gen-postman.js from the Express route files.
     Refresh with:  npm run docs:api  -->

**75 endpoints** across 6 services. Generated from the route files — see [Keeping this current](#keeping-this-current).

For click-and-run testing, import the Postman collection instead: [docs/postman/](postman/README.md). Same source, same bodies.

## Base URLs

Requests go straight to each service port. The api-gateway only proxies `/users` and `/api/analytics`, so it is not used here.

| Service | Port | Base URL |
|---|---|---|
| user-service | 4001 | `http://localhost:4001` |
| order-service | 4002 | `http://localhost:4002` |
| delivery-service | 4003 | `http://localhost:4003` |
| locations-service | 4004 | `http://localhost:4004` |
| menu-service | 4005 | `http://localhost:4005` |
| analytics-service | 4006 | `http://localhost:4006` |

## Authentication

Three kinds of endpoint, and the reference says which for every one:

- **Bearer token** — most routes. Get one from `POST /api/users/login`, then send `Authorization: Bearer <token>`. Tokens are RS256, valid 7 days, and carry `id`, `role` and `area_id`.
- **`X-Internal-Key`** — service-to-service routes under `/api/internal`. The key is `INTERNAL_API_KEY`, defaulting to `internal-dev-key` in `docker/docker-compose.yml`.
- **None** — signup, login, the password-reset pair, and the health probes.

The curl blocks below assume these shell variables:

```bash
export ADMIN_TOKEN=$(curl -s -X POST http://localhost:4001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"..."}' | jq -r .access_token)
# …same for DELIVERY_TOKEN and CUSTOMER_TOKEN
export INTERNAL_KEY=internal-dev-key
```

Roles are `customer`, `delivery_person`, `admin`, `super_admin`. Where a route lists roles, `checkRole` does an exact string match against the token's `role`.

## All endpoints

| Method | Path | Service | Auth |
|---|---|---|---|
| `POST` | [`/api/users/login`](#post-apiuserslogin) | user-service | none |
| `POST` | [`/api/users/forgot-password`](#post-apiusersforgot-password) | user-service | none |
| `POST` | [`/api/users/reset-password`](#post-apiusersreset-password) | user-service | none |
| `POST` | [`/api/users/signup`](#post-apiuserssignup) | user-service | none |
| `POST` | [`/api/users/refresh-token`](#post-apiusersrefresh-token) | user-service | none |
| `GET` | [`/api/users/profile`](#get-apiusersprofile) | user-service | any logged in |
| `GET` | [`/api/users/:userId`](#get-apiusersuserid) | user-service | internal key |
| `PUT` | [`/api/users/approve/:customerId`](#put-apiusersapprovecustomerid) | user-service | admin, super_admin |
| `PUT` | [`/api/users/delete/:userId`](#put-apiusersdeleteuserid) | user-service | any logged in |
| `GET` | [`/api/users/customers`](#get-apiuserscustomers) | user-service | admin, super_admin |
| `GET` | [`/api/users/customers/export`](#get-apiuserscustomersexport) | user-service | admin, super_admin |
| `GET` | [`/api/users/customers/:id/profile`](#get-apiuserscustomersidprofile) | user-service | admin, super_admin |
| `POST` | [`/api/users/customers/:id/approve`](#post-apiuserscustomersidapprove) | user-service | admin, super_admin |
| `POST` | [`/api/users/customers/:id/reject`](#post-apiuserscustomersidreject) | user-service | admin, super_admin |
| `PUT` | [`/api/users/customers/:id/assign-area`](#put-apiuserscustomersidassign-area) | user-service | admin, super_admin |
| `PUT` | [`/api/users/customers/:id/disable`](#put-apiuserscustomersiddisable) | user-service | admin, super_admin |
| `PUT` | [`/api/users/customers/:id/enable`](#put-apiuserscustomersidenable) | user-service | admin, super_admin |
| `PUT` | [`/api/users/customers/:id/unlock`](#put-apiuserscustomersidunlock) | user-service | admin, super_admin |
| `GET` | [`/api/users/notices`](#get-apiusersnotices) | user-service | any logged in |
| `POST` | [`/api/users/notices`](#post-apiusersnotices) | user-service | admin, super_admin |
| `DELETE` | [`/api/users/notices/:id`](#delete-apiusersnoticesid) | user-service | admin, super_admin |
| `POST` | [`/api/internal/notify`](#post-apiinternalnotify) | user-service | internal key |
| `GET` | [`/api/internal/analytics/blocked-users-count`](#get-apiinternalanalyticsblocked-users-count) | user-service | internal key |
| `GET` | [`/api/orders`](#get-apiorders) | order-service | any logged in |
| `POST` | [`/api/orders`](#post-apiorders) | order-service | any logged in |
| `PUT` | [`/api/orders/:order_id`](#put-apiordersorder_id) | order-service | any logged in |
| `PUT` | [`/api/orders/:order_id/payment`](#put-apiordersorder_idpayment) | order-service | delivery_person, admin, super_admin |
| `PUT` | [`/api/orders/:order_id/status`](#put-apiordersorder_idstatus) | order-service | delivery_person, admin, super_admin |
| `DELETE` | [`/api/orders/:order_id`](#delete-apiordersorder_id) | order-service | any logged in |
| `GET` | [`/api/internal/analytics/sales-totals`](#get-apiinternalanalyticssales-totals) | order-service | internal key |
| `GET` | [`/api/internal/analytics/orders-metrics`](#get-apiinternalanalyticsorders-metrics) | order-service | internal key |
| `GET` | [`/api/internal/analytics/unpaid-orders-count`](#get-apiinternalanalyticsunpaid-orders-count) | order-service | internal key |
| `GET` | [`/api/internal/analytics/orders-by-customer`](#get-apiinternalanalyticsorders-by-customer) | order-service | internal key |
| `GET` | [`/api/internal/analytics/top-selling-items`](#get-apiinternalanalyticstop-selling-items) | order-service | internal key |
| `GET` | [`/api/internal/analytics/session-performance`](#get-apiinternalanalyticssession-performance) | order-service | internal key |
| `GET` | [`/api/internal/analytics/area-metrics`](#get-apiinternalanalyticsarea-metrics) | order-service | internal key |
| `GET` | [`/api/delivery/orders/area`](#get-apideliveryordersarea) | delivery-service | delivery_person, admin, super_admin |
| `GET` | [`/api/delivery/orders/my-area`](#get-apideliveryordersmy-area) | delivery-service | delivery_person, admin, super_admin |
| `PUT` | [`/api/delivery/orders/:order_id/payment`](#put-apideliveryordersorder_idpayment) | delivery-service | delivery_person, admin, super_admin |
| `PUT` | [`/api/delivery/orders/:order_id/status`](#put-apideliveryordersorder_idstatus) | delivery-service | delivery_person, admin, super_admin |
| `POST` | [`/api/areas`](#post-apiareas) | locations-service | admin, super_admin |
| `GET` | [`/api/areas`](#get-apiareas) | locations-service | admin, super_admin, delivery_person |
| `GET` | [`/api/areas/:id`](#get-apiareasid) | locations-service | admin, super_admin, delivery_person |
| `PUT` | [`/api/areas/:id`](#put-apiareasid) | locations-service | admin, super_admin |
| `DELETE` | [`/api/areas/:id`](#delete-apiareasid) | locations-service | admin, super_admin |
| `GET` | [`/api/internal/areas`](#get-apiinternalareas) | locations-service | internal key |
| `GET` | [`/api/internal/areas/:id`](#get-apiinternalareasid) | locations-service | internal key |
| `POST` | [`/api/food-items`](#post-apifood-items) | menu-service | admin, super_admin |
| `GET` | [`/api/food-items`](#get-apifood-items) | menu-service | admin, super_admin, customer |
| `GET` | [`/api/food-items/:id`](#get-apifood-itemsid) | menu-service | admin, super_admin, customer |
| `PUT` | [`/api/food-items/:id`](#put-apifood-itemsid) | menu-service | admin, super_admin |
| `DELETE` | [`/api/food-items/:id`](#delete-apifood-itemsid) | menu-service | admin, super_admin |
| `POST` | [`/api/meal-sessions`](#post-apimeal-sessions) | menu-service | admin, super_admin |
| `GET` | [`/api/meal-sessions`](#get-apimeal-sessions) | menu-service | admin, super_admin, customer |
| `GET` | [`/api/meal-sessions/:id`](#get-apimeal-sessionsid) | menu-service | admin, super_admin, customer |
| `PUT` | [`/api/meal-sessions/:id`](#put-apimeal-sessionsid) | menu-service | admin, super_admin |
| `DELETE` | [`/api/meal-sessions/:id`](#delete-apimeal-sessionsid) | menu-service | admin, super_admin |
| `POST` | [`/api/meal-sessions/:id/items`](#post-apimeal-sessionsiditems) | menu-service | admin, super_admin |
| `POST` | [`/api/meal-session-items`](#post-apimeal-session-items) | menu-service | admin, super_admin |
| `GET` | [`/api/meal-session-items/by-session`](#get-apimeal-session-itemsby-session) | menu-service | admin, super_admin, customer |
| `GET` | [`/api/meal-session-items/:meal_session_id`](#get-apimeal-session-itemsmeal_session_id) | menu-service | admin, super_admin, customer |
| `PUT` | [`/api/meal-session-items/:id`](#put-apimeal-session-itemsid) | menu-service | admin, super_admin |
| `DELETE` | [`/api/meal-session-items/:id`](#delete-apimeal-session-itemsid) | menu-service | admin, super_admin |
| `POST` | [`/api/inventory/decrement`](#post-apiinventorydecrement) | menu-service | admin, super_admin, customer |
| `POST` | [`/api/inventory/increment`](#post-apiinventoryincrement) | menu-service | admin, super_admin, customer |
| `GET` | [`/health`](#get-health) | menu-service | none |
| `GET` | [`/api/analytics/sales-totals`](#get-apianalyticssales-totals) | analytics-service | admin, super_admin |
| `GET` | [`/api/analytics/orders-metrics`](#get-apianalyticsorders-metrics) | analytics-service | admin, super_admin |
| `GET` | [`/api/analytics/blocked-users-count`](#get-apianalyticsblocked-users-count) | analytics-service | admin, super_admin |
| `GET` | [`/api/analytics/unpaid-orders-count`](#get-apianalyticsunpaid-orders-count) | analytics-service | admin, super_admin |
| `GET` | [`/api/analytics/top-selling-items`](#get-apianalyticstop-selling-items) | analytics-service | admin, super_admin |
| `GET` | [`/api/analytics/session-performance`](#get-apianalyticssession-performance) | analytics-service | admin, super_admin |
| `GET` | [`/api/analytics/area-metrics`](#get-apianalyticsarea-metrics) | analytics-service | admin, super_admin |
| `GET` | [`/api/analytics/areas`](#get-apianalyticsareas) | analytics-service | admin, super_admin |
| `GET` | [`/health`](#get-health) | analytics-service | none |

## user-service — port 4001

### Auth

#### `POST /api/users/login`

**URL** &nbsp; `http://localhost:4001/api/users/login`  
**Auth** &nbsp; None — open endpoint  
**Source** &nbsp; [`apps/user-service/src/routes/auth.routes.js`](../apps/user-service/src/routes/auth.routes.js)

Returns access_token + refresh_token. Optional `fcm_token` in the body registers the device for push. Use the _Setup folder logins instead of this one — they save tokens automatically.

**Body**

```json
{
  "email": "<adminEmail>",
  "password": "<adminPassword>"
}
```

<details><summary>curl</summary>

```bash
curl -X POST "http://localhost:4001/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"<adminEmail>","password":"<adminPassword>"}'
```

</details>

#### `POST /api/users/forgot-password`

**URL** &nbsp; `http://localhost:4001/api/users/forgot-password`  
**Auth** &nbsp; None — open endpoint  
**Source** &nbsp; [`apps/user-service/src/routes/auth.routes.js`](../apps/user-service/src/routes/auth.routes.js)

Rate limited to 3 requests per 15 minutes per IP. Emails a reset token.

**Body**

```json
{
  "email": "<customerEmail>"
}
```

<details><summary>curl</summary>

```bash
curl -X POST "http://localhost:4001/api/users/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"<customerEmail>"}'
```

</details>

#### `POST /api/users/reset-password`

**URL** &nbsp; `http://localhost:4001/api/users/reset-password`  
**Auth** &nbsp; None — open endpoint  
**Source** &nbsp; [`apps/user-service/src/routes/auth.routes.js`](../apps/user-service/src/routes/auth.routes.js)

Consumes the token emailed by forgot-password.

**Body**

```json
{
  "token": "PASTE_TOKEN_FROM_EMAIL",
  "newPassword": "NewPassw0rd!"
}
```

<details><summary>curl</summary>

```bash
curl -X POST "http://localhost:4001/api/users/reset-password" \
  -H "Content-Type: application/json" \
  -d '{"token":"PASTE_TOKEN_FROM_EMAIL","newPassword":"NewPassw0rd!"}'
```

</details>

### Users

#### `POST /api/users/signup`

**URL** &nbsp; `http://localhost:4001/api/users/signup`  
**Auth** &nbsp; None — open endpoint  
**Source** &nbsp; [`apps/user-service/src/routes/user.routes.js`](../apps/user-service/src/routes/user.routes.js)

role must be one of customer | delivery_person | admin | super_admin. `address` is stored only for customers. New customers land unapproved — approve them before they can log in. Optional `fcm_token` registers the device for push.

**Body**

```json
{
  "full_name": "Test Customer",
  "email": "test.customer@example.com",
  "password": "Passw0rd!",
  "role": "customer",
  "address": "12 Test Lane",
  "phone": "0770000000"
}
```

<details><summary>curl</summary>

```bash
curl -X POST "http://localhost:4001/api/users/signup" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test Customer","email":"test.customer@example.com","password":"Passw0rd!","role":"customer","address":"12 Test Lane","phone":"0770000000"}'
```

</details>

#### `POST /api/users/refresh-token`

**URL** &nbsp; `http://localhost:4001/api/users/refresh-token`  
**Auth** &nbsp; None — open endpoint  
**Source** &nbsp; [`apps/user-service/src/routes/user.routes.js`](../apps/user-service/src/routes/user.routes.js)

Exchanges a refresh token for a new access token.

**Body**

```json
{
  "refresh_token": "<refresh_token>"
}
```

<details><summary>curl</summary>

```bash
curl -X POST "http://localhost:4001/api/users/refresh-token" \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<refresh_token>"}'
```

</details>

#### `GET /api/users/profile`

**URL** &nbsp; `http://localhost:4001/api/users/profile`  
**Auth** &nbsp; Bearer token — any authenticated user  
**Source** &nbsp; [`apps/user-service/src/routes/user.routes.js`](../apps/user-service/src/routes/user.routes.js)

Profile of the token holder.

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4001/api/users/profile" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

</details>

#### `GET /api/users/:userId`

**URL** &nbsp; `http://localhost:4001/api/users/:userId`  
**Auth** &nbsp; `X-Internal-Key` header (service-to-service)  
**Source** &nbsp; [`apps/user-service/src/routes/user.routes.js`](../apps/user-service/src/routes/user.routes.js)

Service-to-service lookup used by order, menu, locations and analytics to resolve a user's area_id. Requires X-Internal-Key — it was unauthenticated until 2026-09-26.

| Path param | Stands for |
|---|---|
| `:userId` | user_id |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4001/api/users/<user_id>" \
  -H "X-Internal-Key: $INTERNAL_KEY"
```

</details>

#### `PUT /api/users/approve/:customerId`

**URL** &nbsp; `http://localhost:4001/api/users/approve/:customerId`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/user-service/src/routes/user.routes.js`](../apps/user-service/src/routes/user.routes.js)

Legacy approve route. The Customers folder equivalent (POST /api/users/customers/:id/approve) is the one the admin UI uses.

| Path param | Stands for |
|---|---|
| `:customerId` | customer_id |

<details><summary>curl</summary>

```bash
curl -X PUT "http://localhost:4001/api/users/approve/<customer_id>" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

</details>

#### `PUT /api/users/delete/:userId`

**URL** &nbsp; `http://localhost:4001/api/users/delete/:userId`  
**Auth** &nbsp; Bearer token — any authenticated user  
**Source** &nbsp; [`apps/user-service/src/routes/user.routes.js`](../apps/user-service/src/routes/user.routes.js)

Soft delete — sets status to `deleted`. The email can be reused by signing up again.

| Path param | Stands for |
|---|---|
| `:userId` | user_id |

<details><summary>curl</summary>

```bash
curl -X PUT "http://localhost:4001/api/users/delete/<user_id>" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

</details>

### Customers

#### `GET /api/users/customers`

**URL** &nbsp; `http://localhost:4001/api/users/customers`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/user-service/src/routes/customer.routes.js`](../apps/user-service/src/routes/customer.routes.js)

status filter accepts the User.status values (e.g. pending, active, deleted).

| Query param | Example | Required |
|---|---|---|
| `status` | `pending` | optional |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4001/api/users/customers" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

</details>

#### `GET /api/users/customers/export`

**URL** &nbsp; `http://localhost:4001/api/users/customers/export`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/user-service/src/routes/customer.routes.js`](../apps/user-service/src/routes/customer.routes.js)

CSV export. limit defaults to 1000.

| Query param | Example | Required |
|---|---|---|
| `status` | `active` | optional |
| `limit` | `1000` | optional |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4001/api/users/customers/export" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

</details>

#### `GET /api/users/customers/:id/profile`

**URL** &nbsp; `http://localhost:4001/api/users/customers/:id/profile`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/user-service/src/routes/customer.routes.js`](../apps/user-service/src/routes/customer.routes.js)

Full customer record including area assignment.

| Path param | Stands for |
|---|---|
| `:id` | customer_id |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4001/api/users/customers/<customer_id>/profile" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

</details>

#### `POST /api/users/customers/:id/approve`

**URL** &nbsp; `http://localhost:4001/api/users/customers/:id/approve`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/user-service/src/routes/customer.routes.js`](../apps/user-service/src/routes/customer.routes.js)

area_id is optional; approving without it leaves the customer unassigned.

| Path param | Stands for |
|---|---|
| `:id` | customer_id |

**Body**

```json
{
  "area_id": 1
}
```

<details><summary>curl</summary>

```bash
curl -X POST "http://localhost:4001/api/users/customers/<customer_id>/approve" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"area_id":{"__raw":"<area_id>","__example":1}}'
```

</details>

#### `POST /api/users/customers/:id/reject`

**URL** &nbsp; `http://localhost:4001/api/users/customers/:id/reject`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/user-service/src/routes/customer.routes.js`](../apps/user-service/src/routes/customer.routes.js)

reason is optional and stored with the rejection.

| Path param | Stands for |
|---|---|
| `:id` | customer_id |

**Body**

```json
{
  "reason": "Incomplete registration details"
}
```

<details><summary>curl</summary>

```bash
curl -X POST "http://localhost:4001/api/users/customers/<customer_id>/reject" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Incomplete registration details"}'
```

</details>

#### `PUT /api/users/customers/:id/assign-area`

**URL** &nbsp; `http://localhost:4001/api/users/customers/:id/assign-area`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/user-service/src/routes/customer.routes.js`](../apps/user-service/src/routes/customer.routes.js)

| Path param | Stands for |
|---|---|
| `:id` | customer_id |

**Body**

```json
{
  "area_id": 1
}
```

<details><summary>curl</summary>

```bash
curl -X PUT "http://localhost:4001/api/users/customers/<customer_id>/assign-area" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"area_id":{"__raw":"<area_id>","__example":1}}'
```

</details>

#### `PUT /api/users/customers/:id/disable`

**URL** &nbsp; `http://localhost:4001/api/users/customers/:id/disable`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/user-service/src/routes/customer.routes.js`](../apps/user-service/src/routes/customer.routes.js)

No body. Blocks the customer from logging in.

| Path param | Stands for |
|---|---|
| `:id` | customer_id |

<details><summary>curl</summary>

```bash
curl -X PUT "http://localhost:4001/api/users/customers/<customer_id>/disable" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

</details>

#### `PUT /api/users/customers/:id/enable`

**URL** &nbsp; `http://localhost:4001/api/users/customers/:id/enable`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/user-service/src/routes/customer.routes.js`](../apps/user-service/src/routes/customer.routes.js)

No body. Reverses disable.

| Path param | Stands for |
|---|---|
| `:id` | customer_id |

<details><summary>curl</summary>

```bash
curl -X PUT "http://localhost:4001/api/users/customers/<customer_id>/enable" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

</details>

#### `PUT /api/users/customers/:id/unlock`

**URL** &nbsp; `http://localhost:4001/api/users/customers/:id/unlock`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/user-service/src/routes/customer.routes.js`](../apps/user-service/src/routes/customer.routes.js)

No body. Clears a lockout from failed login attempts.

| Path param | Stands for |
|---|---|
| `:id` | customer_id |

<details><summary>curl</summary>

```bash
curl -X PUT "http://localhost:4001/api/users/customers/<customer_id>/unlock" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

</details>

### Notices

#### `GET /api/users/notices`

**URL** &nbsp; `http://localhost:4001/api/users/notices`  
**Auth** &nbsp; Bearer token — any authenticated user  
**Source** &nbsp; [`apps/user-service/src/routes/notice.routes.js`](../apps/user-service/src/routes/notice.routes.js)

limit is clamped to 1..100 (default 20). Customers see notices for their own area plus global ones.

| Query param | Example | Required |
|---|---|---|
| `limit` | `20` | optional |
| `offset` | `0` | optional |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4001/api/users/notices" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

</details>

#### `POST /api/users/notices`

**URL** &nbsp; `http://localhost:4001/api/users/notices`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/user-service/src/routes/notice.routes.js`](../apps/user-service/src/routes/notice.routes.js)

area_id null targets every user; set it to an area id to target one area. Sends a push to the matching users.

**Body**

```json
{
  "title": "Kitchen closed tomorrow",
  "body": "No dinner service on the 30th.",
  "area_id": null
}
```

<details><summary>curl</summary>

```bash
curl -X POST "http://localhost:4001/api/users/notices" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Kitchen closed tomorrow","body":"No dinner service on the 30th.","area_id":null}'
```

</details>

#### `DELETE /api/users/notices/:id`

**URL** &nbsp; `http://localhost:4001/api/users/notices/:id`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/user-service/src/routes/notice.routes.js`](../apps/user-service/src/routes/notice.routes.js)

| Path param | Stands for |
|---|---|
| `:id` | notice_id |

<details><summary>curl</summary>

```bash
curl -X DELETE "http://localhost:4001/api/users/notices/<notice_id>" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

</details>

### Internal

#### `POST /api/internal/notify`

**URL** &nbsp; `http://localhost:4001/api/internal/notify`  
**Auth** &nbsp; `X-Internal-Key` header (service-to-service)  
**Source** &nbsp; [`apps/user-service/src/routes/internal.routes.js`](../apps/user-service/src/routes/internal.routes.js)

Service-to-service push. Requires the X-Internal-Key header, not a bearer token.

**Body**

```json
{
  "user_id": "<user_id>",
  "title": "Test push",
  "body": "Sent via the internal notify endpoint"
}
```

<details><summary>curl</summary>

```bash
curl -X POST "http://localhost:4001/api/internal/notify" \
  -H "X-Internal-Key: $INTERNAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<user_id>","title":"Test push","body":"Sent via the internal notify endpoint"}'
```

</details>

#### `GET /api/internal/analytics/blocked-users-count`

**URL** &nbsp; `http://localhost:4001/api/internal/analytics/blocked-users-count`  
**Auth** &nbsp; `X-Internal-Key` header (service-to-service)  
**Source** &nbsp; [`apps/user-service/src/routes/internalAnalytics.routes.js`](../apps/user-service/src/routes/internalAnalytics.routes.js)

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4001/api/internal/analytics/blocked-users-count" \
  -H "X-Internal-Key: $INTERNAL_KEY"
```

</details>

## order-service — port 4002

### Orders

#### `GET /api/orders`

**URL** &nbsp; `http://localhost:4002/api/orders`  
**Auth** &nbsp; Bearer token — any authenticated user  
**Source** &nbsp; [`apps/order-service/src/routes/order.routes.js`](../apps/order-service/src/routes/order.routes.js)

`type` is REQUIRED — one of `current`, `pending` or `completed`; anything else returns 400. A delivery_person must also pass `area_id`. status: pending | preparing | delivering | delivered | completed | cancelled | delivery_failed. payment_status: pending | paid | unpaid | ignored.

| Query param | Example | Required |
|---|---|---|
| `type` | `current` | **yes** |
| `status` | `pending` | optional |
| `meal_type` | `lunch` | optional |
| `payment_status` | `pending` | optional |
| `customer_id` | `{{customer_id}}` | optional |
| `area_id` | `{{area_id}}` | optional |
| `date_range` | `—` | optional |
| `start_date` | `2026-09-01` | optional |
| `end_date` | `2026-09-30` | optional |
| `limit` | `20` | optional |
| `offset` | `0` | optional |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4002/api/orders?type=current" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

</details>

#### `POST /api/orders`

**URL** &nbsp; `http://localhost:4002/api/orders`  
**Auth** &nbsp; Bearer token — any authenticated user  
**Source** &nbsp; [`apps/order-service/src/routes/order.routes.js`](../apps/order-service/src/routes/order.routes.js)

meal_time: breakfast | lunch | dinner. target_date is the delivery date (pre-orders). Decrements menu-service inventory, so the food item must already be attached to a meal session that is open right now and still has stock. Run the menu-service folder first — see the seeding order in the README.

**Body**

```json
{
  "customer_id": "<customer_id>",
  "items": [
    {
      "food_item_id": 53,
      "quantity": 2
    }
  ],
  "meal_time": "lunch",
  "target_date": "<today>"
}
```

<details><summary>curl</summary>

```bash
curl -X POST "http://localhost:4002/api/orders" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"<customer_id>","items":[{"food_item_id":{"__raw":"<food_item_id>","__example":53},"quantity":2}],"meal_time":"lunch","target_date":"<today>"}'
```

</details>

#### `PUT /api/orders/:order_id`

**URL** &nbsp; `http://localhost:4002/api/orders/:order_id`  
**Auth** &nbsp; Bearer token — any authenticated user  
**Source** &nbsp; [`apps/order-service/src/routes/order.routes.js`](../apps/order-service/src/routes/order.routes.js)

Replaces the order items. Only allowed while the order is still pending.

| Path param | Stands for |
|---|---|
| `:order_id` | order_id |

**Body**

```json
{
  "items": [
    {
      "food_item_id": 53,
      "quantity": 3
    }
  ]
}
```

<details><summary>curl</summary>

```bash
curl -X PUT "http://localhost:4002/api/orders/<order_id>" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"food_item_id":{"__raw":"<food_item_id>","__example":53},"quantity":3}]}'
```

</details>

#### `PUT /api/orders/:order_id/payment`

**URL** &nbsp; `http://localhost:4002/api/orders/:order_id/payment`  
**Auth** &nbsp; Bearer token — delivery_person, admin, super_admin  
**Source** &nbsp; [`apps/order-service/src/routes/order.routes.js`](../apps/order-service/src/routes/order.routes.js)

payment_status: pending | paid | unpaid | ignored. An order becomes `completed` when it is both delivered and paid.

| Path param | Stands for |
|---|---|
| `:order_id` | order_id |

**Body**

```json
{
  "payment_status": "paid"
}
```

<details><summary>curl</summary>

```bash
curl -X PUT "http://localhost:4002/api/orders/<order_id>/payment" \
  -H "Authorization: Bearer $DELIVERY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"payment_status":"paid"}'
```

</details>

#### `PUT /api/orders/:order_id/status`

**URL** &nbsp; `http://localhost:4002/api/orders/:order_id/status`  
**Auth** &nbsp; Bearer token — delivery_person, admin, super_admin  
**Source** &nbsp; [`apps/order-service/src/routes/order.routes.js`](../apps/order-service/src/routes/order.routes.js)

Allowed transitions: pending→preparing|cancelled, preparing→delivering|cancelled, delivering→delivered|delivery_failed. Cancelling is admin/super_admin only. `delivery_failed` additionally requires a non-empty `failure_reason` of 500 chars or fewer. `completed` is derived, never set directly. Each transition fires a push to the customer.

| Path param | Stands for |
|---|---|
| `:order_id` | order_id |

**Body**

```json
{
  "status": "preparing"
}
```

<details><summary>curl</summary>

```bash
curl -X PUT "http://localhost:4002/api/orders/<order_id>/status" \
  -H "Authorization: Bearer $DELIVERY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"preparing"}'
```

</details>

#### `DELETE /api/orders/:order_id`

**URL** &nbsp; `http://localhost:4002/api/orders/:order_id`  
**Auth** &nbsp; Bearer token — any authenticated user  
**Source** &nbsp; [`apps/order-service/src/routes/order.routes.js`](../apps/order-service/src/routes/order.routes.js)

| Path param | Stands for |
|---|---|
| `:order_id` | order_id |

<details><summary>curl</summary>

```bash
curl -X DELETE "http://localhost:4002/api/orders/<order_id>" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

</details>

### Internal

#### `GET /api/internal/analytics/sales-totals`

**URL** &nbsp; `http://localhost:4002/api/internal/analytics/sales-totals`  
**Auth** &nbsp; `X-Internal-Key` header (service-to-service)  
**Source** &nbsp; [`apps/order-service/src/routes/internalAnalytics.routes.js`](../apps/order-service/src/routes/internalAnalytics.routes.js)

| Query param | Example | Required |
|---|---|---|
| `period` | `weekly` | optional |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4002/api/internal/analytics/sales-totals" \
  -H "X-Internal-Key: $INTERNAL_KEY"
```

</details>

#### `GET /api/internal/analytics/orders-metrics`

**URL** &nbsp; `http://localhost:4002/api/internal/analytics/orders-metrics`  
**Auth** &nbsp; `X-Internal-Key` header (service-to-service)  
**Source** &nbsp; [`apps/order-service/src/routes/internalAnalytics.routes.js`](../apps/order-service/src/routes/internalAnalytics.routes.js)

| Query param | Example | Required |
|---|---|---|
| `period` | `weekly` | optional |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4002/api/internal/analytics/orders-metrics" \
  -H "X-Internal-Key: $INTERNAL_KEY"
```

</details>

#### `GET /api/internal/analytics/unpaid-orders-count`

**URL** &nbsp; `http://localhost:4002/api/internal/analytics/unpaid-orders-count`  
**Auth** &nbsp; `X-Internal-Key` header (service-to-service)  
**Source** &nbsp; [`apps/order-service/src/routes/internalAnalytics.routes.js`](../apps/order-service/src/routes/internalAnalytics.routes.js)

| Query param | Example | Required |
|---|---|---|
| `customer_id` | `{{customer_id}}` | optional |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4002/api/internal/analytics/unpaid-orders-count" \
  -H "X-Internal-Key: $INTERNAL_KEY"
```

</details>

#### `GET /api/internal/analytics/orders-by-customer`

**URL** &nbsp; `http://localhost:4002/api/internal/analytics/orders-by-customer`  
**Auth** &nbsp; `X-Internal-Key` header (service-to-service)  
**Source** &nbsp; [`apps/order-service/src/routes/internalAnalytics.routes.js`](../apps/order-service/src/routes/internalAnalytics.routes.js)

| Query param | Example | Required |
|---|---|---|
| `customer_id` | `{{customer_id}}` | **yes** |
| `limit` | `50` | optional |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4002/api/internal/analytics/orders-by-customer?customer_id=<customer_id>" \
  -H "X-Internal-Key: $INTERNAL_KEY"
```

</details>

#### `GET /api/internal/analytics/top-selling-items`

**URL** &nbsp; `http://localhost:4002/api/internal/analytics/top-selling-items`  
**Auth** &nbsp; `X-Internal-Key` header (service-to-service)  
**Source** &nbsp; [`apps/order-service/src/routes/internalAnalytics.routes.js`](../apps/order-service/src/routes/internalAnalytics.routes.js)

| Query param | Example | Required |
|---|---|---|
| `startDate` | `2026-09-01` | optional |
| `endDate` | `2026-09-30` | optional |
| `limit` | `10` | optional |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4002/api/internal/analytics/top-selling-items" \
  -H "X-Internal-Key: $INTERNAL_KEY"
```

</details>

#### `GET /api/internal/analytics/session-performance`

**URL** &nbsp; `http://localhost:4002/api/internal/analytics/session-performance`  
**Auth** &nbsp; `X-Internal-Key` header (service-to-service)  
**Source** &nbsp; [`apps/order-service/src/routes/internalAnalytics.routes.js`](../apps/order-service/src/routes/internalAnalytics.routes.js)

sessionType is REQUIRED and must be breakfast | lunch | dinner — omitting it returns 400.

| Query param | Example | Required |
|---|---|---|
| `sessionType` | `lunch` | **yes** |
| `startDate` | `2026-09-01` | optional |
| `endDate` | `2026-09-30` | optional |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4002/api/internal/analytics/session-performance?sessionType=lunch" \
  -H "X-Internal-Key: $INTERNAL_KEY"
```

</details>

#### `GET /api/internal/analytics/area-metrics`

**URL** &nbsp; `http://localhost:4002/api/internal/analytics/area-metrics`  
**Auth** &nbsp; `X-Internal-Key` header (service-to-service)  
**Source** &nbsp; [`apps/order-service/src/routes/internalAnalytics.routes.js`](../apps/order-service/src/routes/internalAnalytics.routes.js)

| Query param | Example | Required |
|---|---|---|
| `areaId` | `{{area_id}}` | optional |
| `startDate` | `2026-09-01` | optional |
| `endDate` | `2026-09-30` | optional |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4002/api/internal/analytics/area-metrics" \
  -H "X-Internal-Key: $INTERNAL_KEY"
```

</details>

## delivery-service — port 4003

### Delivery

#### `GET /api/delivery/orders/area`

**URL** &nbsp; `http://localhost:4003/api/delivery/orders/area`  
**Auth** &nbsp; Bearer token — delivery_person, admin, super_admin  
**Source** &nbsp; [`apps/delivery-service/src/routes/delivery.routes.js`](../apps/delivery-service/src/routes/delivery.routes.js)

payment_status defaults to `pending` when omitted.

| Query param | Example | Required |
|---|---|---|
| `area_id` | `{{area_id}}` | **yes** |
| `meal_time` | `lunch` | optional |
| `date` | `{{today}}` | optional |
| `payment_status` | `pending` | optional |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4003/api/delivery/orders/area?area_id=<area_id>" \
  -H "Authorization: Bearer $DELIVERY_TOKEN"
```

</details>

#### `GET /api/delivery/orders/my-area`

**URL** &nbsp; `http://localhost:4003/api/delivery/orders/my-area`  
**Auth** &nbsp; Bearer token — delivery_person, admin, super_admin  
**Source** &nbsp; [`apps/delivery-service/src/routes/delivery.routes.js`](../apps/delivery-service/src/routes/delivery.routes.js)

Orders for the area assigned to the logged-in delivery person. No query params — the area comes from the token holder's profile.

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4003/api/delivery/orders/my-area" \
  -H "Authorization: Bearer $DELIVERY_TOKEN"
```

</details>

#### `PUT /api/delivery/orders/:order_id/payment`

**URL** &nbsp; `http://localhost:4003/api/delivery/orders/:order_id/payment`  
**Auth** &nbsp; Bearer token — delivery_person, admin, super_admin  
**Source** &nbsp; [`apps/delivery-service/src/routes/delivery.routes.js`](../apps/delivery-service/src/routes/delivery.routes.js)

Proxies to order-service and returns its response body unchanged.

| Path param | Stands for |
|---|---|
| `:order_id` | order_id |

**Body**

```json
{
  "payment_status": "paid"
}
```

<details><summary>curl</summary>

```bash
curl -X PUT "http://localhost:4003/api/delivery/orders/<order_id>/payment" \
  -H "Authorization: Bearer $DELIVERY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"payment_status":"paid"}'
```

</details>

#### `PUT /api/delivery/orders/:order_id/status`

**URL** &nbsp; `http://localhost:4003/api/delivery/orders/:order_id/status`  
**Auth** &nbsp; Bearer token — delivery_person, admin, super_admin  
**Source** &nbsp; [`apps/delivery-service/src/routes/delivery.routes.js`](../apps/delivery-service/src/routes/delivery.routes.js)

Proxies to order-service. Same transition rules and the same `failure_reason` requirement for `delivery_failed`.

| Path param | Stands for |
|---|---|
| `:order_id` | order_id |

**Body**

```json
{
  "status": "delivering"
}
```

<details><summary>curl</summary>

```bash
curl -X PUT "http://localhost:4003/api/delivery/orders/<order_id>/status" \
  -H "Authorization: Bearer $DELIVERY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"delivering"}'
```

</details>

## locations-service — port 4004

### Areas

#### `POST /api/areas`

**URL** &nbsp; `http://localhost:4004/api/areas`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/locations-service/src/routes/area.routes.js`](../apps/locations-service/src/routes/area.routes.js)

**Body**

```json
{
  "area_name": "Hostel Block A"
}
```

<details><summary>curl</summary>

```bash
curl -X POST "http://localhost:4004/api/areas" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"area_name":"Hostel Block A"}'
```

</details>

#### `GET /api/areas`

**URL** &nbsp; `http://localhost:4004/api/areas`  
**Auth** &nbsp; Bearer token — admin, super_admin, delivery_person  
**Source** &nbsp; [`apps/locations-service/src/routes/area.routes.js`](../apps/locations-service/src/routes/area.routes.js)

Readable by admin, super_admin and delivery_person. Returns a bare array of { area_id, area_name }.

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4004/api/areas" \
  -H "Authorization: Bearer $DELIVERY_TOKEN"
```

</details>

#### `GET /api/areas/:id`

**URL** &nbsp; `http://localhost:4004/api/areas/:id`  
**Auth** &nbsp; Bearer token — admin, super_admin, delivery_person  
**Source** &nbsp; [`apps/locations-service/src/routes/area.routes.js`](../apps/locations-service/src/routes/area.routes.js)

| Path param | Stands for |
|---|---|
| `:id` | area_id |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4004/api/areas/<area_id>" \
  -H "Authorization: Bearer $DELIVERY_TOKEN"
```

</details>

#### `PUT /api/areas/:id`

**URL** &nbsp; `http://localhost:4004/api/areas/:id`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/locations-service/src/routes/area.routes.js`](../apps/locations-service/src/routes/area.routes.js)

| Path param | Stands for |
|---|---|
| `:id` | area_id |

**Body**

```json
{
  "area_name": "Hostel Block A (renamed)"
}
```

<details><summary>curl</summary>

```bash
curl -X PUT "http://localhost:4004/api/areas/<area_id>" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"area_name":"Hostel Block A (renamed)"}'
```

</details>

#### `DELETE /api/areas/:id`

**URL** &nbsp; `http://localhost:4004/api/areas/:id`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/locations-service/src/routes/area.routes.js`](../apps/locations-service/src/routes/area.routes.js)

| Path param | Stands for |
|---|---|
| `:id` | area_id |

<details><summary>curl</summary>

```bash
curl -X DELETE "http://localhost:4004/api/areas/<area_id>" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

</details>

### Internal

#### `GET /api/internal/areas`

**URL** &nbsp; `http://localhost:4004/api/internal/areas`  
**Auth** &nbsp; `X-Internal-Key` header (service-to-service)  
**Source** &nbsp; [`apps/locations-service/src/routes/internal.routes.js`](../apps/locations-service/src/routes/internal.routes.js)

Unauthenticated-by-bearer area list for other services. Requires X-Internal-Key.

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4004/api/internal/areas" \
  -H "X-Internal-Key: $INTERNAL_KEY"
```

</details>

#### `GET /api/internal/areas/:id`

**URL** &nbsp; `http://localhost:4004/api/internal/areas/:id`  
**Auth** &nbsp; `X-Internal-Key` header (service-to-service)  
**Source** &nbsp; [`apps/locations-service/src/routes/internal.routes.js`](../apps/locations-service/src/routes/internal.routes.js)

| Path param | Stands for |
|---|---|
| `:id` | area_id |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4004/api/internal/areas/<area_id>" \
  -H "X-Internal-Key: $INTERNAL_KEY"
```

</details>

## menu-service — port 4005

### Food Items

#### `POST /api/food-items`

**URL** &nbsp; `http://localhost:4005/api/food-items`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/menu-service/src/routes/foodItem.routes.js`](../apps/menu-service/src/routes/foodItem.routes.js)

meal_type is the DIETARY enum: veg | non-veg | other. It is NOT a meal time — meal times (breakfast/lunch/dinner) live on meal sessions.

**Body**

```json
{
  "name": "Chicken Rice",
  "description": "Rice with grilled chicken",
  "price": 450,
  "meal_type": "non-veg",
  "image_url": "https://example.com/chicken-rice.jpg"
}
```

<details><summary>curl</summary>

```bash
curl -X POST "http://localhost:4005/api/food-items" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Chicken Rice","description":"Rice with grilled chicken","price":450,"meal_type":"non-veg","image_url":"https://example.com/chicken-rice.jpg"}'
```

</details>

#### `GET /api/food-items`

**URL** &nbsp; `http://localhost:4005/api/food-items`  
**Auth** &nbsp; Bearer token — admin, super_admin, customer  
**Source** &nbsp; [`apps/menu-service/src/routes/foodItem.routes.js`](../apps/menu-service/src/routes/foodItem.routes.js)

meal_type filter: veg | non-veg | other.

| Query param | Example | Required |
|---|---|---|
| `page` | `1` | optional |
| `limit` | `10` | optional |
| `meal_type` | `non-veg` | optional |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4005/api/food-items" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

</details>

#### `GET /api/food-items/:id`

**URL** &nbsp; `http://localhost:4005/api/food-items/:id`  
**Auth** &nbsp; Bearer token — admin, super_admin, customer  
**Source** &nbsp; [`apps/menu-service/src/routes/foodItem.routes.js`](../apps/menu-service/src/routes/foodItem.routes.js)

| Path param | Stands for |
|---|---|
| `:id` | food_item_id |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4005/api/food-items/<food_item_id>" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

</details>

#### `PUT /api/food-items/:id`

**URL** &nbsp; `http://localhost:4005/api/food-items/:id`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/menu-service/src/routes/foodItem.routes.js`](../apps/menu-service/src/routes/foodItem.routes.js)

| Path param | Stands for |
|---|---|
| `:id` | food_item_id |

**Body**

```json
{
  "name": "Chicken Rice (large)",
  "description": "Larger portion",
  "price": 550,
  "meal_type": "non-veg",
  "image_url": "https://example.com/chicken-rice.jpg"
}
```

<details><summary>curl</summary>

```bash
curl -X PUT "http://localhost:4005/api/food-items/<food_item_id>" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Chicken Rice (large)","description":"Larger portion","price":550,"meal_type":"non-veg","image_url":"https://example.com/chicken-rice.jpg"}'
```

</details>

#### `DELETE /api/food-items/:id`

**URL** &nbsp; `http://localhost:4005/api/food-items/:id`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/menu-service/src/routes/foodItem.routes.js`](../apps/menu-service/src/routes/foodItem.routes.js)

| Path param | Stands for |
|---|---|
| `:id` | food_item_id |

<details><summary>curl</summary>

```bash
curl -X DELETE "http://localhost:4005/api/food-items/<food_item_id>" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

</details>

### Meal Sessions

#### `POST /api/meal-sessions`

**URL** &nbsp; `http://localhost:4005/api/meal-sessions`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/menu-service/src/routes/mealSession.routes.js`](../apps/menu-service/src/routes/mealSession.routes.js)

Ordering is allowed only while the clock (Asia/Colombo) is inside this window — see isOrderingAllowed in order.controller.js. The window here is deliberately the whole day so ordering works whenever you run the collection; narrow it to real service hours (e.g. 11:30:00–14:00:00) when testing the rejection path.

If end_time < start_time the session is treated as crossing midnight and ordering opens the PREVIOUS day — that is how pre-orders work.

**Body**

```json
{
  "date": "<today>",
  "meal_time": "lunch",
  "start_time": "00:00:00",
  "end_time": "23:59:00"
}
```

<details><summary>curl</summary>

```bash
curl -X POST "http://localhost:4005/api/meal-sessions" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date":"<today>","meal_time":"lunch","start_time":"00:00:00","end_time":"23:59:00"}'
```

</details>

#### `GET /api/meal-sessions`

**URL** &nbsp; `http://localhost:4005/api/meal-sessions`  
**Auth** &nbsp; Bearer token — admin, super_admin, customer  
**Source** &nbsp; [`apps/menu-service/src/routes/mealSession.routes.js`](../apps/menu-service/src/routes/mealSession.routes.js)

| Query param | Example | Required |
|---|---|---|
| `page` | `1` | optional |
| `limit` | `10` | optional |
| `meal_time` | `lunch` | optional |
| `date` | `{{today}}` | optional |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4005/api/meal-sessions" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

</details>

#### `GET /api/meal-sessions/:id`

**URL** &nbsp; `http://localhost:4005/api/meal-sessions/:id`  
**Auth** &nbsp; Bearer token — admin, super_admin, customer  
**Source** &nbsp; [`apps/menu-service/src/routes/mealSession.routes.js`](../apps/menu-service/src/routes/mealSession.routes.js)

| Path param | Stands for |
|---|---|
| `:id` | meal_session_id |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4005/api/meal-sessions/<meal_session_id>" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

</details>

#### `PUT /api/meal-sessions/:id`

**URL** &nbsp; `http://localhost:4005/api/meal-sessions/:id`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/menu-service/src/routes/mealSession.routes.js`](../apps/menu-service/src/routes/mealSession.routes.js)

| Path param | Stands for |
|---|---|
| `:id` | meal_session_id |

**Body**

```json
{
  "date": "<today>",
  "meal_time": "lunch",
  "start_time": "00:00:00",
  "end_time": "23:00:00"
}
```

<details><summary>curl</summary>

```bash
curl -X PUT "http://localhost:4005/api/meal-sessions/<meal_session_id>" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date":"<today>","meal_time":"lunch","start_time":"00:00:00","end_time":"23:00:00"}'
```

</details>

#### `DELETE /api/meal-sessions/:id`

**URL** &nbsp; `http://localhost:4005/api/meal-sessions/:id`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/menu-service/src/routes/mealSession.routes.js`](../apps/menu-service/src/routes/mealSession.routes.js)

| Path param | Stands for |
|---|---|
| `:id` | meal_session_id |

<details><summary>curl</summary>

```bash
curl -X DELETE "http://localhost:4005/api/meal-sessions/<meal_session_id>" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

</details>

#### `POST /api/meal-sessions/:id/items`

**URL** &nbsp; `http://localhost:4005/api/meal-sessions/:id/items`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/menu-service/src/routes/mealSession.routes.js`](../apps/menu-service/src/routes/mealSession.routes.js)

Bulk-attaches food items to the session with their starting stock.

| Path param | Stands for |
|---|---|
| `:id` | meal_session_id |

**Body**

```json
{
  "food_items": [
    {
      "food_item_id": 53,
      "available_quantity": 50
    }
  ]
}
```

<details><summary>curl</summary>

```bash
curl -X POST "http://localhost:4005/api/meal-sessions/<meal_session_id>/items" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"food_items":[{"food_item_id":{"__raw":"<food_item_id>","__example":53},"available_quantity":50}]}'
```

</details>

### Meal Session Items

#### `POST /api/meal-session-items`

**URL** &nbsp; `http://localhost:4005/api/meal-session-items`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/menu-service/src/routes/mealSessionItem.routes.js`](../apps/menu-service/src/routes/mealSessionItem.routes.js)

**Body**

```json
{
  "meal_session_id": 4,
  "food_item_id": 53,
  "available_quantity": 50
}
```

<details><summary>curl</summary>

```bash
curl -X POST "http://localhost:4005/api/meal-session-items" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"meal_session_id":{"__raw":"<meal_session_id>","__example":4},"food_item_id":{"__raw":"<food_item_id>","__example":53},"available_quantity":50}'
```

</details>

#### `GET /api/meal-session-items/by-session`

**URL** &nbsp; `http://localhost:4005/api/meal-session-items/by-session`  
**Auth** &nbsp; Bearer token — admin, super_admin, customer  
**Source** &nbsp; [`apps/menu-service/src/routes/mealSessionItem.routes.js`](../apps/menu-service/src/routes/mealSessionItem.routes.js)

BOTH meal_time and date are REQUIRED — omitting either returns 400. Resolves the session from meal_time/date rather than an id. This is the endpoint the customer app uses to render a menu.

| Query param | Example | Required |
|---|---|---|
| `meal_time` | `lunch` | **yes** |
| `date` | `{{today}}` | **yes** |
| `check_availability` | `true` | optional |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4005/api/meal-session-items/by-session?meal_time=lunch&date=<today>" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

</details>

#### `GET /api/meal-session-items/:meal_session_id`

**URL** &nbsp; `http://localhost:4005/api/meal-session-items/:meal_session_id`  
**Auth** &nbsp; Bearer token — admin, super_admin, customer  
**Source** &nbsp; [`apps/menu-service/src/routes/mealSessionItem.routes.js`](../apps/menu-service/src/routes/mealSessionItem.routes.js)

| Path param | Stands for |
|---|---|
| `:meal_session_id` | meal_session_id |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4005/api/meal-session-items/<meal_session_id>" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

</details>

#### `PUT /api/meal-session-items/:id`

**URL** &nbsp; `http://localhost:4005/api/meal-session-items/:id`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/menu-service/src/routes/mealSessionItem.routes.js`](../apps/menu-service/src/routes/mealSessionItem.routes.js)

| Path param | Stands for |
|---|---|
| `:id` | meal_session_item_id |

**Body**

```json
{
  "available_quantity": 40
}
```

<details><summary>curl</summary>

```bash
curl -X PUT "http://localhost:4005/api/meal-session-items/<meal_session_item_id>" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"available_quantity":40}'
```

</details>

#### `DELETE /api/meal-session-items/:id`

**URL** &nbsp; `http://localhost:4005/api/meal-session-items/:id`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/menu-service/src/routes/mealSessionItem.routes.js`](../apps/menu-service/src/routes/mealSessionItem.routes.js)

| Path param | Stands for |
|---|---|
| `:id` | meal_session_item_id |

<details><summary>curl</summary>

```bash
curl -X DELETE "http://localhost:4005/api/meal-session-items/<meal_session_item_id>" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

</details>

### Inventory

#### `POST /api/inventory/decrement`

**URL** &nbsp; `http://localhost:4005/api/inventory/decrement`  
**Auth** &nbsp; Bearer token — admin, super_admin, customer  
**Source** &nbsp; [`apps/menu-service/src/routes/inventory.routes.js`](../apps/menu-service/src/routes/inventory.routes.js)

Order creation calls this internally. Broadcasts a `mealSessionItemUpdate` socket.io event on menu-service (port 4005).

**Body**

```json
{
  "meal_session_id": 4,
  "food_item_id": 53,
  "quantity": 1
}
```

<details><summary>curl</summary>

```bash
curl -X POST "http://localhost:4005/api/inventory/decrement" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"meal_session_id":{"__raw":"<meal_session_id>","__example":4},"food_item_id":{"__raw":"<food_item_id>","__example":53},"quantity":1}'
```

</details>

#### `POST /api/inventory/increment`

**URL** &nbsp; `http://localhost:4005/api/inventory/increment`  
**Auth** &nbsp; Bearer token — admin, super_admin, customer  
**Source** &nbsp; [`apps/menu-service/src/routes/inventory.routes.js`](../apps/menu-service/src/routes/inventory.routes.js)

Order cancellation calls this internally. Also broadcasts `mealSessionItemUpdate`.

**Body**

```json
{
  "meal_session_id": 4,
  "food_item_id": 53,
  "quantity": 1
}
```

<details><summary>curl</summary>

```bash
curl -X POST "http://localhost:4005/api/inventory/increment" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"meal_session_id":{"__raw":"<meal_session_id>","__example":4},"food_item_id":{"__raw":"<food_item_id>","__example":53},"quantity":1}'
```

</details>

### Health

#### `GET /health`

**URL** &nbsp; `http://localhost:4005/health`  
**Auth** &nbsp; None — open endpoint  
**Source** &nbsp; [`apps/menu-service/index.js`](../apps/menu-service/index.js)

Liveness probe. No auth.

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4005/health"
```

</details>

## analytics-service — port 4006

### Analytics

#### `GET /api/analytics/sales-totals`

**URL** &nbsp; `http://localhost:4006/api/analytics/sales-totals`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/analytics-service/src/routes/analytics.routes.js`](../apps/analytics-service/src/routes/analytics.routes.js)

period defaults to `weekly`.

| Query param | Example | Required |
|---|---|---|
| `period` | `weekly` | optional |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4006/api/analytics/sales-totals" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

</details>

#### `GET /api/analytics/orders-metrics`

**URL** &nbsp; `http://localhost:4006/api/analytics/orders-metrics`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/analytics-service/src/routes/analytics.routes.js`](../apps/analytics-service/src/routes/analytics.routes.js)

period defaults to `weekly`.

| Query param | Example | Required |
|---|---|---|
| `period` | `weekly` | optional |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4006/api/analytics/orders-metrics" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

</details>

#### `GET /api/analytics/blocked-users-count`

**URL** &nbsp; `http://localhost:4006/api/analytics/blocked-users-count`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/analytics-service/src/routes/analytics.routes.js`](../apps/analytics-service/src/routes/analytics.routes.js)

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4006/api/analytics/blocked-users-count" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

</details>

#### `GET /api/analytics/unpaid-orders-count`

**URL** &nbsp; `http://localhost:4006/api/analytics/unpaid-orders-count`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/analytics-service/src/routes/analytics.routes.js`](../apps/analytics-service/src/routes/analytics.routes.js)

| Query param | Example | Required |
|---|---|---|
| `customer_id` | `{{customer_id}}` | optional |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4006/api/analytics/unpaid-orders-count" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

</details>

#### `GET /api/analytics/top-selling-items`

**URL** &nbsp; `http://localhost:4006/api/analytics/top-selling-items`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/analytics-service/src/routes/analytics.routes.js`](../apps/analytics-service/src/routes/analytics.routes.js)

| Query param | Example | Required |
|---|---|---|
| `startDate` | `2026-09-01` | optional |
| `endDate` | `2026-09-30` | optional |
| `limit` | `10` | optional |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4006/api/analytics/top-selling-items" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

</details>

#### `GET /api/analytics/session-performance`

**URL** &nbsp; `http://localhost:4006/api/analytics/session-performance`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/analytics-service/src/routes/analytics.routes.js`](../apps/analytics-service/src/routes/analytics.routes.js)

sessionType is REQUIRED and must be breakfast | lunch | dinner — omitting it returns 400, not an unfiltered result.

| Query param | Example | Required |
|---|---|---|
| `sessionType` | `lunch` | **yes** |
| `startDate` | `2026-09-01` | optional |
| `endDate` | `2026-09-30` | optional |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4006/api/analytics/session-performance?sessionType=lunch" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

</details>

#### `GET /api/analytics/area-metrics`

**URL** &nbsp; `http://localhost:4006/api/analytics/area-metrics`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/analytics-service/src/routes/analytics.routes.js`](../apps/analytics-service/src/routes/analytics.routes.js)

| Query param | Example | Required |
|---|---|---|
| `areaId` | `{{area_id}}` | optional |
| `startDate` | `2026-09-01` | optional |
| `endDate` | `2026-09-30` | optional |

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4006/api/analytics/area-metrics" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

</details>

#### `GET /api/analytics/areas`

**URL** &nbsp; `http://localhost:4006/api/analytics/areas`  
**Auth** &nbsp; Bearer token — admin, super_admin  
**Source** &nbsp; [`apps/analytics-service/src/routes/analytics.routes.js`](../apps/analytics-service/src/routes/analytics.routes.js)

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4006/api/analytics/areas" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

</details>

### Health

#### `GET /health`

**URL** &nbsp; `http://localhost:4006/health`  
**Auth** &nbsp; None — open endpoint  
**Source** &nbsp; [`apps/analytics-service/index.js`](../apps/analytics-service/index.js)

Liveness probe. No auth.

<details><summary>curl</summary>

```bash
curl -X GET "http://localhost:4006/health"
```

</details>

## Not covered here

- **payment-service** — `apps/payment-service/` holds only a `package.json`. No routes.
- **websocket-service** (`:4008`) and menu-service's socket.io server (`:4005`) — event streams, not REST. menu-service emits `mealSessionItemUpdate` on inventory change; websocket-service rebroadcasts the Redis `order_updates` channel.
- **api-gateway** (`:4000`) — mostly unwired, `/orders` is commented out.

## Keeping this current

This file is generated. Editing it by hand means losing the edit on the next run.

Method, path and allowed roles are **parsed** from `apps/*/src/routes/*.js`, so a new route appears automatically. Request bodies, query params and prose cannot be inferred from a route line — they live in the `OVERRIDES` map in `scripts/gen-postman.js`, keyed by `"METHOD /mounted/path"`.

```bash
npm run docs:api      # regenerate this file and the Postman collection
npm run docs:api:check  # exit 1 if they are out of date (used by CI)
```

A pre-commit hook in `.githooks/` runs the generator whenever a route file is staged and adds the result to the commit. Enable it once per clone:

```bash
git config core.hooksPath .githooks
```

If you add a route without an `OVERRIDES` entry, the generator prints it under *No OVERRIDES entry* and documents it with no body — so it is visible, not silently missing.

