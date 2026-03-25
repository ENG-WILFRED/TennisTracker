/**
 * Standalone WebSocket Server for Real-time Features
 * 
 * Usage:
 * 1. Start this server as a separate process (node --loader ts-node/esm src/websocket-server.ts)
 * 2. Or use: npm run websocket (add to package.json)
 * 
 * This server handles:
 * - Player connections
 * - Match updates
 * - Community notifications
 * - Bookmark/follow updates
 * 
 * Architecture:
 * - userId → Set<WebSocket connections>
 * - matchId → Set<user IDs (for later optimization)
 * 
 * CRITICAL: Run this as a separate service from your Next.js app
 */

import { WebSocketServer, WebSocket } from 'ws';
import express from 'express';

// Port configuration
const WS_PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 3001;
const WS_HOST = process.env.WS_HOST || 'localhost';
const HTTP_PORT = WS_PORT; // HTTP endpoints on same port as WebSocket

// In-memory user connection map
// userId → Set of WebSocket connections
const userConnections = new Map<string, Set<WebSocket>>();

// In-memory match observer map (for future optimization)
// matchId → Set of userId
const matchObservers = new Map<string, Set<string>>();

// Express app for HTTP endpoints
const app = express();
app.use(express.json());

// WebSocket server
const wss = new WebSocketServer({ noServer: true });

console.log(`🟢 WebSocket server starting on ${WS_HOST}:${WS_PORT}`);
console.log(`📋 Environment Configuration:`);
console.log(`   WS_PORT=${process.env.WS_PORT || 'not set (default: 3001)'}`);
console.log(`   WS_HOST=${process.env.WS_HOST || 'not set (default: localhost)'}`);
console.log(`   WS_SERVER_URL=${process.env.WS_SERVER_URL || 'not set (default: http://localhost:3001)'}`);

// Create HTTP server that handles WebSocket upgrades
const server = app.listen(HTTP_PORT, WS_HOST, () => {
  console.log(`✨ HTTP server listening on ${WS_HOST}:${HTTP_PORT}`);
  console.log(`🔗 WebSocket endpoint: ws://${WS_HOST}:${WS_PORT}`);
  console.log(`📡 Broadcast endpoints:`);
  console.log(`   POST /broadcast/broadcast-all`);
  console.log(`   POST /broadcast/broadcast-user`);
  console.log(`   POST /broadcast/broadcast-except`);
  console.log(`   POST /broadcast/broadcast-match`);
  console.log(`   GET /stats`);
});

// ============================================
// HTTP Broadcast Endpoints (from your API)
// ============================================

/**
 * Broadcast to all connected clients
 */
app.post('/broadcast/broadcast-all', (req, res) => {
  const { type, data } = req.body;

  const message = JSON.stringify({
    type,
    data,
    timestamp: new Date().toISOString(),
  });

  for (const [, connections] of userConnections.entries()) {
    for (const ws of connections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }

  console.log(`📢 Broadcast to all (${userConnections.size} users): ${type}`);
  res.json({ sent: true, type });
});

/**
 * Broadcast to specific user
 */
app.post('/broadcast/broadcast-user', (req, res) => {
  const { userId, type, data } = req.body;

  const userConns = userConnections.get(userId);

  if (!userConns) {
    console.log(`⚠️  No connections for user ${userId}`);
    res.json({ sent: false, reason: 'User not connected' });
    return;
  }

  const message = JSON.stringify({
    type,
    data,
    timestamp: new Date().toISOString(),
  });

  for (const ws of userConns) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }

  console.log(`💬 Message to user ${userId}: ${type}`);
  res.json({ sent: true, type, userId });
});

/**
 * Broadcast to all except sender
 */
app.post('/broadcast/broadcast-except', (req, res) => {
  const { senderId, type, data } = req.body;

  const message = JSON.stringify({
    type,
    data,
    timestamp: new Date().toISOString(),
  });

  let count = 0;

  for (const [userId, connections] of userConnections.entries()) {
    if (userId === senderId) continue;

    for (const ws of connections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        count++;
      }
    }
  }

  console.log(`📢 Broadcast except ${senderId} (${count} connections): ${type}`);
  res.json({ sent: true, type, recipientCount: count });
});

/**
 * Broadcast to users watching a specific match
 */
app.post('/broadcast/broadcast-match', (req, res) => {
  const { matchId, type, data } = req.body;

  const observers = matchObservers.get(matchId);

  if (!observers || observers.size === 0) {
    console.log(`⚠️  No observers for match ${matchId}`);
    res.json({ sent: false, reason: 'No match observers' });
    return;
  }

  const message = JSON.stringify({
    type,
    matchId,
    data,
    timestamp: new Date().toISOString(),
  });

  let count = 0;

  for (const userId of observers) {
    const userConns = userConnections.get(userId);

    if (userConns) {
      for (const ws of userConns) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
          count++;
        }
      }
    }
  }

  console.log(`🎾 Broadcast to match ${matchId} (${count} connections): ${type}`);
  res.json({ sent: true, type, matchId, recipientCount: count });
});

/**
 * Get connection stats
 */
app.get('/stats', (req, res) => {
  let totalConnections = 0;

  for (const connections of userConnections.values()) {
    totalConnections += connections.size;
  }

  res.json({
    connectedUsers: userConnections.size,
    totalConnections,
    activeMatches: matchObservers.size,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ============================================
// WebSocket Connection Handler
// ============================================

// Handle WebSocket upgrade from HTTP
server.on('upgrade', (request, socket, head) => {
  // Simple auth: extract userId from query param or headers
  // In production, validate the request properly
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (ws: WebSocket, request) => {
  let userId: string | null = null;
  let connectedAt = new Date();

  console.log(`📡 New WebSocket connection from ${request.socket?.remoteAddress || 'unknown'}`);

  // Handle incoming messages
  ws.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());

      // Auth: First message should authenticate the user
      if (message.type === 'auth') {
        userId = message.userId;

        if (!userConnections.has(userId)) {
          userConnections.set(userId, new Set());
        }

        userConnections.get(userId)!.add(ws);

        console.log(`✅ User authenticated: ${userId} (connections: ${userConnections.get(userId)!.size})`);

        // Send confirmation
        ws.send(
          JSON.stringify({
            type: 'auth-confirmed',
            userId,
            timestamp: new Date().toISOString(),
          })
        );
        return;
      }

      // Handle match subscription
      if (message.type === 'subscribe-match') {
        const matchId = message.matchId;

        if (!matchObservers.has(matchId)) {
          matchObservers.set(matchId, new Set());
        }

        matchObservers.get(matchId)!.add(userId);
        console.log(`👀 User ${userId} subscribed to match ${matchId}`);

        ws.send(
          JSON.stringify({
            type: 'match-subscribe-confirmed',
            matchId,
            timestamp: new Date().toISOString(),
          })
        );
        return;
      }

      // Handle match unsubscription
      if (message.type === 'unsubscribe-match') {
        const matchId = message.matchId;

        if (matchObservers.has(matchId)) {
          matchObservers.get(matchId)!.delete(userId);
        }

        console.log(`👋 User ${userId} unsubscribed from match ${matchId}`);
        return;
      }

      // Echo handler for keep-alive
      if (message.type === 'ping') {
        ws.send(
          JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString(),
          })
        );
        return;
      }

      console.log(`📨 Message from ${userId}:`, message.type);
    } catch (error) {
      console.error('Failed to parse message:', error);
      ws.send(
        JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
        })
      );
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    if (userId) {
      const userConns = userConnections.get(userId);

      if (userConns) {
        userConns.delete(ws);

        console.log(
          `❌ User disconnected: ${userId} (remaining: ${userConns.size})`
        );

        // Clean up if no more connections
        if (userConns.size === 0) {
          userConnections.delete(userId);

          // Clean up from match observers
          for (const [matchId, observers] of matchObservers.entries()) {
            observers.delete(userId);

            if (observers.size === 0) {
              matchObservers.delete(matchId);
            }
          }
        }
      }
    }
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`❌ WebSocket error for user ${userId}:`, error.message);
  });
});

wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

// ============================================
// Graceful Shutdown
// ============================================

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down WebSocket server...');
  wss.close(() => {
    console.log('✅ WebSocket server shut down');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down...');
  server.close(() => {
    console.log('✅ HTTP server shut down');
    process.exit(0);
  });
});

console.log(`✨ WebSocket server ready at ws://${WS_HOST}:${WS_PORT}`);
console.log(`🔗 Clients should connect with: ws://localhost:${WS_PORT}`);

