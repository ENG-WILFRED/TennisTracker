import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(request: Request) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Get current user - we only need the ID from the auth token
    const userId = auth.playerId;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    // OPTIMIZED: Only fetch rooms the user is a participant in, limit to 50 recent rooms
    // This avoids loading ALL rooms in the database
    const userRooms = await prisma.chatParticipant.findMany({
      where: { playerId: userId },
      select: { roomId: true },
      take: 50, // Limit to avoid huge queries
      orderBy: { lastSeen: 'desc' as const },
    });

    const roomIds = userRooms.map(r => r.roomId);

    if (roomIds.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=5, s-maxage=5, stale-while-revalidate=10',
        },
      });
    }

    // Fetch only the rooms the user is in, with optimized data loading
    const rooms = await prisma.chatRoom.findMany({
      where: { id: { in: roomIds } },
      select: {
        id: true,
        name: true,
        description: true,
        isDM: true,
        _count: {
          select: { participants: true },
        },
        // For non-DM rooms, load all participants. For DM rooms, just get the basic data
        participants: {
          select: {
            playerId: true,
            isOnline: true,
            player: {
              select: {
                userId: true,
                user: {
                  select: { 
                    id: true, 
                    firstName: true, 
                    lastName: true, 
                    photo: true 
                  },
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
      orderBy: { updatedAt: 'desc' as const },
    });

    // Format response
    const formattedRooms = rooms.map((room: any) => {
      const onlineCount = room.participants?.filter((p: any) => p.isOnline)?.length || 0;
      
      // For DM rooms, get the other participant's details
      let dmParticipant = null;
      if (room.isDM && room.participants && room.participants.length > 0) {
        dmParticipant = room.participants.find((p: any) => p.playerId !== userId)?.player || null;
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
    const auth = await verifyApiAuth(request);
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
