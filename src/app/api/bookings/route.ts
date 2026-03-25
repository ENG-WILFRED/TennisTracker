import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma/index.js';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amenityId, memberId, guestName, startTime, endTime, notes } = body;

    if (!amenityId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: amenityId, startTime, endTime' },
        { status: 400 }
      );
    }

    // Check if amenity exists and get its details
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
                  { endTime: { gt: new Date(startTime) } }
                ]
              },
              {
                AND: [
                  { startTime: { lt: new Date(endTime) } },
                  { endTime: { gte: new Date(endTime) } }
                ]
              },
              {
                AND: [
                  { startTime: { gte: new Date(startTime) } },
                  { endTime: { lte: new Date(endTime) } }
                ]
              }
            ]
          }
        }
      }
    });

    if (!amenity) {
      return NextResponse.json({ error: 'Amenity not found' }, { status: 404 });
    }

    // Check capacity
    if (amenity.capacity && amenity.bookings.length >= amenity.capacity) {
      return NextResponse.json({ error: 'Amenity is fully booked' }, { status: 409 });
    }

    // Check if booking is within available time
    const bookingStart = new Date(startTime);
    const bookingEnd = new Date(endTime);

    if (amenity.availableFrom && bookingStart < amenity.availableFrom) {
      return NextResponse.json({ error: 'Booking starts before amenity is available' }, { status: 400 });
    }

    if (amenity.availableUntil && bookingEnd > amenity.availableUntil) {
      return NextResponse.json({ error: 'Booking ends after amenity is available' }, { status: 400 });
    }

    // Create the booking
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

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        amenityName: booking.amenity.name,
        startTime: booking.startTime,
        endTime: booking.endTime,
        price: booking.price,
        status: booking.status,
      }
    });

  } catch (error) {
    console.error('Error creating amenity booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: NextRequest) {
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

    const bookings = await prisma.amenityBooking.findMany({
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

    return NextResponse.json(bookings);

  } catch (error) {
    console.error('Error fetching amenity bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}