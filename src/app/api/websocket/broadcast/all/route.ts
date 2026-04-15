/**
 * Broadcast API Routes for WebSocket Integration
 *
 * These endpoints allow the REST API to send real-time messages
 * to connected WebSocket clients.
 */

import { NextRequest, NextResponse } from 'next/server';
import { broadcastToAll } from '@/lib/socket';

/**
 * Broadcast to all connected clients
 */
export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json();

    if (!type) {
      return NextResponse.json({ error: 'Message type required' }, { status: 400 });
    }

    broadcastToAll(type, data);

    return NextResponse.json({
      success: true,
      type,
      message: 'Broadcast sent to all clients'
    });

  } catch (error) {
    console.error('Broadcast error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}