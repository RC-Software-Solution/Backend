# RC Backend — Overview

RC is a food-delivery platform: a customer app, a delivery-driver app, an admin console, and this repo — the backend microservices behind all three. This file is a brief orientation for anyone (including a future Claude Code session) opening this repo on its own, without the rest of the project's context. Full detail lives in the RC root: `../GO-LIVE-PLAYBOOK.md` and `../AWS-INFRASTRUCTURE-PLAYBOOK.md`.

## Branch note — read this first

**The real, current work lives on the `dev` branch, not `main`.** `main` is stale — it reflects an early scaffold stage. If you're looking at `main`, you're looking at the wrong version of this codebase.

## What's actually built (on `dev`)

An Nx monorepo, each app under `apps/` a plain Express service, not NestJS:

| Service | Status |
|---|---|
| `user-service` | Complete — auth, JWT (RS256) + refresh tokens, role-based customer lifecycle, password reset, email/push notifications |
| `order-service` | Complete — order CRUD, cross-service inventory compensation with menu-service, timezone-aware ordering windows, pre-orders |
| `menu-service` | Complete — food items, meal sessions, inventory, its own Socket.IO channel (see below) |
| `delivery-service` | Complete but thin — no own DB, proxies to order-service for area/payment-status views |
| `locations-service` | Complete — delivery area CRUD |
| `analytics-service` | Complete — pure aggregator, no own DB, fans out to the others' internal analytics endpoints |
| `websocket-service` | Exists, but prototype-quality — Redis→WebSocket broadcast, no auth, no scoping. **Deferred from launch** (see below) |
| `payment-service` | Empty stub. **Not being built for launch** — cash-on-delivery only, `order-service`/`delivery-service` already carry a `payment_status` field |
| `api-gateway` | Near-empty (11 lines). **Being retired**, not finished — AWS API Gateway handles routing instead |

## Why websocket-service and menu-service's Socket.IO are deferred

Neither is consumed by the current mobile apps (they poll on screen focus, not subscribe), so there's no product need for them yet. Keeping them out of launch scope lets the whole backend run on AWS Lambda with no persistent compute or Redis/ElastiCache cost. Revisit when a screen actually needs live push updates.

## Deployment direction

Every launch-scope service becomes a Lambda function behind one API Gateway (HTTP API), with a single-AZ RDS MySQL instance and no NAT Gateway anywhere in the design. See `../AWS-INFRASTRUCTURE-PLAYBOOK.md` for the full stack-by-stack breakdown, and its "Pending code changes" checklist for what still needs doing to this codebase before that deploy can happen (wrapping services with `serverless-http`, splitting user-service's Firebase/email calls off into a queue-based notifications function, a couple of known security gaps, and standardizing the Node version).

## Known gaps worth remembering

- `GET /api/users/:userId` has no auth — leaks user PII to anyone with a valid UUID.
- `customerBlockingService`'s auto-block job exists but is never scheduled to run.
- Internal service-to-service calls use a shared static `X-Internal-Key`, currently defaulting to `internal-dev-key` in dev — must not ship to production as-is.
- No formal DB migration tooling — schema changes are one-off manual SQL scripts.
- Zero automated test coverage anywhere in `apps/`.

## Target launch

Cash-on-delivery only, single market (Sri Lanka), AWS `ap-south-1`. Full timeline and budget: `../GO-LIVE-PLAYBOOK.md`.
