import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Fetch the booking details
    const booking = await prisma.courtBooking.findUnique({
      where: { id: bookingId },
      include: {
        court: {
          include: {
            organization: true,
          },
        },
        organization: true,
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

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Format the response
    return NextResponse.json(
      {
        id: booking.id,
        courtId: booking.courtId,
        court: booking.court.name,
        status: booking.status,
        date: booking.startTime.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        }),
        startTime: booking.startTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        endTime: booking.endTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        duration: `${Math.round((booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60))} minutes`,
        price: `$${booking.price?.toFixed(2) || '0.00'}`,
        organizationId: booking.organizationId,
        organizationName: booking.organization.name,
        chatRoomId: booking.organizationId, // Use org ID as reference for chat room
        rawStartTime: booking.startTime.toISOString(),
        rawEndTime: booking.endTime.toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get booking error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}
