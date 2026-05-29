import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

interface Comment {
  id: string;
  text: string;
  rating?: number;
  author: string;
  authorId: string;
  createdAt: Date;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;

    const comments = await prisma.playerComment.findMany({
      where: { playerId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const formatted = comments.map((comment) => ({
      id: comment.id,
      text: comment.content,
      rating: comment.rating,
      author: `${comment.author.firstName || ''} ${comment.author.lastName || ''}`.trim(),
      authorId: comment.authorId,
      createdAt: comment.createdAt,
    }));

    return NextResponse.json({ comments: formatted });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      const headerPresent = Boolean(request.headers.get('Authorization') || request.headers.get('authorization'));
      console.warn(`[comments] Unauthorized POST for /api/players/${(await params).playerId}/comments - Authorization header present: ${headerPresent}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { playerId } = await params;
    const { text, rating } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
    }

    const player = await prisma.player.findUnique({
      where: { userId: playerId },
      select: { userId: true },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const authorUser = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true },
    });

    let authorId: string | null = null;
    if (authorUser) {
      authorId = auth.userId;
    } else {
      const authorPlayer = await prisma.player.findUnique({
        where: { userId: auth.userId },
        select: { userId: true },
      });
      if (authorPlayer) {
        authorId = authorPlayer.userId;
      }
    }

    if (!authorId) {
      return NextResponse.json({ error: 'Invalid authenticated user' }, { status: 401 });
    }

    const normalizedRating = typeof rating === 'number' && rating >= 0 && rating <= 5 ? rating : null;

    const comment = await prisma.playerComment.create({
      data: {
        playerId,
        authorId,
        content: text.trim(),
        rating: normalizedRating,
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        comment: {
          id: comment.id,
          text: comment.content,
          rating: comment.rating,
          author: `${comment.author.firstName || ''} ${comment.author.lastName || ''}`.trim(),
          authorId: comment.authorId,
          createdAt: comment.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating comment:', error);
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2003'
    ) {
      return NextResponse.json({ error: 'Comment author or player relationship is invalid' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
