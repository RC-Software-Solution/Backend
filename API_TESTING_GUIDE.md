# API Testing Guide for Delivery Service and Order Service

This guide provides comprehensive information for testing the APIs of both delivery-service and order-service using Postman or any other API testing tool.

## Base URLs

- **Order Service**: `http://localhost:4002`
- **Delivery Service**: `http://localhost:4003`

## Authentication

### Order Service
- **Authentication Required**: Yes (JWT Token)
- **Header**: `Authorization: Bearer <your_jwt_token>`
- **Role-based Access**: customer, delivery_person, admin, super_admin

### Delivery Service
- **Authentication Required**: No (Internal service)

---

## Order Service APIs (`http://localhost:4002`)

### 1. Create Order
**POST** `/api/orders`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <your_jwt_token>
```

**Sample JSON Payload:**
```json
{
  "customer_id": "CUST-1234567890-abc123",
  "items": [
    {
      "quantity": 2,
      "food_name": "Chicken Biryani",
      "food_description": "Delicious chicken biryani with basmati rice",
      "meal_type": "non-veg",
      "price": 250.00
    },
    {
      "quantity": 1,
      "food_name": "Vegetable Curry",
      "food_description": "Mixed vegetable curry with spices",
      "meal_type": "veg",
      "price": 150.00
    }
  ],
  "total_price": 650.00,
  "meal_time": "lunch"
}
```

**Expected Response:**
```json
{
  "message": "Order placed successfully",
  "order_id": "ORD-1734567890123-abc123"
}
```

### 2. Get Orders
**GET** `/api/orders`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Query Parameters:**
- `type` (required): "current" or "pending"
- `meal_time` (required for type=current): "breakfast", "lunch", or "dinner"
- `date` (optional): "YYYY-MM-DD" format
- `limit` (optional): Number of records (default: 10)
- `offset` (optional): Pagination offset (default: 0)
- `customer_id` (optional): Filter by customer ID (admin only)
- `area_id` (optional): Filter by area ID (admin only)
- `payment_status` (optional): "pending", "paid", "unpaid"

**Sample URLs:**
```
GET /api/orders?type=current&meal_time=lunch
GET /api/orders?type=pending&limit=20&offset=0
GET /api/orders?type=current&meal_time=dinner&date=2024-01-15
GET /api/orders?type=current&meal_time=breakfast&payment_status=pending
```

**Expected Response:**
```json
{
  "message": "Orders retrieved successfully",
  "orders": [
    {
      "id": "ORD-1734567890123-abc123",
      "customer_id": "CUST-1234567890-abc123",
      "area_id": 1,
      "status": "pending",
      "meal_time": "lunch",
      "total_price": "650.00",
      "payment_status": "pending",
      "created_at": "2024-01-15T12:00:00.000Z",
      "updated_at": "2024-01-15T12:00:00.000Z",
      "order_items": [
        {
          "id": "ORDITM-1734567890123-def456",
          "order_id": "ORD-1734567890123-abc123",
          "quantity": 2,
          "food_name": "Chicken Biryani",
          "food_description": "Delicious chicken biryani with basmati rice",
          "meal_type": "non-veg",
          "price": "250.00"
        }
      ]
    }
  ],
  "limit": 10,
  "offset": 0
}
```

### 3. Edit Order
**PUT** `/api/orders/:order_id`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <your_jwt_token>
```

**Sample URL:**
```
PUT /api/orders/ORD-1734567890123-abc123
```

**Sample JSON Payload:**
```json
{
  "items": [
    {
      "quantity": 3,
      "food_name": "Chicken Biryani",
      "food_description": "Delicious chicken biryani with basmati rice",
      "meal_type": "non-veg",
      "price": 250.00
    },
    {
      "quantity": 2,
      "food_name": "Dal Tadka",
      "food_description": "Traditional dal with tempering",
      "meal_type": "veg",
      "price": 120.00
    }
  ],
  "total_price": 990.00
}
```

**Expected Response:**
```json
{
  "message": "Order updated successfully"
}
```

### 4. Update Payment Status
**PUT** `/api/orders/:order_id/payment`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <your_jwt_token>
```

**Sample URL:**
```
PUT /api/orders/ORD-1734567890123-abc123/payment
```

**Sample JSON Payload:**
```json
{
  "payment_status": "paid"
}
```

**Valid payment_status values:** `"pending"`, `"paid"`, `"unpaid"`

**Expected Response:**
```json
{
  "message": "Payment status updated successfully",
  "order_id": "ORD-1734567890123-abc123",
  "payment_status": "paid",
  "order": {
    "id": "ORD-1734567890123-abc123",
    "customer_id": "CUST-1234567890-abc123",
    "area_id": 1,
    "payment_status": "paid",
    "status": "pending",
    "total_price": "650.00",
    "meal_time": "lunch"
  }
}
```

### 5. Delete Order
**DELETE** `/api/orders/:order_id`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Sample URL:**
```
DELETE /api/orders/ORD-1734567890123-abc123
```

**Expected Response:**
```json
{
  "message": "Order deleted successfully"
}
```

---

## Delivery Service APIs (`http://localhost:4003`)

### 1. Get Area Orders
**GET** `/api/delivery/orders/area`

**Query Parameters:**
- `area_id` (required): Area ID to filter orders
- `meal_time` (optional): "breakfast", "lunch", or "dinner"
- `date` (optional): "YYYY-MM-DD" format
- `payment_status` (optional): "pending", "paid", "failed" (default: "pending")

**Sample URLs:**
```
GET /api/delivery/orders/area?area_id=1
GET /api/delivery/orders/area?area_id=1&meal_time=lunch
GET /api/delivery/orders/area?area_id=1&meal_time=dinner&date=2024-01-15
GET /api/delivery/orders/area?area_id=1&payment_status=pending
```

**Expected Response:**
```json
{
  "message": "Orders retrieved successfully",
  "area_id": "1",
  "meal_time": "lunch",
  "date": "today",
  "payment_status": "pending",
  "orders": [
    {
      "id": "ORD-1734567890123-abc123",
      "customer_id": "CUST-1234567890-abc123",
      "area_id": 1,
      "status": "pending",
      "meal_time": "lunch",
      "total_price": "650.00",
      "payment_status": "pending",
      "created_at": "2024-01-15T12:00:00.000Z"
    }
  ],
  "total": 1
}
```

### 2. Get My Area Orders (Delivery Person)
**GET** `/api/delivery/orders/my-area`

**Query Parameters:**
- `area_id` (required): Delivery person's assigned area ID

**Sample URLs:**
```
GET /api/delivery/orders/my-area?area_id=1
```

**Expected Response:**
```json
{
  "message": "Your area orders retrieved successfully",
  "area_id": "1",
  "orders": [
    {
      "id": "ORD-1734567890123-abc123",
      "customer_id": "CUST-1234567890-abc123",
      "area_id": 1,
      "status": "pending",
      "meal_time": "lunch",
      "total_price": "650.00",
      "payment_status": "pending",
      "created_at": "2024-01-15T12:00:00.000Z"
    }
  ],
  "total": 1
}
```

### 3. Update Payment Status (Delivery Service)
**PUT** `/api/delivery/orders/:order_id/payment`

**Headers:**
```
Content-Type: application/json
```

**Sample URL:**
```
PUT /api/delivery/orders/ORD-1734567890123-abc123/payment
```

**Sample JSON Payload:**
```json
{
  "payment_status": "paid"
}
```

**Valid payment_status values:** `"pending"`, `"paid"`, `"unpaid"`

**Expected Response:**
```json
{
  "message": "Payment status updated successfully",
  "order_id": "ORD-1734567890123-abc123",
  "payment_status": "paid",
  "result": {
    "message": "Payment status updated successfully",
    "order_id": "ORD-1734567890123-abc123",
    "payment_status": "paid"
  }
}
```

---

## Sample Data for Testing

### Sample Customer IDs
```
CUST-1734567890-abc123
CUST-1734567891-def456
CUST-1734567892-ghi789
```

### Sample Order IDs
```
ORD-1734567890123-abc123
ORD-1734567891234-def456
ORD-1734567892345-ghi789
```

### Sample Area IDs
```
1, 2, 3, 4, 5
```

### Sample Food Items
```json
[
  {
    "quantity": 1,
    "food_name": "Chicken Biryani",
    "food_description": "Aromatic basmati rice with tender chicken",
    "meal_type": "non-veg",
    "price": 280.00
  },
  {
    "quantity": 2,
    "food_name": "Paneer Butter Masala",
    "food_description": "Creamy tomato-based curry with paneer",
    "meal_type": "veg",
    "price": 220.00
  },
  {
    "quantity": 1,
    "food_name": "Fish Curry",
    "food_description": "Spicy fish curry with coconut",
    "meal_type": "non-veg",
    "price": 300.00
  },
  {
    "quantity": 3,
    "food_name": "Dal Tadka",
    "food_description": "Yellow lentils with tempering",
    "meal_type": "veg",
    "price": 120.00
  }
]
```

---

## Error Responses

### Common Error Responses

**401 Unauthorized:**
```json
{
  "error": "Access denied. No token provided"
}
```

**400 Bad Request:**
```json
{
  "message": "Missing or invalid required fields"
}
```

**404 Not Found:**
```json
{
  "message": "Order not found"
}
```

**500 Internal Server Error:**
```json
{
  "message": "Server error"
}
```

---

## JWT Token Requirements

For testing Order Service APIs, you'll need a valid JWT token. The token should contain:
- `id`: User ID
- Standard JWT claims (exp, iat, etc.)

The user data fetched from the user-service should include:
- `role`: "customer", "delivery_person", "admin", or "super_admin"
- `area_id`: User's assigned area ID (for delivery persons)

---

## Testing Tips

1. **Start Services**: Ensure both services are running on their respective ports
2. **Database**: Make sure the database is set up and meal sessions are configured
3. **Authentication**: Obtain a valid JWT token from the user-service first
4. **Role Testing**: Test with different user roles to verify access control
5. **Data Validation**: Test with invalid data to verify error handling
6. **Meal Sessions**: Ensure meal sessions exist for the date/time you're testing
7. **Time Windows**: Order editing/deletion may be restricted to meal session time windows

## Postman Collection Setup

1. Create a new collection in Postman
2. Set up environment variables:
   - `order_service_url`: `http://localhost:4002`
   - `delivery_service_url`: `http://localhost:4003`
   - `jwt_token`: Your authentication token
3. Import the sample requests from this guide
4. Use `{{order_service_url}}` and `{{delivery_service_url}}` in your requests
5. Set authorization header as `Bearer {{jwt_token}}` for Order Service requests