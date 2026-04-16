import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/courts/{courtId}/availability
 * Player view - Check real-time availability for a specific date range
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courtId: string }> }
) {
  try {
    const { courtId } = await params;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate parameters are required' },
        { status: 400 }
      );
    }

    const court = await prisma.court.findUnique({
      where: { id: courtId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 });
    }

    // Get all confirmed bookings in the date range
    const bookings = await prisma.courtBooking.findMany({
      where: {
        courtId,
        status: 'confirmed',
        startTime: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
      },
    });

    // Generate availability matrix
    const start = new Date(startDate);
    const end = new Date(endDate);
    const availability = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
      const dateStr = d.toISOString().split('T')[0];

      // Get bookings for this day
      const dayBookings = bookings.filter((b: typeof bookings[number]) => 
        b.startTime.toISOString().split('T')[0] === dateStr
      );

      availability.push({
        date: dateStr,
        dayOfWeek,
        bookings: dayBookings,
        isAvailable: dayBookings.length < 10, // Simple heuristic: available if less than 10 bookings
      });
    }

    return NextResponse.json({
      court: {
        id: court.id,
        name: court.name,
      },
      availability,
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
