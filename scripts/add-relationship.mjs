import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  const playerId = process.argv[2];
  if (!playerId) {
    console.error('Usage: node scripts/add-relationship.mjs <playerId>');
    process.exit(2);
  }

  try {
    const coach = await prisma.staff.findFirst({ where: { role: { contains: 'Coach' } }, include: { user: true } });
    if (!coach) {
      console.error('No coach found to assign');
      process.exit(1);
    }

    const rel = await prisma.coachPlayerRelationship.upsert({
      where: { coachId_playerId: { coachId: coach.userId, playerId } },
      update: { status: 'active', sessionsCount: 3, lastSessionAt: new Date() },
      create: { coachId: coach.userId, playerId, status: 'active', sessionsCount: 3, lastSessionAt: new Date() },
    });

    console.log('Created relationship:', rel);
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
