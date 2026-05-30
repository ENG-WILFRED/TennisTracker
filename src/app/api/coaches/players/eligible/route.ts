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

    const memberships = await prisma.membership.findMany({
      where: {
        userId: coachId,
        status: 'accepted',
      },
      select: { orgId: true },
    });

    const orgIds = memberships.map(m => m.orgId);
    if (coach?.organizationId && !orgIds.includes(coach.organizationId)) {
      orgIds.push(coach.organizationId);
    }

    // Get eligible players:
    // 1. Players with direct coach-player relationships (active or pending)
    const coachRelationships = await prisma.coachPlayerRelationship.findMany({
      where: { coachId },
      select: { playerId: true, status: true },
    });

    const relationshipMap = coachRelationships.reduce<Record<string, 'active' | 'pending'>>((acc, rel) => {
      acc[rel.playerId] = rel.status === 'pending' ? 'pending' : 'active';
      return acc;
    }, {});

    const directPlayerIds = coachRelationships.map(r => r.playerId);

    // 2. Players in the coach's organizations
    const organizationPlayerIds: string[] = orgIds.length > 0
      ? (await prisma.player.findMany({
          where: {
            organizationId: { in: orgIds },
          },
          select: { userId: true },
        })).map(p => p.userId)
      : [];

    // Fetch all registered players for coaches to browse platform-wide
    const players = await prisma.player.findMany({
      select: {
        userId: true,
        organizationId: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            photo: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        user: {
          firstName: 'asc',
        },
      },
    });

    // Add relationship status for each player
    const enrichedPlayers = players.map(player => {
      const relationshipStatus = relationshipMap[player.userId];
      const relationshipType = relationshipStatus === 'active'
        ? 'direct'
        : relationshipStatus === 'pending'
          ? 'pending'
          : organizationPlayerIds.includes(player.userId)
            ? 'organization'
            : 'platform';

      return {
        userId: player.userId,
        firstName: player.user.firstName,
        lastName: player.user.lastName,
        photo: player.user.photo,
        email: player.user.email,
        phone: player.user.phone,
        organizationId: player.organizationId,
        relationshipType,
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
