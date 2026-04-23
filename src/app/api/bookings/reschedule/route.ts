import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, playerId, newDate, newTime } = body;

    // Validate required fields
    if (!bookingId || !playerId || !newDate || !newTime) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, playerId, newDate, newTime' },
        { status: 400 }
      );
    }

    // Get the existing booking
    const existingBooking = await prisma.courtBooking.findUnique({
      where: { id: bookingId },
      include: {
        member: {
          include: {
            player: {
              include: {
                user: true,
              },
            },
          },
        },
        court: true,
        organization: true,
      },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if the booking belongs to the player
    const playerMemberId = existingBooking.memberId;
    if (!playerMemberId) {
      return NextResponse.json({ error: 'Invalid booking' }, { status: 400 });
    }

    // Verify the member belongs to the player
    const memberCheck = await prisma.clubMember.findUnique({
      where: { id: playerMemberId },
      include: {
        player: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!memberCheck || memberCheck.player?.user?.id !== playerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if booking can be rescheduled (must be confirmed)
    if (existingBooking.status !== 'confirmed') {
      return NextResponse.json(
        { error: `Cannot reschedule a ${existingBooking.status} booking` },
        { status: 400 }
      );
    }

    // Parse new date and time
    const [hours, minutes] = newTime.split(':');
    const startDateTime = new Date(`${newDate}T${newTime}:00`);
    const endDateTime = new Date(startDateTime);
    
    // Calculate duration from existing booking
    const duration = existingBooking.endTime.getTime() - existingBooking.startTime.getTime();
    endDateTime.setTime(endDateTime.getTime() + duration);

    // Validate date is in the future
    if (startDateTime < new Date()) {
      return NextResponse.json(
        { error: 'Cannot reschedule to a past date/time' },
        { status: 400 }
      );
    }

    // Check for conflicts with other confirmed bookings on the same court
    const conflicts = await prisma.courtBooking.findMany({
      where: {
        courtId: existingBooking.courtId,
        id: { not: bookingId }, // Exclude current booking
        status: 'confirmed',
        OR: [
          {
            AND: [
              { startTime: { lte: startDateTime } },
              { endTime: { gt: startDateTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endDateTime } },
              { endTime: { gte: endDateTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startDateTime } },
              { endTime: { lte: endDateTime } },
            ],
          },
        ],
      },
    });

    if (conflicts.length > 0) {
      return NextResponse.json(
        { error: 'Court is not available at the selected time' },
        { status: 409 }
      );
    }

    // Update the booking with new date/time and set status to pending
    const updatedBooking = await prisma.courtBooking.update({
      where: { id: bookingId },
      data: {
        startTime: startDateTime,
        endTime: endDateTime,
        status: 'pending', // Set to pending for approval
      },
      include: {
        member: true,
        court: true,
        organization: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Booking rescheduled successfully and is pending approval',
        booking: {
          id: updatedBooking.id,
          court: updatedBooking.court.name,
          status: updatedBooking.status,
          startTime: updatedBooking.startTime.toISOString(),
          endTime: updatedBooking.endTime.toISOString(),
          organizationId: updatedBooking.organizationId,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Reschedule booking error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reschedule booking' },
      { status: 500 }
    );
  }
}
