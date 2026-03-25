# WebSocket Integration Test Guide

## Overview

This document outlines how to test the complete real-time WebSocket integration for community posts, comments, and reactions.

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser Client                          │
│  ┌──────────────────────────────────────────────────────›   │
│  │ useCommunityUpdates/useCommunityWebSocket hook            │
│  │ - Connects to ws://localhost:3001                        │
│  │ - Sends auth with userId                                │
│  │ - Listens for: post-created, comment-added, post-liked   │
│  └──────────────────────────────────────────────────────────┘
│
│ WebSocket Connection
│ (ws protocol)
│                                                               │
└───────────────────────────────────┬───────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
        ┌───────────▼──────────────┐    ┌──────────▼─────────────┐
        │  Next.js App             │    │ Standalone WS Server    │
        │  Port 3000               │    │ Port 3001               │
        ├──────────────────────────┤    ├──────────────────────────┤
        │ POST /api/community      │    │ WebSocket Handler       │
        │ - create-post            │    │ - userConnections Map   │
        │ - add-comment            │    │ - Broadcast endpoints   │
        │ - like-post              │    │                         │
        │                          │    │ HTTP POST Endpoints:    │
        │ Calls:                   │    │ /broadcast/broadcast-all │
        │ broadcastToClients()     ◄────┤ /broadcast/broadcast-user│
        │ (HTTP POST             │    │ /broadcast/broadcast-except│
        │  to WS server)           │    │ /broadcast/broadcast-match │
        └──────────────────────────┘    │                         │
                                        │ Broadcasts to clients   │
                                        │ via WebSocket           │
                                        └─────────────────────────┘
```

## Prerequisites

1. **Dependencies installed:**
   ```bash
   npm install ws express @types/ws @types/express
   ```

2. **Files in place:**
   - `src/websocket-server.ts` - Standalone server
   - `src/lib/websocket-broadcast.ts` - HTTP client for broadcasting
   - `src/hooks/useCommunityWebSocket.ts` - Client-side hook
   - `src/app/api/community/route.ts` - API endpoints with broadcasts

3. **Environment:**
   - Node.js 18+ (for ES modules)
   - Next.js dev server configured

## Step 1: Verify WebSocket Server Starts

```bash
# Terminal 1: Start WebSocket server
npm run websocket:dev

# Expected output:
# 🚀 WebSocket server starting on port 3001...
# ✅ WebSocket server running at ws://localhost:3001
# 📊 Monitor at http://localhost:3001/stats
```

The server should output:
- ✅ Server running message
- No errors about port conflicts
- Health check available at `http://localhost:3001/health`

## Step 2: Verify Next.js App Connects

```bash
# Terminal 2: Start Next.js dev server
npm run dev

# Expected output (in Terminal 1, you should see):
# 🔌 New client connection (total: 1)
# 🔐 Client authenticated as userId: [user-id]
```

## Step 3: Verify Client Hook Connects

1. Open [localhost:3000](http://localhost:3000) in your browser
2. Log in with test account
3. Open **Browser DevTools Console** (F12)
4. Look for messages like:
   ```
   [WebSocket] Attempting to connect to ws://localhost:3001
   [WebSocket] Connected! Ready for realtime updates
   [WebSocket] Sent auth: {"type":"auth","userId":"..."}
   ```

## Step 4: Test Post Creation → Real-Time Broadcast

### Terminal 3: Monitor WebSocket Server Logs
```bash
# Keep the WebSocket server running in Terminal 1
# Watch for broadcast messages
```

### Browser: Create a Post
1. Navigate to Community section
2. Create a new post with content: "Test post [timestamp]"
3. Submit

### Expected Flow:

**Browser Console (Tab where you created post):**
```
[API] Creating post...
[API] Post created successfully (id: post-123)
```

**WebSocket Server Logs (Terminal 1):**
```
📬 HTTP POST /broadcast/broadcast-all
📢 Broadcast to all (2 users): post-created
📤 Sent to userId: [user-id]
```

**Browser Console (Other tabs - if you have multiple logged in):**
```
📝 New post received
[Post] {"id":"post-123","title":"Test post","created":true}
```

**CommunityFeed Component:**
- 🟢 Live indicator shows green
- New post appears at top of feed instantly
- No page refresh needed

## Step 5: Test Comment Addition → Real-Time Broadcast

### Browser: Add a Comment
1. Click on recent post
2. Type comment: "Test comment [timestamp]"
3. Click "Add Comment"

### Expected Flow:

**Browser Console (Creating comment):**
```
[API] Adding comment...
[API] Comment added successfully
```

**WebSocket Server Logs (Terminal 1):**
```
📬 HTTP POST /broadcast/broadcast-all
📢 Broadcast to all (2 users): comment-added
📤 Sent to userId: [user-id]
```

**Browser Console (All tabs):**
```
💬 New comment added
[Comment] {"id":"comment-123","content":"Test comment","postId":"post-123"}
```

**Post in Feed:**
- Comment count increments instantly
- New comment visible without refresh
- Author name and avatar show correctly

## Step 6: Test Like Reaction → Real-Time Broadcast

### Browser: Like a Post
1. Click heart icon on a post
2. Observe instant feedback

### Expected Flow:

**Browser Console:**
```
[API] Liking post...
[API] Like added successfully
```

**WebSocket Server Logs:**
```
📬 HTTP POST /broadcast/broadcast-all
📢 Broadcast to all (2 users): post-liked
📤 Sent to userId: [user-id]
```

**Browser Console (All tabs):**
```
❤️ Post reaction update
[Reaction] {"postId":"post-123","action":"liked","userId":"..."}
```

**Post in Feed:**
- Heart icon fills with red color instantly
- Like count increments
- Click again to unlike (like count decrements)

## Step 7: Multi-Tab Real-Time Verification

### Browser: Two-Tab Test
1. Open [localhost:3000](http://localhost:3000) in two browser tabs
2. Log in with same account in both tabs
3. In **Tab 1**, create a post
4. Watch **Tab 2** - post should appear instantly **without page refresh**
5. In **Tab 2**, add a comment
6. Watch **Tab 1** - comment should appear instantly

### WebSocket Server Output:
```
🔌 New client connection (total: 2)
🔐 Client authenticated as userId: user-123
...
📢 Broadcast to all (2 users): post-created
📤 Sent to userId: user-123
📤 Sent to userId: user-123
```

All two connections should receive the broadcast.

## Step 8: Verify Reconnection Logic

### Simulate Disconnect:
1. Keep both tabs open
2. **Kill Terminal 1** (WebSocket server)
3. Observe browser console:
   ```
   [WebSocket] Connection closed: Error in opening handshake
   [WebSocket] Reconnecting in 3 seconds (attempt 1/5)...
   [WebSocket] Reconnecting in 4.5 seconds (attempt 2/5)...
   ```
4. **Restart WebSocket server**: `npm run websocket:dev`
5. Observe browser console:
   ```
   [WebSocket] Connected! Ready for realtime updates
   [WebSocket] Sent auth: {"type":"auth","userId":"..."}
   ```
6. Feed should continue to work - create new post in one tab and it appears in other

## Monitoring & Debugging

### WebSocket Server Stats
Visit [http://localhost:3001/stats](http://localhost:3001/stats) to see:
```json
{
  "timestamp": "2024-12-20T10:30:45.123Z",
  "connectedUsers": 2,
  "totalConnections": 2,
  "userConnections": {
    "user-123": 2,
    "user-456": 1
  },
  "broadcastStats": {
    "totalBroadcasts": 15,
    "byType": {
      "post-created": 3,
      "comment-added": 7,
      "post-liked": 5
    }
  }
}
```

### Browser Console Logging
All WebSocket events log with `[WebSocket]` prefix. Search console for:
- `Connected!` - Connection successful
- `New post received` - Real-time post update
- `New comment` - Real-time comment update
- `reaction update` - Real-time like/unlike
- `Reconnecting` - Attempting to reconnect

### Network Tab (DevTools)
1. Open Network tab (F12)
2. Filter by "WS"
3. You should see `localhost:3001` with status "101 Switching Protocols"
4. This is the WebSocket upgrade handshake

## Troubleshooting

### WebSocket Server Won't Start
```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill process using port
kill -9 <PID>

# Restart server
npm run websocket:dev
```

### No "Connected!" in Browser Console
1. Check WebSocket server is running: `http://localhost:3001/health`
2. Check for CORS issues in Network tab
3. Verify session is set (user is logged in)
4. Check browser console for auth errors

### Posts not appearing in other tabs
1. Verify WebSocket server logs show "Broadcast to all (X users)"
2. Check both tabs show 🟢 Live indicator
3. Check browser console for `New post received` message
4. Verify POST `/broadcast/broadcast-all` succeeded (200 status)

### API throws "broadcastToClients is not defined"
- Ensure `src/lib/websocket-broadcast.ts` is imported in `src/app/api/community/route.ts`
- Check import: `import { broadcastToClients } from '@/lib/websocket-broadcast';`

## Performance Benchmarks

| Scenario | Expected Time | Notes |
|----------|---|---|
| Post creation → all clients see it | <100ms | WebSocket is instant, HTTP broadcast ~50ms |
| Comment addition | <100ms | Same as post |
| Like reaction | <50ms | Smallest payload |
| Reconnect after disconnect | 3-5 seconds | Exponential backoff |
| 50 concurrent users | <200ms per broadcast | Server can handle hundreds |

## Next Steps

Once all tests pass:
1. ✅ Test with real user interactions
2. ✅ Test on staging environment
3. ✅ Configure WS_SERVER_URL for production
4. ✅ Set up PM2/Docker for server management
5. ✅ Add monitoring/alerting for WebSocket server health
6. ✅ Monitor connection count and broadcast latency

## Production Deployment

When deploying:
1. Run WebSocket server on separate port (e.g., 3001)
2. Set `WS_SERVER_URL=https://api.example.com:3001` (external endpoint)
3. Ensure WebSocket server starts before/with Next.js app
4. Use PM2 to manage both processes:
   ```bash
   # ecosystem.config.js
   module.exports = {
     apps: [
       { name: 'next', script: 'npm run build && npm start' },
       { name: 'websocket', script: 'npm run websocket' }
     ]
   }
   ```
5. Use HTTPS and WSS (secure WebSocket)
6. Add health checks and auto-restart

## Support

If tests fail, check:
1. WebSocket server running: `curl http://localhost:3001/health`
2. Browser has session (logged in)
3. API broadcast calls (in API route logs)
4. Browser console (search for `[WebSocket]`)
5. Network tab (WS protocol)
