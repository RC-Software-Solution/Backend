# Postman — RC Backend

Every REST endpoint across the six services: **75 requests** (73 routes + 2 health checks), in
`rc-backend.postman_collection.json`.

The collection is generated from the Express route files by [`scripts/gen-postman.js`](../../scripts/gen-postman.js).
Add a route, re-run the script, and it appears. Don't hand-edit the JSON — edits are overwritten on
the next run. See [Regenerating](#regenerating).

Prefer reading to clicking? The same generator writes [`docs/API.md`](../API.md) — every endpoint
with its URL, auth, params, body and a copy-pasteable curl.

## ⚠️ Run this against a disposable database

The collection contains `DELETE`, `reject` and `disable` requests. They act on whatever
`{{area_id}}`, `{{customer_id}}` and friends currently hold — **which may be real rows**.

A full run against a shared DB will, among other things, disable or unapprove whichever customer
`{{customer_id}}` points at, including the account you logged in as. List endpoints now capture ids
only when the variable is still empty, so a create-then-delete folder operates on its own row rather
than the first pre-existing one — but that is a guard rail, not a guarantee. Point this at a local
or throwaway database.

## Quick start

1. **Import both files** into Postman (drag and drop):
   - `rc-backend.postman_collection.json`
   - `rc-backend.postman_environment.json`
2. **Select the `RC Backend — local` environment** from the top-right dropdown.
3. **Fill in the six credential fields** in the environment (Environments → RC Backend — local).
   Find an account per role with:
   ```sql
   SELECT id, email, role, approved, status FROM users WHERE status = 'active';
   ```
   You need one `admin` (or `super_admin`), one `delivery_person`, and one `customer`. Passwords are
   whatever they were set to — if you don't have them, `apps/user-service/reset-admin-password.js`
   resets the admin.
4. **Start the stack** if it isn't up: `docker compose -f docker/docker-compose.yml up -d`.
5. **Run the `_Setup` folder.** The three logins save `adminToken`, `deliveryToken` and
   `customerToken`. Every other request picks its token up automatically.

After that, any request in any folder is one click.

## How it's wired

**Base URLs are collection variables**, one per service — `{{userApi}}` … `{{analyticsApi}}`,
defaulting to `http://localhost:4001`–`4006`. Change the port or point at a deployed host by editing
the collection variable, not each request.

Requests go **straight to the service ports, not through the api-gateway**. The gateway
([`apps/api-gateway/index.js`](../../apps/api-gateway/index.js)) only proxies `/users` and
`/api/analytics`, and its `/orders` route is commented out, so it can't serve most of these.

**Auth is per-request, by role.** Each request uses the *least-privileged* token that its route
accepts, so a 403 means a real authorization bug rather than a collection that over-privileges
everything. Internal endpoints use the `X-Internal-Key` header instead of a bearer token; the key
defaults to `internal-dev-key`, matching `docker-compose.yml`.

**IDs chain automatically.** Create requests save their new id into a collection variable
(`{{order_id}}`, `{{food_item_id}}`, `{{area_id}}`, …) that later requests consume, so a top-to-bottom
Collection Runner pass works. Clicking a single `PUT /api/orders/:order_id/...` in isolation will 404
until something has populated `{{order_id}}` — run the `GET /api/orders` in the same folder first.

**Dates are computed, not hardcoded.** A collection-level pre-request script sets `{{today}}` to the
current Asia/Colombo date before every request, so meal sessions and orders don't go stale overnight.

**Two tests run against every request automatically** (collection-level): no 5xx, and a response
under 5 seconds. Per-endpoint assertions are deliberately not included — add them where you care.

**Ordering has three gates** beyond auth, all of which return 400: the customer must have an
`area_id`, they must have fewer than 2 `unpaid` orders, and the clock must be inside the session
window.

## Seeding order

The database currently has **0 food items and 0 meal sessions**, so ordering will fail until a menu
exists. Build one in this order:

1. `locations-service → Areas → POST /api/areas` (one area already exists, `area_id = 1`)
2. `menu-service → Food Items → POST /api/food-items`
3. `menu-service → Meal Sessions → POST /api/meal-sessions` — ships with a `00:00:00`–`23:59:00`
   window on `{{today}}`, so ordering is always open. `isOrderingAllowed` compares the **current
   Asia/Colombo time** against the window, so a realistic 11:30–14:00 session only accepts orders
   during those hours. Narrow it when you want to test the rejection path.
4. `menu-service → Meal Sessions → POST /api/meal-sessions/:id/items` — attaches stock
5. `order-service → Orders → POST /api/orders`

## Bugs found while building this — fixed 2026-09-26

| Where | Was | Fix |
|---|---|---|
| `food_items.id` | No `AUTO_INCREMENT` in the DB although [`Food_Items.js`](../../apps/menu-service/src/models/Food_Items.js) declares `autoIncrement: true`, so `POST /api/food-items` always failed with *Field 'id' doesn't have a default value* | `ALTER TABLE food_items MODIFY id INT NOT NULL AUTO_INCREMENT;` — applied. Needed `SET FOREIGN_KEY_CHECKS=0` around it because `meal_session_items.fk_food` references the column. Both tables were empty, so no renumbering. |
| [`area.routes.js`](../../apps/locations-service/src/routes/area.routes.js) | Roles spelled with **hyphens** (`super-admin`, `delivery-person`) while tokens carry **underscores**, so only a plain `admin` could reach any area route — super-admins and delivery staff were locked out | Role lists corrected to `super_admin` / `delivery_person`. Area reads now use `{{deliveryToken}}` in the collection, matching who the route is meant for. |
| [`user.routes.js`](../../apps/user-service/src/routes/user.routes.js) | `GET /api/users/:userId` had **no auth middleware** at all. Marked "internal", but port 4001 is published, so anyone could read any user record — name, email, phone, address — by id | Moved behind `internalAuthMiddleware` (`X-Internal-Key`), matching the other internal routes. All four callers now send the header. |

A second round, found by running the whole collection against the live stack:

| Where | Was | Fix |
|---|---|---|
| [`customer.controller.js`](../../apps/user-service/src/controllers/customer.controller.js), [`user.controller.js`](../../apps/user-service/src/controllers/user.controller.js) | Approving a customer returned **500 while the approval succeeded**. `await sendEmail(...)` sat inside the try after `customer.save()`, so a dead SMTP account turned a committed write into an error. Admins saw a failure and retried an action that had already worked. | New `sendEmailQuietly()` in [`emailService.js`](../../apps/user-service/src/services/emailService.js) logs and returns `false` instead of throwing, mirroring `sendPushNotification`. Both approve paths use it. `sendEmail` still throws for password reset, where the email *is* the deliverable. |
| [`orderItems.js`](../../apps/order-service/src/utils/orderItems.js) (new) | `POST /api/orders` 404'd with *"One or more session items not found"* when `food_item_id` arrived as a JSON **string**. The lookup is `new Map(sessionItems.map(si => [si.food_item_id, si]))` — numeric keys — and `Map.has("53")` misses. | `normalizeItems()` coerces `food_item_id` at the request boundary in both `createOrder` and `editOrder`. Non-numeric ids become `NaN`, which stays falsy so the existing not-found guard still fires. Covered by [`orderItems.test.js`](../../apps/order-service/src/utils/orderItems.test.js). |
| [`delivery.controller.js`](../../apps/delivery-service/src/controllers/delivery.controller.js) | `PUT /api/delivery/orders/:id/payment` turned order-service's **404 into a 500**. `updateOrderStatus` had an `if (error.status)` forwarding guard; `updatePaymentStatus` never got it. | Same guard added. A bogus order id now returns 404 with the upstream body. |

Checked and **not** changed: `payment_status: 'ignored'` exists in the DB enum but both order-service
and delivery-service reject it identically, so they agree — there is nothing to reconcile.

The `X-Internal-Key` change needed the callers fixed in the same change, or the API would have broken:
[analytics](../../apps/analytics-service/src/services/userServiceClient.js),
[locations](../../apps/locations-service/src/services/userServiceClient.js),
[menu](../../apps/menu-service/src/services/userServiceClient.js) and
[order](../../apps/order-service/src/services/userServiceClient.js) all call it to resolve a user's
`area_id`, and all four called it anonymously. menu-service also had no `INTERNAL_API_KEY` in
`docker-compose.yml`; it does now.

Not a bug, but easy to trip over: `food_items.meal_type` is `veg | non-veg | other` (**dietary**),
while `meal_sessions.meal_time` is `breakfast | lunch | dinner`. Similar names, unrelated enums. The
bodies here use the right values for each.

## Still open

**`meal_session_items.food_item_id` is `ON DELETE CASCADE`, and `deleteFoodItem` is a hard delete**
([foodItem.controller.js](../../apps/menu-service/src/controllers/foodItem.controller.js) — the model
is not `paranoid` and the table has no `deleted_at`). Deleting a food item silently strips it from
every meal session, including one that is currently open and taking orders.

Already-placed orders are safe: `order_items` snapshots `food_name`, `food_description`, `meal_type`
and `price` and holds no FK to `food_items`, so menu edits never rewrite order history or revenue
figures. It is the live sessions that are exposed.

Cheapest fix, if you want deletes to fail loudly instead:

```sql
ALTER TABLE meal_session_items DROP FOREIGN KEY fk_food;
ALTER TABLE meal_session_items ADD CONSTRAINT fk_food
  FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE RESTRICT;
```

Left alone for now — it changes delete behaviour rather than repairing something broken.

## Not covered

- **payment-service** — [`apps/payment-service/`](../../apps/payment-service/) contains only a
  `package.json`. No routes, no server.
- **websocket-service** (`:4008`) and menu-service's socket.io server (`:4005`) — event streams, not
  REST. Postman can open a WebSocket request manually; menu-service emits `mealSessionItemUpdate`
  when inventory changes, and websocket-service rebroadcasts the Redis `order_updates` channel.
- **api-gateway** (`:4000`) — not running and mostly unwired; see above.

## Regenerating

```bash
npm run docs:api          # rewrite this collection, the environment and docs/API.md
npm run docs:api:check    # exit 1 if they are stale — runs in CI
```

Re-import the collection afterwards (Postman won't pick up file changes on its own).

A pre-commit hook regenerates automatically whenever a route file is staged. Enable it once per
clone:

```bash
git config core.hooksPath .githooks
```

Method, path and allowed roles are parsed from the route files. Request bodies, query params and
descriptions can't be inferred from a route line, so they live in the `OVERRIDES` map at the top of
the script, keyed by `"METHOD /mounted/path"`. If you add a route and don't add an entry, the script
prints it under *No OVERRIDES entry* and ships the request with no body — so nothing goes missing
silently.

## Related

- [`notifications.postman_collection.json`](notifications.postman_collection.json) — the narrower,
  scenario-ordered collection for the notifications feature, with assertions on push behaviour.
  Keep using it for that flow; this one is for breadth.
- [`../notifications.md`](../notifications.md) — notifications feature guide.
