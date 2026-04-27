import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function POST(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { orgId } = await params;

    // Verify organization exists and user has access
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
      return new Response(JSON.stringify({ error: 'You do not have permission to seed tournaments' }), { status: 403 });
    }

    // Get members with players
    const members = await prisma.clubMember.findMany({
      where: { organizationId: orgId },
      include: { player: true },
      take: 20,
    });

    if (members.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No members found in organization. Cannot seed tournaments.' }),
        { status: 400 }
      );
    }

    const seededTournaments = [];

    // Create sample tournaments
    const now = new Date();

    // Tournament 1: Upcoming - Open for registration
    const upcomingTournament = await prisma.clubEvent.create({
      data: {
        organizationId: orgId,
        name: 'Spring Championship 2026',
        description: 'Our annual spring tennis tournament featuring players from all levels',
        eventType: 'tournament',
        startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        endDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
        registrationDeadline: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        prizePool: 5000,
        entryFee: 50,
        registrationCap: 32,
      },
    });

    // Register some members
    for (let i = 0; i < Math.min(5, members.length); i++) {
      await prisma.eventRegistration.create({
        data: {
          eventId: upcomingTournament.id,
          memberId: members[i].id,
          status: 'confirmed',
          signupOrder: i + 1,
        },
      });
    }

    seededTournaments.push(upcomingTournament);

    // Tournament 2: Ongoing
    const ongoingTournament = await prisma.clubEvent.create({
      data: {
        organizationId: orgId,
        name: 'Summer Open 2026',
        description: 'Mixed doubles summer tournament',
        eventType: 'tournament',
        startDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        registrationDeadline: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        prizePool: 3000,
        entryFee: 30,
        registrationCap: 24,
      },
    });

    // Register members
    for (let i = 0; i < Math.min(8, members.length); i++) {
      await prisma.eventRegistration.create({
        data: {
          eventId: ongoingTournament.id,
          memberId: members[i].id,
          status: 'confirmed',
          signupOrder: i + 1,
        },
      });
    }

    seededTournaments.push(ongoingTournament);

    // Tournament 3: Completed
    const completedTournament = await prisma.clubEvent.create({
      data: {
        organizationId: orgId,
        name: 'Winter Championship 2025',
        description: 'Last season winter championship',
        eventType: 'tournament',
        startDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        endDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        registrationDeadline: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000), // 50 days ago
        prizePool: 4000,
        entryFee: 40,
        registrationCap: 32,
      },
    });

    // Register all members
    for (let i = 0; i < Math.min(12, members.length); i++) {
      await prisma.eventRegistration.create({
        data: {
          eventId: completedTournament.id,
          memberId: members[i].id,
          status: 'confirmed',
          signupOrder: i + 1,
        },
      });
    }

    seededTournaments.push(completedTournament);

    console.log(`Seeded ${seededTournaments.length} tournaments for org ${orgId}`);

    return new Response(JSON.stringify({ success: true, tournaments: seededTournaments, count: seededTournaments.length }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error seeding tournaments:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500 });
  }
}
