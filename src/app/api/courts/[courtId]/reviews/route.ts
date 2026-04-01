import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/courts/{courtId}/reviews
 * Player view - Get all reviews/comments for a court
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courtId: string }> }
) {
  try {
    const { courtId } = await params;
    const { searchParams } = new URL(request.url);
    const rating = searchParams.get('rating');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const skip = parseInt(searchParams.get('skip') || '0');

    let whereClause: any = { courtId };
    if (rating) {
      whereClause.rating = parseInt(rating);
    }

    const comments = await prisma.courtComment.findMany({
      where: whereClause,
      include: {
        author: {
          include: {
            user: {
              select: { firstName: true, lastName: true, photo: true, nationality: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });

    const total = await prisma.courtComment.count({ where: whereClause });

    const avgRating = await prisma.courtComment.aggregate({
      where: { courtId },
      _avg: { rating: true },
    });

    const ratingDistribution = await Promise.all(
      [5, 4, 3, 2, 1].map(async (r) => ({
        rating: r,
        count: await prisma.courtComment.count({
          where: { courtId, rating: r },
        }),
      }))
    );

    return NextResponse.json({
      reviews: comments,
      stats: {
        total,
        averageRating: avgRating._avg?.rating || 0,
        ratingDistribution,
      },
      pagination: {
        skip,
        limit,
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/courts/{courtId}/reviews
 * Player adds a review for a court they've booked
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courtId: string }> }
) {
  try {
    const { courtId } = await params;
    const body = await request.json();
    const { rating, content, bookingId } = body;

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify court exists
    const court = await prisma.court.findUnique({
      where: { id: courtId },
    });

    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 });
    }

    // Verify booking exists and user is the player (if bookingId provided)
    if (bookingId) {
      const booking = await prisma.courtBooking.findUnique({
        where: { id: bookingId },
        include: { member: { include: { player: true } } },
      });

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
    }

    // Get player from token - for now using a placeholder
    // In production, you'd extract from JWT
    const players = await prisma.player.findFirst({
      where: { user: { email: 'test@example.com' } },
    });

    if (!players) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const comment = await prisma.courtComment.create({
      data: {
        courtId,
        content,
        rating: Math.max(1, Math.min(5, rating || 5)),
        authorId: players.userId,
        bookingId,
      },
      include: {
        author: {
          include: {
            user: {
              select: { firstName: true, lastName: true, photo: true },
            },
          },
        },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
