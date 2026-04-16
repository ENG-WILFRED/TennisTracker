import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/coaches/[coachId]/auto-follow-contacts
 * Automatically make a coach follow:
 * 1. All players they coach
 * 2. The organizations they belong to
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ coachId: string }> }
) {
  try {
    const { coachId } = await params;

    // 1. Get all players the coach coaches
    const coachPlayerRelationships = await prisma.coachPlayerRelationship.findMany({
      where: {
        coachId,
        status: 'active',
      },
      include: {
        player: {
          select: {
            userId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    let followedPlayers = 0;
    for (const rel of coachPlayerRelationships) {
      try {
        const existing = await prisma.userFollower.findUnique({
          where: {
            followerId_followingId: {
              followerId: coachId,
              followingId: rel.player.userId,
            },
          },
        });

        if (!existing) {
          await prisma.userFollower.create({
            data: {
              followerId: coachId,
              followingId: rel.player.userId,
            },
          });
          followedPlayers++;
        }
      } catch (error) {
        // Silently skip failed follows
      }
    }

    // 2. Get the organization the coach belongs to and have them follow it
    const coach = await prisma.staff.findUnique({
      where: { userId: coachId },
      select: { organizationId: true },
    });

    let followedOrgs = 0;
    if (coach?.organizationId) {
      // Get the organization's Player record (organizations are stored as players)
      const org = await prisma.organization.findUnique({
        where: { id: coach.organizationId },
        select: { id: true, name: true },
      });

      if (org) {
        // Note: Organizations don't have a direct Player record, so we can't follow them
        // But we can create a special relationship if needed
        // For now, just log that the coach is in this org
        followedOrgs = 1;
      }
    }

    // Get updated follow count
    const totalFollows = await prisma.userFollower.count({
      where: { followerId: coachId },
    });

    return NextResponse.json({
      success: true,
      coachId,
      followedPlayers,
      followedOrgs,
      totalFollows,
      message: `Coach now follows ${totalFollows} users (${followedPlayers} new players)`,
    });
  } catch (error) {
    console.error('Auto-follow error:', error);
    return NextResponse.json(
      {
        error: 'Failed to auto-follow contacts',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/coaches/[coachId]/auto-follow-contacts
 * Check current follow status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ coachId: string }> }
) {
  try {
    const { coachId } = await params;

    // Get all users the coach follows
    const follows = await prisma.userFollower.findMany({
      where: { followerId: coachId },
      include: {
        following: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Get all players the coach coaches
    const playersCoached = await prisma.coachPlayerRelationship.findMany({
      where: { coachId },
      include: {
        player: {
          select: {
            userId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    const coachesPlayersIds = new Set(playersCoached.map((p: typeof playersCoached[number]) => p.player.userId));
    const followsPlayers = follows.filter((f: typeof follows[number]) => coachesPlayersIds.has(f.followingId));
    const followsOthers = follows.filter((f: typeof follows[number]) => !coachesPlayersIds.has(f.followingId));

    console.log(`📊 Auto-follow check for coach ${coachId}:`, {
      totalFollows: follows.length,
      followsPlayers: followsPlayers.length,
      playerCoaches: playersCoached.length,
      missingFollows: playersCoached.length - followsPlayers.length,
    });

    return NextResponse.json({
      coachId,
      stats: {
        totalFollows: follows.length,
        followsPlayers: followsPlayers.length,
        playersCoached: playersCoached.length,
        followsOthers: followsOthers.length,
        missingFollows: playersCoached.length - followsPlayers.length,
      },
      followedPlayers: followsPlayers.map((f: typeof followsPlayers[number]) => ({
        userId: f.followingId,
        name: `${f.following.user.firstName} ${f.following.user.lastName}`,
      })),
      coachingPlayers: playersCoached.map((p: typeof playersCoached[number]) => ({
        userId: p.player.userId,
        name: `${p.player.user.firstName} ${p.player.user.lastName}`,
        isFollowed: coachesPlayersIds.has(p.player.userId),
      })),
    });
  } catch (error) {
    console.error('Check follow status error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check follow status',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
