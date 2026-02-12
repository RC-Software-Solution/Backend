# Quick Setup Guide for API Testing

## Prerequisites
1. Node.js installed
2. MySQL database running
3. Redis server running (for order-service)

## Starting the Services

### 1. Order Service (Port 4002)
```bash
cd apps/order-service
npm install
npm start
```

### 2. Delivery Service (Port 4003)
```bash
cd apps/delivery-service
npm install
npm start
```

## Environment Configuration

### Order Service (.env)
```
PORT=4002
DB_HOST=db
DB_USER=root
DB_NAME=rc
DB_PASSWORD=
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
JWT_SECRET=your_secret_key
```

### Delivery Service (.env)
```
PORT=4003
ORDER_SERVICE_URL=http://localhost:4002
```

## Database Setup Requirements

### Required Tables:
1. `orders` - Main orders table
2. `order_items` - Order items table
3. `meal_sessions` - Meal session configuration
4. `users` - User data (from user-service)

### Sample Meal Session Data:
```sql
INSERT INTO meal_sessions (meal_time, start_time, end_time, order_limit, current_orders, date) VALUES
('breakfast', '07:00:00', '10:00:00', 100, 0, CURDATE()),
('lunch', '12:00:00', '15:00:00', 150, 0, CURDATE()),
('dinner', '19:00:00', '22:00:00', 120, 0, CURDATE());
```

## Getting JWT Token

To test Order Service APIs, you'll need a JWT token from the user-service. The token should include:
- User ID
- User role (customer, delivery_person, admin, super_admin)
- User area_id (for delivery persons)

## Testing Workflow

1. Start both services
2. Ensure database is set up with required tables and data
3. Get JWT token from user-service
4. Import `postman_collection.json` into Postman
5. Set environment variables in Postman:
   - `order_service_url`: http://localhost:4002
   - `delivery_service_url`: http://localhost:4003
   - `jwt_token`: Your JWT token
6. Start testing with the provided requests

## Troubleshooting

### Common Issues:
1. **Database connection errors**: Check database is running and credentials are correct
2. **Redis connection errors**: Ensure Redis server is running
3. **Authentication errors**: Verify JWT token is valid and not expired
4. **Meal session not found**: Ensure meal sessions exist for current date
5. **User not found**: Verify user exists in user-service database

### Service Dependencies:
- Order Service depends on: Database, Redis, User Service
- Delivery Service depends on: Order Service

## Quick Test Commands

### Test Order Service Health:
```bash
curl http://localhost:4002/api/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -G -d "type=pending"
```

### Test Delivery Service Health:
```bash
curl "http://localhost:4003/api/delivery/orders/area?area_id=1"
```