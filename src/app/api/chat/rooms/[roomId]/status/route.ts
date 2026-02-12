import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

// Update user online status when they join a chat room
export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const userId = auth.playerId;
    const { roomId } = await params;

    // Check if participant already exists
    let participant = await prisma.chatParticipant.findUnique({
      where: {
        roomId_playerId: {
          roomId,
          playerId: userId,
        },
      },
    });

    if (!participant) {
      // Create new participant
      participant = await prisma.chatParticipant.create({
        data: {
          roomId,
          playerId: userId,
          isOnline: true,
        },
      });
    } else {
      // Update existing participant to online
      participant = await prisma.chatParticipant.update({
        where: {
          roomId_playerId: {
            roomId,
            playerId: userId,
          },
        },
        data: {
          isOnline: true,
          lastSeen: new Date(),
        },
      });
    }

    return new Response(JSON.stringify(participant), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating online status:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

// Set user offline when they leave
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const userId = auth.playerId;
    const { roomId } = await params;

    // Update participant to offline
    const participant = await prisma.chatParticipant.update({
      where: {
        roomId_playerId: {
          roomId,
          playerId: userId,
        },
      },
      data: {
        isOnline: false,
        lastSeen: new Date(),
      },
    });

    return new Response(JSON.stringify(participant), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating offline status:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
