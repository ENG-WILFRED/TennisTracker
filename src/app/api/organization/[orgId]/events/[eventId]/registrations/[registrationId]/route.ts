import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; eventId: string; registrationId: string }> }
) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { orgId, eventId, registrationId } = await params;
    const body = await request.json();
    const { status, rejectionReason } = body;

    if (!status) {
      return new Response(
        JSON.stringify({ error: 'status is required' }), 
        { status: 400 }
      );
    }

    // Verify registration exists and belongs to the event
    const registration = await prisma.eventRegistration.findFirst({
      where: {
        id: registrationId,
        eventId,
        event: {
          organizationId: orgId
        }
      }
    });

    if (!registration) {
      return new Response(JSON.stringify({ error: 'Registration not found' }), { status: 404 });
    }

    // Update registration
    const updatedRegistration = await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: {
        status,
        rejectionReason: rejectionReason || null
      },
      include: {
        member: {
          select: {
            id: true,
            player: {
              select: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  }
                }
              }
            }
          }
        }
      }
    });

    return new Response(JSON.stringify({
      id: updatedRegistration.id,
      eventId: updatedRegistration.eventId,
      memberId: updatedRegistration.memberId,
      status: updatedRegistration.status,
      signupOrder: updatedRegistration.signupOrder,
      registeredAt: updatedRegistration.registeredAt,
      rejectionReason: updatedRegistration.rejectionReason,
      member: updatedRegistration.member ? {
        id: updatedRegistration.member.id,
        player: updatedRegistration.member.player ? {
          user: updatedRegistration.member.player.user
        } : null
      } : null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating registration:', error);
    return new Response(JSON.stringify({ error: 'Failed to update registration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ orgId: string; eventId: string; registrationId: string }> }
) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { orgId, eventId, registrationId } = await params;

    // Verify registration exists and belongs to the event
    const registration = await prisma.eventRegistration.findFirst({
      where: {
        id: registrationId,
        eventId,
        event: {
          organizationId: orgId
        }
      }
    });

    if (!registration) {
      return new Response(JSON.stringify({ error: 'Registration not found' }), { status: 404 });
    }

    // Delete registration
    await prisma.eventRegistration.delete({
      where: { id: registrationId }
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting registration:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete registration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
