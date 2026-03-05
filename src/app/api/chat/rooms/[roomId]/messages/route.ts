import prisma from '@/lib/prisma';
import { broadcastToRoom } from '@/lib/chatSockets';
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

    // Get messages for the room
    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      include: {
        player: {
          include: { user: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    // mark messages from others as read (simple global flag)
    const me = await prisma.player.findUnique({ where: { userId: auth.playerId } });
    if (me && me.userId) {
      // Mark unread messages from others as read
      await prisma.chatMessage.updateMany({
        where: {
          roomId,
          playerId: { not: me.userId },
        },
        data: { readAt: new Date() },
      });
    }

    const formattedMessages = messages.map((msg: any) => ({
      id: msg.id,
      content: msg.content,
      playerId: msg.player.userId,
      playerName: `${msg.player.user.firstName} ${msg.player.user.lastName}`,
      playerPhoto: msg.player.user.photo,
      createdAt: msg.createdAt,
      deliveredAt: msg.deliveredAt,
      readAt: msg.readAt,
    }));

    return new Response(JSON.stringify(formattedMessages), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const user = await prisma.player.findUnique({
      where: { userId: auth.playerId },
      include: { user: true },
    });

    if (!user || !user.user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    const { roomId } = await params;
    const body = await request.json();
    const { content } = body as any;

    if (!content) {
      return new Response(JSON.stringify({ error: 'Content is required' }), { status: 400 });
    }

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        roomId: roomId,
        playerId: user.userId,
        content,
        deliveredAt: new Date(),
      },
    });

    // notify any websocket subscribers in this room
    const formatted = {
      type: 'message',
      data: {
        id: message.id,
        content: message.content,
        playerId: user.userId,
        playerName: `${user.user.firstName} ${user.user.lastName}`,
        playerPhoto: user.user.photo,
        createdAt: message.createdAt,
        deliveredAt: message.deliveredAt,
        readAt: message.readAt,
      },
    };
    broadcastToRoom(roomId, formatted);

    return new Response(
      JSON.stringify({
        id: message.id,
        content: message.content,
        playerId: user.userId,
        playerName: `${user.user.firstName} ${user.user.lastName}`,
        playerPhoto: user.user.photo,
        createdAt: message.createdAt,
        deliveredAt: message.deliveredAt,
        readAt: message.readAt,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating message:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
