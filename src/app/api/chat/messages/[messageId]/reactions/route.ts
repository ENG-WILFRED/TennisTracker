import prisma from '@/lib/prisma';
import { broadcastToRoom } from '@/lib/chatSockets';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { messageId } = await params;
    const body = await request.json();
    const { emoji } = body;

    if (!emoji) {
      return new Response(JSON.stringify({ error: 'Emoji is required' }), { status: 400 });
    }

    // Get the message to find the room
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: { room: true },
    });

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message not found' }), { status: 404 });
    }

    // Check if user is in the room
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        roomId_playerId: {
          roomId: message.roomId,
          playerId: auth.playerId,
        },
      },
    });

    if (!participant) {
      return new Response(JSON.stringify({ error: 'Not authorized to react to this message' }), { status: 403 });
    }

    // Check if reaction already exists
    const existingReaction = await prisma.messageReaction.findUnique({
      where: {
        messageId_playerId_emoji: {
          messageId,
          playerId: auth.playerId,
          emoji,
        },
      },
    });

    if (existingReaction) {
      // Remove the reaction (toggle)
      await prisma.messageReaction.delete({
        where: { id: existingReaction.id },
      });

      // Broadcast reaction removal
      broadcastToRoom(message.roomId, {
        type: 'reaction_removed',
        data: {
          messageId,
          playerId: auth.playerId,
          emoji,
        },
      });

      return new Response(JSON.stringify({ action: 'removed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // Add the reaction
      const reaction = await prisma.messageReaction.create({
        data: {
          messageId,
          playerId: auth.playerId,
          emoji,
        },
        include: {
          player: {
            include: { user: true },
          },
        },
      });

      // Broadcast new reaction
      broadcastToRoom(message.roomId, {
        type: 'reaction_added',
        data: {
          messageId,
          reaction: {
            id: reaction.id,
            emoji: reaction.emoji,
            playerId: reaction.player.userId,
            playerName: `${reaction.player.user.firstName} ${reaction.player.user.lastName}`,
          },
        },
      });

      return new Response(JSON.stringify({
        action: 'added',
        reaction: {
          id: reaction.id,
          emoji: reaction.emoji,
          playerId: reaction.player.userId,
          playerName: `${reaction.player.user.firstName} ${reaction.player.user.lastName}`,
        },
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error handling reaction:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { messageId } = await params;

    const reactions = await prisma.messageReaction.findMany({
      where: { messageId },
      include: {
        player: {
          include: { user: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const formattedReactions = reactions.map((reaction: any) => ({
      id: reaction.id,
      emoji: reaction.emoji,
      playerId: reaction.player.userId,
      playerName: `${reaction.player.user.firstName} ${reaction.player.user.lastName}`,
    }));

    return new Response(JSON.stringify(formattedReactions), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching reactions:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}