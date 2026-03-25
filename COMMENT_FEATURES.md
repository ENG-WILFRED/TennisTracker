# Comment Replies & Reactions - Implementation Guide

## Overview

The Community Post system now supports:
1. **Reading Comments** - Comments on posts with author info and metadata
2. **Reply to Comments** - Nested comment threads (replies to comments)
3. **React to Comments** - Add reactions (like, love, haha, etc.) to individual comments

## Database Schema

### PostComment Model (Updated)

```prisma
model PostComment {
  id              String   @id @default(uuid())
  post            CommunityPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId          String
  
  author          Player   @relation(fields: [authorId], references: [userId], onDelete: Cascade)
  authorId        String
  
  content         String
  
  // Support for comment replies (nested comments)
  parentComment   PostComment? @relation("comment_replies", fields: [parentCommentId], references: [id], onDelete: Cascade)
  parentCommentId String?
  replies         PostComment[] @relation("comment_replies")
  
  // Reactions to this comment
  reactions       CommentReaction[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([postId])
  @@index([authorId])
  @@index([parentCommentId])
}

model CommentReaction {
  id              String   @id @default(uuid())
  comment         PostComment @relation(fields: [commentId], references: [id], onDelete: Cascade)
  commentId       String
  
  user            Player   @relation("comment_reactions", fields: [userId], references: [userId], onDelete: Cascade)
  userId          String
  
  type            String   @default("like") // like, love, haha, wow, sad, angry
  
  createdAt       DateTime @default(now())
  
  @@unique([commentId, userId])
  @@index([commentId])
  @@index([userId])
}
```

## API Endpoints

### 1. Read Comments

Comments are automatically included when fetching posts:

```typescript
// GET /api/community?action=feed&userId=<userId>&page=1
const response = await fetch('/api/community?action=feed&userId=...&page=1');
const { posts } = await response.json();

// Each post includes:
posts[0].comments = [
  {
    id: "comment-123",
    content: "Great post!",
    author: {
      userId: "...",
      user: {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        photo: "URL"
      }
    },
    replies: [], // Nested replies
    reactions: [], // Comment reactions
    createdAt: "2024-12-20T10:30:00Z",
    parentCommentId: null // null if top-level comment
  }
]
```

### 2. Add Comment (Existing)

```typescript
POST /api/community
{
  "action": "add-comment",
  "userId": "user-email",
  "data": {
    "postId": "post-123",
    "content": "This is a comment"
  }
}

// Response:
{
  "id": "comment-123",
  "postId": "post-123",
  "authorId": "user-id",
  "content": "This is a comment",
  "parentCommentId": null,
  "replies": [],
  "reactions": [],
  "author": { /* author info */ },
  "createdAt": "2024-12-20T10:30:00Z"
}
```

### 3. Reply to Comment (NEW)

```typescript
POST /api/community
{
  "action": "reply-to-comment",
  "userId": "user-email",
  "data": {
    "commentId": "comment-123",
    "content": "Great point! I agree."
  }
}

// Response:
{
  "id": "reply-456",
  "postId": "post-123",  // Same post as parent comment
  "authorId": "user-id",
  "content": "Great point! I agree.",
  "parentCommentId": "comment-123",  // Links to parent
  "replies": [],
  "reactions": [],
  "author": { /* author info */ },
  "createdAt": "2024-12-20T10:35:00Z"
}
```

### 4. React to Comment (NEW)

Toggle reaction types: `like`, `love`, `haha`, `wow`, `sad`, `angry`

```typescript
POST /api/community
{
  "action": "react-to-comment",
  "userId": "user-email",
  "data": {
    "commentId": "comment-123",
    "reactionType": "love"  // Optional, defaults to "like"
  }
}

// Response (First reaction):
{
  "action": "reaction-added",
  "reaction": {
    "id": "reaction-789",
    "commentId": "comment-123",
    "userId": "user-id",
    "type": "love",
    "createdAt": "2024-12-20T10:40:00Z"
  }
}

// Response (Toggle off - clicking again):
{
  "action": "reaction-removed"
}
```

## WebSocket Events (Real-Time)

New events are broadcast to all connected clients:

### Event: `comment-reply-added`

Triggered when someone replies to a comment:

```json
{
  "type": "comment-reply-added",
  "data": {
    "reply": {
      "id": "reply-456",
      "postId": "post-123",
      "authorId": "user-id",
      "content": "Great point!",
      "parentCommentId": "comment-123",
      "author": { /* author info */ },
      "createdAt": "2024-12-20T10:35:00Z"
    },
    "parentCommentId": "comment-123",
    "postId": "post-123"
  }
}
```

### Event: `comment-reaction-added`

Triggered when someone reacts to a comment:

```json
{
  "type": "comment-reaction-added",
  "data": {
    "reaction": {
      "id": "reaction-789",
      "commentId": "comment-123",
      "userId": "user-id",
      "type": "love"
    },
    "commentId": "comment-123",
    "userId": "user-id",
    "reactionType": "love"
  }
}
```

### Event: `comment-reaction-removed`

Triggered when someone removes a reaction:

```json
{
  "type": "comment-reaction-removed",
  "data": {
    "commentId": "comment-123",
    "userId": "user-id",
    "reactionType": "love"
  }
}
```

## React Hook Usage

Updated `useCommunityUpdates` hook now includes comment callbacks:

```typescript
import { useCommunityUpdates } from '@/hooks/useCommunityWebSocket';

export function MyComponent() {
  const isConnected = useCommunityUpdates(
    // Post events
    (post) => console.log('New post:', post),
    
    // Comment added
    (comment) => console.log('New comment:', comment),
    
    // Comment reply added (NEW)
    (reply) => {
      console.log('Reply to comment:', reply.parentCommentId, reply);
      // Update UI: Add reply to parent comment's replies array
      updateCommentReplies(reply.parentCommentId, reply);
    },
    
    // Comment reaction added (NEW)
    (reaction) => {
      console.log('Comment reaction:', reaction);
      // Update UI: Add reaction to comment
      updateCommentReaction(reaction.commentId, reaction);
    },
    
    // Comment reaction removed (NEW)
    (reaction) => {
      console.log('Reaction removed:', reaction);
      // Update UI: Remove reaction from comment
      removeCommentReaction(reaction.commentId, reaction.userId);
    },
    
    // Post liked
    (reaction) => console.log('Post liked:', reaction),
    
    // User followed
    (follow) => console.log('User followed:', follow),
    
    // Feed updated
    (feed) => console.log('Feed updated:', feed)
  );

  return (
    <div>
      Connection: {isConnected ? '🟢 Live' : '⚪ Updating'}
    </div>
  );
}
```

## Component Implementation Example

```typescript
'use client';

import { useState } from 'react';
import { useCommunityUpdates } from '@/hooks/useCommunityWebSocket';

export function CommentThread({ postId, comments }) {
  const [allComments, setAllComments] = useState(comments);

  const isConnected = useCommunityUpdates(
    undefined, // onPostCreated
    (comment) => {
      // New top-level comment
      if (comment.postId === postId) {
        setAllComments([...allComments, comment]);
      }
    },
    (reply) => {
      // New reply to a comment
      if (reply.postId === postId && reply.parentCommentId) {
        setAllComments(
          allComments.map((comment) =>
            comment.id === reply.parentCommentId
              ? {
                  ...comment,
                  replies: [...(comment.replies || []), reply],
                }
              : comment
          )
        );
      }
    },
    (reaction) => {
      // Reaction added to comment
      setAllComments(
        allComments.map((comment) =>
          comment.id === reaction.commentId
            ? {
                ...comment,
                reactions: [...(comment.reactions || []), reaction],
              }
            : comment
        )
      );
    },
    (reaction) => {
      // Reaction removed from comment
      setAllComments(
        allComments.map((comment) =>
          comment.id === reaction.commentId
            ? {
                ...comment,
                reactions: comment.reactions.filter(
                  (r) => !(r.userId === reaction.userId && r.type === reaction.reactionType)
                ),
              }
            : comment
        )
      );
    }
  );

  return (
    <div className="comment-thread">
      <div className="status">{isConnected ? '🟢 Live' : '⚪ Updating'}</div>
      
      {allComments.map((comment) => (
        <div key={comment.id} className="comment">
          <div className="comment-header">
            <strong>{comment.author.user.firstName} {comment.author.user.lastName}</strong>
            <span className="time">{new Date(comment.createdAt).toLocaleString()}</span>
          </div>
          
          <p className="comment-content">{comment.content}</p>
          
          <div className="comment-actions">
            <button onClick={() => replyToComment(comment.id)}>Reply</button>
            <button onClick={() => reactToComment(comment.id, 'like')}>
              👍 Like ({comment.reactions?.filter(r => r.type === 'like').length || 0})
            </button>
          </div>

          {/* Comment Reactions */}
          {comment.reactions && comment.reactions.length > 0 && (
            <div className="comment-reactions">
              {groupBy(comment.reactions, 'type').map(([type, reactions]) => (
                <span key={type} className="reaction-group">
                  {getEmojiForType(type)} {reactions.length}
                </span>
              ))}
            </div>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="comment-replies pl-4">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="reply">
                  <strong>{reply.author.user.firstName}</strong>
                  <p>{reply.content}</p>
                  <div className="reply-reactions">
                    {reply.reactions?.map((r) => (
                      <span key={r.id}>{getEmojiForType(r.type)}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Features

### ✅ Completed

1. **Database Models**
   - PostComment with parentCommentId for replies
   - CommentReaction model for reactions
   - Proper cascade deletion

2. **API Endpoints**
   - `action: 'reply-to-comment'` - Create nested replies
   - `action: 'react-to-comment'` - Add/remove reactions
   - Full author information included
   - Validation and authorization checks

3. **WebSocket Events**
   - `comment-reply-added` - Real-time reply notifications
   - `comment-reaction-added` - Real-time reaction notifications
   - `comment-reaction-removed` - Real-time reaction removal

4. **React Hooks**
   - Updated `useCommunityUpdates` with 3 new callbacks
   - Proper cleanup and subscription management
   - Connection status tracking

### 🔄 Real-Time Flow

```
User A replies to comment:
  ↓
POST /api/community (reply-to-comment)
  ↓
API creates PostComment with parentCommentId
  ↓
broadcastToClients({ type: 'comment-reply-added', ... })
  ↓
WebSocket server broadcasts to all clients
  ↓
User B's hook receives 'comment-reply-added' event
  ↓
Callback executes: onCommentReplyAdded(reply)
  ↓
Component updates state with new reply
  ↓
UI re-renders with nested reply (no page refresh!)
```

## Testing

### Test Comment Replies

```bash
# Create a post first
curl -X POST http://localhost:3000/api/community \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create-post",
    "userId": "john@example.com",
    "data": { "content": "Check this out!" }
  }'

# Add a comment
curl -X POST http://localhost:3000/api/community \
  -H "Content-Type: application/json" \
  -d '{
    "action": "add-comment",
    "userId": "jane@example.com",
    "data": { "postId": "post-123", "content": "Great post!" }
  }'

# Reply to the comment
curl -X POST http://localhost:3000/api/community \
  -H "Content-Type: application/json" \
  -d '{
    "action": "reply-to-comment",
    "userId": "john@example.com",
    "data": { "commentId": "comment-456", "content": "Thanks!" }
  }'
```

### Test Comment Reactions

```bash
# React to a comment
curl -X POST http://localhost:3000/api/community \
  -H "Content-Type: application/json" \
  -d '{
    "action": "react-to-comment",
    "userId": "alice@example.com",
    "data": { "commentId": "comment-456", "reactionType": "love" }
  }'

# Toggle off (click again)
curl -X POST http://localhost:3000/api/community \
  -H "Content-Type: application/json" \
  -d '{
    "action": "react-to-comment",
    "userId": "alice@example.com",
    "data": { "commentId": "comment-456", "reactionType": "love" }
  }'
```

## Migration Notes

This feature added two database structures:
1. `parentCommentId` column to PostComment table (nullable)
2. New CommentReaction table for comment reactions

If migrating existing data:
- Existing comments have `parentCommentId = null` (top-level)
- Existing comment likes counter is replaced by CommentReaction records
- No data loss, backward compatible

## Performance Considerations

- Replies are eagerly loaded within comments (up to N levels)
- Reactions are indexed by commentId + userId for fast lookups
- Broadcasting is non-blocking (fire and forget)
- WebSocket reconnection handles temporary network issues

## Next Steps

1. **UI Implementation** - Add comment reply UI to CommunityFeed component
2. **Threading Display** - Show replies nested under parent comments
3. **Reaction UI** - Add emoji picker for comment reactions
4. **Pagination** - Implement pagination for long comment threads
5. **Moderation** - Add ability to edit/delete replies
6. **Notifications** - Alert users when someone replies or reacts to their comment
