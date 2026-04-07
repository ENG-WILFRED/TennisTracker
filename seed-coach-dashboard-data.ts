import prisma from './src/lib/prisma';

async function main() {
  console.log('🌱 Seeding coach dashboard data...');

  try {
    // Get all coaches
    const coaches = await prisma.staff.findMany({
      where: { role: { contains: 'Coach' } },
      select: { userId: true, organizationId: true },
    });

    if (coaches.length === 0) {
      console.log('❌ No coaches found. Skipping dashboard data seeding.');
      return;
    }

    console.log(`✓ Found ${coaches.length} coaches`);

    // Get all players
    const players = await prisma.player.findMany({
      select: { userId: true },
      take: 50,
    });

    if (players.length === 0) {
      console.log('❌ No players found. Skipping dashboard data seeding.');
      return;
    }

    console.log(`✓ Found ${players.length} players`);

    let coachPlayerRelationshipsCreated = 0;
    let coachSessionsCreated = 0;
    let bookingsCreated = 0;
    let walletTransactionsCreated = 0;
    let reviewsCreated = 0;
    let statsCreated = 0;

    // For each coach, create player relationships, sessions, and bookings
    for (const coach of coaches) {
      console.log(`\n📅 Seeding dashboard data for coach ${coach.userId}...`);

      // Create coach wallet if doesn't exist
      const wallet = await prisma.coachWallet.upsert({
        where: { coachId: coach.userId },
        update: {},
        create: { coachId: coach.userId, balance: 0, totalEarned: 0, totalWithdrawn: 0, pendingBalance: 0 },
      });

      // Create coach stats if doesn't exist
      const stats = await prisma.coachStats.upsert({
        where: { coachId: coach.userId },
        update: {},
        create: { coachId: coach.userId },
      });
      statsCreated++;

      // Create coach-player relationships (5-10 per coach)
      const playerCount = Math.floor(Math.random() * 6) + 5; // 5-10 players
      const selectedPlayers = players.sort(() => 0.5 - Math.random()).slice(0, playerCount);

      for (const player of selectedPlayers) {
        const relationship = await prisma.coachPlayerRelationship.upsert({
          where: { coachId_playerId: { coachId: coach.userId, playerId: player.userId } },
          update: { status: 'active' },
          create: {
            coachId: coach.userId,
            playerId: player.userId,
            status: 'active',
            joinedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Last 90 days
            sessionsCount: Math.floor(Math.random() * 20) + 1,
          },
        });
        coachPlayerRelationshipsCreated++;

        // Create 2-5 coaching sessions for each player relationship
        const sessionCount = Math.floor(Math.random() * 4) + 2;
        for (let i = 0; i < sessionCount; i++) {
          const daysAgo = Math.floor(Math.random() * 60) - 30; // Between past 30 and future 30 days
          const sessionDate = new Date();
          sessionDate.setDate(sessionDate.getDate() + daysAgo);
          sessionDate.setHours(Math.floor(Math.random() * 9) + 8, 0, 0, 0); // 8 AM - 5 PM

          const endTime = new Date(sessionDate);
          endTime.setHours(endTime.getHours() + 1);

          const sessionTypes = ['1-on-1', 'group'];
          const sessionType = sessionTypes[Math.floor(Math.random() * sessionTypes.length)];
          const price = [30, 45, 60, 75, 100, 120][Math.floor(Math.random() * 6)];
          const maxParticipants = sessionType === '1-on-1' ? 1 : Math.floor(Math.random() * 8) + 2;

          const session = await prisma.coachSession.create({
            data: {
              coachId: coach.userId,
              organizationId: coach.organizationId,
              playerId: sessionType === '1-on-1' ? player.userId : undefined,
              sessionType,
              title: `${sessionType} Session - ${player.userId.substring(0, 8)}`,
              description: `Coaching session for skill development`,
              startTime: sessionDate,
              endTime: endTime,
              timezone: 'UTC',
              maxParticipants,
              price,
              status: daysAgo < 0 ? 'completed' : 'scheduled',
            },
          });
          coachSessionsCreated++;

          // Create session bookings
          const bookingCount = sessionType === '1-on-1' ? 1 : Math.floor(Math.random() * maxParticipants) + 1;
          const bookingPlayers = [player, ...selectedPlayers.filter(p => p.userId !== player.userId)].slice(0, bookingCount);

          for (const bookingPlayer of bookingPlayers) {
            const booking = await prisma.sessionBooking.create({
              data: {
                sessionId: session.id,
                playerId: bookingPlayer.userId,
                status: daysAgo < 0 ? 'completed' : 'confirmed',
                attendanceStatus: daysAgo < 0 ? 'attended' : 'pending',
                feedbackRating: daysAgo < 0 ? Math.floor(Math.random() * 2) + 4 : 0, // 4-5 stars if completed
                feedbackText: daysAgo < 0 ? 'Great session! Learned a lot.' : undefined,
                completedAt: daysAgo < 0 ? new Date() : undefined,
              },
            });
            bookingsCreated++;

            // Create review for completed sessions
            if (daysAgo < 0) {
              const review = await prisma.coachSessionReview.create({
                data: {
                  coachId: coach.userId,
                  sessionId: session.id,
                  playerId: bookingPlayer.userId,
                  rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
                  comment: ['Excellent coaching!', 'Very helpful session', 'Improved my technique'][Math.floor(Math.random() * 3)],
                },
              });
              reviewsCreated++;
            }
          }

          // Add wallet transactions for completed sessions
          if (daysAgo < 0) {
            const transactionAmount = price * bookingCount;
            const transaction = await prisma.walletTransaction.create({
              data: {
                walletId: wallet.id,
                type: 'credit',
                amount: transactionAmount,
                description: `Payment for ${sessionType} session`,
                reference: session.id,
                balanceBefore: wallet.balance,
                balanceAfter: wallet.balance + transactionAmount,
                platformFee: transactionAmount * 0.1, // 10% fee
              },
            });
            walletTransactionsCreated++;

            // Update wallet balance
            await prisma.coachWallet.update({
              where: { coachId: coach.userId },
              data: {
                balance: { increment: transactionAmount },
                totalEarned: { increment: transactionAmount },
                pendingBalance: { increment: transactionAmount },
              },
            });
          }
        }
      }
    }

    console.log(`\n✅ Seeding completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`  • Coach-Player Relationships: ${coachPlayerRelationshipsCreated}`);
    console.log(`  • Coach Sessions: ${coachSessionsCreated}`);
    console.log(`  • Session Bookings: ${bookingsCreated}`);
    console.log(`  • Wallet Transactions: ${walletTransactionsCreated}`);
    console.log(`  • Coach Reviews: ${reviewsCreated}`);
    console.log(`  • Coach Stats Records: ${statsCreated}`);
  } catch (error) {
    console.error('❌ Error seeding dashboard data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
