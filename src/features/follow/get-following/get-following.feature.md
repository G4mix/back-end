# Get Following Feature

## Overview
This feature allows authenticated users to retrieve a paginated list of users that a specific user profile is following.

## Endpoints
- `GET /api/v1/follow/following`

## Authentication
- Requires JWT token in Authorization header
- Format: `Bearer <token>`

## Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string (UUID) | Yes | The user profile ID to get following for |
| page | number | No | Page number (0-based, default: 0) |
| limit | number | No | Number of items per page (default: 10, max: 100) |

## Response Format
```json
{
  "following": [
    {
      "id": "follow-uuid",
      "followingUser": {
        "id": "user-profile-uuid",
        "displayName": "User Display Name",
        "icon": "https://example.com/icon.jpg",
        "username": "username"
      },
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 0,
    "limit": 10,
    "total": 15,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Business Rules
1. Only authenticated users can access this endpoint
2. Users can view who any user is following
3. Pagination starts at page 0
4. Maximum limit is 100 items per page
5. Results are ordered by creation date (newest first)

## Error Responses
- `401 UNAUTHORIZED` - User not authenticated
- `400 INVALID_USER_ID` - Invalid user ID format
- `500 DATABASE_ERROR` - Database operation failed

## Examples

### Get first page of following
```bash
GET /api/v1/follow/following?userId=123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer <token>
```

### Get second page with custom limit
```bash
GET /api/v1/follow/following?userId=123e4567-e89b-12d3-a456-426614174000&page=1&limit=5
Authorization: Bearer <token>
```
