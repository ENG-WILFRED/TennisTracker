import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(request: Request) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Get current user - we only need the ID from the auth token
    const user = { id: auth.playerId };

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    // Single optimized query: fetch rooms with counts and participants in one go
    const rooms = await prisma.chatRoom.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        isDM: true,
        _count: {
          select: { participants: true },
        },
        participants: {
          select: {
            playerId: true,
            isOnline: true,
            player: {
              select: {
                user: {
                  select: { id: true, firstName: true, lastName: true, photo: true },
                },
              },
            },
          },
        },
        messages: {
          select: { content: true },
          orderBy: { createdAt: 'desc' as const },
          take: 1,
        },
      },
    });

    // Format response
    const formattedRooms = rooms.map((room: any) => {
      const onlineCount = room.participants?.filter((p: any) => p.isOnline)?.length || 0;
      
      // For DM rooms, get the other participant's details
      let dmParticipant = null;
      if (room.isDM) {
        dmParticipant = room.participants?.find((p: any) => p.playerId !== user.id)?.player || null;
      }

      return {
        id: room.id,
        name: room.isDM && dmParticipant ? `${dmParticipant.user.firstName} ${dmParticipant.user.lastName}` : room.name,
        description: room.description,
        participantCount: room._count.participants,
        onlineCount,
        lastMessage: room.messages?.[0]?.content || '',
        isDM: room.isDM,
        dmParticipant: dmParticipant,
      };
    });

    // Cache this list briefly at Cloudflare edge (5s) to reduce DB pressure
    return new Response(JSON.stringify(formattedRooms), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=5, s-maxage=5, stale-while-revalidate=10',
      },
    });
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const user = { id: auth.playerId };

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    const body = await request.json();
    const { name, description } = body as any;

    if (!name) {
      return new Response(JSON.stringify({ error: 'Room name is required' }), { status: 400 });
    }

    // Create new chat room
    const newRoom = await prisma.chatRoom.create({
      data: {
        name,
        description,
        createdBy: user.id,
        participants: {
          create: {
            playerId: user.id,
            isOnline: true,
          },
        },
      },
    });

    return new Response(
      JSON.stringify({
        id: newRoom.id,
        name: newRoom.name,
        description: newRoom.description,
        participantCount: 1,
        onlineCount: 1,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating chat room:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
