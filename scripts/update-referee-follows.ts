import prisma from '@/lib/prisma';

/**
 * Update all referees to follow:
 * 1. All players they have refereed
 * 2. All players in ball crew matches they've been assigned to
 * 3. Organizations they belong to (if they're also staff)
 */
async function updateAllRefereesFollows() {
  try {
    console.log('🏌️ Updating all referees to follow players and organizations...\n');

    // Get all referees
    const referees = await prisma.referee.findMany({
      select: {
        userId: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (referees.length === 0) {
      console.log('No referees found in the database.');
      return;
    }

    console.log(`Found ${referees.length} referees. Processing...\n`);

    for (const referee of referees) {
      const refereeId = referee.userId;
      const refereeName = `${referee.user.firstName} ${referee.user.lastName}`;

      console.log(`Processing: ${refereeName} (${referee.user.email})`);

      try {
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

        const totalFollows = await prisma.userFollower.count({
          where: { followerId: refereeId },
        });

        console.log(
          `  ✓ ${refereeName}: Now follows ${totalFollows} users (${followedPlayers} from matches, ${followedBallCrewPlayers} from ball crew, ${followedOrgs} orgs)`
        );
      } catch (error) {
        console.error(`  ✗ Error processing ${refereeName}:`, error instanceof Error ? error.message : error);
      }
    }

    console.log(`\n✅ All referees have been updated to follow their players and organizations!`);
  } catch (error) {
    console.error('Error updating referees:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateAllRefereesFollows();
