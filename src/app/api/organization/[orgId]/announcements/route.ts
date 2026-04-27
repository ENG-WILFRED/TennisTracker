import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;

    const announcements = await prisma.clubAnnouncement.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });

    return new Response(JSON.stringify(announcements), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { orgId } = await params;
    const body = await request.json();
    const { title, message, announcementType, targetRoles } = body;

    if (!title || !message) {
      return new Response(JSON.stringify({ error: 'Title and message are required' }), { status: 400 });
    }

    const announcement = await prisma.clubAnnouncement.create({
      data: {
        organizationId: orgId,
        title,
        message,
        announcementType: announcementType || 'general',
        targetRoles: targetRoles || ['member'],
        createdBy: auth.playerId,
      },
    });

    return new Response(JSON.stringify(announcement), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}