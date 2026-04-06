// simple in-memory registry of WebSocket connections by room
const rooms: Map<string, Set<WebSocket>> = new Map();

export function addSocket(roomId: string, socket: WebSocket) {
  let set = rooms.get(roomId);
  if (!set) {
    set = new Set();
    rooms.set(roomId, set);
  }
  set.add(socket);
}

export function removeSocket(roomId: string, socket: WebSocket) {
  const set = rooms.get(roomId);
  if (set) {
    set.delete(socket);
    if (set.size === 0) {
      rooms.delete(roomId);
    }
  }
}

export function broadcastToRoom(roomId: string, data: unknown) {
  const set = rooms.get(roomId);
  if (!set) return;
  const msg = typeof data === 'string' ? data : JSON.stringify(data);
  for (const sock of set) {
    try {
      sock.send(msg);
    } catch (e) {
      console.error('Failed to send websocket message', e);
    }
  }
}
