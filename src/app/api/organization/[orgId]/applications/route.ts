import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const { orgId } = await params;
    const organization = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!organization) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const isOwner = organization.createdBy === auth.userId;
    const isAdmin = await prisma.membership.findFirst({
      where: {
        orgId,
        userId: auth.userId,
        role: 'admin',
        status: 'accepted',
      },
    });

    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const applications = await prisma.membership.findMany({
      where: {
        orgId,
        status: 'pending',
      },
      include: {
        user: true,
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    return new Response(JSON.stringify(applications), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching organization applications:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
