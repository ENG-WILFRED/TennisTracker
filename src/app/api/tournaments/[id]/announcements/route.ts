import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const announcements = await prisma.tournamentAnnouncement.findMany({
      where: {
        eventId: id,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          select: {
            name: true,
            organizationId: true,
          },
        },
      },
    });

    return new Response(JSON.stringify(announcements), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching tournament announcements:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, message, announcementType, isPublished } = body;

    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: 'Title and message are required' }),
        { status: 400 }
      );
    }

    // Get the event to verify it exists and get organizationId
    const event = await prisma.clubEvent.findUnique({
      where: { id },
      select: { organizationId: true },
    });

    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
      });
    }

    const announcement = await prisma.tournamentAnnouncement.create({
      data: {
        eventId: id,
        organizationId: event.organizationId,
        title,
        message,
        announcementType: announcementType || 'general',
        isPublished: isPublished || true,
        createdBy: auth.playerId,
      },
      include: {
        event: {
          select: {
            name: true,
            organizationId: true,
          },
        },
      },
    });

    return new Response(JSON.stringify(announcement), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating tournament announcement:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}
