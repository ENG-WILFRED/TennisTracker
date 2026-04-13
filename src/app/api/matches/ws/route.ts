import { broadcastToRoom } from '@/lib/chatSockets';

// WebSocketPair is provided by the Edge runtime (Cloudflare/Next edge). TypeScript
// may not have a built-in declaration for it in this environment, so declare it
// as `any` to avoid build-time type errors.
declare const WebSocketPair: any;

export const runtime = 'edge';

export async function GET(request: Request) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');
  if (!matchId) {
    return new Response('matchId query parameter required', { status: 400 });
  }

  const pair = new WebSocketPair();
  const client = pair[1];

  client.accept();
  broadcastToRoom(`match-${matchId}`, { type: 'viewer_joined', timestamp: Date.now() });

  client.addEventListener('message', (evt: any) => {
    try {
      const data = JSON.parse(evt.data as string);
      // Broadcast match updates to all viewers
      if (data.type === 'score_update' || data.type === 'violation' || data.type === 'match_complete') {
        broadcastToRoom(`match-${matchId}`, data);
      }
    } catch (e) {
      console.error('Failed to parse WebSocket message', e);
    }
  });

  client.addEventListener('close', () => {
    broadcastToRoom(`match-${matchId}`, { type: 'viewer_left', timestamp: Date.now() });
  });

  const resInit: any = { status: 101, webSocket: pair[0] };
  return new Response(null, resInit);
}