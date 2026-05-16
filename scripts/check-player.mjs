import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  const playerId = process.argv[2];
  if (!playerId) {
    console.error('Usage: node scripts/check-player.mjs <playerId>');
    process.exit(2);
  }

  try {
    const player = await prisma.player.findUnique({ where: { userId: playerId } });
    console.log('PLAYER:', player ? JSON.stringify(player, null, 2) : 'NOT_FOUND');

    const relationships = await prisma.coachPlayerRelationship.findMany({
      where: { playerId },
      include: { coach: { include: { user: true } } },
    });
    console.log('RELATIONSHIPS_COUNT:', relationships.length);
    console.log('RELATIONSHIPS:', JSON.stringify(relationships, null, 2));
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
