# Add Personal Link Feature

## Overview
This feature allows authenticated users to add personal links to their profile. Links can be social media profiles, websites, portfolios, etc.

## Endpoints
- `POST /api/v1/user/links`

## Authentication
- Requires JWT token in Authorization header
- Format: `Bearer <token>`

## Request Body
```json
{
  "url": "https://github.com/username"
}
```

## Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| url | string | Yes | The URL to add (must start with http:// or https://, max 700 chars) |

## Response Format
```json
{
  "link": {
    "id": "link-uuid",
    "url": "https://github.com/username",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

## Business Rules
1. Only authenticated users can add links
2. Links must start with http:// or https://
3. Maximum URL length is 700 characters
4. Users can add multiple links to their profile
5. Links are associated with the authenticated user's profile

## Validation Rules
- URL must be a valid URL format
- URL must start with http:// or https://
- URL length must not exceed 700 characters

## Error Responses
- `401 UNAUTHORIZED` - User not authenticated
- `400 INVALID_URL` - Invalid URL format
- `400 URL_TOO_LONG` - URL exceeds maximum length
- `400 URL_MUST_START_WITH_HTTP` - URL must start with http:// or https://
- `500 DATABASE_ERROR` - Database operation failed

## Examples

### Add GitHub profile
```bash
POST /api/v1/user/links
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://github.com/username"
}
```

### Add LinkedIn profile
```bash
POST /api/v1/user/links
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://linkedin.com/in/username"
}
```

### Add personal website
```bash
POST /api/v1/user/links
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://mywebsite.com"
}
```
