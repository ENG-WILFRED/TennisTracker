import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export interface MatchUpdate {
  type: 'score_update' | 'violation' | 'match_complete' | 'viewer_joined' | 'viewer_left';
  data?: any;
  timestamp: number;
}

export function useMatchWebSocket(matchId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [updates, setUpdates] = useState<MatchUpdate[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const { user } = useAuth();

  useEffect(() => {
    if (!matchId) return;

    const connect = () => {
      try {
        // Connect to the dedicated WebSocket server on port 3001
        const wsUrl = `ws://127.0.0.1:3001`;
        console.log('Attempting WebSocket connection to:', wsUrl);
        
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connected successfully');
          setIsConnected(true);
          setConnectionError(null);
          reconnectAttempts.current = 0;

          // Send authentication message if user is available
          if (user?.id) {
            ws.send(JSON.stringify({
              type: 'auth',
              userId: user.id,
            }));
          } else {
            console.log('User not available, sending anonymous auth');
            ws.send(JSON.stringify({
              type: 'auth',
              userId: 'anonymous',
            }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            // Handle auth confirmation
            if (message.type === 'auth-confirmed') {
              console.log('WebSocket authenticated successfully');

              // Now subscribe to match updates
              if (matchId) {
                ws.send(JSON.stringify({
                  type: 'subscribe-match',
                  matchId: matchId,
                }));
              }
              return;
            }

            // Handle match subscription confirmation
            if (message.type === 'match-subscribe-confirmed') {
              console.log(`Subscribed to match ${message.matchId}`);
              return;
            }

            // Handle match updates
            const update: MatchUpdate = message;
            setUpdates(prev => [...prev, update]);
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e, 'Raw data:', event.data);
          }
        };

        ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          setIsConnected(false);
          
          // Only attempt reconnection if it wasn't a clean close
          if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000); // Exponential backoff, max 30s
            console.log(`Attempting reconnection ${reconnectAttempts.current}/${maxReconnectAttempts} in ${delay}ms`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          } else if (reconnectAttempts.current >= maxReconnectAttempts) {
            setConnectionError('Failed to reconnect after multiple attempts. Please refresh the page.');
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket connection error:', {
            error,
            readyState: ws.readyState,
            url: ws.url,
            matchId
          });
          
          // Provide more specific error messages
          let errorMessage = 'WebSocket connection failed';
          if (ws.readyState === WebSocket.CONNECTING) {
            errorMessage = 'Unable to establish WebSocket connection. Check network connectivity.';
          } else if (ws.readyState === WebSocket.CLOSING) {
            errorMessage = 'WebSocket connection is closing.';
          } else if (ws.readyState === WebSocket.CLOSED) {
            errorMessage = 'WebSocket connection is closed.';
          }
          
          setConnectionError(errorMessage);
          setIsConnected(false);
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setConnectionError('Failed to initialize WebSocket connection');
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [matchId]);

  // Send auth message when user becomes available
  useEffect(() => {
    if (user?.id && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('User became available, sending auth message');
      wsRef.current.send(JSON.stringify({
        type: 'auth',
        userId: user.id,
      }));
    }
  }, [user?.id]);

  const sendUpdate = (update: Omit<MatchUpdate, 'timestamp'>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ ...update, timestamp: Date.now() }));
    }
  };

  return { isConnected, updates, sendUpdate, connectionError };
}