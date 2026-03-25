import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma/index.js';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Get filter parameters
    const surface = searchParams.get('surface');
    const indoorOutdoor = searchParams.get('indoorOutdoor');
    const orgId = searchParams.get('orgId');
    const city = searchParams.get('city');
    const hasLights = searchParams.get('hasLights');
    const status = searchParams.get('status') || 'available';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Build where clause for filtering
    const where: any = {
      status: { in: [status, 'booked'] }, // Show available and booked courts
    };

    // Apply surface filter
    if (surface) {
      where.surface = { in: surface.split(',').map((s) => s.trim()) };
    }

    // Apply indoor/outdoor filter
    if (indoorOutdoor) {
      where.indoorOutdoor = { in: indoorOutdoor.split(',').map((s) => s.trim()) };
    }

    // Apply organization filter
    if (orgId) {
      where.organizationId = orgId;
    }

    // Apply lights filter
    if (hasLights !== null) {
      where.lights = hasLights === 'true';
    }

    // Apply city filter (via organization)
    if (city) {
      where.organization = {
        city: {
          contains: city,
          mode: 'insensitive',
        },
      };
    }

    // Get total count for pagination
    const total = await prisma.court.count({ where });

    // Get courts with organization details
    const courts = await prisma.court.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            country: true,
            address: true,
            phone: true,
            email: true,
            logo: true,
            rating: true,
            ratingCount: true,
            primaryColor: true,
          },
        },
        bookings: {
          where: {
            startTime: {
              gte: new Date(),
            },
            status: 'confirmed',
          },
          take: 5,
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
            isPeak: true,
            price: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { organization: { rating: 'desc' } },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({
      courts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Court search error:', error);
    return NextResponse.json(
      { error: `Failed to search courts: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courtId, date } = body;

    if (!courtId || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: courtId, date' },
        { status: 400 }
      );
    }

    // Get available time slots for a court on a specific date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get court details
    const court = await prisma.court.findUnique({
      where: { id: courtId },
      include: {
        organization: true,
      },
    });

    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 });
    }

    // Get existing bookings for this court on this date
    const existingBookings = await prisma.courtBooking.findMany({
      where: {
        courtId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { in: ['confirmed', 'no-show'] },
      },
      select: {
        startTime: true,
        endTime: true,
        isPeak: true,
        price: true,
      },
    });

    // Generate time slots (6 AM to 10 PM, 1-hour slots)
    const slots = [];
    const hoursStart = 6;
    const hoursEnd = 22;

    // Define peak hours (5 PM - 9 PM)
    const peakHourStart = 17;
    const peakHourEnd = 21;

    for (let hour = hoursStart; hour < hoursEnd; hour++) {
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);

      const slotEnd = new Date(date);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      // Check if slot is booked
      const isBooked = existingBookings.some(
        (booking) => booking.startTime < slotEnd && booking.endTime > slotStart
      );

      const isPeak = hour >= peakHourStart && hour < peakHourEnd;
      const basePriceMap: { [key: string]: number } = {
        'Hard': isPeak ? 80 : 50,
        'Clay': isPeak ? 100 : 60,
        'Grass': isPeak ? 120 : 75,
      };

      const basePrice = basePriceMap[court.surface] || (isPeak ? 80 : 50);
      const indoorMultiplier = court.indoorOutdoor === 'indoor' ? 1.2 : 1.0;
      const price = Math.round(basePrice * indoorMultiplier);

      slots.push({
        hour,
        time: `${hour.toString().padStart(2, '0')}:00`,
        available: !isBooked,
        isPeak,
        price,
      });
    }

    return NextResponse.json({
      court: {
        id: court.id,
        name: court.name,
        surface: court.surface,
        indoorOutdoor: court.indoorOutdoor,
        lights: court.lights,
        organization: court.organization,
      },
      slots,
      date,
    });
  } catch (error: any) {
    console.error('Time slot error:', error);
    return NextResponse.json(
      { error: `Failed to fetch time slots: ${error.message}` },
      { status: 500 }
    );
  }
}
