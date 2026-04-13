import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

interface StatusPayload {
  playerId: string;
  isOnline: boolean;
}

/**
 * POST /api/messaging/status
 * Update user's online/offline status in all chat rooms
 * 
 * This endpoint marks the current user as online/offline.
 * Initial status snapshot is fetched via GET /api/messaging/contacts
 * Subsequent status updates are broadcast via WebSocket.
 */
export async function POST(req: NextRequest) {
  try {
    const { playerId, isOnline }: StatusPayload = await req.json();

    if (!playerId) {
      return NextResponse.json(
        { error: 'Missing required field: playerId' },
        { status: 400 }
      );
    }

    // Update online status in all chat rooms for this player
    const updated = await prisma.chatParticipant.updateMany({
      where: { playerId },
      data: {
        isOnline,
        lastSeen: new Date(),
      },
    });

    console.log(`📡 User ${playerId} ${isOnline ? 'online' : 'offline'} (${updated.count} rooms)`);

    // Broadcast status change via WebSocket (fire and forget)
    const broadcastStatus = async () => {
      try {
        const wsUrl = process.env.WS_SERVER_URL || 'http://localhost:3001';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        await fetch(`${wsUrl}/broadcast/broadcast-all`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'user-status',
            data: {
              userId: playerId,
              isOnline,
            },
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        console.log('📡 Status broadcast to WebSocket');
      } catch (error) {
        // Gracefully handle WebSocket unavailability
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('⚠️ WebSocket broadcast timeout');
        } else {
          console.warn('⚠️ WebSocket server unavailable - status updated in DB but not broadcast in real-time');
        }
      }
    };

    broadcastStatus();

    return NextResponse.json({
      success: true,
      playerId,
      isOnline,
      roomsUpdated: updated.count,
    });
  } catch (error) {
    console.error('Error updating status:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}
