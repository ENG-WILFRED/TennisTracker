import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

// simple alias endpoints for backwards compatibility or external clients
// which expect `/api/chat/chats` instead of `/api/chat/rooms`.

export async function GET(request: Request) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const user = { id: auth.playerId };
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    const roomsBase = await prisma.chatRoom.findMany({
      select: { id: true, name: true, description: true },
    });

    const formattedRooms = await Promise.all(
      roomsBase.map(async (room: any) => {
        const participantCount = await prisma.chatParticipant.count({ where: { roomId: room.id } });
        const onlineCount = await prisma.chatParticipant.count({ where: { roomId: room.id, isOnline: true } });
        const lastMsg = await prisma.chatMessage.findFirst({ where: { roomId: room.id }, orderBy: { createdAt: 'desc' }, select: { content: true } });

        return {
          id: room.id,
          name: room.name,
          description: room.description,
          participantCount,
          onlineCount,
          lastMessage: lastMsg?.content || '',
        };
      })
    );

    return new Response(JSON.stringify(formattedRooms), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=5, s-maxage=5, stale-while-revalidate=10',
      },
    });
  } catch (error) {
    console.error('Error fetching chat rooms (alias):', error);
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
    console.error('Error creating chat room (alias):', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
