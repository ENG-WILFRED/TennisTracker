import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ orgId: string; bookingId: string }> }
) {
  try {
    const { orgId, bookingId } = await params;
    const auth = await verifyApiAuth(request);

    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { status, rejectionReason } = await request.json();

    if (!['pending', 'confirmed', 'cancelled', 'rejected'].includes(status)) {
      return new Response(
        JSON.stringify({ error: 'Invalid status. Must be one of: pending, confirmed, cancelled, rejected' }),
        { status: 400 }
      );
    }

    // Verify the booking belongs to this organization
    const booking = await prisma.courtBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.organizationId !== orgId) {
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404 }
      );
    }

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { status: 404 }
      );
    }

    // Verify that the user has permission to manage bookings for this organization
    // Check if user is a manager/staff of the organization
    const member = await prisma.clubMember.findFirst({
      where: {
        organizationId: orgId,
        player: { userId: auth.playerId },
        role: { in: ['officer', 'manager', 'admin'] },
      },
    });

    // Also check if user is the organization owner
    const user = await prisma.user.findUnique({
      where: { id: auth.playerId },
    });

    const isOwner = user?.email === organization.email;

    if (!member && !isOwner) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to manage bookings for this organization' }),
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = { status };
    
    // If rejecting, include rejection reason and timestamp
    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
      updateData.rejectedAt = new Date();
    }

    // Update the booking status
    const updatedBooking = await prisma.courtBooking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        court: true,
        member: {
          include: {
            player: {
              include: { user: true },
            },
          },
        },
      },
    });

    return new Response(JSON.stringify(updatedBooking), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
