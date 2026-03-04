import { addSocket, removeSocket } from '@/lib/chatSockets';

// WebSocketPair is provided by the Edge runtime (Cloudflare/Next edge). TypeScript
// may not have a built-in declaration for it in this environment, so declare it
// as `any` to avoid build-time type errors.
declare const WebSocketPair: any;

export const runtime = 'edge';

async function GET_legacy(request: Request) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');
  if (!roomId) {
    return new Response('roomId query parameter required', { status: 400 });
  }

  const pair = new WebSocketPair();
  const client = pair[1];

  client.accept();
  addSocket(roomId, client);

  client.addEventListener('message', (evt: any) => {
    try {
      // no-op for now; clients may send pings in future
      JSON.parse(evt.data as string);
    } catch (e) {}
  });

  client.addEventListener('close', () => {
    removeSocket(roomId, client);
  });

  const resInit: any = { status: 101, webSocket: pair[0] };
  return new Response(null, resInit);
}

// new handler that delegates to Durable Object when available and falls back to
// the legacy in-memory registry.
export async function GET(request: Request) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');
  if (!roomId) {
    return new Response('roomId query parameter required', { status: 400 });
  }

  // attempt to resolve namespace from globalThis (works on Workers)
  const envAny = (globalThis as any);
  if (envAny && envAny.CHAT_ROOMS) {
    const id = envAny.CHAT_ROOMS.idFromName(roomId);
    const obj = envAny.CHAT_ROOMS.get(id);
    return obj.fetch(request);
  }

  // otherwise fall back to legacy behaviour
  return GET_legacy(request);
}