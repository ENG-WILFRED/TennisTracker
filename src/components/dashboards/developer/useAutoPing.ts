import { useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/ToastContext';

export function useAutoPing(
  onPingUpdate: (latency: number | null, status: 'idle' | 'ok' | 'failed', time: string) => void,
  onTimelineUpdate: (event: string) => void
) {
  const { addToast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const pingBaseUrl = async () => {
      const startTime = Date.now();
      try {
        const response = await fetch('/', { method: 'HEAD' });
        const latency = Date.now() - startTime;
        const time = new Date().toLocaleTimeString();
        onPingUpdate(latency, response.ok ? 'ok' : 'failed', time);
        const statusText = response.ok ? `OK (${latency}ms)` : 'FAILED';
        onTimelineUpdate(`Auto ping: ${statusText} — ${time}`);
        if (!response.ok) addToast(`Base URL ping failed: ${response.status}`, 'error');
      } catch (error) {
        const time = new Date().toLocaleTimeString();
        onPingUpdate(null, 'failed', time);
        onTimelineUpdate(`Auto ping: FAILED — ${time}`);
        addToast('Base URL ping failed', 'error');
      }
    };

    // Initial ping
    pingBaseUrl();

    // Set up interval for every 5 minutes
    intervalRef.current = setInterval(pingBaseUrl, 5 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once on mount
}

