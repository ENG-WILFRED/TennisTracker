import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; courtId: string; bookingId: string }> }
) {
  try {
    if (!verifyApiAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId, courtId, bookingId } = await params;
    const body = await request.json();
    const { status, cancellationReason } = body;

    const booking = await prisma.courtBooking.updateMany({
      where: {
        id: bookingId,
        courtId: courtId,
        organizationId: orgId,
      },
      data: {
        status,
        cancellationReason: status === 'cancelled' ? cancellationReason || 'Cancelled by admin' : undefined,
        cancelledAt: status === 'cancelled' ? new Date() : undefined,
      },
    });

    if (booking.count === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const updated = await prisma.courtBooking.findUnique({ where: { id: bookingId } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH booking error:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
