import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/courts/{courtId}/details
 * Player view - Get court details with public information and reviews
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courtId: string }> }
) {
  try {
    const { courtId } = await params;

    const court = await prisma.court.findUnique({
      where: { id: courtId },
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 });
    }

    // Get aggregated stats
    const stats = await prisma.courtBooking.aggregate({
      where: { courtId, status: 'confirmed' },
      _count: true,
      _sum: { price: true },
      _avg: { price: true },
    });

    // Get average rating from comments
    const avgRating = await prisma.courtComment.aggregate({
      where: { courtId },
      _avg: { rating: true },
      _count: true,
    });

    // Get recent comments/reviews
    const comments = await prisma.courtComment.findMany({
      where: { courtId },
      include: {
        author: {
          include: {
            user: { select: { firstName: true, lastName: true, photo: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get bookings count by time
    const totalBookings = await prisma.courtBooking.count({
      where: { courtId },
    });

    const confirmedBookings = await prisma.courtBooking.count({
      where: { courtId, status: 'confirmed' },
    });

    const cancelledBookings = await prisma.courtBooking.count({
      where: { courtId, status: 'cancelled' },
    });

    return NextResponse.json({
      court: {
        id: court.id,
        name: court.name,
        courtNumber: court.courtNumber,
        surface: court.surface,
        indoorOutdoor: court.indoorOutdoor,
        lights: court.lights,
        status: court.status,
        organization: court.organization,
      },
      stats: {
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        revenue: stats._sum?.price || 0,
        averagePrice: stats._avg?.price || 0,
        averageRating: avgRating._avg?.rating || 0,
        totalComments: avgRating._count || 0,
      },
      comments,
    });
  } catch (error) {
    console.error('Error fetching court details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
