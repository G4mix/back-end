# Feature: Delete User Account

## Overview
This feature allows users to permanently delete their own account and all associated data.

## User Story
As a user, I want to delete my account so that I can remove all my personal data from the platform when I no longer wish to use it.

## Acceptance Criteria

### Scenario: Delete own account successfully
```gherkin
Given the API is running
And I am authenticated as user "valid-uuid"
When I make a DELETE request to "/api/v1/users/valid-uuid"
Then I should receive a 200 status code
And the response should contain success message "USER_DELETED_SUCCESSFULLY"
And my user account should be permanently deleted
And my profile images should be removed from storage
And all my associated data should be removed
```

### Scenario: Try to delete another user's account
```gherkin
Given the API is running
And I am authenticated as user "user-a-uuid"
When I make a DELETE request to "/api/v1/users/user-b-uuid"
Then I should receive a 403 status code
And the response should contain error message "FORBIDDEN"
And the other user's account should remain unchanged
```

### Scenario: Delete non-existent user account
```gherkin
Given the API is running
And I am authenticated as user "valid-uuid"
When I make a DELETE request to "/api/v1/users/non-existent-uuid"
Then I should receive a 404 status code
And the response should contain error message "USER_NOT_FOUND"
```

### Scenario: Delete account without authentication
```gherkin
Given the API is running
When I make a DELETE request to "/api/v1/users/any-uuid" without authentication
Then I should receive a 401 status code
And the request should be rejected
```

## API Endpoint
- **Method**: DELETE
- **Path**: `/api/v1/users/{userId}`
- **Authentication**: Required (JWT)
- **Path Parameters**:
  - `userId`: UUID of the user account to delete

## Response Format

### Success Response (200)
```json
{
  "message": "USER_DELETED_SUCCESSFULLY"
}
```

### Error Responses

#### Forbidden (403)
```json
{
  "message": "FORBIDDEN"
}
```

#### Not Found (404)
```json
{
  "message": "USER_NOT_FOUND"
}
```

#### Unauthorized (401)
```json
{
  "message": "UNAUTHORIZED"
}
```

## Business Rules
1. Users can only delete their own accounts
2. Account deletion is permanent and irreversible
3. All user data is removed including:
   - User profile information
   - Profile images (icon and background)
   - Associated posts, comments, likes
   - Follow relationships
4. Files are removed from cloud storage
5. Authentication token becomes invalid after deletion
6. User ID must be a valid UUID format
