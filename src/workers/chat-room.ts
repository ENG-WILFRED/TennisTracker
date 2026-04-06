/// <reference types="@cloudflare/workers-types" />
// Durable Object used to coordinate WebSocket connections for a chat room.
// Each chat room name maps to a unique instance via `CHAT_ROOMS.idFromName(name)`.

export class ChatRoom {
  state: DurableObjectState;
  env: Record<string, unknown>;
  sockets: Set<WebSocket>;

  constructor(state: DurableObjectState, env: Record<string, unknown>) {
    this.state = state;
    this.env = env;
    this.sockets = new Set();
  }

  // called when a request is forwarded to this object
  async fetch(request: Request) {
    const url = new URL(request.url);
    if (url.pathname === '/connect') {
      // WebSocket upgrade request
      const pair = new WebSocketPair();
      const [clientSocket, serverSocket] = Object.values(pair);
      serverSocket.accept();
      this.sockets.add(serverSocket);

      serverSocket.addEventListener('message', (evt) => {
        // broadcast incoming message to all other sockets
        for (const sock of this.sockets) {
          if (sock !== serverSocket) {
            sock.send(evt.data);
          }
        }
      });

      serverSocket.addEventListener('close', () => {
        this.sockets.delete(serverSocket);
      });

      return new Response(null, { status: 101, webSocket: clientSocket });
    }

    return new Response('Not found', { status: 404 });
  }
}
