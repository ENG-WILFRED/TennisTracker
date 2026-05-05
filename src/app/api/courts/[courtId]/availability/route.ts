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

    const searchStart = new Date(startDate);
    const searchEnd = new Date(endDate);

    // Get all confirmed bookings in the date range
    const bookings = await prisma.courtBooking.findMany({
      where: {
        courtId,
        status: 'confirmed',
        startTime: {
          gte: searchStart,
          lte: searchEnd,
        },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
      },
    });

    // Get all active coach sessions for the court in the same window
    const sessions = await prisma.coachSession.findMany({
      where: {
        courtId,
        status: { in: ['scheduled', 'confirmed', 'in-progress'] },
        OR: [
          {
            startTime: {
              gte: searchStart,
              lte: searchEnd,
            },
          },
          {
            endTime: {
              gte: searchStart,
              lte: searchEnd,
            },
          },
          {
            AND: [
              { startTime: { lte: searchStart } },
              { endTime: { gte: searchEnd } },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        status: true,
      },
    });

    const availability = [];
    for (let d = new Date(searchStart); d <= searchEnd; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
      const dateStr = d.toISOString().split('T')[0];

      const dayBookings = bookings.filter((b: typeof bookings[number]) =>
        b.startTime.toISOString().split('T')[0] === dateStr
      );

      const daySessions = sessions.filter((s: typeof sessions[number]) =>
        s.startTime.toISOString().split('T')[0] === dateStr ||
        s.endTime.toISOString().split('T')[0] === dateStr ||
        (s.startTime < new Date(`${dateStr}T00:00:00Z`) && s.endTime > new Date(`${dateStr}T23:59:59Z`))
      );

      availability.push({
        date: dateStr,
        dayOfWeek,
        bookings: dayBookings,
        sessions: daySessions,
        isAvailable: dayBookings.length < 10 && daySessions.length === 0,
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
