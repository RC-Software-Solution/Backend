# Requirements Backlog

Tracked gaps between [`Meal Order and Delivery Platform.md`](Meal%20Order%20and%20Delivery%20Platform.md) (the user-story spec) and the current implementation, found via a codebase cross-check on 2026-09-14.

Legend: ❌ Not implemented · ⚠️ Partial / mismatched · 🔁 Internal inconsistency

---

## Customer

- [ ] ❌ **National ID field missing from signup.** Spec requires first name, last name, national ID card number, email, phone. `User` model (`apps/user-service/src/models/User.js`) only has `full_name` (not split) and no `national_id` column at all.
  - Fix touches: `User.js` (add columns), `user.controller.js: signup()`, signup route validation.

- [ ] ❌ **Hostel / boarding-place / "other" location model doesn't exist.** Spec: customer picks hostel from a list + room number, OR boarding place from a list + nearest hostel, OR "Other" + free-text description. Actual: `locations-service` has a single flat `Area` model (`area_id`, `area_name` only — see `apps/locations-service/src/models/Area.model.js`), and `User.address` is just a free-text string. No `location_type`, no room number, no "nearest hostel" relation, no other-description field.
  - **Highest-impact item** — `area_id` is used as a foreign key from `User`, `Order`, and `delivery-service`'s auth context, so redesigning this touches three services, not just a form field.

- [ ] ⚠️ **"Edit my location details" (super admin side) is area-only.** `customer.controller.js: assignArea()` only sets `area_id`; there's no endpoint to edit a customer's address/location details generally. Depends on the location-model fix above.

- [ ] ⚠️ **Purchase history "last seven days" has no dedicated endpoint.** `order.controller.js: getOrders` supports `date_range` (`today`, `this_week`, `custom`, ...) which the frontend *could* use to build a 7-day view, but there's no explicit "last 7 days" filter or endpoint.

- [ ] ⚠️ **"Important notices" notifications don't exist as a feature.** `notificationService.js` / `emailService.js` are only wired into order and approval events. There is no admin-authored notice/announcement model or broadcast endpoint for customers to receive general notices.

---

## Delivery Person

- [ ] ❌ **No "mark as Delivered" endpoint.** `Order.status` enum includes `'delivered'`, but `order.routes.js` only exposes `PUT /:order_id/payment` (payment status). No route changes order status to delivered, so the whole "mark delivered" flow described in the spec has no backend support yet.

- [ ] ❌ **No search by order-code or user-code.** `delivery.controller.js` (`getAreaOrders`, `getMyAreaOrders`) only filters by `area_id`, `meal_time`, `date`, `payment_status` — no search-by-code capability, even though `Order.id` is already a human-readable code (`ORD-<timestamp>-<rand>`, generated in `Order.beforeValidate`) that's well-suited for this.

- [ ] ❌ **No live delivery stats (parcels/orders/money collected).** Spec wants running counts of total parcels, orders, and collected money that update as orders are marked delivered. No aggregation endpoint exists in `delivery-service` or `order-service` for this.

- [ ] ❌ **No yet-to-be-delivered count endpoint.** Closest existing thing is `getOrders?type=current`, which returns a list, not a count/summary suited for a live dashboard tile.

- [ ] ⚠️ **Daily unpaid list tracking.** `updatePaymentStatus` (both in `delivery.controller.js` and `order.controller.js`) can flip an order to `unpaid`/`paid`, but there's no daily rollup (order numbers + amounts) as described in the spec — depends on the stats endpoint above.

---

## Admin

- [ ] ❌ **Newsletter posts feature doesn't exist.** No `newsletter` concept anywhere in the codebase (models, controllers, or routes).

- [ ] ⚠️ **"Important notices" (admin-authored)** — same gap as the customer-side item above; needs a shared notice/announcement model + endpoints for admins to create and customers to receive.

---

## Super Admin

Meals, session times/quantities, and analytics (`analytics.controller.js`: sales totals, orders metrics, top-selling items, area metrics) are already well covered — no backlog items here beyond the location-edit item under Customer.

---

## Cross-cutting / Tech Debt

- [ ] 🔁 **Two parallel customer-approval mechanisms.** `user.controller.js: approveCustomer()` still uses the legacy `User.approved` boolean only, while `customer.controller.js: approveCustomer()` uses the newer `customer_status` enum + `UserStatusLog` audit trail (and also sets `approved`). Both controllers/routes appear to still be live. Confirm which one the frontend actually calls and remove or fully migrate the other — otherwise the two flags can drift out of sync.

- [ ] 🔒 **`GET /api/users/:userId` is unauthenticated.** Secrets are no longer returned (fixed 2026-09-26), but it still exposes email, phone and address to anyone with a user id. It's called by the auth middleware of order, menu, locations, analytics and delivery services. Move it behind `internalAuthMiddleware` (e.g. `/api/internal/users/:id`), update those 5 `userServiceClient`s to send `X-Internal-Key`, and add `INTERNAL_API_KEY` to menu-service and delivery-service in `docker/docker-compose.yml`.

- [ ] ⚠️ **delivery-service `orderServiceClient` is a shared singleton holding the last caller's auth header.** `setAuthHeader()` stores the token on the module-level instance, so concurrent requests can be forwarded with another user's token. Pass the header per call and remove `setAuthHeader`.

---

## Already covered (for reference — no action needed)

- Meal browsing by breakfast/lunch/dinner, veg/non-veg/other (`Food_Item.meal_type`, `Meal_Session.meal_time`)
- Meal images/price/description (`Food_Item.image_url/price/description`)
- Countdown timer + live quantity countdown (`Meal_Session.start_time/end_time`, `Meal_Session_Item.available_quantity`, pushed via Redis/websocket)
- Basket → confirm order (`POST /orders` accepts an `items[]` array)
- Edit/cancel order until session ends (`editOrder`/`deleteOrder` check `isOrderingAllowed()`)
- Block new orders after >2 unpaid orders (`createOrder` in `order.controller.js`)
- Super admin approve/reject signup + assign area, with audit log (`customer.controller.js`, `UserStatusLog`)
- Admin/Super admin meal & session management (`foodItem.controller.js`, `mealSession.controller.js`, `mealSessionItem.controller.js`)
- Super admin analytics: daily/weekly/monthly sales, orders metrics, top-selling items, area metrics
- Push/email notifications for approval events
