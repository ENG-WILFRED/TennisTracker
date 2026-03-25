# Community API Documentation

## Overview

The Community API enables users to engage in social features including posts, comments, likes, and following other users. All endpoints require authentication via NextAuth session.

## Base URL
```
/api/community
```

## Authentication
All endpoints require a valid NextAuth session. Requests without a session will receive a `401 Unauthorized` response.

---

## GET Endpoints

### 1. Get User Feed

**Endpoint:** `GET /api/community?action=feed`

Retrieves a paginated feed of posts from users you follow and your own posts.

**Query Parameters:**
- `action` (required): `"feed"`
- `userId` (optional): User ID to fetch feed for (defaults to current user)
- `page` (optional, default: 1): Page number for pagination
- `pageSize` (fixed): 10 posts per page

**Response:**
```json
{
  "posts": [
    {
      "id": "post_123",
      "content": "Just had an amazing match! 🎾",
      "visibility": "public",
      "createdAt": "2025-03-15T10:30:00Z",
      "author": {
        "email": "user@example.com",
        "name": "John Doe",
        "image": "https://..."
      },
      "comments": [
        {
          "id": "comment_1",
          "content": "Great post!",
          "author": {
            "email": "friend@example.com",
            "name": "Jane Smith",
            "image": "https://..."
          },
          "createdAt": "2025-03-15T11:00:00Z"
        }
      ],
      "commentCount": 1,
      "reactionCount": 5,
      "userHasLiked": false
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 45,
    "pages": 5
  }
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized

---

### 2. Explore Public Posts

**Endpoint:** `GET /api/community?action=explore`

Retrieves all public posts for content discovery.

**Query Parameters:**
- `action` (required): `"explore"`
- `page` (optional, default: 1): Page number for pagination

**Response:** Same structure as feed endpoint

**Status Codes:**
- `200`: Success
- `401`: Unauthorized

---

### 3. Get User Followers

**Endpoint:** `GET /api/community?action=followers`

Retrieves list of followers for a user.

**Query Parameters:**
- `action` (required): `"followers"`
- `userId` (optional): User ID (defaults to current user)

**Response:**
```json
{
  "followers": [
    {
      "id": "user_123",
      "email": "follower@example.com",
      "name": "Alex Johnson",
      "image": "https://..."
    }
  ]
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized

---

### 4. Get User Following

**Endpoint:** `GET /api/community?action=following`

Retrieves list of users that a user is following.

**Query Parameters:**
- `action` (required): `"following"`
- `userId` (optional): User ID (defaults to current user)

**Response:**
```json
{
  "following": [
    {
      "id": "user_456",
      "email": "following@example.com",
      "name": "Sam Williams",
      "image": "https://..."
    }
  ]
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized

---

## POST Endpoints

### 1. Create a Post

**Endpoint:** `POST /api/community`

Creates a new community post.

**Request Body:**
```json
{
  "action": "create-post",
  "data": {
    "content": "Just completed a great practice session! 💪",
    "visibility": "public"
  }
}
```

**Fields:**
- `content` (required, string): Post content (must not be empty)
- `visibility` (optional, string): "public" or "private" (defaults to "public")

**Response:**
```json
{
  "id": "post_789",
  "content": "Just completed a great practice session! 💪",
  "visibility": "public",
  "authorId": "user_123",
  "createdAt": "2025-03-15T12:00:00Z",
  "author": {
    "email": "user@example.com",
    "name": "John Doe",
    "image": "https://..."
  }
}
```

**Status Codes:**
- `201`: Post created successfully
- `400`: Empty content
- `401`: Unauthorized

---

### 2. Delete a Post

**Endpoint:** `POST /api/community`

Deletes a post (only author can delete).

**Request Body:**
```json
{
  "action": "delete-post",
  "data": {
    "postId": "post_789"
  }
}
```

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
- `200`: Post deleted successfully
- `401`: Unauthorized or not author

---

### 3. Add a Comment

**Endpoint:** `POST /api/community`

Adds a comment to a post.

**Request Body:**
```json
{
  "action": "add-comment",
  "data": {
    "postId": "post_789",
    "content": "Great post! Keep it up!"
  }
}
```

**Fields:**
- `postId` (required, string): UUID of the post
- `content` (required, string): Comment content (must not be empty)

**Response:**
```json
{
  "id": "comment_456",
  "postId": "post_789",
  "authorId": "user_456",
  "content": "Great post! Keep it up!",
  "createdAt": "2025-03-15T12:15:00Z",
  "author": {
    "email": "commenter@example.com",
    "name": "Jane Smith",
    "image": "https://..."
  }
}
```

**Status Codes:**
- `201`: Comment created successfully
- `400`: Empty content
- `401`: Unauthorized

---

### 4. Delete a Comment

**Endpoint:** `POST /api/community`

Deletes a comment (only author can delete).

**Request Body:**
```json
{
  "action": "delete-comment",
  "data": {
    "commentId": "comment_456"
  }
}
```

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
- `200`: Comment deleted successfully
- `401`: Unauthorized or not author

---

### 5. Like/Unlike a Post

**Endpoint:** `POST /api/community`

Toggles like status on a post. If already liked, it unlikes. If not liked, it likes.

**Request Body:**
```json
{
  "action": "like-post",
  "data": {
    "postId": "post_789"
  }
}
```

**Response (Like):**
```json
{
  "action": "liked",
  "reaction": {
    "id": "reaction_123",
    "postId": "post_789",
    "userId": "user_123",
    "type": "like",
    "createdAt": "2025-03-15T12:20:00Z"
  }
}
```

**Response (Unlike):**
```json
{
  "action": "unliked"
}
```

**Status Codes:**
- `200`: Like/unlike successful
- `401`: Unauthorized

---

### 6. Follow/Unfollow User

**Endpoint:** `POST /api/community`

Toggles follow status on a user. If already following, it unfollows. If not following, it follows.

**Request Body:**
```json
{
  "action": "follow",
  "data": {
    "userId": "user_456"
  }
}
```

**Response (Follow):**
```json
{
  "action": "followed",
  "follow": {
    "followerId": "user_123",
    "followingId": "user_456"
  }
}
```

**Response (Unfollow):**
```json
{
  "action": "unfollowed"
}
```

**Status Codes:**
- `201`: Follow successful (when following)
- `200`: Unfollow successful
- `400`: Cannot follow yourself
- `401`: Unauthorized

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error description"
}
```

### Common Errors:

- **`401 Unauthorized`**: Missing or invalid session
- **`400 Bad Request`**: Invalid request body or parameters
- **`500 Internal Server Error`**: Server-side error

---

## Usage Examples

### JavaScript/TypeScript Example

```typescript
// Fetch user feed
async function getUserFeed(page = 1) {
  const response = await fetch(`/api/community?action=feed&page=${page}`);
  return response.json();
}

// Create a post
async function createPost(content: string) {
  const response = await fetch('/api/community', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'create-post',
      data: { content }
    })
  });
  return response.json();
}

// Like a post
async function toggleLike(postId: string) {
  const response = await fetch('/api/community', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'like-post',
      data: { postId }
    })
  });
  return response.json();
}

// Follow a user
async function toggleFollow(userId: string) {
  const response = await fetch('/api/community', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'follow',
      data: { userId }
    })
  });
  return response.json();
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding in production:
- 100 posts per user per day
- 1000 comments per user per day
- 500 follows per user per day

---

## Database Schema

### CommunityPost
```prisma
model CommunityPost {
  id        String   @id @default(cuid())
  authorId  String
  content   String
  visibility String  @default("public")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### PostComment
```prisma
model PostComment {
  id        String   @id @default(cuid())
  postId    String
  authorId  String
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### PostReaction
```prisma
model PostReaction {
  postId    String
  userId    String
  type      String
  createdAt DateTime @default(now())
  
  @@id([postId, userId])
}
```

### UserFollower
```prisma
model UserFollower {
  followerId  String
  followingId String
  createdAt   DateTime @default(now())
  
  @@id([followerId, followingId])
}
```
