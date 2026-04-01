import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/courts/{courtId}/bookings
 * Player view - Get available time slots and booking history for a court
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courtId: string }> }
) {
  try {
    const { courtId } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required (YYYY-MM-DD format)' },
        { status: 400 }
      );
    }

    // Get all bookings for this court on the specified date
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const bookings = await prisma.courtBooking.findMany({
      where: {
        courtId,
        startTime: { gte: startOfDay, lte: endOfDay },
        status: { in: ['confirmed', 'pending'] },
      },
      select: {
        startTime: true,
        endTime: true,
        status: true,
      },
      orderBy: { startTime: 'asc' },
    });

    // Get court details for hours
    const court = await prisma.court.findUnique({
      where: { id: courtId },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json({
      date,
      bookings,
      court: {
        id: court?.id,
        name: court?.name,
      },
    });
  } catch (error) {
    console.error('Error fetching court bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
