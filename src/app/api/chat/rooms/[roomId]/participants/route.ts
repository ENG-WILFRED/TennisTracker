import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { roomId } = await params;

    // Get participants in the room
    const participants = await prisma.chatParticipant.findMany({
      where: { roomId },
      include: {
        player: {
          include: { user: true },
        },
      },
    });

    const formattedParticipants = participants.map((p: any) => ({
      id: p.id,
      playerId: p.player.userId,
      playerName: `${p.player.user.firstName} ${p.player.user.lastName}`,
      playerPhoto: p.player.user.photo,
      isOnline: p.isOnline,
    }));

    return new Response(JSON.stringify(formattedParticipants), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=5, s-maxage=5, stale-while-revalidate=10',
      },
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { roomId } = await params;
    const body = await request.json();
    const { playerId } = body as any;

    if (!playerId) {
      return new Response(JSON.stringify({ error: 'Player ID is required' }), { status: 400 });
    }

    // Check if the room exists
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404 });
    }

    // Check if participant already exists
    const existingParticipant = await prisma.chatParticipant.findUnique({
      where: {
        roomId_playerId: {
          roomId,
          playerId,
        },
      },
    });

    if (existingParticipant) {
      return new Response(JSON.stringify({ error: 'User is already a participant in this room' }), { status: 400 });
    }

    // Add participant to room
    const participant = await prisma.chatParticipant.create({
      data: {
        roomId,
        playerId,
        isOnline: false,
      },
      include: {
        player: {
          include: { user: true },
        },
      },
    });

    const formattedParticipant = {
      id: participant.id,
      playerId: participant.player.userId,
      playerName: `${participant.player.user.firstName} ${participant.player.user.lastName}`,
      playerPhoto: participant.player.user.photo,
      isOnline: participant.isOnline,
    };

    return new Response(JSON.stringify(formattedParticipant), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error adding participant:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
