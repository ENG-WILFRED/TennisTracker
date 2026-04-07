import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/coaches/courts?coachId=<coachId>
 * Fetch all courts for a coach's organization
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

    // Get coach's organization
    const coach = await prisma.staff.findUnique({
      where: { userId: coachId },
      select: { organizationId: true },
    });

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      );
    }

    if (!coach.organizationId) {
      return NextResponse.json(
        { error: 'Coach is not associated with any organization' },
        { status: 400 }
      );
    }

    // Get all courts for the organization
    const courts = await prisma.court.findMany({
      where: {
        organizationId: coach.organizationId,
      },
      select: {
        id: true,
        name: true,
        courtNumber: true,
        surface: true,
        indoorOutdoor: true,
        lights: true,
      },
      orderBy: [
        { courtNumber: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({ courts });
  } catch (error: any) {
    console.error('Error fetching coach courts:', error);
    return NextResponse.json(
      { error: `Failed to fetch courts: ${error.message}` },
      { status: 500 }
    );
  }
}
