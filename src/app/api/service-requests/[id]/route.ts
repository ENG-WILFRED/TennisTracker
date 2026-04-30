import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';


// PATCH /api/service-requests/[id] - Update service request status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { status, response } = await request.json();

    if (!status || !['accepted', 'rejected', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get the booking
    const booking = await prisma.serviceBooking.findUnique({
      where: { id },
      include: { service: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify authorization: provider can update or client can cancel
    const isProvider = booking.service.providerId === auth.userId;
    const isClient = booking.userId === auth.userId;

    if (!isProvider && !isClient) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Clients can only cancel
    if (isClient && status !== 'cancelled') {
      return NextResponse.json({ error: 'Clients can only cancel requests' }, { status: 403 });
    }

    // Update booking
    const updated = await prisma.serviceBooking.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        service: {
          include: {
            provider: true,
          },
        },
      },
    });

    return NextResponse.json({ booking: updated });
  } catch (error) {
    console.error('Error updating service request:', error);
    return NextResponse.json({ error: 'Failed to update service request' }, { status: 500 });
  }
}

// GET /api/service-requests/[id] - Get single service request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const booking = await prisma.serviceBooking.findUnique({
      where: { id },
      include: {
        service: {
          include: {
            provider: true,
          },
        },
        user: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error('Error fetching service request:', error);
    return NextResponse.json({ error: 'Failed to fetch service request' }, { status: 500 });
  }
}
