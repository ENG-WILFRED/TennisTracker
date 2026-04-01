import prisma from '@/lib/prisma';
import type { NextRequest } from 'next/server';

const buildOrgQuery = () => ({
  members: {
    select: {
      id: true,
      playerId: true,
      role: true,
      joinDate: true,
      paymentStatus: true,
      attendanceCount: true,
      player: {
        select: {
          user: { select: { firstName: true, lastName: true, email: true, photo: true } },
        },
      },
    },
    take: 10,
  },
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
    take: 5,
    orderBy: { startDate: 'asc' as const },
  },
  rankings: {
    select: {
      id: true,
      currentRank: true,
      ratingPoints: true,
      member: {
        select: {
          player: {
            select: {
              user: { select: { firstName: true, lastName: true, email: true, photo: true } },
            },
          },
        },
      },
    },
    take: 5,
    orderBy: { currentRank: 'asc' as const },
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
    take: 5,
    orderBy: { createdAt: 'desc' as const },
  },
  finances: {
    select: {
      id: true,
      month: true,
      year: true,
      membershipRevenue: true,
      courtBookingRevenue: true,
      totalRevenue: true,
      netProfit: true,
    },
    orderBy: [{ year: 'desc' as const }, { month: 'desc' as const }],
    take: 12,
  },
  ratings: {
    select: {
      id: true,
      rating: true,
      category: true,
      comment: true,
      createdAt: true,
    },
    take: 10,
    orderBy: { createdAt: 'desc' as const },
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

    return new Response(
      JSON.stringify(org),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=5, s-maxage=5, stale-while-revalidate=10',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching organization:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
