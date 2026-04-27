import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string; announcementId: string }>;
  }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { id, announcementId } = await params;
    const body = await request.json();
    const { title, message, announcementType, isActive, isPublished } = body;

    // Verify the announcement belongs to this tournament
    const announcement = await prisma.tournamentAnnouncement.findFirst({
      where: {
        id: announcementId,
        eventId: id,
      },
    });

    if (!announcement) {
      return new Response(
        JSON.stringify({
          error: 'Announcement not found',
        }),
        { status: 404 }
      );
    }

    const updated = await prisma.tournamentAnnouncement.update({
      where: { id: announcementId },
      data: {
        ...(title && { title }),
        ...(message && { message }),
        ...(announcementType && { announcementType }),
        ...(isActive !== undefined && { isActive }),
        ...(isPublished !== undefined && { isPublished }),
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

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating tournament announcement:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string; announcementId: string }>;
  }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { id, announcementId } = await params;

    // Verify the announcement belongs to this tournament
    const announcement = await prisma.tournamentAnnouncement.findFirst({
      where: {
        id: announcementId,
        eventId: id,
      },
    });

    if (!announcement) {
      return new Response(
        JSON.stringify({ error: 'Announcement not found' }),
        { status: 404 }
      );
    }

    await prisma.tournamentAnnouncement.delete({
      where: { id: announcementId },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting tournament announcement:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}
