import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ orgId: string; bookingId: string }> }
) {
  try {
    const { orgId, bookingId } = await params;
    const auth = verifyApiAuth(request);

    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { status } = await request.json();

    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return new Response(
        JSON.stringify({ error: 'Invalid status. Must be one of: pending, confirmed, cancelled' }),
        { status: 400 }
      );
    }

    // Verify that the user is a manager/staff of the organization
    const member = await prisma.clubMember.findFirst({
      where: {
        organizationId: orgId,
        player: { userId: auth.playerId },
        role: { in: ['officer', 'manager'] },
      },
    });

    if (!member) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to manage bookings for this organization' }),
        { status: 403 }
      );
    }

    // Update the booking status
    const updatedBooking = await prisma.courtBooking.update({
      where: { id: bookingId },
      data: { status },
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
