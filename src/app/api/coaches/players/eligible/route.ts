import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/coaches/players/eligible?coachId=<coachId>
 * Get all eligible players for a coach to schedule sessions with:
 * - Players in coach-player relationships (coaching this coach)
 * - Players in the same organization(s) as the coach
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const coachId = url.searchParams.get('coachId');

    if (!coachId) {
      return NextResponse.json({ error: 'coachId required' }, { status: 400 });
    }

    // Get coach's organizations (primary + all memberships)
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

    // Get all organizations where coach is a member
    const memberships = await prisma.membership.findMany({
      where: {
        userId: coachId,
        status: 'accepted',
      },
      select: { orgId: true },
    });

    const orgIds = memberships.map(m => m.orgId);
    if (coach.organizationId && !orgIds.includes(coach.organizationId)) {
      orgIds.push(coach.organizationId);
    }

    // Get eligible players:
    // 1. Players with direct coach-player relationships
    const directPlayerRelationships = await prisma.coachPlayerRelationship.findMany({
      where: {
        coachId,
        status: 'active',
      },
      select: { playerId: true },
    });

    const directPlayerIds = directPlayerRelationships.map(r => r.playerId);

    // 2. Players in same organizations as coach
    let organizationPlayerIds: string[] = [];
    if (orgIds.length > 0) {
      const orgPlayers = await prisma.player.findMany({
        where: {
          organizationId: { in: orgIds },
        },
        select: { userId: true },
      });
      organizationPlayerIds = orgPlayers.map(p => p.userId);
    }

    // Combine and deduplicate player IDs
    const allPlayerIds = Array.from(new Set([...directPlayerIds, ...organizationPlayerIds]));

    // Fetch detailed player information
    const players = await prisma.player.findMany({
      where: {
        userId: { in: allPlayerIds },
      },
      select: {
        userId: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            photo: true,
            email: true,
            phone: true,
          },
        },
        organizationId: true,
      },
      orderBy: {
        user: {
          firstName: 'asc',
        },
      },
    });

    // Add relationship status for each player
    const enrichedPlayers = players.map(player => {
      const isDirect = directPlayerIds.includes(player.userId);
      return {
        userId: player.userId,
        firstName: player.user.firstName,
        lastName: player.user.lastName,
        photo: player.user.photo,
        email: player.user.email,
        phone: player.user.phone,
        organizationId: player.organizationId,
        relationshipType: isDirect ? 'direct' : 'organization', // 'direct' if coached by this coach, 'organization' if in same org
      };
    });

    return NextResponse.json({
      players: enrichedPlayers,
      count: enrichedPlayers.length,
      totalCoached: directPlayerIds.length,
      fromOrganizations: organizationPlayerIds.length,
    });
  } catch (error) {
    console.error('Error fetching eligible players:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
