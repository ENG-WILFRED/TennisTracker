import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

async function requireOrgManager(request: Request, orgId: string) {
  const auth = await verifyApiAuth(request);
  if (!auth) return { error: 'Unauthorized', status: 401 };

  const organization = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!organization) return { error: 'Organization not found', status: 404 };

  const isOwner = organization.createdBy === auth.userId;
  const isAdmin = Boolean(await prisma.clubMember.findFirst({
    where: { organizationId: orgId, playerId: auth.userId, role: 'admin' },
  }));

  if (!isOwner && !isAdmin) {
    return { error: 'You do not have permission to manage membership tiers', status: 403 };
  }

  return { auth, organization };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ orgId: string; tierId: string }> }) {
  try {
    const { orgId, tierId } = await params;
    const access = await requireOrgManager(request, orgId);
    if ('error' in access) {
      return new Response(JSON.stringify({ error: access.error }), { status: access.status });
    }

    const body = await request.json();
    const benefits = Array.isArray(body.benefits)
      ? body.benefits
      : typeof body.benefits === 'string'
      ? body.benefits.split(',').map((item: string) => item.trim()).filter(Boolean)
      : [];

    const tier = await prisma.membershipTier.updateMany({
      where: { id: tierId, organizationId: orgId },
      data: {
        name: body.name,
        description: body.description || '',
        monthlyPrice: Number(body.monthlyPrice || 0),
        courtHoursPerMonth: Number(body.courtHoursPerMonth || 0),
        maxConcurrentBookings: Number(body.maxConcurrentBookings || 0),
        discountPercentage: Number(body.discountPercentage || 0),
        benefitsJson: JSON.stringify(benefits),
      },
    });

    if (tier.count === 0) {
      return new Response(JSON.stringify({ error: 'Membership tier not found' }), { status: 404 });
    }

    const updated = await prisma.membershipTier.findUnique({ where: { id: tierId } });
    return new Response(JSON.stringify({
      ...updated,
      benefits,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating membership tier:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Internal server error' }), { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ orgId: string; tierId: string }> }) {
  try {
    const { orgId, tierId } = await params;
    const access = await requireOrgManager(request, orgId);
    if ('error' in access) {
      return new Response(JSON.stringify({ error: access.error }), { status: access.status });
    }

    const deleted = await prisma.membershipTier.deleteMany({ where: { id: tierId, organizationId: orgId } });
    if (deleted.count === 0) {
      return new Response(JSON.stringify({ error: 'Membership tier not found' }), { status: 404 });
    }

    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error('Error deleting membership tier:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Internal server error' }), { status: 500 });
  }
}
