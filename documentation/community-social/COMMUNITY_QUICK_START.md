# Community Features - Quick Reference Guide

## 📌 What's New?

TennisTracker now includes a complete social/community system allowing players to:
- 📝 Create and share posts
- 💬 Comment on posts
- 👍 Like posts
- 👥 Follow other players
- 📊 See personalized feed from followed players

## 🗂️ File Structure

```
TennisTracker/
├── prisma/
│   ├── schema.prisma (4 new models)
│   └── seeds/
│       └── community.ts (NEW - seed data)
├── src/
│   ├── app/api/
│   │   └── community/
│   │       └── route.ts (NEW - API endpoints)
│   └── components/
│       ├── CommunityFeed.tsx (NEW)
│       └── UserProfile.tsx (NEW)
├── COMMUNITY_API.md (NEW - API docs)
├── COMMUNITY_IMPLEMENTATION.md (NEW - implementation guide)
└── COMMUNITY_CHECKLIST.md (NEW - this file's sibling)
```

## 🗄️ Database Models

### CommunityPost
```prisma
model CommunityPost {
  id            String
  authorId      String      // Player who created post
  content       String      // Post text
  visibility    String      // "public" or "private"
  createdAt     DateTime
  updatedAt     DateTime
  
  // Relations
  author        Player      // Post author
  comments      PostComment[]
  likes         PostReaction[]
}
```

### PostComment
```prisma
model PostComment {
  id            String
  postId        String      // Parent post
  authorId      String      // Who commented
  content       String      // Comment text
  createdAt     DateTime
  updatedAt     DateTime
  
  // Relations
  post          CommunityPost
  author        Player
}
```

### PostReaction
```prisma
model PostReaction {
  postId        String      // Which post
  userId        String      // Who liked
  type          String      // "like" (currently)
  createdAt     DateTime
  
  // Unique constraint prevents duplicate likes
  @@unique([postId, userId])
}
```

### UserFollower
```prisma
model UserFollower {
  followerId    String      // Who is following
  followingId   String      // Who are they following
  createdAt     DateTime
  
  // Unique constraint prevents duplicate follows
  @@unique([followerId, followingId])
}
```

## 🔌 API Endpoints

### Base URL
```
/api/community
```

### GET Requests

| Action | Purpose | Example |
|--------|---------|---------|
| `feed` | Get your personalized feed | `?action=feed&page=1` |
| `explore` | Discover all public posts | `?action=explore&page=1` |
| `followers` | List someone's followers | `?action=followers&userId=XXX` |
| `following` | List who someone follows | `?action=following&userId=XXX` |

### POST Requests

| Action | Purpose | Example Data |
|--------|---------|---------|
| `create-post` | Post to community | `{content: "Great match!", visibility: "public"}` |
| `delete-post` | Remove your post | `{postId: "XXX"}` |
| `add-comment` | Comment on post | `{postId: "XXX", content: "Nice!"}` |
| `delete-comment` | Remove your comment | `{commentId: "XXX"}` |
| `like-post` | Like/unlike a post | `{postId: "XXX"}` |
| `follow` | Follow/unfollow user | `{userId: "XXX"}` |

## 💻 Using in React

### Example 1: Get User's Feed
```typescript
async function getFeed(page = 1) {
  const response = await fetch(`/api/community?action=feed&page=${page}`);
  const data = await response.json();
  // data.posts contains array of posts with comments and reactions
  // data.pagination contains page metadata
}
```

### Example 2: Create a Post
```typescript
async function createPost(content: string) {
  const response = await fetch('/api/community', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'create-post',
      data: { content, visibility: 'public' }
    })
  });
  return response.json();
}
```

### Example 3: Like a Post
```typescript
async function likePost(postId: string) {
  const response = await fetch('/api/community', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'like-post',
      data: { postId }
    })
  });
  // Response: { action: 'liked', reaction: {...} } or { action: 'unliked' }
}
```

### Example 4: Follow a User
```typescript
async function followUser(userId: string) {
  const response = await fetch('/api/community', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'follow',
      data: { userId }
    })
  });
  // Response: { action: 'followed' } or { action: 'unfollowed' }
}
```

## 🎨 React Components

### CommunityFeed Component
```tsx
import { CommunityFeed } from '@/components/CommunityFeed';

export default function Page() {
  return <CommunityFeed />;
}
```

**Features:**
- Display paginated posts from following
- Create new posts
- Like/unlike posts
- View comments
- Pagination controls

### UserProfile Component
```tsx
import { UserProfile } from '@/components/UserProfile';

export default function Page({ userId }: { userId: string }) {
  return <UserProfile userId={userId} />;
}
```

**Features:**
- Display user info
- Show stats (followers, following, posts)
- Follow/unfollow button
- List of followers preview

## 🔐 Security Notes

✅ All endpoints require NextAuth session
✅ Users can only delete their own posts/comments
✅ Cannot follow yourself
✅ Proper authorization checks in place
✅ SQL injection prevention via Prisma ORM

## 📊 Seed Data

When you run seed script, it creates:
- **12 posts** from various players
- **50+ follows** between players
- **~8 comments** on popular posts
- **~40 likes** distributed across posts

Test with: `marcus.johnson@example.com` (password: `tennis123`)

## 🚀 Getting Started (5 Steps)

### 1. Apply Database Changes
```bash
npx prisma migrate dev
```

### 2. Seed Test Data
```bash
npm run seed
```

### 3. Create Community Page
Create `src/app/community/page.tsx`:
```tsx
import { CommunityFeed } from '@/components/CommunityFeed';

export default function Page() {
  return <CommunityFeed />;
}
```

### 4. Add Navigation Link
In your navbar, add link to `/community`

### 5. Test It!
- Sign in with test account
- Visit `/community`
- Create a post
- Like another post
- Follow a user

## 🐛 Troubleshooting

### Posts not appearing in feed?
- Check if you're following other users
- Own posts always appear in personal feed
- Feed shows only public posts from followed users

### Can't like posts?
- Ensure you're signed in
- Each user can only like each post once
- Click again to unlike

### Follow button not working?
- Can't follow yourself
- Check browser console for error messages
- Verify API endpoint is responding

### API returns 401 Unauthorized?
- You need to be signed in
- Check NextAuth session is valid
- Try signing in again

## 📈 Performance Tips

- Feed uses pagination (10 posts per page)
- Comments show preview (first 3)
- Reactions aggregated in response
- Database indexes optimize common queries

## 🔮 Future Ideas

- Trending posts/hashtags
- Email notifications for likes/comments
- Rich text editor for posts
- Image uploads
- Post editing
- Thread replies
- Search functionality
- User recommendations

## 📚 Detailed Documentation

For complete API documentation, see: [COMMUNITY_API.md](COMMUNITY_API.md)
For implementation details, see: [COMMUNITY_IMPLEMENTATION.md](COMMUNITY_IMPLEMENTATION.md)
For integration checklist, see: [COMMUNITY_CHECKLIST.md](COMMUNITY_CHECKLIST.md)

## 💡 Pro Tips

1. **Test with Multiple Users**: Sign in as different players to see feed/follows work
2. **Check Database**: Use `npx prisma studio` to browse data visually
3. **API Testing**: Use cURL or Postman to test endpoints directly
4. **Monitor Console**: Check browser console and server logs for errors
5. **Start Small**: Implement one feature at a time

## 🛠️ Common Tasks

**How to find all posts by a user?**
```typescript
// Currently: Use user profile page
// Future: Implement user posts filter on profile
```

**How to get trending posts?**
```typescript
// Currently: Not implemented
// Future: Could sort by reaction count
```

**How to search posts?**
```typescript
// Currently: Not implemented
// Future: Implement /api/community/search endpoint
```

**How to notify users of interactions?**
```typescript
// Currently: Not implemented
// Future: Add notification service
```

---

Last Updated: 2025-03-15
Version: 1.0.0
Status: Ready for Use ✅
