import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

interface MessagePayload {
  content: string;
  senderId: string;
  roomId: string;
}

export async function POST(req: NextRequest) {
  try {
    const { content, senderId, roomId }: MessagePayload = await req.json();

    if (!content?.trim() || !senderId || !roomId) {
      return NextResponse.json(
        { error: 'Missing required fields: content, senderId, roomId' },
        { status: 400 }
      );
    }

    // Verify the sender is a participant in the room
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        roomId_playerId: {
          roomId,
          playerId: senderId,
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Sender is not a participant in this room' },
        { status: 403 }
      );
    }

    // Create the message
    const message = await prisma.chatMessage.create({
      data: {
        content: content.trim(),
        playerId: senderId,
        roomId,
        deliveredAt: new Date(),
      },
      include: {
        player: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                photo: true,
              },
            },
          },
        },
      },
    });

    console.log(`💬 Message saved: ${message.player.user.firstName} → ${roomId}`);

    // Broadcast message to other participants via WebSocket (optional, non-blocking)
    const broadcastMessage = async () => {
      try {
        const wsUrl = process.env.WS_SERVER_URL || 'http://localhost:3001';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

        await fetch(`${wsUrl}/broadcast/broadcast-all`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'new-message',
            data: {
              roomId,
              message: {
                id: message.id,
                content: message.content,
                createdAt: message.createdAt,
                senderId: message.playerId,
                senderName: `${message.player.user.firstName} ${message.player.user.lastName}`,
                read: false,
              },
            },
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        console.log('📡 Message broadcast to WebSocket');
      } catch (error) {
        // Gracefully handle WebSocket unavailability
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('⚠️ WebSocket broadcast timeout');
        } else {
          console.warn('⚠️ WebSocket server unavailable - message stored but not broadcast in real-time');
        }
      }
    };

    // Fire and forget the broadcast
    broadcastMessage();

    return NextResponse.json(
      {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        senderId: message.playerId,
        senderName: `${message.player.user.firstName} ${message.player.user.lastName}`,
        read: false,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
