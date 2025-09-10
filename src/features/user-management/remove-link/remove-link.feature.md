# Remove Personal Link Feature

## Overview
This feature allows authenticated users to remove personal links from their profile. Only the owner of the link can remove it.

## Endpoints
- `DELETE /api/v1/user/links/:linkId`

## Authentication
- Requires JWT token in Authorization header
- Format: `Bearer <token>`

## Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| linkId | string (UUID) | Yes | The ID of the link to remove |

## Response Format
- Success: `200 OK` with message "Link removed successfully"
- Error: Appropriate error message

## Business Rules
1. Only authenticated users can remove links
2. Users can only remove their own links
3. Link must exist and belong to the authenticated user
4. Operation is irreversible

## Error Responses
- `401 UNAUTHORIZED` - User not authenticated
- `404 LINK_NOT_FOUND` - Link not found or doesn't belong to user
- `400` - Invalid link ID format
- `500 DATABASE_ERROR` - Database operation failed

## Examples

### Remove a link
```bash
DELETE /api/v1/user/links/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer <token>
```

### Response for successful removal
```
200 OK
Link removed successfully
```

### Response for link not found
```
404 Not Found
LINK_NOT_FOUND
```
