import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { roomId } = await params;

    // Get participants in the room
    const participants = await prisma.chatParticipant.findMany({
      where: { roomId },
      include: {
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photo: true,
          },
        },
      },
    });

    const formattedParticipants = participants.map((p: any) => ({
      id: p.id,
      playerId: p.player.id,
      playerName: `${p.player.firstName} ${p.player.lastName}`,
      playerPhoto: p.player.photo,
      isOnline: p.isOnline,
    }));

    return new Response(JSON.stringify(formattedParticipants), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
