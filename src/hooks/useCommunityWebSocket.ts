// WebSocket connection manager for real-time community updates
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { isAccessTokenExpired, getStoredTokens } from '@/lib/tokenManager';

type WebSocketMessage = {
  type: 'post-created' | 'comment-added' | 'comment-reply-added' | 'comment-reaction-added' | 'comment-reaction-removed' | 'post-liked' | 'user-followed' | 'feed-update' | 'auth' | 'auth-confirmed' | 'error';
  data?: unknown;
  timestamp?: string;
  userId?: string;
};

class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 3000;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private isConnecting = false;
  private userId: string | null = null;
  private authSent = false;
  private pendingConnection: Promise<void> | null = null;
  private tokenExpiryTimer: NodeJS.Timeout | null = null;
  private shouldReconnect = true; // Only true if token is valid

  constructor(url: string) {
    this.url = url;
  }

  connect(userId?: string): Promise<void> {
    // Check if token is expired - if so, don't connect
    if (isAccessTokenExpired()) {
      this.shouldReconnect = false;
      console.warn('🔐 WebSocket: Token expired, not connecting');
      return Promise.reject(new Error('Token expired'));
    }

    // If already connected, resolve immediately
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    // If already connecting, return the pending connection promise
    if (this.isConnecting && this.pendingConnection) {
      return this.pendingConnection;
    }

    this.pendingConnection = new Promise((resolve, reject) => {

      if (userId) {
        this.userId = userId;
        this.authSent = false;
      }

      this.isConnecting = true;

      try {
        // Determine WebSocket URL based on environment and config
        let wsUrl: string;
        
        if (typeof window === 'undefined') {
          // Server-side, shouldn't happen
          reject(new Error('WebSocket can only be used client-side'));
          return;
        }

        // Priority 1: Use NEXT_PUBLIC_WS_URL if explicitly configured
        if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_WS_URL) {
          wsUrl = process.env.NEXT_PUBLIC_WS_URL;
        } else {
          // Priority 2: Auto-detect based on current page location
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // Development: connect to localhost:3001
            wsUrl = `${protocol}//localhost:3001`;
          } else {
            // Production: use same host as current page (proxy on same domain)
            const host = window.location.host;
            wsUrl = `${protocol}//${host}`;
          }
        }

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          this.pendingConnection = null;
          this.shouldReconnect = true; // Token is valid, allow reconnect if disconnected

          // Send auth message immediately after connection
          if (this.userId && !this.authSent) {
            this.sendAuth(this.userId);
          }

          // Set up token expiry monitoring
          this.startTokenExpiryMonitoring();

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

        this.ws.onclose = () => {
          this.isConnecting = false;
          this.pendingConnection = null;
          this.authSent = false;
          
          // Only attempt reconnect if token is still valid
          if (this.shouldReconnect && !isAccessTokenExpired()) {
            this.attemptReconnect();
          } else if (isAccessTokenExpired()) {
            console.log('🔐 WebSocket: Token expired, stopping reconnection attempts');
            this.shouldReconnect = false;
          }
        };
      } catch (error) {
        this.isConnecting = false;
        this.pendingConnection = null;
        reject(error);
      }
    });

    return this.pendingConnection;
  }

  private startTokenExpiryMonitoring() {
    // Clear any existing timer
    if (this.tokenExpiryTimer) {
      clearTimeout(this.tokenExpiryTimer);
    }

    const tokens = getStoredTokens();
    if (!tokens) return;

    // Calculate time until token expires (minus 1 minute buffer)
    const timeUntilExpiry = tokens.expiresAt - Date.now() - 60000;

    if (timeUntilExpiry > 0) {
      // Set timer to disconnect before token actually expires
      this.tokenExpiryTimer = setTimeout(() => {
        console.log('🔐 WebSocket: Token expiring soon, will disconnect on next connection loss');
        this.shouldReconnect = false;
      }, timeUntilExpiry);
    }
  }

  private sendAuth(userId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not ready for auth');
      return;
    }

    this.ws.send(
      JSON.stringify({
        type: 'auth',
        userId,
      })
    );

    this.authSent = true;
  }

  private attemptReconnect() {
    // Don't reconnect if token is expired
    if (isAccessTokenExpired()) {
      console.log('🔐 WebSocket: Token expired, not reconnecting');
      this.shouldReconnect = false;
      return;
    }

    if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.baseReconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
      
      setTimeout(() => {
        this.connect(this.userId || undefined).catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached or token invalid');
    }
  }

  private handleMessage(message: WebSocketMessage) {
    if (message.type === 'auth-confirmed') {
      return;
    }

    if (message.type === 'error') {
      console.error('WebSocket error:', message.data);
      return;
    }

    const listeners = this.listeners.get(message.type);
    if (listeners) {
      listeners.forEach((listener) => listener(message.data));
    }
  }

  subscribe(eventType: string, callback: (data: unknown) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  send(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not open');
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.tokenExpiryTimer) {
      clearTimeout(this.tokenExpiryTimer);
      this.tokenExpiryTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
    this.authSent = false;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Global instance
let globalWsManager: WebSocketManager | null = null;

export function getWebSocketManager(): WebSocketManager {
  if (!globalWsManager) {
    globalWsManager = new WebSocketManager('ws://localhost:3001');
  }
  return globalWsManager;
}

// Enhanced hook for subscribing to community updates
export function useCommunityUpdates(
  onPostCreated?: (post: unknown) => void,
  onCommentAdded?: (comment: unknown) => void,
  onCommentReplyAdded?: (reply: unknown) => void,
  onCommentReactionAdded?: (reaction: unknown) => void,
  onCommentReactionRemoved?: (reaction: unknown) => void,
  onPostLiked?: (data: unknown) => void,
  onUserFollowed?: (data: unknown) => void,
  onFeedUpdate?: (data: unknown) => void
) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const unsubscribesRef = useRef<(() => void)[]>([]);
  const connectionCheckRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) {
      console.warn('No user available for WebSocket connection');
      return;
    }

    const wsManager = getWebSocketManager();

    // Connect if not already connected
    if (!wsManager.isConnected()) {
      // Use user ID as unique identifier
      const userId = user.id;
      wsManager.connect(userId).catch((error) => {
        console.error('Failed to connect WebSocket:', error);
      });
    }

    // Subscribe to events
    const callbacks: [string, (data: unknown) => void][] = [];
    
    if (onPostCreated) {
      callbacks.push(['post-created', onPostCreated]);
    }
    if (onCommentAdded) {
      callbacks.push(['comment-added', onCommentAdded]);
    }
    if (onCommentReplyAdded) {
      callbacks.push(['comment-reply-added', onCommentReplyAdded]);
    }
    if (onCommentReactionAdded) {
      callbacks.push(['comment-reaction-added', onCommentReactionAdded]);
    }
    if (onCommentReactionRemoved) {
      callbacks.push(['comment-reaction-removed', onCommentReactionRemoved]);
    }
    if (onPostLiked) {
      callbacks.push(['post-liked', onPostLiked]);
    }
    if (onUserFollowed) {
      callbacks.push(['user-followed', onUserFollowed]);
    }
    if (onFeedUpdate) {
      callbacks.push(['feed-update', onFeedUpdate]);
    }

    // Subscribe to all events
    callbacks.forEach(([eventType, callback]) => {
      const unsubscribe = wsManager.subscribe(eventType, callback);
      unsubscribesRef.current.push(unsubscribe);
    });

    // Create a periodic check for connection status
    const checkConnection = () => {
      setIsConnected(wsManager.isConnected());
    };

    checkConnection();
    connectionCheckRef.current = setInterval(checkConnection, 5000); // Check every 5 seconds

    // Cleanup
    return () => {
      unsubscribesRef.current.forEach((unsub) => unsub());
      unsubscribesRef.current = [];

      if (connectionCheckRef.current) {
        clearInterval(connectionCheckRef.current);
      }
    };
  }, [user?.id, onPostCreated, onCommentAdded, onCommentReplyAdded, onCommentReactionAdded, onCommentReactionRemoved, onPostLiked, onUserFollowed, onFeedUpdate]);

  return isConnected;
}

// Alternative hook that returns updates object instead of callbacks
export function useCommunityWebSocket(userId?: string) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [updates, setUpdates] = useState<WebSocketMessage | null>(null);
  const unsubscribesRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    const effectUserId = userId || user?.id;

    if (!effectUserId) {
      console.warn('No user ID available for WebSocket connection');
      return;
    }

    const wsManager = getWebSocketManager();

    // Connect if not already connected
    if (!wsManager.isConnected()) {
      wsManager.connect(effectUserId).catch((error) => {
        console.error('Failed to connect WebSocket:', error);
      });
    }

    setIsConnected(wsManager.isConnected());

    // Subscribe to all event types
    const eventTypes = ['post-created', 'comment-added', 'post-liked', 'user-followed', 'feed-update'] as const;
    
    eventTypes.forEach((eventType) => {
      const unsubscribe = wsManager.subscribe(eventType, (data) => {
        setUpdates({
          type: eventType,
          data,
          timestamp: new Date().toISOString(),
        });
      });

      unsubscribesRef.current.push(unsubscribe);
    });

    // Connection status checker
    const connectionCheckRef = setInterval(() => {
      setIsConnected(wsManager.isConnected());
    }, 5000);

    // Cleanup
    return () => {
      unsubscribesRef.current.forEach((unsub) => unsub());
      unsubscribesRef.current = [];
      clearInterval(connectionCheckRef);
    };
  }, [userId, user?.id]);

  return { isConnected, updates };
}


// Hook for refreshing feed periodically
export function useAutoRefresh(
  refreshCallback: () => Promise<void>,
  interval: number = 30000 // 30 seconds
) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const doRefresh = async () => {
      setIsRefreshing(true);
      try {
        await refreshCallback();
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    };

    // Set up interval
    intervalRef.current = setInterval(doRefresh, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshCallback, interval]);

  return isRefreshing;
}
