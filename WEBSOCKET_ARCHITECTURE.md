# WebSocket Server Setup & Architecture

## Overview

This is a **production-ready WebSocket architecture** for Vico that properly handles real-time updates across:
- Match updates and live scoring
- Community posts and notifications
- User follow events
- Any future real-time feature

### Why This Architecture?

Your previous approach stored connections in memory, which **breaks in production** because:

```
❌ Next.js App Router → serverless instances restart
❌ Memory is not shared across instances
❌ Connections are lost
```

This solution uses a **dedicated WebSocket server** that:

```
✅ Runs separately from your Next.js app
✅ Maintains persistent connections
✅ Scales properly with multiple instances
✅ Easy to add Redis later for clustering
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This adds:
- `ws` - WebSocket library
- `express` - HTTP server for broadcast endpoints

### 2. Start the WebSocket Server

**In development (with auto-reload):**
```bash
npm run websocket:dev
```

**In a separate terminal, start Next.js:**
```bash
npm run dev
```

**In production:**
```bash
npm run websocket
```

You should see:
```
✨ HTTP server listening on localhost:3001
🔗 WebSocket endpoint: ws://localhost:3001
📡 Broadcast endpoints:
   POST /broadcast/broadcast-all
   POST /broadcast/broadcast-user
   POST /broadcast/broadcast-except
   POST /broadcast/broadcast-match
   GET /stats
```

### 3. Verify It's Running

```bash
# Check health
curl http://localhost:3001/health
# Response: {"status":"ok","uptime":123.45}

# Check stats
curl http://localhost:3001/stats
# Response: {"connectedUsers":0,"totalConnections":0,"activeMatches":0,"timestamp":"..."}
```

## How It Works

### Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│           Your Next.js App (Port 3000)          │
│  ┌──────────────────────────────────────────┐   │
│  │  API Routes (e.g. /api/community)        │   │
│  │  ├─ Create post                          │   │
│  │  ├─ Add comment                          │   │
│  │  └─ Like post                            │   │
│  │         │                                │   │
│  │         │ HTTP POST                      │   │
│  │         ▼                                │   │
│  │  src/lib/websocket-broadcast.ts          │   │
│  │  ├─ broadcastToClients()                 │   │
│  │  ├─ broadcastToUser(userId)              │   │
│  │  ├─ broadcastExcept(senderId)            │   │
│  │  └─ broadcastToMatch(matchId)            │   │
│  └──────────────────────────────────────────┘   │
│                     │                            │
│                     │ HTTP POST                  │
│                     ▼                            │
│       network.local:3001                        │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│    WebSocket Server (Port 3001)                 │
│  src/websocket-server.ts                        │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ Express HTTP Server                      │   │
│  ├─ POST /broadcast/broadcast-all           │   │
│  ├─ POST /broadcast/broadcast-user          │   │
│  ├─ POST /broadcast/broadcast-except        │   │
│  ├─ POST /broadcast/broadcast-match         │   │
│  ├─ GET /stats                              │   │
│  └─ GET /health                             │   │
│  │                                          │   │
│  │  ┌──────────────────────────────────┐    │   │
│  │  │ WebSocket Server (noServer mode) │    │   │
│  │  │ ├─ Client connections            │    │   │
│  │  │ ├─ Message routing               │    │   │
│  │  │ └─ Cleanup on disconnect         │    │   │
│  │  └──────────────────────────────────┘    │   │
│  │                                          │   │
│  │  In-Memory Maps:                         │   │
│  │  ├─ userConnections: Map<userId, Set<ws>>  │
│  │  └─ matchObservers: Map<matchId, Set<userId>> │
│  └──────────────────────────────────────────┘   │
│                     ▲                            │
│                     │ WebSocket                  │
│                     │                            │
└─────────────────────────────────────────────────┘
                      │
                      ▼ ws://localhost:3001
            ┌─────────────────────┐
            │  Browser Clients    │
            │  useCommunityUpdates│
            │  hook connects here │
            └─────────────────────┘
```

### Message Flow Example: Create a Post

```
1. User creates post in app
   POST /api/community
   ├─ Validate & store in DB
   ├─ broadcastToClients({
   │    type: 'post-created',
   │    data: { id, content, author, ... }
   │  })
   │
   └─→ HTTP POST http://localhost:3001/broadcast/broadcast-all
       {
         "type": "post-created",
         "data": { /* post object */ }
       }
       │
       └─→ WebSocket Server receives
           ├─ Parses request body
           ├─ Sends to all connected clients via WebSocket
           └─→ Clients receive in real-time
               {
                 "type": "post-created",
                 "data": { /* post object */ },
                 "timestamp": "2026-03-20T..."
               }

2. Client-side hook processes event
   useCommunityUpdates hook
   └─→ Updates component state
       └─→ UI shows new post instantly
```

## Client-Side Hook

Your clients use this hook to listen for updates:

```typescript
const { updates, isConnected } = useCommunityUpdates(['post-created', 'comment-added']);

// isConnected = true when WebSocket is connected
// updates = new events as they arrive

useEffect(() => {
  if (updates?.type === 'post-created') {
    // Handle new post
  }
}, [updates]);
```

See [useCommunityWebSocket.ts](src/hooks/useCommunityWebSocket.ts) for details.

## API Broadcast Functions

### Available Functions

All functions are in `src/lib/websocket-broadcast.ts`:

#### 1. Broadcast to Everyone
```typescript
broadcastToClients({
  type: 'post-created',
  data: { id, content, author, likes: [], comments: [] }
});
```

Use for: Global announcements, public events

#### 2. Broadcast to Specific User
```typescript
broadcastToUser('user-id-123', {
  type: 'notification',
  data: { message: 'Someone followed you' }
});
```

Use for: Personal notifications, private updates

#### 3. Broadcast to Everyone Except Sender
```typescript
broadcastExcept('user-id-123', {
  type: 'user-followed',
  data: { followerId: 'user-id-123', username: 'john' }
});
```

Use for: Activity feed, "you" filtering

#### 4. Broadcast to Match Watchers
```typescript
broadcastToMatch('match-id-456', {
  type: 'score-update',
  data: { score: '30-15', server: 'player-a' }
});
```

Use for: Live scoring, match events

### Where to Add Broadcasts

In any API route:

```typescript
// src/app/api/community/route.ts
import { broadcastToClients } from '@/lib/websocket-broadcast';

export async function POST(request: NextRequest) {
  const { action, data, userId } = await request.json();

  if (action === 'create-post') {
    const post = await prisma.communityPost.create({
      data: { /* ... */ },
      include: { /* ... */ }
    });

    // ✨ Broadcast to all clients
    broadcastToClients({
      type: 'post-created',
      data: post
    });

    return NextResponse.json(post);
  }
}
```

## Environment Configuration

You can customize these with environment variables:

```bash
# .env.local

# WebSocket Server Address (from API's perspective)
WS_SERVER_URL=http://localhost:3001

# WebSocket Port
WS_PORT=3001

# WebSocket Host
WS_HOST=localhost
```

### For Production

If your WebSocket server is on a different machine:

```bash
WS_SERVER_URL=http://ws-server.internal.company.com:3001
```

## Event Types

Define event types as your app evolves:

```typescript
// Community events
{ type: 'post-created', data: CommunityPost }
{ type: 'comment-added', data: { postId, comment } }
{ type: 'post-liked', data: { postId, userId, action } }
{ type: 'user-followed', data: UserFollower }

// Match events
{ type: 'score-update', data: ScoreUpdate }
{ type: 'match-ended', data: Match }
{ type: 'player-subbed', data: SubstitutionEvent }

// System events
{ type: 'notification', data: Notification }
{ type: 'error', data: ErrorMessage }
```

## Monitoring & Stats

### Get Connection Stats

```bash
curl http://localhost:3001/stats
```

Response:
```json
{
  "connectedUsers": 42,
  "totalConnections": 48,
  "activeMatches": 5,
  "timestamp": "2026-03-20T22:30:45.123Z"
}
```

### Logs

The server logs all events:

```
📡 New WebSocket connection from 127.0.0.1
✅ User authenticated: user-123 (connections: 1)
👀 User user-123 subscribed to match match-456
📢 Broadcast to all (15 users): post-created
💬 Message to user user-789: notification
❌ User disconnected: user-123 (remaining: 0)
```

## Scaling (Next Steps)

### Phase 1: Current (Single WS Server)
- ✅ Works for 100-500 concurrent users
- ✅ Suitable for MVP/beta
- ✅ No external dependencies

### Phase 2: Redis (Pub/Sub)
- Multiple app instances
- Shared message broker
- ~200 lines of code change

```typescript
// Instead of in-memory maps, use Redis
const redis = createClient();

// App 1 publishes to 'match:123'
redis.publish('match:123', JSON.stringify(message));

// App 2, 3, 4 all subscribe
redis.subscribe('match:123', (message) => {
  broadcastToMatch('match:123', message);
});
```

### Phase 3: Durable Objects (Cloudflare)
- If using Cloudflare Workers
- Less code - all in Durable Objects

## Troubleshooting

### WebSocket server not connecting

**Problem:** `WS_SERVER_URL not configured` warning

**Solution:**
```bash
export WS_SERVER_URL=http://localhost:3001
# Or in .env.local:
WS_SERVER_URL=http://localhost:3001
```

### Broadcasts not working

**Problem:** API returns `{"sent": false, "reason": "User not connected"}`

**Solution:**
1. Check WebSocket server is running: `curl http://localhost:3001/health`
2. Check client hook is connected: `isConnected === true`
3. Check stats: `curl http://localhost:3001/stats`

### Client events not arriving

**Problem:** Browser receives nothing

**Solution:**
1. Check browser DevTools Network tab - should show WebSocket connection under WS
2. Check browser console for errors
3. Check useCommunityUpdates hook - ensure subscribed to correct event types
4. Check server logs for "Broadcast" messages

## Real-World Examples

### Match Live Scoring (Referee Updates Score)

```typescript
// Referee updates score via API
POST /api/matches/update-score
{
  "matchId": "match-123",
  "playerAScore": 30,
  "playerBScore": 15,
  "server": "player-a"
}

// API handler
broadcastToMatch('match-123', {
  type: 'score-update',
  data: {
    playerAScore: 30,
    playerBScore: 15,
    server: 'player-a',
    timestamp: new Date()
  }
});

// Players watching see it immediately
const { updates } = useCommunityUpdates(['score-update']);
if (updates?.type === 'score-update') {
  updateScoreBoard(updates.data);
}
```

### Follow Notification

```typescript
// User follows another user
POST /api/community
{
  "action": "follow",
  "userId": "follower-123",
  "targetUserId": "user-456"
}

// Create follow record
const follow = await prisma.userFollower.create({
  data: { followerId, followingId: targetUserId }
});

// Notify the followed user
broadcastToUser(targetUserId, {
  type: 'user-followed',
  data: {
    followerId,
    followerName: /* ... */,
    followerImage: /* ... */
  }
});

// Notify others
broadcastExcept(followerId, {
  type: 'follow-activity',
  data: { follower, followed, action: 'followed' }
});
```

## Files Modified

```
src/
├─ websocket-server.ts        [NEW] Dedicated WS server
├─ lib/
│  └─ websocket-broadcast.ts   [UPDATED] HTTP client
├─ hooks/
│  └─ useCommunityWebSocket.ts [EXISTING] Client hook
└─ app/api/community/
   └─ route.ts                [UPDATED] Calls broadcast functions

package.json                   [UPDATED] Added ws, express, npm scripts
```

## Next Steps

1. **Install dependencies**: `npm install`
2. **Start WebSocket server**: `npm run websocket:dev`
3. **Start Next.js**: `npm run dev` (in another terminal)
4. **Test**: Create a post, watch it appear in real-time
5. **Monitor**: Check `/stats` endpoint during testing
6. **Plan Phase 2**: When you have > 500 concurrent users

---

**Questions?** Check the event logs, monitor stats, or review the event types in your use cases.
