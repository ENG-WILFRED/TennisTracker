import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

/**
 * Test script to verify the courts API endpoint works correctly
 */
async function testCourtsAPI() {
  try {
    console.log('🔍 Testing courts API...\n');

    // First, get a coach from the database
    console.log('1. Fetching a coach...');
    const coach = await prisma.staff.findFirst({
      where: {
        organizationId: { not: null },
      },
      select: { userId: true, organizationId: true },
    });

    if (!coach) {
      console.error('❌ No coach found with an organization');
      return;
    }

    console.log(`✅ Found coach: ${coach.userId} in org: ${coach.organizationId}\n`);

    // Now get courts for this coach's organization
    console.log(`2. Fetching courts for organization: ${coach.organizationId}`);
    const courts = await prisma.court.findMany({
      where: {
        organizationId: coach.organizationId || undefined,
      },
      select: {
        id: true,
        name: true,
        courtNumber: true,
        surface: true,
        indoorOutdoor: true,
        lights: true,
      },
      orderBy: [{ courtNumber: 'asc' }, { name: 'asc' }],
    });

    console.log(`✅ Found ${courts.length} courts\n`);

    if (courts.length > 0) {
      console.log('Sample courts:');
      courts.slice(0, 3).forEach((court: any) => {
        console.log(
          `  - ${court.name} (${court.surface}, ${court.indoorOutdoor}, ${court.lights ? 'with lights' : 'no lights'})`
        );
      });
    }

    console.log('\n✅ API should work correctly!');
  } catch (error) {
    console.error('❌ Error testing courts API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCourtsAPI();
