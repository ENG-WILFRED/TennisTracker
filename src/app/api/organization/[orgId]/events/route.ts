import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const events = await prisma.clubEvent.findMany({
      where: {
        organizationId: orgId,
        ...(type === 'tournament' && { eventType: 'tournament' }),
      },
      include: {
        _count: { select: { registrations: true } },
      },
      orderBy: { startDate: 'desc' },
    });

    // Transform to include only needed fields
    const formattedEvents = events.map(e => ({
      id: e.id,
      name: e.name,
      description: e.description,
      eventType: e.eventType,
      startDate: e.startDate.toISOString(),
      endDate: e.endDate?.toISOString(),
      registrationCap: e.registrationCap,
      entryFee: e.entryFee,
      location: e.location,
      _count: e._count,
    }));

    return new Response(JSON.stringify(formattedEvents), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching organization events:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { orgId } = await params;
    const body = await request.json();

    console.log(`POST /api/organization/${orgId}/events called`);

    // Validate organization access
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), { status: 404 });
    }

    // Check authorization
    const isOwner = organization.createdBy === auth.playerId;
    const isAdmin = await prisma.clubMember.findFirst({
      where: { organizationId: orgId, playerId: auth.playerId, role: 'admin' },
    });

    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: 'You do not have permission to create events' }), { status: 403 });
    }

    // Create event
    const event = await prisma.clubEvent.create({
      data: {
        organizationId: orgId,
        name: body.name,
        eventType: body.eventType || 'tournament',
        description: body.description,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        registrationDeadline: body.registrationDeadline ? new Date(body.registrationDeadline) : new Date(),
        registrationCap: body.registrationCap || 32,
        entryFee: body.entryFee || 0,
        prizePool: body.prizePool || 0,
      },
    });

    console.log(`Event created: ${event.id}`);

    return new Response(JSON.stringify(event), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating event:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500 });
  }
}