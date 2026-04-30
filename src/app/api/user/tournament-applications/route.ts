import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/authMiddleware';

/**
 * GET /api/user/tournament-applications
 * Fetch all tournament applications for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication using JWT token from Authorization header
    const auth = await verifyApiAuth(request as unknown as Request);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const playerId = auth.userId; // This is actually the userId

    // Get player and their registrations
    const player = await prisma.player.findUnique({
      where: { userId: playerId },
      include: {
        clubMembers: {
          include: {
            eventRegistrations: {
              include: {
                event: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    startDate: true,
                    endDate: true,
                    entryFee: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player profile not found' },
        { status: 404 }
      );
    }

    // Collect all registrations from all club memberships
    const applications = player.clubMembers.flatMap((member: any) =>
      member.eventRegistrations.map((reg: any) => ({
        id: reg.id,
        eventId: reg.eventId,
        memberId: reg.memberId,
        status: reg.status,
        createdAt: reg.registeredAt,
        event: reg.event,
      }))
    );

    // Sort by created date (newest first)
    applications.sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error fetching tournament applications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
