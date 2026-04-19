import prisma from "@/lib/prisma";

/**
 * Seeds 5 players to each tournament with paid and confirmed status
 */

export async function seedTournamentPlayers() {
  console.log("👥 Seeding tournament players...");

  try {
    // Get organization
    const org = await prisma.organization.findFirst();
    if (!org) throw new Error("No organization found");

    // Get or create players
    let players = await prisma.player.findMany({
      where: { organizationId: org.id },
      include: { user: true },
      take: 10,
    });

    console.log(`📊 Found ${players.length} existing players`);

    // If not enough players, create some
    if (players.length < 5) {
      console.log("➕ Creating additional players...");
      const playersToCreate = 5 - players.length;

      for (let i = 1; i <= playersToCreate; i++) {
        const username = `player_seed_${Date.now()}_${i}`;
        const user = await prisma.user.create({
          data: {
            username,
            email: `${username}@example.com`,
            phone: `+254${715000000 + i}`,
            passwordHash: "hashed_password",
            firstName: `Player`,
            lastName: `Seed ${i}`,
          },
        });

        const player = await prisma.player.create({
          data: {
            userId: user.id,
            organizationId: org.id,
          },
        });

        players.push({ ...player, user });
        console.log(`✅ Created player: ${user.firstName} ${user.lastName}`);
      }
    }

    // Get all tournaments
    const tournaments = await prisma.clubEvent.findMany({
      where: {
        eventType: "tournament",
        organizationId: org.id,
      },
    });

    console.log(`🏆 Found ${tournaments.length} tournaments`);

    if (tournaments.length === 0) {
      console.log("⚠️ No tournaments found, skipping player seeding");
      return;
    }

    // Ensure all players are club members
    for (const player of players) {
      const existingMember = await prisma.clubMember.findFirst({
        where: {
          organizationId: org.id,
          playerId: player.userId,
        },
      });

      if (!existingMember) {
        await prisma.clubMember.create({
          data: {
            organizationId: org.id,
            playerId: player.userId,
            paymentStatus: "active",
            role: "member",
          },
        });
        console.log(
          `✅ Added ${player.user?.firstName} ${player.user?.lastName} as club member`
        );
      }
    }

    // Register players to tournaments
    let registrationCount = 0;
    let paymentCount = 0;

    for (const tournament of tournaments) {
      // Get club members for this organization
      const members = await prisma.clubMember.findMany({
        where: { organizationId: org.id },
        take: 5,
      });

      for (let index = 0; index < members.length; index++) {
        const member = members[index];

        // Check if already registered
        const existingReg = await prisma.eventRegistration.findUnique({
          where: {
            eventId_memberId: {
              eventId: tournament.id,
              memberId: member.id,
            },
          },
        });

        if (!existingReg) {
          // Create registration
          await prisma.eventRegistration.create({
            data: {
              eventId: tournament.id,
              memberId: member.id,
              status: "confirmed",
              signupOrder: index + 1,
            },
          });
          registrationCount++;
          console.log(
            `✅ Registered player to tournament ${tournament.name}`
          );

          // Create payment record
          const player = await prisma.player.findUnique({
            where: { userId: member.playerId },
            include: { user: true },
          });

          if (player) {
            await prisma.paymentRecord.create({
              data: {
                userId: player.userId,
                eventId: tournament.id,
                bookingType: "tournament",
                amount: 500,
                currency: "KES",
                provider: "seed",
                providerStatus: "completed",
                metadata: JSON.stringify({
                  tournamentId: tournament.id,
                  playerName: `${player.user?.firstName} ${player.user?.lastName}`,
                }),
              },
            });
            paymentCount++;
            console.log(
              `💰 Marked payment as completed for ${player.user?.firstName}`
            );
          }
        }
      }
    }

    console.log(
      `✅ Tournament players seeded successfully! (${registrationCount} registrations, ${paymentCount} payments)`
    );
  } catch (err) {
    console.error("❌ Error seeding tournament players:", err);
    throw err;
  }
}
