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
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100); // Max 100 per page
    const before = url.searchParams.get('before'); // Cursor-based pagination

    // Build where clause
    const whereClause: any = {
      roomId,
      isDeleted: false,
    };

    if (before) {
      whereClause.createdAt = { lt: new Date(before) };
    }

    // Get messages with pagination
    const messages = await prisma.chatMessage.findMany({
      where: whereClause,
      include: {
        player: {
          include: { user: true },
        },
        replyTo: {
          include: {
            player: {
              include: { user: true },
            },
          },
        },
        reactions: {
          include: {
            player: {
              include: { user: true },
            },
          },
        },
        _count: {
          select: { reactions: true }
        }
      },
      orderBy: { createdAt: 'desc' }, // Most recent first for pagination
      take: limit + 1, // +1 to check if there are more
    });

    const hasMore = messages.length > limit;
    const messagesToReturn = hasMore ? messages.slice(0, limit) : messages;

    // Reverse back to chronological order
    messagesToReturn.reverse();

    // Mark messages from others as read (only recent messages)
    const me = await prisma.player.findUnique({ where: { userId: auth.playerId } });
    let readMessageIds: string[] = [];
    if (me && me.userId) {
      readMessageIds = messagesToReturn
        .filter((msg: typeof messagesToReturn[number]) => msg.playerId !== me.userId && !msg.readAt)
        .map((msg: typeof messagesToReturn[number]) => msg.id);

      if (readMessageIds.length > 0) {
        await prisma.chatMessage.updateMany({
          where: { id: { in: readMessageIds } },
          data: { readAt: new Date() },
        });

        // Broadcast read receipts to all participants in the room
        const readReceiptMessage = {
          type: 'message_read',
          data: {
            messageIds: readMessageIds,
            readAt: new Date().toISOString(),
            readerId: auth.playerId,
          },
        };
        broadcastToRoom(roomId, readReceiptMessage);
      }
    }

    const formattedMessages = messagesToReturn.map((msg: any) => ({
      id: msg.id,
      content: msg.content,
      playerId: msg.player.userId,
      playerName: `${msg.player.user.firstName} ${msg.player.user.lastName}`,
      playerPhoto: msg.player.user.photo,
      createdAt: msg.createdAt,
      deliveredAt: msg.deliveredAt,
      readAt: msg.readAt,
      replyToId: msg.replyToId,
      replyTo: msg.replyTo ? {
        id: msg.replyTo.id,
        content: msg.replyTo.content,
        playerId: msg.replyTo.player.userId,
        playerName: `${msg.replyTo.player.user.firstName} ${msg.replyTo.player.user.lastName}`,
        playerPhoto: msg.replyTo.player.user.photo,
        createdAt: msg.replyTo.createdAt,
      } : null,
      reactions: msg.reactions?.map((reaction: any) => ({
        id: reaction.id,
        emoji: reaction.emoji,
        playerId: reaction.player.userId,
        playerName: `${reaction.player.user.firstName} ${reaction.player.user.lastName}`,
      })) || [],
      isDeleted: msg.isDeleted,
    }));

    return new Response(JSON.stringify({
      messages: formattedMessages,
      hasMore,
      nextCursor: hasMore ? messagesToReturn[0]?.createdAt : null,
    }), {
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
    const { content, replyToId } = body as any;

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
        replyToId: replyToId || null,
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
        replyToId: message.replyToId,
        replyTo: null, // Will be populated if needed
        isDeleted: message.isDeleted,
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
        replyToId: message.replyToId,
        replyTo: null,
        isDeleted: message.isDeleted,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating message:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
