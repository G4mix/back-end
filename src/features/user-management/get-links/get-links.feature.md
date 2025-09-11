# Get Personal Links Feature

## Overview
This feature allows authenticated users to retrieve their personal links or view another user's public links.

## Endpoints
- `GET /v1/user/links`

## Authentication
- Requires JWT token in Authorization header
- Format: `Bearer <token>`

## Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string (UUID) | No | The user profile ID to get links for (defaults to current user) |

## Response Format
```json
{
  "links": [
    {
      "id": "link-uuid",
      "url": "https://github.com/username",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "link-uuid-2",
      "url": "https://linkedin.com/in/username",
      "created_at": "2024-01-02T00:00:00.000Z"
    }
  ]
}
```

## Business Rules
1. Only authenticated users can access this endpoint
2. If no userId is provided, returns current user's links
3. Users can view any user's public links
4. Results are ordered by creation date (newest first)
5. Returns empty array if user has no links

## Error Responses
- `401 UNAUTHORIZED` - User not authenticated
- `400 INVALID_USER_ID` - Invalid user ID format
- `500 DATABASE_ERROR` - Database operation failed

## Examples

### Get current user's links
```bash
GET /v1/user/links
Authorization: Bearer <token>
```

### Get specific user's links
```bash
GET /v1/user/links?userId=123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer <token>
```
