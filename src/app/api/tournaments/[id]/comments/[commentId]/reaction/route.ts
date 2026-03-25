import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function POST(request: Request, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth?.playerId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const resolvedParams = await params;
    const { commentId } = resolvedParams;
    const { type = 'like' } = await request.json() as { type?: string };

    // Verify comment exists
    const comment = await prisma.tournamentComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return new Response(JSON.stringify({ error: 'Comment not found' }), { status: 404 });
    }

    // Verify user is not the comment author
    if (comment.authorId === auth.playerId) {
      return new Response(JSON.stringify({ error: 'Cannot react to your own comment' }), { status: 400 });
    }

    // Check if reaction already exists
    const existingReaction = await prisma.tournamentCommentReaction.findUnique({
      where: {
        tournamentCommentId_userId: {
          tournamentCommentId: commentId,
          userId: auth.playerId,
        },
      },
    });

    if (existingReaction) {
      // Remove reaction if already exists (toggle)
      await prisma.tournamentCommentReaction.delete({
        where: { id: existingReaction.id },
      });

      return new Response(JSON.stringify({ success: true, action: 'removed' }), { status: 200 });
    }

    // Create new reaction
    const reaction = await prisma.tournamentCommentReaction.create({
      data: {
        tournamentCommentId: commentId,
        userId: auth.playerId,
        type,
      },
    });

    return new Response(JSON.stringify({ success: true, action: 'added', reaction }), { status: 201 });
  } catch (error) {
    console.error('Error handling reaction:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  try {
    const resolvedParams = await params;
    const { commentId } = resolvedParams;

    // Get reaction counts for the comment
    const reactions = await prisma.tournamentCommentReaction.groupBy({
      by: ['type'],
      where: { tournamentCommentId: commentId },
      _count: true,
    });

    return new Response(JSON.stringify({ reactions }), { status: 200 });
  } catch (error) {
    console.error('Error fetching reactions:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
