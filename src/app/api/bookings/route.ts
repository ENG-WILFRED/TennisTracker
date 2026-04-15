import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cacheResponse, clearCachePrefix } from '@/lib/apiCache';
import { recordEndpointMetrics } from '@/lib/monitoring';

export async function POST(request: NextRequest) {
  const start = Date.now();
  let status = 200;

  try {
    const body = await request.json();
    const { amenityId, memberId, guestName, startTime, endTime, notes } = body;

    if (!amenityId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: amenityId, startTime, endTime' },
        { status: 400 }
      );
    }

    const amenity = await prisma.eventAmenity.findUnique({
      where: { id: amenityId },
      include: {
        event: true,
        bookings: {
          where: {
            OR: [
              {
                AND: [
                  { startTime: { lte: new Date(startTime) } },
                  { endTime: { gt: new Date(startTime) } },
                ],
              },
              {
                AND: [
                  { startTime: { lt: new Date(endTime) } },
                  { endTime: { gte: new Date(endTime) } },
                ],
              },
              {
                AND: [
                  { startTime: { gte: new Date(startTime) } },
                  { endTime: { lte: new Date(endTime) } },
                ],
              },
            ],
          },
        },
      },
    });

    if (!amenity) {
      return NextResponse.json({ error: 'Amenity not found' }, { status: 404 });
    }

    if (amenity.capacity && amenity.bookings.length >= amenity.capacity) {
      return NextResponse.json({ error: 'Amenity is fully booked' }, { status: 409 });
    }

    const bookingStart = new Date(startTime);
    const bookingEnd = new Date(endTime);

    if (amenity.availableFrom && bookingStart < amenity.availableFrom) {
      return NextResponse.json({ error: 'Booking starts before amenity is available' }, { status: 400 });
    }

    if (amenity.availableUntil && bookingEnd > amenity.availableUntil) {
      return NextResponse.json({ error: 'Booking ends after amenity is available' }, { status: 400 });
    }

    const booking = await prisma.amenityBooking.create({
      data: {
        amenityId,
        memberId: memberId || null,
        guestName: guestName || null,
        startTime: bookingStart,
        endTime: bookingEnd,
        status: 'confirmed',
        price: amenity.price,
        notes: notes || null,
      },
      include: {
        amenity: {
          include: {
            event: true,
          },
        },
        member: {
          include: {
            player: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    const response = NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        amenityName: booking.amenity.name,
        startTime: booking.startTime,
        endTime: booking.endTime,
        price: booking.price,
        status: booking.status,
      },
    });

    clearCachePrefix(`bookings:${amenityId}`);
    return response;
  } catch (error) {
    status = 500;
    console.error('Error creating amenity booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  } finally {
    recordEndpointMetrics('/api/bookings', 'POST', status, Date.now() - start);
  }
}

export async function GET(request: NextRequest) {
  const start = Date.now();
  let status = 200;

  try {
    const { searchParams } = new URL(request.url);
    const amenityId = searchParams.get('amenityId');
    const memberId = searchParams.get('memberId');

    const filters: any = {};

    if (amenityId) {
      filters.amenityId = amenityId;
    }

    if (memberId) {
      filters.memberId = memberId;
    }

    const cacheKey = `bookings:${amenityId || 'all'}:${memberId || 'all'}`;
    const bookings = await cacheResponse(cacheKey, async () => {
      return prisma.amenityBooking.findMany({
        where: filters,
        include: {
          amenity: {
            include: {
              event: true,
            },
          },
          member: {
            include: {
              player: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
        orderBy: {
          startTime: 'asc',
        },
      });
    }, 30_000);

    return NextResponse.json(bookings);

  } catch (error) {
    status = 500;
    console.error('Error fetching amenity bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  } finally {
    recordEndpointMetrics('/api/bookings', 'GET', status, Date.now() - start);
  }
}