import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string; eventId: string }> }
) {
  try {
    const { orgId, eventId } = await params;

    const registrations = await prisma.eventRegistration.findMany({
      where: {
        eventId,
        event: {
          organizationId: orgId,
        }
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
      },
      orderBy: {
        signupOrder: 'asc'
      }
    });

    const formattedRegistrations = registrations.map((reg: typeof registrations[number]) => ({
      id: reg.id,
      eventId: reg.eventId,
      memberId: reg.memberId,
      status: reg.status,
      signupOrder: reg.signupOrder,
      registeredAt: reg.registeredAt,
      rejectionReason: reg.rejectionReason,
      member: reg.member ? {
        id: reg.member.id,
        player: reg.member.player ? {
          user: reg.member.player.user
        } : null
      } : null
    }));

    return new Response(JSON.stringify(formattedRegistrations), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch registrations' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string; eventId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { orgId, eventId } = await params;
    const body = await request.json();
    const { memberId, status = 'registered' } = body;

    if (!memberId) {
      return new Response(
        JSON.stringify({ error: 'memberId is required' }), 
        { status: 400 }
      );
    }

    // Verify event exists and belongs to organization
    const event = await prisma.clubEvent.findUnique({
      where: { id: eventId },
      select: { organizationId: true, registrations: true, registrationCap: true }
    });

    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 });
    }

    if (event.organizationId !== orgId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
    }

    // Check if member already registered
    const existingReg = await prisma.eventRegistration.findUnique({
      where: {
        eventId_memberId: { eventId, memberId }
      }
    });

    if (existingReg) {
      return new Response(
        JSON.stringify({ error: 'Member already registered for this event' }), 
        { status: 400 }
      );
    }

    // Check registration cap
    if (event.registrations.length >= event.registrationCap) {
      return new Response(
        JSON.stringify({ error: 'Event registration is full' }), 
        { status: 400 }
      );
    }

    // Verify member exists
    const member = await prisma.clubMember.findUnique({
      where: { id: memberId }
    });

    if (!member) {
      return new Response(JSON.stringify({ error: 'Member not found' }), { status: 404 });
    }

    // Create registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        memberId,
        status,
        signupOrder: event.registrations.length + 1,
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
      id: registration.id,
      eventId: registration.eventId,
      memberId: registration.memberId,
      status: registration.status,
      signupOrder: registration.signupOrder,
      registeredAt: registration.registeredAt,
      rejectionReason: registration.rejectionReason,
      member: registration.member ? {
        id: registration.member.id,
        player: registration.member.player ? {
          user: registration.member.player.user
        } : null
      } : null
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating registration:', error);
    return new Response(JSON.stringify({ error: 'Failed to create registration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
