import { PrismaClient } from '../../src/generated/prisma/index.js';

const prisma = new PrismaClient();

export async function seedStats() {
  console.log('📊 Seeding player statistics and rankings...');

  try {
    // Get all organizations
    const organizations = await prisma.organization.findMany({ take: 5 });
    if (organizations.length === 0) {
      console.log('⚠️  No organizations found. Skipping stats seed.');
      return;
    }

    // Get all club members
    const members = await prisma.clubMember.findMany({
      include: {
        player: true,
        organization: true,
      },
      take: 20,
    });

    if (members.length === 0) {
      console.log('⚠️  No club members found. Skipping stats seed.');
      return;
    }

    const currentYear = new Date().getFullYear();
    const currentWeek = getISOWeek(new Date());

    console.log(`📈 Creating rankings for ${members.length} players...`);

    // Create ranking data for each member
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      if (!member.player) continue;

      // Random but realistic match statistics
      const matchesPlayed = 5 + Math.floor(Math.random() * 30);
      const matchesWon = Math.floor(matchesPlayed * (0.4 + Math.random() * 0.4));
      const matchesLost = matchesPlayed - matchesWon;
      const winRate = matchesPlayed > 0 ? (matchesWon / matchesPlayed) * 100 : 0;
      const ratingPoints = 800 + Math.floor(Math.random() * 600);

      // Create or update player ranking
      try {
        await prisma.playerRanking.upsert({
          where: {
            organizationId_memberId_weekNumber_year: {
              organizationId: member.organizationId,
              memberId: member.id,
              weekNumber: currentWeek,
              year: currentYear,
            },
          },
          update: {
            currentRank: i + 1,
            previousRank: i + Math.floor(Math.random() * 3),
            ratingPoints,
            matchesWon,
            matchesLost,
            winRate: parseFloat(winRate.toFixed(2)),
          },
          create: {
            organizationId: member.organizationId,
            memberId: member.id,
            weekNumber: currentWeek,
            year: currentYear,
            currentRank: i + 1,
            previousRank: i + Math.floor(Math.random() * 3),
            ratingPoints,
            matchesWon,
            matchesLost,
            winRate: parseFloat(winRate.toFixed(2)),
          },
        });

        // Update player's base statistics
        await prisma.player.update({
          where: { userId: member.playerId },
          data: {
            matchesPlayed,
            matchesWon,
            matchesLost,
          },
        });
      } catch (error) {
        console.error(`Failed to create ranking for ${member.id}:`, error);
      }
    }

    // Create historical rankings (previous week)
    console.log(`📊 Creating historical rankings...`);
    const previousWeek = currentWeek === 1 ? 52 : currentWeek - 1;
    const previousYear = currentWeek === 1 ? currentYear - 1 : currentYear;

    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      if (!member.player) continue;

      const matchesPlayed = 5 + Math.floor(Math.random() * 25);
      const matchesWon = Math.floor(matchesPlayed * (0.35 + Math.random() * 0.4));
      const matchesLost = matchesPlayed - matchesWon;
      const winRate = matchesPlayed > 0 ? (matchesWon / matchesPlayed) * 100 : 0;
      const ratingPoints = 750 + Math.floor(Math.random() * 500);

      try {
        await prisma.playerRanking.upsert({
          where: {
            organizationId_memberId_weekNumber_year: {
              organizationId: member.organizationId,
              memberId: member.id,
              weekNumber: previousWeek,
              year: previousYear,
            },
          },
          update: {
            currentRank: i + Math.floor(Math.random() * 5),
            ratingPoints,
            matchesWon,
            matchesLost,
            winRate: parseFloat(winRate.toFixed(2)),
          },
          create: {
            organizationId: member.organizationId,
            memberId: member.id,
            weekNumber: previousWeek,
            year: previousYear,
            currentRank: i + Math.floor(Math.random() * 5),
            previousRank: i + Math.floor(Math.random() * 5),
            ratingPoints,
            matchesWon,
            matchesLost,
            winRate: parseFloat(winRate.toFixed(2)),
          },
        });
      } catch (error) {
        console.error(`Failed to create historical ranking for ${member.id}:`, error);
      }
    }

    console.log('✅ Player statistics and rankings seeded successfully!');
    console.log(`   - Players ranked: ${Math.min(members.length, 20)}`);
    console.log(`   - Current week rankings: ${currentWeek}`);
    console.log(`   - Historical rankings created for week ${previousWeek}`);
  } catch (error) {
    console.error('❌ Error seeding statistics:', error);
    throw error;
  }
}

// Helper function to get ISO week number
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
