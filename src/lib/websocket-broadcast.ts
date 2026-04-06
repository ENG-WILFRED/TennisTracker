/**
 * WebSocket Broadcast Client
 * 
 * These functions communicate with the standalone WebSocket server
 * to broadcast messages to connected clients.
 * 
 * IMPORTANT: The WebSocket server must be running separately:
 *   npm run websocket
 * 
 * Architecture:
 * - Your API routes use these functions
 * - These functions HTTP POST to the WebSocket server
 * - WebSocket server broadcasts to all connected clients
 */

const WS_SERVER_URL = process.env.WS_SERVER_URL || 'http://localhost:3001';

/**
 * Send broadcast request to WebSocket server
 * Internal helper used by all broadcast functions
 */
async function sendToWSServer(
  action: 'broadcast-all' | 'broadcast-user' | 'broadcast-except' | 'broadcast-match',
  payload: unknown
) {
  try {
    // Only broadcast in production or if WS server is configured
    if (!process.env.WS_SERVER_URL && process.env.NODE_ENV === 'production') {
      console.warn(
        '⚠️  WS_SERVER_URL not configured. WebSocket broadcasts will not be sent.'
      );
      return;
    }

    const response = await fetch(`${WS_SERVER_URL}/broadcast/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        `❌ WebSocket broadcast failed: ${response.status} ${response.statusText}`
      );
    }
  } catch (error) {
    console.error('Failed to send broadcast to WebSocket server:', error);
    // Don't throw - broadcasts are not critical to API success
  }
}

/**
 * Broadcast message to all connected clients
 * Use for: global notifications, public events
 */
export function broadcastToClients(message: unknown) {
  sendToWSServer('broadcast-all', {
    type: (message as Record<string, unknown>)?.type || 'generic',
    data: (message as Record<string, unknown>)?.data || message,
  });
}

/**
 * Broadcast message to specific user
 * Use for: personal notifications, direct updates
 */
export function broadcastToUser(userId: string, message: unknown) {
  sendToWSServer('broadcast-user', {
    userId,
    type: (message as Record<string, unknown>)?.type || 'generic',
    data: (message as Record<string, unknown>)?.data || message,
  });
}

/**
 * Broadcast to all except the sender
 * Use for: social updates, activity feeds
 */
export function broadcastExcept(senderId: string, message: unknown) {
  sendToWSServer('broadcast-except', {
    senderId,
    type: (message as Record<string, unknown>)?.type || 'generic',
    data: (message as Record<string, unknown>)?.data || message,
  });
}

/**
 * Broadcast to users watching a specific match
 * Use for: live score updates, match events
 */
export function broadcastToMatch(matchId: string, message: unknown) {
  sendToWSServer('broadcast-match', {
    matchId,
    type: (message as Record<string, unknown>)?.type || 'generic',
    data: (message as Record<string, unknown>)?.data || message,
  });
}

/**
 * Get connection stats (optional, for monitoring dashboards)
 */
export async function getConnectionStats() {
  try {
    const response = await fetch(`${WS_SERVER_URL}/stats`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch connection stats:', error);
  }

  return null;
}

/**
 * Get count of connected clients (for monitoring)
 */
export async function getConnectedClientsCount(): Promise<number> {
  const stats = await getConnectionStats();
  return stats?.totalConnections || 0;
}
