import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/referees/[refereeId]/auto-follow-contacts
 * Automatically make a referee follow:
 * 1. All players they have refereed matches for
 * 2. All players they've been ball crew for
 * 3. The organizations they belong to (if they're also staff)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ refereeId: string }> }
) {
  try {
    const { refereeId } = await params;

    // 1. Get all matches where this referee is the referee
    const matches = await prisma.match.findMany({
      where: {
        refereeId,
      },
      include: {
        playerA: {
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
        playerB: {
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
    const followedPlayerIds = new Set<string>();

    // Make referee follow both players from each match
    for (const match of matches) {
      // Follow player A
      if (match.playerA && !followedPlayerIds.has(match.playerA.userId)) {
        try {
          const existing = await prisma.userFollower.findUnique({
            where: {
              followerId_followingId: {
                followerId: refereeId,
                followingId: match.playerA.userId,
              },
            },
          });

          if (!existing) {
            await prisma.userFollower.create({
              data: {
                followerId: refereeId,
                followingId: match.playerA.userId,
              },
            });
            followedPlayers++;
            followedPlayerIds.add(match.playerA.userId);
          }
        } catch (error) {
          // Silently skip failed follows
        }
      }

      // Follow player B
      if (match.playerB && !followedPlayerIds.has(match.playerB.userId)) {
        try {
          const existing = await prisma.userFollower.findUnique({
            where: {
              followerId_followingId: {
                followerId: refereeId,
                followingId: match.playerB.userId,
              },
            },
          });

          if (!existing) {
            await prisma.userFollower.create({
              data: {
                followerId: refereeId,
                followingId: match.playerB.userId,
              },
            });
            followedPlayers++;
            followedPlayerIds.add(match.playerB.userId);
          }
        } catch (error) {
          // Silently skip failed follows
        }
      }
    }

    // 2. Get all ball crew matches where this referee is assigned
    const ballCrewMatches = await prisma.matchBallCrew.findMany({
      where: {
        refereeId,
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

    let followedBallCrewPlayers = 0;

    // Make referee follow ball crew players
    for (const ballCrew of ballCrewMatches) {
      if (ballCrew.player && !followedPlayerIds.has(ballCrew.player.userId)) {
        try {
          const existing = await prisma.userFollower.findUnique({
            where: {
              followerId_followingId: {
                followerId: refereeId,
                followingId: ballCrew.player.userId,
              },
            },
          });

          if (!existing) {
            await prisma.userFollower.create({
              data: {
                followerId: refereeId,
                followingId: ballCrew.player.userId,
              },
            });
            followedBallCrewPlayers++;
            followedPlayerIds.add(ballCrew.player.userId);
          }
        } catch (error) {
          // Silently skip failed follows
        }
      }
    }

    // 3. Check if referee is also a staff member with an organization
    const staffMember = await prisma.staff.findUnique({
      where: { userId: refereeId },
      select: {
        organizationId: true,
      },
    });

    let followedOrgs = 0;
    if (staffMember?.organizationId) {
      // Get the organization
      const org = await prisma.organization.findUnique({
        where: { id: staffMember.organizationId },
        select: { id: true, name: true, createdBy: true },
      });

      if (org && org.createdBy) {
        // If org has a creator (user), make referee follow it
        try {
          const existing = await prisma.userFollower.findUnique({
            where: {
              followerId_followingId: {
                followerId: refereeId,
                followingId: org.createdBy,
              },
            },
          });

          if (!existing) {
            await prisma.userFollower.create({
              data: {
                followerId: refereeId,
                followingId: org.createdBy,
              },
            });
            followedOrgs = 1;
          }
        } catch (error) {
          // Silently skip
        }
      }
    }

    // Get updated follow count
    const totalFollows = await prisma.userFollower.count({
      where: { followerId: refereeId },
    });

    return NextResponse.json({
      success: true,
      refereeId,
      followedPlayers,
      followedBallCrewPlayers,
      followedOrgs,
      totalFollows,
      message: `Referee now follows ${totalFollows} users (${followedPlayers} players from matches, ${followedBallCrewPlayers} from ball crew, ${followedOrgs} orgs)`,
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
 * GET /api/referees/[refereeId]/auto-follow-contacts
 * Check current follow status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ refereeId: string }> }
) {
  try {
    const { refereeId } = await params;

    // Get all users the referee follows
    const follows = await prisma.userFollower.findMany({
      where: { followerId: refereeId },
    });

    // Get user details for followed accounts
    const followingUserIds = follows.map((f: typeof follows[number]) => f.followingId);
    let followingUsers: any[] = [];
    
    if (followingUserIds.length > 0) {
      followingUsers = await prisma.user.findMany({
        where: {
          id: { in: followingUserIds },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });
    }

    // Get all matches the referee has officiated
    const matchesRefereed = await prisma.match.findMany({
      where: { refereeId },
    });

    // Get all ball crew matches
    const ballCrewMatches = await prisma.matchBallCrew.findMany({
      where: { refereeId },
      select: {
        id: true,
        matchId: true,
        playerId: true,
      },
    });

    return NextResponse.json({
      refereeId,
      totalFollows: follows.length,
      follows: followingUsers.map((user) => ({
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      })),
      matchesRefereed: matchesRefereed.length,
      ballCrewMatches: ballCrewMatches.length,
      summary: {
        totalFollows: follows.length,
        totalMatches: matchesRefereed.length,
        ballCrewAssignments: ballCrewMatches.length,
      },
    });
  } catch (error) {
    console.error('Error fetching follow status:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch follow status',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
