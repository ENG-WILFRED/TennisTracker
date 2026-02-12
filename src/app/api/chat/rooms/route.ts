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

    // Get all chat rooms with participant and online count
    const rooms = await prisma.chatRoom.findMany({
      include: {
        participants: {
          select: {
            playerId: true,
            isOnline: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true },
        },
      },
    });

    const formattedRooms = rooms.map((room: any) => ({
      id: room.id,
      name: room.name,
      description: room.description,
      participantCount: room.participants.length,
      onlineCount: room.participants.filter((p: any) => p.isOnline).length,
      lastMessage: room.messages[0]?.content || '',
    }));

    return new Response(JSON.stringify(formattedRooms), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
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
    const { name, description } = body;

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
