# Feature: Get User by ID

## Overview
This feature allows retrieving detailed information about a specific user by their ID.

## User Story
As a user, I want to view detailed information about a specific user so that I can learn more about them before deciding to follow or interact.

## Acceptance Criteria

### Scenario: Get existing user by ID
```gherkin
Given the API is running
And there is a user with ID "valid-uuid"
When I make a GET request to "/api/v1/users/valid-uuid"
Then I should receive a 200 status code
And the response should contain the user's information
And the response should include the user's profile data
And the response should include follower/following counts
```

### Scenario: Get non-existent user by ID
```gherkin
Given the API is running
When I make a GET request to "/api/v1/users/non-existent-uuid"
Then I should receive a 404 status code
And the response should contain an error message "USER_NOT_FOUND"
```

### Scenario: Get user with invalid ID format
```gherkin
Given the API is running
When I make a GET request to "/api/v1/users/invalid-id"
Then I should receive a 400 status code
And the response should indicate invalid ID format
```

## API Endpoint
- **Method**: GET
- **Path**: `/api/v1/users/{userId}`
- **Path Parameters**:
  - `userId`: UUID of the user to retrieve

## Response Format

### Success Response (200)
```json
{
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "verified": "boolean",
    "created_at": "ISO string",
    "updated_at": "ISO string",
    "userProfile": {
      "id": "uuid",
      "icon": "string|null",
      "displayName": "string|null",
      "autobiography": "string|null",
      "backgroundImage": "string|null",
      "isFollowing": "boolean",
      "links": ["string"],
      "followersCount": "number",
      "followingCount": "number"
    }
  }
}
```

### Error Response (404)
```json
{
  "message": "USER_NOT_FOUND"
}
```

## Business Rules
1. Only existing users can be retrieved
2. User ID must be a valid UUID format
3. Response includes complete user profile information
4. Follower/following counts are calculated in real-time
5. Email is included in response for authenticated requests
