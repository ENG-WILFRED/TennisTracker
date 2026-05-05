import { useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/ToastContext';

export function useDeveloperSocket(
  onMetricsUpdate: (metrics: any) => void,
  onBugReported: (bug: any) => void,
  onBugStatusUpdate: (data: any) => void,
  onTestCompleted: (data: any) => void,
  onTimelineUpdate: (event: string) => void,
  onNotificationUpdate: (note: string) => void
) {
  const wsRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { addToast } = useToast();
  const isConnectedRef = useRef(false);

  useEffect(() => {
    if (isConnectedRef.current) return; // Prevent multiple connections

    const initializeSocket = async () => {
      try {
        const { io } = await import('socket.io-client');
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const socket = io(`${protocol}//${window.location.host}`, {
          path: '/api/socketio',
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 10,
        });

        socket.on('connect', () => {
          if (isConnectedRef.current) return; // Prevent duplicate handling
          isConnectedRef.current = true;
          onTimelineUpdate(`Socket.IO connected — ${new Date().toLocaleTimeString()}`);
          socket.emit('developer_subscribe');
        });

        socket.on('developer_subscribed', () => {
          onTimelineUpdate(`Developer metrics streaming enabled — ${new Date().toLocaleTimeString()}`);
        });

        socket.on('developer_metrics_update', onMetricsUpdate);
        socket.on('bug_reported', (bug: any) => {
          onBugReported(bug);
          onNotificationUpdate(`New bug reported: "${bug.title}"`);
          onTimelineUpdate(`New bug: ${bug.title} — ${new Date().toLocaleTimeString()}`);
          addToast(`New bug reported: "${bug.title}"`, 'warning');
        });
        socket.on('bug_status_update', (data: any) => {
          onBugStatusUpdate(data);
          onNotificationUpdate(`Bug "${data.title}" → ${data.status}`);
          addToast(`Bug "${data.title}" → ${data.status}`, 'info');
        });
        socket.on('test_run_completed', async (data: any) => {
          onTestCompleted(data);
          onNotificationUpdate(`Test run completed: ${data.suite || 'all'}`);
          onTimelineUpdate(`Test run completed — ${new Date().toLocaleTimeString()}`);
          addToast(
            `Tests completed! ${data.passed || 0}✓ ${data.failed || 0}✗`,
            (data.failed || 0) > 0 ? 'warning' : 'success'
          );
        });
        socket.on('disconnect', () => {
          isConnectedRef.current = false;
          onTimelineUpdate(`Socket.IO disconnected — ${new Date().toLocaleTimeString()}`);
        });
        socket.on('error', (error: any) => {
          addToast('Connection error: ' + (error?.message || 'Unknown error'), 'error');
        });
        socket.on('ping', (data: any) => socket.emit('pong', data));

        wsRef.current = socket;
      } catch (error) {
        console.error('Socket.IO connection error:', error);
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(initializeSocket, 5000);
      }
    };

    initializeSocket();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.emit('developer_unsubscribe');
        wsRef.current.disconnect();
      }
      isConnectedRef.current = false;
    };
  }, []); // Empty dependency array - only run once on mount

  return wsRef;
}
