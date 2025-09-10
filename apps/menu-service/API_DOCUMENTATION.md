# Menu Service API Documentation

## Overview
The Menu Service provides APIs for managing food items, meal sessions, session items, and inventory. All endpoints require authentication and admin/super-admin roles.

**Base URL:** `http://localhost:4005` (or your deployed URL)

## Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Food Items API

### 1. Create Food Item
**POST** `/api/food-items`

**Request Body:**
```json
{
  "name": "Chicken Biryani",
  "description": "Spicy rice dish with chicken and aromatic spices",
  "price": 250.00,
  "meal_type": "non-veg",
  "image_url": "https://example.com/images/biryani.jpg"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Food item created successfully",
  "data": {
    "id": 1,
    "name": "Chicken Biryani",
    "description": "Spicy rice dish with chicken and aromatic spices",
    "price": "250.00",
    "meal_type": "non-veg",
    "image_url": "https://example.com/images/biryani.jpg",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Get All Food Items
**GET** `/api/food-items`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `meal_type` (optional): Filter by meal type (`veg`, `non-veg`, `other`)

**Example:** `/api/food-items?page=1&limit=5&meal_type=veg`

**Response (200):**
```json
{
  "success": true,
  "message": "Food items retrieved successfully",
  "data": {
    "foodItems": [
      {
        "id": 1,
        "name": "Chicken Biryani",
        "description": "Spicy rice dish with chicken",
        "price": "250.00",
        "meal_type": "non-veg",
        "image_url": "https://example.com/biryani.jpg",
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 3. Get Single Food Item
**GET** `/api/food-items/:id`

**Example:** `/api/food-items/1`

**Response (200):**
```json
{
  "success": true,
  "message": "Food item retrieved successfully",
  "data": {
    "id": 1,
    "name": "Chicken Biryani",
    "description": "Spicy rice dish with chicken",
    "price": "250.00",
    "meal_type": "non-veg",
    "image_url": "https://example.com/biryani.jpg",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Update Food Item
**PUT** `/api/food-items/:id`

**Request Body:**
```json
{
  "name": "Mutton Biryani",
  "price": 300.00,
  "meal_type": "non-veg"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Food item updated successfully",
  "data": {
    "id": 1,
    "name": "Mutton Biryani",
    "description": "Spicy rice dish with chicken",
    "price": "300.00",
    "meal_type": "non-veg",
    "image_url": "https://example.com/biryani.jpg",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T11:45:00.000Z"
  }
}
```

### 5. Delete Food Item
**DELETE** `/api/food-items/:id`

**Example:** `/api/food-items/1`

**Response (200):**
```json
{
  "success": true,
  "message": "Food item deleted successfully"
}
```

## Meal Sessions API

### 1. Create Meal Session
**POST** `/api/meal-sessions`

**Request Body:**
```json
{
  "date": "2024-01-15",
  "meal_time": "lunch",
  "start_time": "12:00:00",
  "end_time": "14:00:00"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Meal session created successfully",
  "data": {
    "id": 1,
    "date": "2024-01-15",
    "meal_time": "lunch",
    "start_time": "12:00:00",
    "end_time": "14:00:00",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Get All Meal Sessions
**GET** `/api/meal-sessions`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `meal_time` (optional): Filter by meal time (`breakfast`, `lunch`, `dinner`)
- `date` (optional): Filter by specific date (YYYY-MM-DD)

**Example:** `/api/meal-sessions?page=1&limit=5&meal_time=lunch&date=2024-01-15`

**Response (200):**
```json
{
  "success": true,
  "message": "Meal sessions retrieved successfully",
  "data": {
    "mealSessions": [
      {
        "id": 1,
        "date": "2024-01-15",
        "meal_time": "lunch",
        "start_time": "12:00:00",
        "end_time": "14:00:00",
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z",
        "sessionItems": [
          {
            "id": 1,
            "meal_session_id": 1,
            "food_item_id": 1,
            "available_quantity": 50,
            "foodItem": {
              "id": 1,
              "name": "Chicken Biryani",
              "price": "250.00",
              "meal_type": "non-veg"
            }
          }
        ]
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 15,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 3. Get Single Meal Session
**GET** `/api/meal-sessions/:id`

**Example:** `/api/meal-sessions/1`

**Response (200):**
```json
{
  "success": true,
  "message": "Meal session retrieved successfully",
  "data": {
    "id": 1,
    "date": "2024-01-15",
    "meal_time": "lunch",
    "start_time": "12:00:00",
    "end_time": "14:00:00",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "sessionItems": [
      {
        "id": 1,
        "meal_session_id": 1,
        "food_item_id": 1,
        "available_quantity": 50,
        "foodItem": {
          "id": 1,
          "name": "Chicken Biryani",
          "price": "250.00",
          "meal_type": "non-veg"
        }
      }
    ]
  }
}
```

### 4. Update Meal Session
**PUT** `/api/meal-sessions/:id`

**Request Body:**
```json
{
  "start_time": "12:30:00",
  "end_time": "14:30:00"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Meal session updated successfully",
  "data": {
    "id": 1,
    "date": "2024-01-15",
    "meal_time": "lunch",
    "start_time": "12:30:00",
    "end_time": "14:30:00",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T11:45:00.000Z"
  }
}
```

### 5. Delete Meal Session
**DELETE** `/api/meal-sessions/:id`

**Example:** `/api/meal-sessions/1`

**Response (200):**
```json
{
  "success": true,
  "message": "Meal session deleted successfully"
}
```

### 6. Add Items to Meal Session
**POST** `/api/meal-sessions/:id/items`

**Request Body:**
```json
{
  "food_items": [
    {
      "food_item_id": 1,
      "available_quantity": 50
    },
    {
      "food_item_id": 2,
      "available_quantity": 30
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Food items added to meal session successfully",
  "data": [
    {
      "id": 1,
      "meal_session_id": 1,
      "food_item_id": 1,
      "available_quantity": 50,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "meal_session_id": 1,
      "food_item_id": 2,
      "available_quantity": 30,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## Meal Session Items API

### 1. Create Meal Session Item
**POST** `/api/meal-session-items`

**Request Body:**
```json
{
  "meal_session_id": 1,
  "food_item_id": 1,
  "available_quantity": 50
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Session item created",
  "data": {
    "id": 1,
    "meal_session_id": 1,
    "food_item_id": 1,
    "available_quantity": 50,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Get Items for a Session
**GET** `/api/meal-session-items/:meal_session_id`

**Example:** `/api/meal-session-items/1`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "meal_session_id": 1,
      "food_item_id": 1,
      "available_quantity": 50,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "foodItem": {
        "id": 1,
        "name": "Chicken Biryani",
        "price": "250.00",
        "meal_type": "non-veg"
      }
    }
  ]
}
```

### 3. Update Meal Session Item
**PUT** `/api/meal-session-items/:id`

**Request Body:**
```json
{
  "available_quantity": 40
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Session item updated",
  "data": {
    "id": 1,
    "meal_session_id": 1,
    "food_item_id": 1,
    "available_quantity": 40,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T11:45:00.000Z"
  }
}
```

### 4. Delete Meal Session Item
**DELETE** `/api/meal-session-items/:id`

**Example:** `/api/meal-session-items/1`

**Response (200):**
```json
{
  "success": true,
  "message": "Session item deleted"
}
```

## Inventory Management API

### 1. Decrement Item Availability
**POST** `/api/inventory/decrement`

**Request Body:**
```json
{
  "meal_session_id": 1,
  "food_item_id": 1,
  "quantity": 2
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Availability decremented successfully",
  "data": {
    "id": 1,
    "meal_session_id": 1,
    "food_item_id": 1,
    "available_quantity": 48,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T11:45:00.000Z"
  }
}
```

**Error Response (409) - Insufficient Quantity:**
```json
{
  "success": false,
  "error": "Insufficient quantity"
}
```

### 2. Increment Item Availability
**POST** `/api/inventory/increment`

**Request Body:**
```json
{
  "meal_session_id": 1,
  "food_item_id": 1,
  "quantity": 5
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Availability incremented successfully",
  "data": {
    "id": 1,
    "meal_session_id": 1,
    "food_item_id": 1,
    "available_quantity": 53,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T11:45:00.000Z"
  }
}
```

## WebSocket Events

### Real-time Inventory Updates
When inventory changes occur, the service emits WebSocket events:

**Event:** `mealSessionItemUpdate`

**Payload:**
```json
{
  "meal_session_id": 1,
  "food_item_id": 1,
  "available_quantity": 48
}
```

**Client-side JavaScript example:**
```javascript
const socket = io('http://localhost:4005');

socket.on('mealSessionItemUpdate', (data) => {
  console.log('Inventory updated:', data);
  // Update UI with new availability
  updateItemAvailability(data.meal_session_id, data.food_item_id, data.available_quantity);
});
```

## Error Responses

### Common Error Formats

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation error message"
}
```

**401 Unauthorized:**
```json
{
  "error": "Access denied. No token provided"
}
```

**403 Forbidden:**
```json
{
  "error": "You don't have permission to perform this action"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Resource not found"
}
```

**409 Conflict:**
```json
{
  "success": false,
  "message": "Resource already exists or constraint violation"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Failed to perform operation",
  "error": "Detailed error message"
}
```

## Health Check

### Service Status
**GET** `/health`

**Response (200):**
```json
{
  "status": "OK",
  "service": "menu-service",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Usage Examples

### Complete Workflow Example

1. **Create Food Items:**
```bash
curl -X POST http://localhost:4005/api/food-items \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Bread", "price": 20.00, "meal_type": "veg"}'
```

2. **Create Meal Session:**
```bash
curl -X POST http://localhost:4005/api/meal-sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date": "2024-01-15", "meal_time": "breakfast", "start_time": "08:00:00", "end_time": "10:00:00"}'
```

3. **Add Items to Session:**
```bash
curl -X POST http://localhost:4005/api/meal-sessions/1/items \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"food_items": [{"food_item_id": 1, "available_quantity": 100}]}'
```

4. **Decrement Availability (when order is placed):**
```bash
curl -X POST http://localhost:4005/api/inventory/decrement \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"meal_session_id": 1, "food_item_id": 1, "quantity": 2}'
```

This documentation covers all the APIs available in the Menu Service with sample requests and responses for easy integration.
