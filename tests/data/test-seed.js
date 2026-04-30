import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function check() {
  try {
    const tournaments = await prisma.clubEvent.findMany({
      where: { eventType: 'tournament' },
    });

    console.log('\n✅ TOURNAMENTS SEEDED:');
    tournaments.forEach(t => {
      console.log(`  - ${t.name}`);
    });

    const matches = await prisma.tournamentMatch.findMany();
    console.log(`\n✅ TOURNAMENT MATCHES: ${matches.length} created`);

    const rankings = await prisma.playerRanking.findMany();
    console.log(`✅ PLAYER RANKINGS: ${rankings.length} records created`);

    const registrations = await prisma.eventRegistration.findMany();
    const tournamentRegs = registrations.filter(r => {
      return r.eventId; // All registrations should have eventId
    });
    console.log(`✅ TOURNAMENT REGISTRATIONS: ${tournamentRegs.length} total participants\n`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
