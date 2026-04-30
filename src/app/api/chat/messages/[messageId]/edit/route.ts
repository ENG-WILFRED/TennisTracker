import prisma from '@/lib/prisma';
import { broadcastToRoom } from '@/lib/chatSockets';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { messageId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || content.trim() === '') {
      return new Response(JSON.stringify({ error: 'Content is required' }), { status: 400 });
    }

    // Get the message  
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: { room: true },
    });

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message not found' }), { status: 404 });
    }

    // Check if user owns the message
    if (message.playerId !== auth.userId) {
      return new Response(JSON.stringify({ error: 'You can only edit your own messages' }), { status: 403 });
    }

    // Check if message is not too old (e.g., 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.createdAt < fifteenMinutesAgo) {
      return new Response(JSON.stringify({ error: 'Messages can only be edited within 15 minutes' }), { status: 400 });
    }

    // Update the message
    const updatedMessage = await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        content: content.trim(),
      },
      include: {
        player: {
          include: { user: true },
        },
      },
    });

    // Broadcast the edit
    broadcastToRoom(message.roomId, {
      type: 'message_edited',
      data: {
        messageId,
        content: updatedMessage.content,
        updatedAt: new Date().toISOString(),
      },
    });

    return new Response(JSON.stringify({
      id: updatedMessage.id,
      content: updatedMessage.content,
      updatedAt: new Date().toISOString(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error editing message:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}