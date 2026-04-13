// WebSocket hook for real-time messaging
import { useEffect, useState, useCallback, useRef } from 'react';
import { isAccessTokenExpired, getStoredTokens } from '@/lib/tokenManager';

class ChatWebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 3000;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private isConnecting = false;
  private userId: string | null = null;
  private authSent = false;
  private connectPromise: Promise<void> | null = null;
  private connectResolve: (() => void) | null = null;
  private tokenExpiryTimer: NodeJS.Timeout | null = null;
  private shouldReconnect = true; // Only true if token is valid

  constructor(url: string) {
    this.url = url;
  }

  connect(userId?: string): Promise<void> {
    // Check if token is expired - if so, don't connect
    if (isAccessTokenExpired()) {
      this.shouldReconnect = false;
      console.warn('🔐 Chat WebSocket: Token expired, not connecting');
      return Promise.reject(new Error('Token expired'));
    }

    // If already connected, return immediately
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('✅ Chat WebSocket already connected');
      return Promise.resolve();
    }

    // If already connecting, return the existing promise
    if (this.isConnecting && this.connectPromise) {
      console.log('⏳ Chat WebSocket connection in progress, waiting...');
      return this.connectPromise;
    }

    // Create new connection promise
    this.connectPromise = new Promise((resolve, reject) => {
      this.connectResolve = resolve;

      if (userId) {
        this.userId = userId;
        this.authSent = false;
      }

      this.isConnecting = true;

      try {
        let wsUrl: string;
        
        if (typeof window === 'undefined') {
          this.isConnecting = false;
          reject(new Error('WebSocket can only be used client-side'));
          return;
        }

        if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_WS_URL) {
          wsUrl = process.env.NEXT_PUBLIC_WS_URL;
        } else {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            wsUrl = `${protocol}//localhost:3001`;
          } else {
            const host = window.location.host;
            wsUrl = `${protocol}//${host}`;
          }
        }

        console.log(`🔌 Chat: Connecting to WebSocket at ${wsUrl}`);
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ Chat WebSocket connected');
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          this.shouldReconnect = true; // Token is valid, allow reconnect if disconnected

          if (this.userId && !this.authSent) {
            this.sendAuth(this.userId);
          }

          // Set up token expiry monitoring
          this.startTokenExpiryMonitoring();

          if (this.connectResolve) {
            this.connectResolve();
            this.connectResolve = null;
          }
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (event: Event) => {
          const errorMsg = event instanceof Event ? 'WebSocket connection error' : String(event);
          console.error('❌ Chat WebSocket error:', errorMsg);
          this.isConnecting = false;
          this.connectPromise = null;
          this.connectResolve = null;
          reject(new Error('WebSocket connection failed'));
        };

        this.ws.onclose = () => {
          console.log('🔌 Chat WebSocket disconnected');
          this.ws = null;
          this.authSent = false;
          this.connectPromise = null;
          this.connectResolve = null;
          
          // Only attempt reconnect if token is still valid
          if (this.shouldReconnect && !isAccessTokenExpired()) {
            this.reconnect();
          } else if (isAccessTokenExpired()) {
            console.log('🔐 Chat WebSocket: Token expired, stopping reconnection attempts');
            this.shouldReconnect = false;
          }
        };
      } catch (error) {
        this.isConnecting = false;
        this.connectPromise = null;
        this.connectResolve = null;
        reject(error);
      }
    });

    return this.connectPromise;
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
        console.log('🔐 Chat WebSocket: Token expiring soon, will disconnect on next connection loss');
        this.shouldReconnect = false;
      }, timeUntilExpiry);
    }
  }

  private sendAuth(userId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('🔐 Sending auth message for:', userId);
      this.ws.send(JSON.stringify({
        type: 'auth',
        userId,
      }));
      this.authSent = true;
    }
  }

  private reconnect() {
    // Don't reconnect if token is expired
    if (isAccessTokenExpired()) {
      console.log('🔐 Chat WebSocket: Token expired, not reconnecting');
      this.shouldReconnect = false;
      return;
    }

    if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`🔄 Chat: Attempting to reconnect in ${delay}ms...`);
      setTimeout(() => {
        this.connect(this.userId || undefined);
      }, delay);
    } else {
      console.error('❌ Chat: Max reconnection attempts reached or token invalid');
    }
  }

  private handleMessage(message: unknown) {
    if (!message || !(message as any).type) return;

    try {
      if ((message as any).type === 'auth-confirmed') {
        console.log('🔐 Chat: Auth confirmed', (message as any).userId);
        return;
      }

      if ((message as any).type === 'error') {
        const errorMsg = typeof (message as any).data === 'string' ? (message as any).data : JSON.stringify((message as any).data);
        console.error('Chat WebSocket error:', errorMsg);
        return;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error instanceof Error ? error.message : String(error));
      return;
    }

    const listeners = this.listeners.get((message as any).type);
    if (listeners) {
      listeners.forEach((listener) => listener(message));
    }
  }

  subscribe(eventType: string, callback: (data: unknown) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  send(message: unknown) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('Chat WebSocket is not open');
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

let chatWsManager: ChatWebSocketManager | null = null;

function getChatWsManager(): ChatWebSocketManager {
  if (!chatWsManager) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || '';
    chatWsManager = new ChatWebSocketManager(wsUrl);
  }
  return chatWsManager;
}

export function useChatWebSocket(userId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const wsManagerRef = useRef<ChatWebSocketManager>(null);

  useEffect(() => {
    if (!userId) return;

    const ws = getChatWsManager();
    wsManagerRef.current = ws;

    ws.connect(userId)
      .then(() => {
        setIsConnected(true);
        console.log('✅ Chat WebSocket ready for', userId);
      })
      .catch((error) => {
        // Only log if it's not the "already connecting" case
        if (error.message !== 'Already connecting') {
          console.warn('⚠️ Chat WebSocket unavailable (messaging will work without real-time updates):', error.message);
        }
        setIsConnected(false);
      });

    return () => {
      // Keep connection alive when component unmounts
    };
  }, [userId]);

  const subscribe = useCallback((eventType: string, callback: (data: unknown) => void) => {
    const ws = getChatWsManager();
    return ws.subscribe(eventType, callback);
  }, []);

  const send = useCallback((message: unknown) => {
    const ws = getChatWsManager();
    ws.send(message);
  }, []);

  return {
    isConnected,
    subscribe,
    send,
  };
}
