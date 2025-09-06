# API Testing Documentation

This directory contains comprehensive documentation and tools for testing the Order Service and Delivery Service APIs.

## 📁 Files Overview

### 📖 Documentation
- **[API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md)** - Complete API reference with sample URLs, JSON payloads, and responses
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Quick setup instructions for running the services

### 🛠️ Postman Tools
- **[postman_collection.json](./postman_collection.json)** - Ready-to-import Postman collection with all API endpoints

## 🚀 Quick Start

1. **Import Postman Collection**:
   - Open Postman
   - Click "Import" 
   - Select `postman_collection.json`

2. **Set Environment Variables**:
   ```
   order_service_url: http://localhost:4002
   delivery_service_url: http://localhost:4003
   jwt_token: your_jwt_token_here
   ```

3. **Start Testing**:
   - Follow the [SETUP_GUIDE.md](./SETUP_GUIDE.md) to run services
   - Use the pre-configured requests in the collection

## 📊 Services Overview

### 🛒 Order Service (Port 4002)
- **Authentication**: Required (JWT Token)
- **Endpoints**: 5 main endpoints for order management
- **Features**: Create, read, update, delete orders with role-based access

### 🚚 Delivery Service (Port 4003)
- **Authentication**: Not required (Internal service)
- **Endpoints**: 3 endpoints for delivery management
- **Features**: Area-based order filtering and payment status updates

## 🔗 API Endpoints Summary

| Service | Method | Endpoint | Description |
|---------|--------|----------|-------------|
| Order | POST | `/api/orders` | Create new order |
| Order | GET | `/api/orders` | Get orders with filters |
| Order | PUT | `/api/orders/:id` | Edit existing order |
| Order | PUT | `/api/orders/:id/payment` | Update payment status |
| Order | DELETE | `/api/orders/:id` | Delete order |
| Delivery | GET | `/api/delivery/orders/area` | Get area orders |
| Delivery | GET | `/api/delivery/orders/my-area` | Get my area orders |
| Delivery | PUT | `/api/delivery/orders/:id/payment` | Update payment status |

## 🔐 Authentication

Order Service requires JWT authentication with the following user roles:
- `customer` - Can manage own orders
- `delivery_person` - Can view orders in assigned area
- `admin` / `super_admin` - Can view/manage all orders

## 📝 Sample Data

The documentation includes realistic sample data for:
- Customer IDs
- Order IDs  
- Food items with descriptions
- Area IDs
- JSON payloads

## 🎯 Testing Tips

1. **Start with health checks** - Use simple GET requests first
2. **Verify authentication** - Ensure JWT token is valid
3. **Test error scenarios** - Try invalid inputs to test validation
4. **Use realistic data** - Use the provided sample data for consistency
5. **Check meal sessions** - Ensure meal sessions exist for current date/time

## 🆘 Need Help?

- Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) for common troubleshooting
- Verify all dependencies are installed and services are running
- Ensure database has required tables and meal session data
- Validate JWT token is not expired

---

*This documentation was generated for easy API testing with Postman and other API testing tools.*