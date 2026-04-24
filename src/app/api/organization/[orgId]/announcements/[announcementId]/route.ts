import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

async function requireOrgManager(request: Request, orgId: string) {
  const auth = verifyApiAuth(request);
  if (!auth) return { error: 'Unauthorized', status: 401 };

  const organization = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!organization) return { error: 'Organization not found', status: 404 };

  const isOwner = organization.createdBy === auth.playerId;
  const isAdmin = Boolean(await prisma.clubMember.findFirst({
    where: { organizationId: orgId, playerId: auth.playerId, role: 'admin' },
  }));

  if (!isOwner && !isAdmin) {
    return { error: 'You do not have permission to manage announcements', status: 403 };
  }

  return { auth, organization };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ orgId: string; announcementId: string }> }) {
  try {
    const { orgId, announcementId } = await params;
    const access = await requireOrgManager(request, orgId);
    if ('error' in access) {
      return new Response(JSON.stringify({ error: access.error }), { status: access.status });
    }

    const body = await request.json();
    const announcement = await prisma.clubAnnouncement.updateMany({
      where: { id: announcementId, organizationId: orgId },
      data: {
        title: body.title,
        message: body.message,
        announcementType: body.announcementType || 'general',
        isActive: Boolean(body.isActive),
      },
    });

    if (announcement.count === 0) {
      return new Response(JSON.stringify({ error: 'Announcement not found' }), { status: 404 });
    }

    const updated = await prisma.clubAnnouncement.findUnique({ where: { id: announcementId } });
    return new Response(JSON.stringify(updated), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Error updating announcement:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Internal server error' }), { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ orgId: string; announcementId: string }> }) {
  try {
    const { orgId, announcementId } = await params;
    const access = await requireOrgManager(request, orgId);
    if ('error' in access) {
      return new Response(JSON.stringify({ error: access.error }), { status: access.status });
    }

    const deleted = await prisma.clubAnnouncement.deleteMany({ where: { id: announcementId, organizationId: orgId } });
    if (deleted.count === 0) {
      return new Response(JSON.stringify({ error: 'Announcement not found' }), { status: 404 });
    }

    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error('Error deleting announcement:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Internal server error' }), { status: 500 });
  }
}
