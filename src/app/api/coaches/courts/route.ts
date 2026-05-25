import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/coaches/courts?coachId=<coachId>
 * Fetch all courts for all organizations the coach belongs to
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const coachId = searchParams.get('coachId');

    if (!coachId) {
      return NextResponse.json(
        { error: 'coachId is required' },
        { status: 400 }
      );
    }

    // Get coach's primary organization and all memberships
    const coach = await prisma.staff.findUnique({
      where: { userId: coachId },
      select: { organizationId: true },
    });

    // Get all organizations where the coach is a member (primary + additional memberships)
    const memberships = await prisma.membership.findMany({
      where: {
        userId: coachId,
        status: 'accepted', // Only accepted memberships
      },
      select: { orgId: true },
    });

    const orgIds = memberships.map(m => m.orgId);
    
    // Also include primary organization if not already in memberships
    if (coach?.organizationId && !orgIds.includes(coach.organizationId)) {
      orgIds.push(coach.organizationId);
    }

    // Get all courts from all organizations the coach belongs to; if the coach has no orgs, return all courts
    const courts = await prisma.court.findMany({
      where: orgIds.length > 0
        ? { organizationId: { in: orgIds } }
        : {},
      select: {
        id: true,
        name: true,
        courtNumber: true,
        surface: true,
        indoorOutdoor: true,
        lights: true,
        organizationId: true,
        organization: { select: { name: true } },
      },
      orderBy: [
        { organizationId: 'asc' },
        { courtNumber: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({ courts });
  } catch (error: unknown) {
    console.error('Error fetching coach courts:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to fetch courts: ${message}` },
      { status: 500 }
    );
  }
}
