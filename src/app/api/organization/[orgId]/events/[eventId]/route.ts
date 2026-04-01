import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

// GET - Fetch event details
export async function GET(request: Request, { params }: { params: Promise<{ orgId: string; eventId: string }> }) {
  try {
    const { orgId, eventId } = await params;

    const event = await prisma.clubEvent.findUnique({
      where: { id: eventId },
      include: {
        organization: { select: { id: true, name: true } },
        registrations: {
          select: {
            id: true,
            memberId: true,
            status: true,
            signupOrder: true,
            registeredAt: true,
            member: {
              select: {
                id: true,
                playerId: true,
                player: {
                  select: {
                    user: { select: { firstName: true, lastName: true, email: true } }
                  }
                }
              }
            }
          }
        },
        bracket: true,
        matches: { take: 10 },
        announcements: true,
      }
    });

    if (!event || event.organizationId !== orgId) {
      return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(event), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Error fetching event:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500 });
  }
}

// PUT - Update event
export async function PUT(request: Request, { params }: { params: Promise<{ orgId: string; eventId: string }> }) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { orgId, eventId } = await params;
    const body = await request.json();

    // Verify authorization
    const event = await prisma.clubEvent.findUnique({
      where: { id: eventId },
      select: { organizationId: true }
    });

    if (!event || event.organizationId !== orgId) {
      return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 });
    }

    const isOwner = await prisma.organization.findFirst({
      where: { id: orgId, createdBy: auth.playerId }
    });

    const isAdmin = await prisma.clubMember.findFirst({
      where: { organizationId: orgId, playerId: auth.playerId, role: 'admin' }
    });

    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: 'You do not have permission to update this event' }), { status: 403 });
    }

    const updatedEvent = await prisma.clubEvent.update({
      where: { id: eventId },
      data: {
        name: body.name,
        description: body.description,
        eventType: body.eventType,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        registrationDeadline: body.registrationDeadline ? new Date(body.registrationDeadline) : undefined,
        registrationCap: body.registrationCap,
        entryFee: body.entryFee,
        prizePool: body.prizePool,
        location: body.location,
        rules: body.rules,
        instructions: body.instructions,
      },
      include: {
        _count: { select: { registrations: true } }
      }
    });

    return new Response(JSON.stringify(updatedEvent), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Error updating event:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500 });
  }
}

// DELETE - Delete event
export async function DELETE(request: Request, { params }: { params: Promise<{ orgId: string; eventId: string }> }) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { orgId, eventId } = await params;

    // Verify authorization
    const event = await prisma.clubEvent.findUnique({
      where: { id: eventId },
      select: { organizationId: true }
    });

    if (!event || event.organizationId !== orgId) {
      return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 });
    }

    const isOwner = await prisma.organization.findFirst({
      where: { id: orgId, createdBy: auth.playerId }
    });

    const isAdmin = await prisma.clubMember.findFirst({
      where: { organizationId: orgId, playerId: auth.playerId, role: 'admin' }
    });

    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: 'You do not have permission to delete this event' }), { status: 403 });
    }

    await prisma.clubEvent.delete({ where: { id: eventId } });

    return new Response(JSON.stringify({ success: true, message: 'Event deleted successfully' }), { status: 200 });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500 });
  }
}
