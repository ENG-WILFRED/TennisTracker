import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function seedCoachStats() {
  console.log('🌱 Seeding coach stats and assigning organizations...');

  try {
    const coaches = await prisma.staff.findMany({ include: { user: true, players: true } });
    if (!coaches.length) {
      console.log('No coaches found');
      return;
    }

    const orgs = await prisma.organization.findMany();

    for (const coach of coaches) {
      // Assign an organization if missing
      if (!coach.organizationId && orgs.length > 0) {
        const randomOrg = orgs[Math.floor(Math.random() * orgs.length)];
        await prisma.staff.update({ where: { userId: coach.userId }, data: { organizationId: randomOrg.id } });
        console.log(`Assigned org ${randomOrg.name} to coach ${coach.user.firstName}`);
      }

      const playersCount = coach.players?.length ?? 0;

      // Upsert coach stats
      await prisma.coachStats.upsert({
        where: { coachId: coach.userId },
        update: {
          totalSessions: Math.max(10, Math.floor(Math.random() * 300)),
          completedSessions: Math.max(5, Math.floor(Math.random() * 200)),
          totalPlayers: Math.max(playersCount, Math.floor(Math.random() * 200)),
          activePlayers: playersCount,
          totalRevenue: Math.round((Math.random() * 20000) * 100) / 100,
          avgRating: Math.round((3 + Math.random() * 2) * 10) / 10,
          ratingCount: Math.floor(Math.random() * 200),
        },
        create: {
          coachId: coach.userId,
          totalSessions: Math.max(10, Math.floor(Math.random() * 300)),
          completedSessions: Math.max(5, Math.floor(Math.random() * 200)),
          totalPlayers: Math.max(playersCount, Math.floor(Math.random() * 200)),
          activePlayers: playersCount,
          totalRevenue: Math.round((Math.random() * 20000) * 100) / 100,
          avgRating: Math.round((3 + Math.random() * 2) * 10) / 10,
          ratingCount: Math.floor(Math.random() * 200),
        },
      });

      console.log(`Upserted stats for ${coach.user.firstName} ${coach.user.lastName}`);
    }

    console.log('✅ Coach stats seeding complete');
  } catch (err) {
    console.error('Error seeding coach stats', err);
  } finally {
    await prisma.$disconnect();
  }
}

seedCoachStats();
