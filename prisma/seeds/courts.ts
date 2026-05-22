import { PrismaClient } from '../../src/generated/prisma/index.js';

const prisma = new PrismaClient();

export async function seedCourts(organizations: any[]) {
  console.log('🏟️ Seeding courts...\n');

  const courtsData = [
    {
      organizationId: organizations[0].id,
      name: 'Central Tennis Club Main Court',
      courtNumber: 1,
      surface: 'Hard',
      indoorOutdoor: 'outdoor',
      lights: true,
      status: 'available',
    },
    {
      organizationId: organizations[1].id,
      name: 'Elite Sports Academy Main Court',
      courtNumber: 1,
      surface: 'Hard',
      indoorOutdoor: 'indoor',
      lights: true,
      status: 'available',
    },
    {
      organizationId: organizations[2].id,
      name: 'Community Tennis Court',
      courtNumber: 1,
      surface: 'Hard',
      indoorOutdoor: 'outdoor',
      lights: false,
      status: 'available',
    },
  ];

  const createdCourts = [];

  for (const courtData of courtsData) {
    try {
      const court = await prisma.court.upsert({
        where: {
          organizationId_courtNumber: {
            organizationId: courtData.organizationId,
            courtNumber: courtData.courtNumber,
          },
        },
        update: courtData,
        create: courtData,
      });
      createdCourts.push(court);
      console.log(`  ✓ ${courtData.name} at ${organizations.find((o) => o.id === courtData.organizationId)?.name}`);
    } catch (error) {
      console.error(`  ✗ Error creating court ${courtData.name}:`, error);
    }
  }

  console.log('');
  return createdCourts;
}
