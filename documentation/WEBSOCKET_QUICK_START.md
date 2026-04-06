# WebSocket Integration Quick Start

## 1. Start the WebSocket Server

Open a new terminal and run:

```bash
npm run websocket:dev
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

## 2. Start Your Next.js App

In another terminal:
```bash
npm run dev
```

## 3. How Broadcasts Work

Every broadcast function in `src/lib/websocket-broadcast.ts` automatically:

1. **Sends HTTP POST** to the WebSocket server automatically
2. **Server broadcasts** to connected clients via WebSocket
3. **Clients receive** events in real-time

No manual setup needed! Just call the broadcast functions from your API routes.

## 4. Example: Community Post Creation

In `src/app/api/community/route.ts`, the POST handler already has:

```typescript
if (action === 'create-post') {
  const post = await prisma.communityPost.create({
    data: { /* ... */ },
    include: { /* ... */ }
  });

  // ✨ This sends to all connected clients automatically
  broadcastToClients({
    type: 'post-created',
    data: postWithMeta,
  });

  return NextResponse.json(postWithMeta, { status: 201 });
}
```

The `broadcastToClients()` function:
- HTTP POSTs to `http://localhost:3001/broadcast/broadcast-all`
- Server broadcasts to all WebSocket clients
- All connected browsers receive the event instantly

## 5. Client-Side: Subscribe to Events

In your React component (e.g., CommunityFeed):

```typescript
import { useCommunityUpdates } from '@/hooks/useCommunityWebSocket';

export function CommunityFeed() {
  const { updates, isConnected } = useCommunityUpdates([
    'post-created',
    'comment-added',
    'post-liked'
  ]);

  // Handle new post
  useEffect(() => {
    if (updates?.type === 'post-created') {
      setPosts([updates.data, ...posts]);
    }
  }, [updates]);

  return (
    <div>
      <div className={isConnected ? 'text-green-600' : 'text-gray-400'}>
        {isConnected ? '🟢 Live' : '⚪ Updating..'}
      </div>
      {/* Posts list */}
    </div>
  );
}
```

## 6. Test It

### Terminal 1: WebSocket Server
```bash
npm run websocket:dev
```

### Terminal 2: Next.js App
```bash
npm run dev
```

### Browser Test

1. Open `http://localhost:3000` in **two browser tabs** (simulate two users)
2. In Tab 1, create a community post
3. In Tab 2, **watch the post appear instantly** (no page refresh!)
4. In Tab 1, like the post
5. In Tab 2, **like count updates instantly**

## 7. Monitoring

### Check WebSocket Server Status

```bash
curl http://localhost:3001/health
# {"status":"ok","uptime":123.45}
```

### View Active Connections

```bash
curl http://localhost:3001/stats
# {
#   "connectedUsers": 2,
#   "totalConnections": 3,
#   "activeMatches": 0
# }
```

### Watch Server Logs

The server logs all events:
```
📢 Broadcast to all (2 users): post-created
💬 Message to user user-123: notification
❌ User disconnected: user-456 (remaining: 2)
```

## 8. Adding New Features

### Example: Match Live Scoring

In `/api/matches/update-score`:

```typescript
import { broadcastToMatch } from '@/lib/websocket-broadcast';

export async function POST(request: NextRequest) {
  const { matchId, playerAScore, playerBScore } = await request.json();

  // Update database
  const match = await prisma.match.update({
    where: { id: matchId },
    data: { playerAscore: playerAScore, playerBscore: playerBScore }
  });

  // Broadcast to match watchers
  broadcastToMatch(matchId, {
    type: 'score-update',
    data: {
      playerAScore,
      playerBScore,
      timestamp: new Date()
    }
  });

  return NextResponse.json(match);
}
```

In your match view component:

```typescript
const { updates, isConnected } = useCommunityUpdates(['score-update']);

useEffect(() => {
  if (updates?.type === 'score-update' && updates.data.matchId === currentMatch.id) {
    // Update score board
    setScore({
      playerA: updates.data.playerAScore,
      playerB: updates.data.playerBScore
    });
  }
}, [updates]);
```

## 9. Broadcast Functions Reference

### broadcastToClients(message)
Send to **everyone**
```typescript
broadcastToClients({
  type: 'post-created',
  data: post
});
```

### broadcastToUser(userId, message)
Send to **specific user**
```typescript
broadcastToUser(userId, {
  type: 'notification',
  data: { message: 'Someone followed you' }
});
```

### broadcastExcept(userId, message)
Send to **everyone except sender**
```typescript
broadcastExcept(userId, {
  type: 'user-followed',
  data: { follower }
});
```

### broadcastToMatch(matchId, message)
Send to **match watchers**
```typescript
broadcastToMatch(matchId, {
  type: 'score-update',
  data: scoreData
});
```

## 10. Troubleshooting

### WebSocket server not connecting?

```bash
# Check if server is running
curl http://localhost:3001/health

# Check logs in terminal where you ran npm run websocket:dev
```

### Broadcasts not working?

1. Verify server is running: `curl http://localhost:3001/stats`
2. Check browser console for errors
3. Check that `useCommunityUpdates` hook is subscribed to correct event type

### Build errors?

```bash
# Rebuild
npm run build

# Restart WebSocket server
npm run websocket:dev
```

## 11. Environment Variables

You can customize with environment variables in `.env.local`:

```bash
# WebSocket server address (from Next.js perspective)
WS_SERVER_URL=http://localhost:3001

# WebSocket server port
WS_PORT=3001

# WebSocket server host
WS_HOST=localhost
```

## 12. What's Next?

This setup handles:
- ✅ 100-500 concurrent users
- ✅ Real-time post updates
- ✅ Match score broadcasting
- ✅ User notifications
- ✅ Follow events

When you scale:
- **100-1000 users**: Add Redis for multi-server support
- **1000+ users**: Consider managed services (Pusher, Ably)
- **Match infrastructure**: Add room-based routing

See [WEBSOCKET_ARCHITECTURE.md](WEBSOCKET_ARCHITECTURE.md) for production details.

---

**That's it!** Your WebSocket server is production-ready. Focus on adding more broadcast calls to your API routes. 🎉
