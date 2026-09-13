# Graph Report - Backend  (2026-09-13)

## Corpus Check
- Corpus is ~27,316 words - fits in a single context window. You may not need a graph.

## Summary
- 1051 nodes · 1325 edges · 66 communities (46 shown, 8 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 103 edges (avg confidence: 0.86)
- Token cost: 0 input · 115,490 output

## Community Hubs (Navigation)
- Locations Service Core
- Order Service Core
- Shared Lint & Test Config
- Platform Docs & Deployment Notes
- User Service Build Config
- User Auth & Token Core
- Analytics Service Core
- Delivery Service Core
- Order Service Dependencies
- Websocket Service Core
- User Service Dependencies
- Menu Service Dependencies
- Delivery Service Dependencies
- Order Internal Analytics
- Analytics Data Services
- Locations Service Dependencies
- Root Dev Dependencies
- Customer Management
- Analytics Service Dependencies
- Meal Session Items
- User Internal Analytics
- API Gateway Dependencies
- Menu Service Data Models
- User Profile & Signup
- Customer Auto-Blocking Job
- Base TS Config
- Menu Service Realtime Wiring
- Meal Session Management
- Food Item Management
- Nx Workspace Config
- Inventory Management
- User Service E2E Project Config
- Menu Service Auth Utils
- User Service Auth Utils
- Order to Menu Service Client
- Payment Service Stub
- User & Status Log Models
- Push Notification Service
- User Service App TS Config
- User Service Spec TS Config
- E2E TS Config
- E2E Spec TS Config
- Approval Notifications
- User Service Root TS Config
- Menu to User Service Client
- API Gateway Proxy
- Nx MCP Server Config
- Nx Copilot Instructions
- Refresh Token Flow Doc
- Meal Session API Docs
- Health Check Endpoint
- API Gateway Overview Entry
- Payment Service Overview Entry
- Login Process Doc Node

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 15 edges
2. `request()` - 14 edges
3. `call()` - 10 edges
4. `getInternalHeaders()` - 10 edges
5. `options` - 10 edges
6. `authMiddleware()` - 9 edges
7. `user-service (Docker Compose service)` - 9 edges
8. `emitInventoryUpdate()` - 8 edges
9. `MenuServiceClient` - 8 edges
10. `order-service (Docker Compose service)` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Nx Workspace Scaffold README` --conceptually_related_to--> `RC Backend Platform`  [AMBIGUOUS]
  README.md → OVERVIEW.md
- `user-service` --conceptually_related_to--> `Refresh Token System`  [INFERRED]
  OVERVIEW.md → REFRESH_TOKEN_IMPLEMENTATION.md
- `locations-service` --conceptually_related_to--> `locations-service (Docker Compose service)`  [INFERRED]
  OVERVIEW.md → docker/docker-compose.yml
- `analytics-service` --conceptually_related_to--> `analytics-service (Docker Compose service)`  [INFERRED]
  OVERVIEW.md → docker/docker-compose.yml
- `Shared Static X-Internal-Key Gap` --shares_data_with--> `INTERNAL_API_KEY default 'internal-dev-key'`  [INFERRED]
  OVERVIEW.md → docker/docker-compose.yml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Docker Compose Local Dev Stack** — docker_docker_compose_redis, docker_docker_compose_db, docker_docker_compose_user_service, docker_docker_compose_order_service, docker_docker_compose_delivery_service, docker_docker_compose_locations_service, docker_docker_compose_menu_service, docker_docker_compose_analytics_service, docker_docker_compose_websocket_service, docker_docker_compose_phpmyadmin [EXTRACTED 1.00]
- **RC Backend Microservices (Nx Monorepo Apps)** — overview_user_service, overview_order_service, overview_menu_service, overview_delivery_service, overview_locations_service, overview_analytics_service, overview_websocket_service, overview_payment_service, overview_api_gateway [EXTRACTED 1.00]
- **Refresh Token Authentication Flow** — refresh_token_implementation_refresh_token_system, refresh_token_implementation_auth_middleware, refresh_token_implementation_refresh_token_endpoint, overview_user_service, docker_docker_compose_user_service [INFERRED 0.85]

## Communities (66 total, 8 thin omitted)

### Community 0 - "Locations Service Core"
Cohesion: 0.05
Nodes (40): app, areaRoutes, cors, express, internalRoutes, { Sequelize }, Area, createArea() (+32 more)

### Community 1 - "Order Service Core"
Cohesion: 0.05
Nodes (38): app, cors, express, internalAnalyticsRoutes, orderRoutes, buildDateFilter(), createOrder(), { DateTime } (+30 more)

### Community 2 - "Shared Lint & Test Config"
Cohesion: 0.04
Nodes (42): dependencies, axios, cors, dotenv, express, http-proxy-middleware, axios, cors (+34 more)

### Community 3 - "Platform Docs & Deployment Notes"
Cohesion: 0.06
Nodes (42): Food Items API, Inventory Management API (Decrement/Increment), mealSessionItemUpdate WebSocket Event, Cross-Day Session Handling, Future Order Placement Rules, target_date Field on Orders, UTC-Only Time Zone Handling, analytics-service (Docker Compose service) (+34 more)

### Community 4 - "User Service Build Config"
Cohesion: 0.05
Nodes (40): configurations, defaultConfiguration, executor, options, outputs, development, production, buildTarget (+32 more)

### Community 5 - "User Auth & Token Core"
Cohesion: 0.07
Nodes (33): Redis, { comparePassword, hashPassword }, forgotPassword(), { generateAccessToken, generateRefreshToken }, {
  generatePasswordResetToken,
  verifyResetToken,
  clearResetToken,
}, login(), resetPassword(), User (+25 more)

### Community 6 - "Analytics Service Core"
Cohesion: 0.09
Nodes (33): analyticsRoutes, app, cors, express, helmet, areaAnalyticsService, getAreaMetrics(), getAreas() (+25 more)

### Community 7 - "Delivery Service Core"
Cohesion: 0.07
Nodes (27): app, cors, deliveryRoutes, express, helmet, morgan, getAreaOrders(), getMyAreaOrders() (+19 more)

### Community 8 - "Order Service Dependencies"
Cohesion: 0.05
Nodes (37): author, dependencies, axios, cors, dotenv, express, helmet, ioredis (+29 more)

### Community 9 - "Websocket Service Core"
Cohesion: 0.06
Nodes (33): app, express, http, { initWebSocketServer, broadcast }, server, { subscriber }, author, dependencies (+25 more)

### Community 10 - "User Service Dependencies"
Cohesion: 0.06
Nodes (35): author, dependencies, axios, bcryptjs, cors, dotenv, express, firebase-admin (+27 more)

### Community 11 - "Menu Service Dependencies"
Cohesion: 0.06
Nodes (30): author, dependencies, axios, cors, dotenv, express, jsonwebtoken, luxon (+22 more)

### Community 12 - "Delivery Service Dependencies"
Cohesion: 0.07
Nodes (28): author, dependencies, axios, cors, dotenv, express, helmet, jsonwebtoken (+20 more)

### Community 13 - "Order Internal Analytics"
Cohesion: 0.11
Nodes (23): { Sequelize }, getAreaMetrics(), getDateRange(), getOrdersByCustomerId(), getOrdersMetrics(), getSalesTotals(), getSessionPerformance(), getTopSellingItems() (+15 more)

### Community 14 - "Analytics Data Services"
Cohesion: 0.15
Nodes (21): getAreaById(), getAreas(), { request, getInternalHeaders, DEFAULT_TIMEOUT_MS }, getMealSessions(), { request, getInternalHeaders, DEFAULT_TIMEOUT_MS }, buildUrl(), call(), getAreaMetrics() (+13 more)

### Community 15 - "Locations Service Dependencies"
Cohesion: 0.08
Nodes (25): author, dependencies, axios, cors, dotenv, express, jsonwebtoken, mysql2 (+17 more)

### Community 16 - "Root Dev Dependencies"
Cohesion: 0.08
Nodes (26): devDependencies, esbuild, eslint, eslint-config-prettier, @eslint/js, jest, jest-environment-node, nx (+18 more)

### Community 17 - "Customer Management"
Cohesion: 0.13
Nodes (21): assignArea(), disableCustomer(), enableCustomer(), exportCustomers(), getCustomerProfile(), listCustomers(), logStatusChange(), orderServiceClient (+13 more)

### Community 18 - "Analytics Service Dependencies"
Cohesion: 0.10
Nodes (20): dependencies, cors, dotenv, express, helmet, jsonwebtoken, devDependencies, nodemon (+12 more)

### Community 19 - "Meal Session Items"
Cohesion: 0.14
Nodes (18): createMealSessionItem(), { DateTime }, deleteMealSessionItem(), { emitInventoryUpdate }, isSessionAvailable(), listMealSessionItems(), listMealSessionItemsByTime(), { Meal_Session_Item, Meal_Session, Food_Item } (+10 more)

### Community 20 - "User Internal Analytics"
Cohesion: 0.11
Nodes (16): app, authRoutes, cors, customerRoutes, express, helmet, internalAnalyticsRoutes, morgan (+8 more)

### Community 21 - "API Gateway Dependencies"
Cohesion: 0.11
Nodes (18): author, dependencies, cors, dotenv, express, http-proxy-middleware, description, cors (+10 more)

### Community 22 - "Menu Service Data Models"
Cohesion: 0.13
Nodes (13): { Sequelize }, { DataTypes }, Food_Item, sequelize, Meal_Session_Item, { DataTypes }, { DataTypes }, Meal_Session_Item (+5 more)

### Community 23 - "User Profile & Signup"
Cohesion: 0.14
Nodes (16): deleteAccount(), getProfile(), getUserById(), { hashPassword }, { sendEmail }, { sendPushNotification }, signup(), User (+8 more)

### Community 24 - "Customer Auto-Blocking Job"
Cohesion: 0.16
Nodes (11): { checkAllAcceptedCustomers }, run(), autoBlockCustomerIfNeeded(), checkAllAcceptedCustomers(), checkAndBlockCustomerById(), getUnpaidCountForCustomer(), orderServiceClient, User (+3 more)

### Community 25 - "Base TS Config"
Cohesion: 0.11
Nodes (17): compileOnSave, compilerOptions, baseUrl, declaration, emitDecoratorMetadata, experimentalDecorators, importHelpers, lib (+9 more)

### Community 26 - "Menu Service Realtime Wiring"
Cohesion: 0.12
Nodes (14): app, clients, cors, express, foodItemRoutes, http, inventoryRoutes, io (+6 more)

### Community 27 - "Meal Session Management"
Cohesion: 0.17
Nodes (14): addItemsToMealSession(), createMealSession(), { DateTime }, deleteMealSession(), getAllMealSessions(), getMealSessionById(), { Meal_Session, Food_Item, Meal_Session_Item }, updateMealSession() (+6 more)

### Community 28 - "Food Item Management"
Cohesion: 0.18
Nodes (13): createFoodItem(), deleteFoodItem(), { Food_Item }, getAllFoodItems(), getFoodItemById(), updateFoodItem(), Food_Item, adminRoles (+5 more)

### Community 29 - "Nx Workspace Config"
Cohesion: 0.13
Nodes (14): defaultBase, extends, namedInputs, default, sharedGlobals, cache, dependsOn, inputs (+6 more)

### Community 30 - "Inventory Management"
Cohesion: 0.19
Nodes (12): { decrementAvailability, incrementAvailability }, decrementItemAvailability(), { emitInventoryUpdate }, incrementItemAvailability(), adminRoles, { authMiddleware }, { checkRole }, {
  decrementItemAvailability,
  incrementItemAvailability
} (+4 more)

### Community 31 - "User Service E2E Project Config"
Cohesion: 0.15
Nodes (12): dependsOn, executor, options, outputs, implicitDependencies, name, jestConfig, passWithNoTests (+4 more)

### Community 32 - "Menu Service Auth Utils"
Cohesion: 0.27
Nodes (10): authMiddleware(), fs, getPublicKey(), jwt, { refreshAccessToken, getRefreshTokenFromRequest, sendTokenRefreshResponse }, userServiceClient, axios, getRefreshTokenFromRequest() (+2 more)

### Community 33 - "User Service Auth Utils"
Cohesion: 0.29
Nodes (9): authMiddleware(), fs, jwt, { refreshAccessToken, getRefreshTokenFromRequest, sendTokenRefreshResponse }, User, axios, getRefreshTokenFromRequest(), refreshAccessToken() (+1 more)

### Community 35 - "Payment Service Stub"
Cohesion: 0.20
Nodes (9): author, description, keywords, license, main, name, scripts, test (+1 more)

### Community 36 - "User & Status Log Models"
Cohesion: 0.20
Nodes (7): { Sequelize }, { DataTypes }, sequelize, User, { DataTypes }, sequelize, UserStatusLog

### Community 37 - "Push Notification Service"
Cohesion: 0.22
Nodes (7): admin, keyPath, path, serviceAccount, admin, path, firebase-admin

### Community 38 - "User Service App TS Config"
Cohesion: 0.22
Nodes (8): compilerOptions, module, outDir, types, exclude, extends, include, ./tsconfig.json

### Community 39 - "User Service Spec TS Config"
Cohesion: 0.22
Nodes (8): compilerOptions, module, moduleResolution, outDir, types, extends, include, ./tsconfig.json

### Community 40 - "E2E TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, esModuleInterop, extends, files, include, ../../tsconfig.base.json, references

### Community 41 - "E2E Spec TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, module, outDir, types, extends, include, ./tsconfig.json

### Community 42 - "Approval Notifications"
Cohesion: 0.29
Nodes (7): approveCustomer(), approveCustomer(), nodemailer, sendEmail(), transporter, sendPushNotification(), nodemailer

### Community 43 - "User Service Root TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, esModuleInterop, extends, files, include, ../../tsconfig.base.json, references

### Community 45 - "API Gateway Proxy"
Cohesion: 0.50
Nodes (3): app, { createProxyMiddleware }, express

### Community 47 - "Nx Copilot Instructions"
Cohesion: 0.67
Nodes (3): Nx CI Error Guidelines Workflow, Nx Generation Guidelines Workflow, Nx MCP Server

### Community 48 - "Refresh Token Flow Doc"
Cohesion: 0.67
Nodes (3): Auth Middleware (Refresh Detection), POST /refresh-token Endpoint, Token Refresh Flow

## Ambiguous Edges - Review These
- `RC Backend Platform` → `Nx Workspace Scaffold README`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to

## Knowledge Gaps
- **635 isolated node(s):** `npx`, `express`, `cors`, `helmet`, `analyticsRoutes` (+630 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 666 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `RC Backend Platform` and `Nx Workspace Scaffold README`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `socket.io` connect `Menu Service Realtime Wiring` to `Menu Service Dependencies`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `firebase-admin` connect `Push Notification Service` to `User Service Dependencies`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `nodemailer` connect `Approval Notifications` to `User Service Dependencies`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **What connects `npx`, `express`, `cors` to the rest of the system?**
  _635 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Locations Service Core` be split into smaller, more focused modules?**
  _Cohesion score 0.050314465408805034 - nodes in this community are weakly interconnected._
- **Should `Order Service Core` be split into smaller, more focused modules?**
  _Cohesion score 0.05297532656023222 - nodes in this community are weakly interconnected._