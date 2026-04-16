/**
 * Socket.IO Gateway for Real-time Features
 *
 * Integrated into Next.js for unified server architecture
 *
 * Handles:
 * - Player connections and disconnections
 * - Match updates and live scoring
 * - Community notifications
 * - Chat messages
 * - Tournament updates
 * - Booking confirmations
 *
 * Architecture:
 * - userId → socket connections
 * - matchId → user observers
 * - Shared auth and database with main API
 */

import { Server as SocketIOServer } from 'socket.io';
import { verifyToken } from './jwt';
import prisma from './prisma';

// In-memory connection maps
const userSockets = new Map<string, Set<string>>(); // userId → Set of socket IDs
const matchObservers = new Map<string, Set<string>>(); // matchId → Set of userIds
const developerSockets = new Map<string, Set<string>>(); // Developer user IDs → Set of socket IDs
const socketMetadata = new Map<string, { userId: string; connectedAt: Date; lastActivity: Date; isDeveloper?: boolean }>();

// Connection statistics
let totalConnections = 0;
let activeConnections = 0;
let metricsInterval: NodeJS.Timeout | null = null;

let io: SocketIOServer;

function decodeSocketToken(token: string) {
  // In production, use JWT verification only.
  if (process.env.NODE_ENV === 'production') {
    return verifyToken(token);
  }

  // Support simple test tokens during local development / integration testing.
  if (token?.startsWith('test-')) {
    return { playerId: token.replace(/[^a-zA-Z0-9_-]/g, '_') } as any;
  }

  return verifyToken(token);
}

/**
 * Initialize Socket.IO server
 */
export function initializeSocketIO(server: any) {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    },
    path: '/api/socketio'
  });

  io.on('connection', (socket) => {
    console.log(`🔗 Socket connected: ${socket.id}`);

    // Handle authentication
    socket.on('auth', async (data) => {
      try {
        const { token } = data;
        const payload = decodeSocketToken(token);

        if (payload?.playerId) {
          await handleAuthenticatedConnection(socket, payload.playerId);
        } else {
          socket.emit('auth_error', { message: 'Invalid token' });
          socket.disconnect();
        }
      } catch (error) {
        console.error('Socket auth error:', error);
        socket.emit('auth_error', { message: 'Authentication failed' });
        socket.disconnect();
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      handleDisconnection(socket.id);
    });

    // Handle ping/pong for connection health
    socket.on('ping', (data) => {
      socket.emit('pong', { ...data, serverTime: Date.now() });
    });
  });

  console.log('🚀 Socket.IO server initialized');
  return io;
}

/**
 * Handle authenticated socket connection
 */
async function handleAuthenticatedConnection(socket: any, playerId: string) {
  // Track socket
  if (!userSockets.has(playerId)) {
    userSockets.set(playerId, new Set());
  }
  userSockets.get(playerId)!.add(socket.id);

  // Store metadata
  socketMetadata.set(socket.id, {
    userId: playerId,
    connectedAt: new Date(),
    lastActivity: new Date()
  });

  totalConnections++;
  activeConnections++;

  console.log(`✅ User ${playerId} authenticated (${activeConnections} active connections)`);

  // Send welcome message
  socket.emit('authenticated', {
    userId: playerId,
    connectedAt: new Date().toISOString(),
    serverTime: new Date().toISOString()
  });

  // Set up event handlers
  setupSocketEventHandlers(socket, playerId);

  // Heartbeat
  const heartbeat = setInterval(() => {
    if (socket.connected) {
      socket.emit('ping', { timestamp: Date.now() });
    } else {
      clearInterval(heartbeat);
    }
  }, 30000);
}

/**
 * Set up socket event handlers
 */
function setupSocketEventHandlers(socket: any, playerId: string) {
  // Match subscription
  socket.on('subscribe_match', async (data: any) => {
    await handleMatchSubscription(socket, playerId, data.matchId);
  });

  socket.on('unsubscribe_match', async (data: any) => {
    await handleMatchUnsubscription(socket, playerId, data.matchId);
  });

  // Developer metrics subscription
  socket.on('developer_subscribe', async () => {
    await handleDeveloperSubscription(socket, playerId);
  });

  socket.on('developer_unsubscribe', async () => {
    await handleDeveloperUnsubscription(socket, playerId);
  });

  // Chat events
  socket.on('join_chat', async (data: any) => {
    await handleChatJoin(socket, playerId, data.chatId);
  });

  socket.on('leave_chat', async (data: any) => {
    await handleChatLeave(socket, playerId, data.chatId);
  });

  socket.on('typing_start', async (data: any) => {
    await handleTypingStart(playerId, data.chatId);
  });

  socket.on('typing_stop', async (data: any) => {
    await handleTypingStop(playerId, data.chatId);
  });

  // Update activity
  socket.onAny(() => {
    const metadata = socketMetadata.get(socket.id);
    if (metadata) {
      metadata.lastActivity = new Date();
    }
  });
}

/**
 * Handle match subscription
 */
async function handleMatchSubscription(socket: any, playerId: string, matchId: string) {
  if (!matchId) {
    socket.emit('error', { message: 'Match ID required' });
    return;
  }

  // Verify access
  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      OR: [
        { playerAId: playerId },
        { playerBId: playerId },
        { refereeId: playerId },
      ]
    }
  });

  if (!match) {
    socket.emit('error', { message: 'Access denied to match' });
    return;
  }

  // Add to observers
  if (!matchObservers.has(matchId)) {
    matchObservers.set(matchId, new Set());
  }
  matchObservers.get(matchId)!.add(playerId);

  socket.emit('match_subscribed', { matchId, status: 'success' });
  console.log(`👁️  User ${playerId} subscribed to match ${matchId}`);
}

/**
 * Handle match unsubscription
 */
async function handleMatchUnsubscription(socket: any, playerId: string, matchId: string) {
  if (!matchId || !matchObservers.has(matchId)) {
    return;
  }

  matchObservers.get(matchId)!.delete(playerId);

  if (matchObservers.get(matchId)!.size === 0) {
    matchObservers.delete(matchId);
  }

  socket.emit('match_unsubscribed', { matchId, status: 'success' });
  console.log(`👁️  User ${playerId} unsubscribed from match ${matchId}`);
}

/**
 * Handle developer subscription
 */
async function handleDeveloperSubscription(socket: any, playerId: string) {
  // Verify user is a developer
  const user = await prisma.user.findUnique({
    where: { id: playerId }
  });
  const userWithRole = user as unknown as { role?: string };

  if (!userWithRole || userWithRole.role !== 'developer') {
    socket.emit('error', { message: 'Access denied: developer role required' });
    return;
  }

  // Add to developer sockets
  if (!developerSockets.has(playerId)) {
    developerSockets.set(playerId, new Set());
  }
  developerSockets.get(playerId)!.add(socket.id);

  // Update socket metadata
  const metadata = socketMetadata.get(socket.id);
  if (metadata) {
    metadata.isDeveloper = true;
  }

  socket.emit('developer_subscribed', { status: 'success' });
  console.log(`🔧 Developer ${playerId} subscribed to metrics`);
}

/**
 * Handle developer unsubscription
 */
async function handleDeveloperUnsubscription(socket: any, playerId: string) {
  if (!developerSockets.has(playerId)) {
    return;
  }

  developerSockets.get(playerId)!.delete(socket.id);

  if (developerSockets.get(playerId)!.size === 0) {
    developerSockets.delete(playerId);
  }

  socket.emit('developer_unsubscribed', { status: 'success' });
  console.log(`🔧 Developer ${playerId} unsubscribed from metrics`);
}

/**
 * Handle chat join
 */
async function handleChatJoin(socket: any, playerId: string, chatId: string) {
  // Verify access
  const chat = await prisma.chatRoom.findFirst({
    where: {
      id: chatId,
      participants: { some: { playerId: playerId } }
    }
  });

  if (!chat) {
    socket.emit('error', { message: 'Access denied to chat' });
    return;
  }

  socket.emit('chat_joined', { chatId, status: 'success' });
  console.log(`💬 User ${playerId} joined chat ${chatId}`);
}

/**
 * Handle chat leave
 */
async function handleChatLeave(socket: any, playerId: string, chatId: string) {
  socket.emit('chat_left', { chatId, status: 'success' });
  console.log(`💬 User ${playerId} left chat ${chatId}`);
}

/**
 * Handle typing indicators
 */
async function handleTypingStart(playerId: string, chatId: string) {
  if (!chatId) return;

  await broadcastToChat(chatId, 'user_typing', {
    userId: playerId,
    chatId,
    isTyping: true
  }, [playerId]);
}

async function handleTypingStop(playerId: string, chatId: string) {
  if (!chatId) return;

  await broadcastToChat(chatId, 'user_typing', {
    userId: playerId,
    chatId,
    isTyping: false
  }, [playerId]);
}

/**
 * Handle disconnection
 */
function handleDisconnection(socketId: string) {
  const metadata = socketMetadata.get(socketId);
  if (!metadata) return;

  const { userId } = metadata;

  // Remove from user sockets
  const userConns = userSockets.get(userId);
  if (userConns) {
    userConns.delete(socketId);
    if (userConns.size === 0) {
      userSockets.delete(userId);
    }
  }

  // Remove metadata
  socketMetadata.delete(socketId);

  activeConnections--;

  console.log(`🔌 User ${userId} disconnected (${activeConnections} active connections)`);

  // Clean up match subscriptions
  for (const [matchId, observers] of matchObservers.entries()) {
    observers.delete(userId);
    if (observers.size === 0) {
      matchObservers.delete(matchId);
    }
  }

  // Clean up developer subscriptions
  if (developerSockets.has(userId)) {
    developerSockets.get(userId)!.delete(socketId);
    if (developerSockets.get(userId)!.size === 0) {
      developerSockets.delete(userId);
    }
  }
}

/**
 * Broadcast to user
 */
export function broadcastToUser(userId: string, event: string, data: any) {
  const socketIds = userSockets.get(userId);
  if (!socketIds) return;

  socketIds.forEach(socketId => {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit(event, data);
    }
  });

  console.log(`📢 Broadcast to user ${userId}: ${event}`);
}

/**
 * Broadcast to all
 */
export function broadcastToAll(event: string, data: any) {
  io.emit(event, data);
  console.log(`📢 Broadcast to all: ${event}`);
}

/**
 * Broadcast to match observers
 */
export function broadcastToMatch(matchId: string, event: string, data: any, excludeUserIds: string[] = []) {
  const observers = matchObservers.get(matchId);
  if (!observers) return;

  let sentCount = 0;
  for (const userId of observers) {
    if (excludeUserIds.includes(userId)) continue;

    const socketIds = userSockets.get(userId);
    if (!socketIds) continue;

    socketIds.forEach(socketId => {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit(event, data);
        sentCount++;
      }
    });
  }

  console.log(`📢 Broadcast to match ${matchId} (${sentCount} connections): ${event}`);
}

/**
 * Broadcast to chat participants
 */
export async function broadcastToChat(chatId: string, event: string, data: any, excludeUserIds: string[] = []) {
  const chat = await prisma.chatRoom.findUnique({
    where: { id: chatId },
    include: { participants: true }
  });

  if (!chat) return;

  let sentCount = 0;
  for (const participant of chat.participants) {
    if (excludeUserIds.includes(participant.playerId)) continue;

    const socketIds = userSockets.get(participant.playerId);
    if (!socketIds) continue;

    socketIds.forEach(socketId => {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit(event, data);
        sentCount++;
      }
    });
  }

  console.log(`📢 Broadcast to chat ${chatId} (${sentCount} connections): ${event}`);
}

/**
 * Broadcast to developers
 */
export function broadcastToDevelopers(event: string, data: any) {
  if (developerSockets.size === 0) return;

  let sentCount = 0;
  for (const [, socketIds] of developerSockets) {
    socketIds.forEach(socketId => {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit(event, data);
        sentCount++;
      }
    });
  }

  if (sentCount > 0) {
    console.log(`📢 Broadcast to developers (${sentCount} connections): ${event}`);
  }
}

/**
 * Get connection statistics
 */
export function getSocketStats() {
  return {
    totalConnections,
    activeConnections,
    connectedUsers: userSockets.size,
    activeMatches: matchObservers.size,
    connectedDevelopers: developerSockets.size,
    memoryUsage: process.memoryUsage()
  };
}

/**
 * Get or set the metrics broadcast interval
 */
export function getMetricsInterval() {
  return metricsInterval;
}

export function setMetricsInterval(interval: NodeJS.Timeout) {
  metricsInterval = interval;
}

export { io };