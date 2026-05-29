import { PrismaClient } from '../../src/generated/prisma/index.js';

const prisma = new PrismaClient();

export async function seedCourts(organizations: any[]) {
  console.log('🏟️ Seeding courts...\n');

  const surfaceOptions = ['Hard', 'Clay', 'Grass', 'Synthetic'];
  const courtsData = organizations.flatMap((org, orgIndex) => {
    const isIndoor = orgIndex % 2 === 1;
    return [
      {
        organizationId: org.id,
        name: `${org.name} Main Court`,
        courtNumber: 1,
        surface: surfaceOptions[orgIndex % surfaceOptions.length],
        indoorOutdoor: isIndoor ? 'indoor' : 'outdoor',
        lights: true,
        status: 'available',
      },
      {
        organizationId: org.id,
        name: `${org.name} Practice Court`,
        courtNumber: 2,
        surface: surfaceOptions[(orgIndex + 1) % surfaceOptions.length],
        indoorOutdoor: 'outdoor',
        lights: orgIndex % 2 === 0,
        status: 'available',
      },
    ];
  });

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
