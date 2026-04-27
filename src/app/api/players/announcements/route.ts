import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

// Get announcements for all tournaments a player is registered for
export async function GET(request: Request) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    // Get all registrations for this player
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        member: {
          player: {
            userId: auth.playerId,
          },
        },
      },
      select: {
        eventId: true,
      },
    });

    const eventIds = registrations.map((r: typeof registrations[number]) => r.eventId);

    if (eventIds.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get announcements for these events
    const announcements = await prisma.tournamentAnnouncement.findMany({
      where: {
        eventId: {
          in: eventIds,
        },
        isActive: true,
        isPublished: true,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            organizationId: true,
          },
        },
      },
      take: 50,
    });

    return new Response(JSON.stringify(announcements), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching player announcements:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}
