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

    const formattedMessages = messages.map((msg: any) => ({
      id: msg.id,
      content: msg.content,
      playerId: msg.player.userId,
      playerName: `${msg.player.user.firstName} ${msg.player.user.lastName}`,
      playerPhoto: msg.player.user.photo,
      createdAt: msg.createdAt,
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
    const { content } = body;

    if (!content) {
      return new Response(JSON.stringify({ error: 'Content is required' }), { status: 400 });
    }

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        roomId: roomId,
        playerId: user.userId,
        content,
      },
    });

    return new Response(
      JSON.stringify({
        id: message.id,
        content: message.content,
        playerId: user.userId,
        playerName: `${user.user.firstName} ${user.user.lastName}`,
        playerPhoto: user.user.photo,
        createdAt: message.createdAt,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating message:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
