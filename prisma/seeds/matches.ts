import { PrismaClient } from '../../src/generated/prisma/index.js';

const prisma = new PrismaClient();

export async function seedMatches(users: any[], referees: any[]) {
  console.log('🎾 Seeding matches...\n');

  // Get players for match creation
  const players = users.filter((u) => u.player);
  const refereeUsers = referees;

  if (players.length < 2) {
    console.log('  ⚠ Not enough players to create matches');
    return [];
  }

  const matchesData = [
    {
      playerAEmail: 'marcus.johnson@example.com',
      playerBEmail: 'anna.martinez@example.com',
      winnerEmail: 'marcus.johnson@example.com',
      refereeEmail: 'john.referee@example.com',
      score: '6-4, 6-3',
      round: 1,
    },
    {
      playerAEmail: 'sophia.chen@example.com',
      playerBEmail: 'david.kim@example.com',
      winnerEmail: 'david.kim@example.com',
      refereeEmail: 'john.referee@example.com',
      score: '7-5, 6-4',
      round: 1,
    },
    {
      playerAEmail: 'lucas.santos@example.com',
      playerBEmail: 'james.wilson@example.com',
      winnerEmail: 'lucas.santos@example.com',
      refereeEmail: 'john.referee@example.com',
      score: '6-2, 6-1',
      round: 2,
    },
    {
      playerAEmail: 'emma.turner@example.com',
      playerBEmail: 'anna.martinez@example.com',
      winnerEmail: 'anna.martinez@example.com',
      refereeEmail: null,
      score: '4-6, 6-3, 6-2',
      round: 1,
    },
  ];

  const createdMatches = [];

  for (const matchData of matchesData) {
    try {
      const playerA = users.find((u) => u.email === matchData.playerAEmail);
      const playerB = users.find((u) => u.email === matchData.playerBEmail);
      const winner = matchData.winnerEmail ? users.find((u) => u.email === matchData.winnerEmail) : null;
      const referee = matchData.refereeEmail ? users.find((u) => u.email === matchData.refereeEmail) : null;

      if (!playerA || !playerB) {
        console.log(`  ⚠ Skipping match: ${matchData.playerAEmail} vs ${matchData.playerBEmail} - missing players`);
        continue;
      }

      const match = await prisma.match.create({
        data: {
          round: matchData.round,
          playerAId: playerA.id,
          playerBId: playerB.id,
          winnerId: winner ? winner.id : null,
          refereeId: referee ? referee.id : null,
          score: matchData.score,
        },
      });

      // Update player match statistics
      if (winner) {
        await prisma.player.update({
          where: { userId: winner.id },
          data: {
            matchesPlayed: { increment: 1 },
            matchesWon: { increment: 1 },
          },
        });

        const loser = playerA.id === winner.id ? playerB : playerA;
        await prisma.player.update({
          where: { userId: loser.id },
          data: {
            matchesPlayed: { increment: 1 },
            matchesLost: { increment: 1 },
          },
        });
      }

      // Update referee stats
      if (referee && referee.referee) {
        await prisma.referee.update({
          where: { userId: referee.id },
          data: {
            matchesRefereed: { increment: 1 },
          },
        });
      }

      createdMatches.push(match);
      console.log(
        `  ✓ ${matchData.playerAEmail} vs ${matchData.playerBEmail} (Winner: ${matchData.winnerEmail || 'TBD'})`
      );
    } catch (error) {
      console.error(
        `  ✗ Error creating match ${matchData.playerAEmail} vs ${matchData.playerBEmail}:`,
        error
      );
    }
  }

  console.log('');
  return createdMatches;
}
