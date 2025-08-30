# API Usage Guide - Drawn to Run

## Overview
This document provides comprehensive guidance for using the Drawn to Run API, including endpoint documentation, authentication requirements, request/response formats, and versioning information.

**Base URL**: `https://drawn-to-run.netlify.app/api`  
**Current Version**: v1.0  
**Last Updated**: August 29, 2024

---

## API Versioning

### Current Version: v1.0
**Release Date**: August 29, 2024  
**Status**: ✅ Stable  
**Breaking Changes**: None (initial release)

### Versioning Strategy
- **Major versions** (v1, v2): Breaking changes to request/response format
- **Minor versions** (v1.1, v1.2): New endpoints or optional fields
- **Patch versions** (v1.0.1): Bug fixes and security updates

### Version Headers
Include version in requests using the `Accept` header:
```
Accept: application/json; version=1.0
```

---

## Authentication

### Authentication Methods
1. **JWT Bearer Token** (Recommended for applications)
2. **Public Access** (Limited to read-only endpoints)

### Getting Access Token
```bash
# Login to get access token
curl -X POST https://drawn-to-run.netlify.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your_password"
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "participant"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here"
  }
}
```

### Using Access Token
Include the token in the Authorization header:
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://drawn-to-run.netlify.app/api/events
```

### Token Refresh
```bash
curl -X POST https://drawn-to-run.netlify.app/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "your_refresh_token"}'
```

---

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure_password"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "participant",
      "email_verified": false,
      "created_at": "2024-08-29T12:00:00Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here"
  }
}
```

#### POST /api/auth/login
Authenticate user and get access token.

**Authentication**: None required  
**Request**: See example above  
**Response**: See example above

#### GET /api/auth/me
Get current user information.

**Authentication**: Required (Bearer token)  
**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "participant",
    "email_verified": false,
    "created_at": "2024-08-29T12:00:00Z"
  }
}
```

#### POST /api/auth/logout
Logout user and invalidate tokens.

**Authentication**: Required (Bearer token)  
**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

### Event Endpoints

#### GET /api/events
List all events with optional filtering.

**Authentication**: None required  
**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `search` (optional): Search events by title or description
- `tags` (optional): Comma-separated tag IDs to filter by
- `location` (optional): Filter by location
- `date_from` (optional): Filter events from date (ISO 8601)
- `date_to` (optional): Filter events to date (ISO 8601)

**Example Request**:
```bash
curl "https://drawn-to-run.netlify.app/api/events?page=1&limit=10&tags=1,2&search=5K"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Central Park 5K Fun Run",
      "description": "Join us for a scenic 5K run through beautiful Central Park!",
      "event_date": "2025-09-15T14:00:00Z",
      "location": "Central Park, New York, NY",
      "latitude": 40.78296000,
      "longitude": -73.96540000,
      "distance_options": ["5K"],
      "capacity": 200,
      "registration_fee": "25.00",
      "early_bird_fee": "20.00",
      "early_bird_deadline": "2025-08-15T23:59:59Z",
      "banner_image": null,
      "status": "active",
      "created_at": "2025-08-17T21:06:10Z",
      "updated_at": "2025-08-17T21:06:10Z",
      "organizer": {
        "name": "Event Organizer",
        "email": "organizer@drawntorun.com",
        "profile_image": null
      },
      "tags": [
        {"id": 1, "name": "5K", "category": "distance", "color": "#3b82f6"},
        {"id": 7, "name": "Park", "category": "location", "color": "#22c55e"}
      ],
      "registration_count": 0,
      "comment_count": 0
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

#### POST /api/events
Create a new event.

**Authentication**: Required (organizer or admin role)  
**Request**:
```json
{
  "title": "Marathon Training Run",
  "description": "Long distance training run for marathon preparation",
  "event_date": "2024-10-15T08:00:00Z",
  "location": "Brooklyn Bridge Park, NY",
  "latitude": 40.7025,
  "longitude": -73.9962,
  "distance_options": ["10K", "Half Marathon"],
  "capacity": 150,
  "registration_fee": 35.00,
  "early_bird_fee": 25.00,
  "early_bird_deadline": "2024-09-15T23:59:59Z"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 2,
    "title": "Marathon Training Run",
    // ... full event object
  }
}
```

#### GET /api/events/:id
Get detailed information about a specific event.

**Authentication**: None required  
**Path Parameters**:
- `id`: Event ID (integer)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Central Park 5K Fun Run",
    // ... complete event details with organizer and tags
  }
}
```

#### PUT /api/events/:id
Update an existing event.

**Authentication**: Required (event creator or admin)  
**Path Parameters**: `id` - Event ID  
**Request**: Same as POST /api/events (all fields optional)

#### DELETE /api/events/:id
Delete an event.

**Authentication**: Required (admin only)  
**Path Parameters**: `id` - Event ID  
**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Event deleted successfully",
    "deleted_event": {
      "id": 1,
      "title": "Central Park 5K Fun Run"
    }
  }
}
```

---

### Event Registration Endpoints

#### POST /api/events/:id/register
Register for an event.

**Authentication**: Required  
**Path Parameters**: `id` - Event ID  
**Request**:
```json
{
  "distance": "5K"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "event_id": 1,
    "distance": "5K",
    "status": "registered",
    "registered_at": "2024-08-29T12:00:00Z"
  }
}
```

---

### Event Comments Endpoints

#### GET /api/events/:id/comments
Get comments for an event.

**Authentication**: None required  
**Path Parameters**: `id` - Event ID  
**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

#### POST /api/events/:id/comments
Add a comment to an event.

**Authentication**: Required  
**Path Parameters**: `id` - Event ID  
**Request**:
```json
{
  "content": "Looking forward to this event!",
  "parent_id": null
}
```

---

### User Endpoints

#### GET /api/users/:id
Get user profile information.

**Authentication**: None required  
**Path Parameters**: `id` - User ID  
**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "bio": "Passionate runner and event organizer",
    "profile_image": "https://example.com/avatar.jpg",
    "role": "participant",
    "email_verified": true,
    "created_at": "2024-08-01T12:00:00Z",
    "updated_at": "2024-08-29T12:00:00Z"
  }
}
```

#### PUT /api/users/:id
Update user profile.

**Authentication**: Required (own profile or admin)  
**Path Parameters**: `id` - User ID  
**Request**:
```json
{
  "name": "John Smith",
  "bio": "Updated bio text",
  "profile_image": "https://example.com/new-avatar.jpg"
}
```

---

### User Following Endpoints

#### POST /api/users/:id/follow
Follow a user.

**Authentication**: Required  
**Path Parameters**: `id` - User ID to follow  
**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "User followed successfully"
  }
}
```

#### DELETE /api/users/:id/follow
Unfollow a user.

**Authentication**: Required  
**Path Parameters**: `id` - User ID to unfollow

#### GET /api/users/:id/follow
Check follow status and get counts.

**Authentication**: Required  
**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "isFollowing": true,
    "targetUserId": 2,
    "followerCount": 45,
    "followingCount": 23
  }
}
```

#### GET /api/users/:id/followers
Get user's followers list.

**Authentication**: None required  
**Query Parameters**: Standard pagination (`page`, `limit`)

#### GET /api/users/:id/following
Get list of users being followed.

**Authentication**: None required  
**Query Parameters**: Standard pagination (`page`, `limit`)

---

### Utility Endpoints

#### GET /api/tags
Get all available tags.

**Authentication**: None required  
**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "5K",
      "category": "distance",
      "color": "#3b82f6"
    },
    {
      "id": 2,
      "name": "Marathon",
      "category": "distance", 
      "color": "#ef4444"
    }
  ]
}
```

#### POST /api/subscribe
Subscribe to email newsletter.

**Authentication**: None required  
**Request**:
```json
{
  "email": "subscriber@example.com"
}
```

---

## Response Format

### Success Response
All successful API responses follow this format:
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "meta": {
    // Optional metadata (pagination, etc.)
  }
}
```

### Error Response
All error responses follow this format:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed: email is required",
    "details": {
      "field": "email",
      "provided": null
    }
  }
}
```

### HTTP Status Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate email)
- `500 Internal Server Error`: Server error

---

## Error Codes

### Authentication Errors
- `AUTH_REQUIRED`: Authentication token required
- `AUTH_INVALID`: Invalid or expired token
- `AUTH_FORBIDDEN`: Insufficient permissions

### Validation Errors
- `VALIDATION_ERROR`: Request data validation failed
- `MISSING_FIELD`: Required field missing
- `INVALID_FORMAT`: Field format invalid

### Resource Errors
- `RESOURCE_NOT_FOUND`: Requested resource not found
- `RESOURCE_CONFLICT`: Resource already exists
- `CAPACITY_EXCEEDED`: Event registration capacity full

### Server Errors
- `DATABASE_ERROR`: Database operation failed
- `INTERNAL_ERROR`: Unexpected server error

---

## Rate Limiting

### Current Limits
**Note**: Rate limiting not yet implemented (see Known Issues #13)

### Planned Limits (Future Implementation)
- **Public endpoints**: 100 requests/hour per IP
- **Authenticated endpoints**: 1000 requests/hour per user
- **Event creation**: 10 events/day per organizer
- **Comment posting**: 60 comments/hour per user

### Rate Limit Headers (Future)
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459200
```

---

## Pagination

### Standard Pagination
Most list endpoints support pagination:

**Request Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response Meta**:
```json
{
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## CORS Policy

### Allowed Origins
- `https://drawn-to-run.netlify.app` (production)
- `http://localhost:5173` (development)
- `http://localhost:8888` (Netlify dev)

### Allowed Methods
- GET, POST, PUT, DELETE, OPTIONS

### Allowed Headers
- Content-Type, Authorization, Accept

---

## Best Practices

### 1. Always Handle Errors
```javascript
async function fetchEvents() {
  try {
    const response = await fetch('/api/events');
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error.message);
    }
    
    return result.data;
  } catch (error) {
    console.error('Failed to fetch events:', error);
    throw error;
  }
}
```

### 2. Use Proper Content-Type
Always include proper headers:
```javascript
const response = await fetch('/api/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(eventData)
});
```

### 3. Handle Authentication
Store and refresh tokens appropriately:
```javascript
// Check if token is expired before requests
if (isTokenExpired(accessToken)) {
  accessToken = await refreshToken(refreshToken);
}
```

### 4. Implement Retry Logic
Handle temporary failures:
```javascript
async function apiRequest(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response.json();
      if (response.status >= 400 && response.status < 500) {
        // Client error, don't retry
        break;
      }
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

---

## API Changelog

### v1.0 (August 29, 2024)
**Initial Release**
- ✅ Authentication endpoints (register, login, logout, me)
- ✅ Event CRUD operations (list, create, get, update, delete)
- ✅ Event registration system
- ✅ Event comments system  
- ✅ User profile management
- ✅ User following system (follow, unfollow, followers, following)
- ✅ Tag system and filtering
- ✅ Email newsletter subscription

**Critical Fixes**:
- Fixed Netlify function deployment issues
- Resolved event detail API 404 errors
- Standardized function naming and structure

**Known Limitations**:
- No rate limiting implemented
- No API versioning headers
- Limited error detail in some responses

### Upcoming Releases

#### v1.1 (Planned)
- Rate limiting implementation
- Enhanced error responses with more detail
- API versioning headers
- Performance optimizations

#### v1.2 (Planned)
- Strava integration endpoints
- Webhook endpoints for real-time updates
- Advanced search and filtering options

#### v2.0 (Future)
- Breaking changes to authentication flow
- Enhanced security features
- Real-time notifications via WebSocket

---

## Support and Contributing

### Reporting Issues
- **GitHub Issues**: [Repository Issues](https://github.com/your-org/drawn-to-run/issues)
- **Security Issues**: Email security@drawntorun.com

### API Support
For API-specific questions or integration help:
- Check this documentation first
- Review error responses for troubleshooting hints
- Test endpoints with provided examples

### Contributing
See project README for development setup and contribution guidelines.

---

**Document Version**: 1.0  
**Last Updated**: August 29, 2024  
**Next Review**: September 15, 2024

*This document is version-controlled and updated with each API release. Always reference the latest version for accurate information.*