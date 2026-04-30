import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    const membershipTiers = await prisma.membershipTier.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        name: true,
        description: true,
        monthlyPrice: true,
        benefitsJson: true,
        courtHoursPerMonth: true,
        maxConcurrentBookings: true,
        discountPercentage: true,
      },
      orderBy: { monthlyPrice: 'asc' },
    });

    const formatted = membershipTiers.map((tier) => ({
      ...tier,
      benefits: typeof tier.benefitsJson === 'string' && tier.benefitsJson ? JSON.parse(tier.benefitsJson) : [],
    }));

    return new Response(JSON.stringify(formatted), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching membership tiers:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Internal server error' }), { status: 500 });
  }
}

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

export async function POST(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
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

    if (!body.name || typeof body.name !== 'string') {
      return new Response(JSON.stringify({ error: 'Tier name is required' }), { status: 400 });
    }

    const tier = await prisma.membershipTier.create({
      data: {
        organizationId: orgId,
        name: body.name,
        description: body.description || '',
        monthlyPrice: Number(body.monthlyPrice || 0),
        courtHoursPerMonth: Number(body.courtHoursPerMonth || 0),
        maxConcurrentBookings: Number(body.maxConcurrentBookings || 0),
        discountPercentage: Number(body.discountPercentage || 0),
        benefitsJson: JSON.stringify(benefits),
      },
    });

    return new Response(JSON.stringify({
      ...tier,
      benefits,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating membership tier:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Internal server error' }), { status: 500 });
  }
}
