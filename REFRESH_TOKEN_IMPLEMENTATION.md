# Refresh Token Implementation

This document explains how the new refresh token system works for automatic token refresh in mobile clients.

## Overview

The auth middleware in all services has been updated to automatically handle refresh tokens when access tokens expire. This allows mobile clients to seamlessly refresh their tokens without requiring user re-authentication.

## How It Works

### 1. Login Process
When a user logs in, the system generates both an access token (7 days expiry) and a refresh token (30 days expiry):
- Access token: Contains user ID, role, and area_id
- Refresh token: Contains only user ID
- Refresh token is stored in the database for validation

### 2. Token Refresh Flow
When an access token expires:

1. **Client sends request** with expired access token in `Authorization: Bearer <token>` header
2. **Middleware detects expiration** and looks for refresh token in:
   - `X-Refresh-Token` header, or
   - `Authorization: Refresh <token>` header format
3. **If refresh token found**, middleware calls user service to validate and get new access token
4. **Response sent** with new access token and refresh instructions

### 3. Client Implementation

Mobile clients should implement the following pattern:

```javascript
// Example client implementation
async function makeAuthenticatedRequest(url, options = {}) {
  const accessToken = await getStoredAccessToken();
  const refreshToken = await getStoredRefreshToken();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
      'X-Refresh-Token': refreshToken
    }
  });
  
  // Check if token refresh is required
  if (response.status === 401 && response.headers.get('refresh_required')) {
    const data = await response.json();
    if (data.new_access_token) {
      // Store new access token
      await storeAccessToken(data.new_access_token);
      
      // Retry original request with new token
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${data.new_access_token}`,
          'X-Refresh-Token': refreshToken
        }
      });
    }
  }
  
  return response;
}
```

## API Endpoints

### Refresh Token Endpoint
- **URL**: `POST /refresh-token`
- **Body**: `{ "refresh_token": "your_refresh_token" }`
- **Response**: `{ "access_token": "new_access_token" }`

## Error Handling

### Token Expired Response
When a token expires and refresh fails:
```json
{
  "error": "Token has expired"
}
```

### Successful Refresh Response
When refresh succeeds:
```json
{
  "error": "Token expired",
  "refresh_required": true,
  "new_access_token": "new_access_token_here",
  "message": "Please retry the request with the new access token"
}
```

## Security Considerations

1. **Refresh tokens are stored in database** and validated on each refresh
2. **Refresh tokens expire after 30 days** requiring re-login
3. **Access tokens expire after 7 days** but can be refreshed seamlessly
4. **Only one refresh token per user** - new login invalidates previous refresh token

## Docker Compatibility

The auth utilities are now included locally in each service (`src/utils/auth-utils.js`) to ensure compatibility with Docker containers. Each service has its own copy of the auth utility functions, eliminating dependency issues when running in isolated containers.

### Required Dependencies

Make sure each service has `axios` installed for making HTTP requests to the user service:

```bash
# In each service directory
npm install axios
```

The following services have been updated with axios dependency:
- ✅ User Service (already had axios)
- ✅ Order Service (axios added)
- ✅ Delivery Service (axios added)

## Environment Variables

Make sure these environment variables are set:
- `USER_SERVICE_URL`: URL of the user service for token refresh calls
- `JWT_PUBLIC_KEY_PATH`: Path to JWT public key for token verification
- `JWT_PRIVATE_KEY_PATH`: Path to JWT private key for token signing
