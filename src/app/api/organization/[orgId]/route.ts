import prisma from '@/lib/prisma';
import type { NextRequest } from 'next/server';

// Optimized lightweight query - only essential org data
const buildOrgQuery = () => ({
  courts: {
    select: {
      id: true,
      name: true,
      courtNumber: true,
      surface: true,
      indoorOutdoor: true,
      lights: true,
      status: true,
    },
    take: 5,
  },
  events: {
    select: {
      id: true,
      name: true,
      eventType: true,
      startDate: true,
      registrationCap: true,
      entryFee: true,
    },
    take: 3,
    orderBy: { startDate: 'asc' as const },
  },
  announcements: {
    select: {
      id: true,
      title: true,
      message: true,
      announcementType: true,
      isActive: true,
      createdAt: true,
    },
    take: 3,
    orderBy: { createdAt: 'desc' as const },
  },
  membershipTiers: {
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
    take: 5,
  },
  _count: {
    select: {
      members: true,
      courts: true,
      events: true,
    },
  },
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const queryInclude = buildOrgQuery();

    let org: any = await prisma.organization.findUnique({
      where: { id: orgId },
      include: queryInclude,
    });

    // If not found by id, try to resolve by slug (support both id and slug URLs)
    if (!org) {
      org = await prisma.organization.findUnique({
        where: { slug: orgId },
        include: queryInclude,
      });
    }

    if (!org) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), { status: 404 });
    }

    if (Array.isArray(org.membershipTiers)) {
      org.membershipTiers = org.membershipTiers.map((tier: any) => ({
        ...tier,
        benefits: typeof tier.benefitsJson === 'string' && tier.benefitsJson ? JSON.parse(tier.benefitsJson) : [],
      }));
    }

    return new Response(
      JSON.stringify(org),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching organization:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
