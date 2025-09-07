# Feature: Get Users List

## Overview
This feature allows retrieving a paginated list of users with optional search functionality.

## User Story
As a user, I want to see a list of all users so that I can discover and connect with other users in the platform.

## Acceptance Criteria

### Scenario: Get users with default pagination
```gherkin
Given the API is running
When I make a GET request to "/api/v1/users"
Then I should receive a 200 status code
And the response should contain a list of users
And the response should include pagination information
And the default page should be 1
And the default limit should be 10
```

### Scenario: Get users with custom pagination
```gherkin
Given the API is running
When I make a GET request to "/api/v1/users?page=2&limit=5"
Then I should receive a 200 status code
And the response should contain at most 5 users
And the pagination should show page 2
```

### Scenario: Search users by username or display name
```gherkin
Given the API is running
And there are users with usernames "john_doe" and "jane_smith"
When I make a GET request to "/api/v1/users?search=john"
Then I should receive a 200 status code
And the response should contain users matching "john"
And the search should be case-insensitive
```

### Scenario: Handle empty search results
```gherkin
Given the API is running
When I make a GET request to "/api/v1/users?search=nonexistent"
Then I should receive a 200 status code
And the response should contain an empty users array
And the total count should be 0
```

## API Endpoint
- **Method**: GET
- **Path**: `/api/v1/users`
- **Query Parameters**:
  - `page` (optional): Page number (default: 0)
  - `limit` (optional): Number of users per page (default: 10, max: 100)
  - `search` (optional): Search term for username or display name

## Response Format
```json
{
  "users": [
    {
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
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number"
  }
}
```

## Business Rules
1. Users are returned in creation order (newest first)
2. Search is case-insensitive and matches both username and display name
3. Maximum limit is 100 users per page
4. Pagination starts from page 1
5. Only verified users are included in the results
