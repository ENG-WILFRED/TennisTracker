import { PrismaClient } from '../../src/generated/prisma/index.js';

const prisma = new PrismaClient();

export async function seedCourts(organizations: any[]) {
  console.log('🏟️ Seeding courts...\n');

  const courtsData = [
    // ==================== CENTRAL TENNIS CLUB COURTS ====================
    // Location: Downtown Manhattan (123 Main Street, New York)
    {
      organizationId: organizations[0].id,
      name: 'Downtown Clay Court A',
      courtNumber: 1,
      surface: 'Clay',
      indoorOutdoor: 'outdoor',
      lights: true,
      status: 'available',
    },
    {
      organizationId: organizations[0].id,
      name: 'Downtown Clay Court B',
      courtNumber: 2,
      surface: 'Clay',
      indoorOutdoor: 'outdoor',
      lights: true,
      status: 'available',
    },
    {
      organizationId: organizations[0].id,
      name: 'Downtown Hard Court A',
      courtNumber: 3,
      surface: 'Hard',
      indoorOutdoor: 'outdoor',
      lights: true,
      status: 'available',
    },
    {
      organizationId: organizations[0].id,
      name: 'Downtown Hard Court B',
      courtNumber: 4,
      surface: 'Hard',
      indoorOutdoor: 'indoor',
      lights: true,
      status: 'available',
    },
    {
      organizationId: organizations[0].id,
      name: 'Downtown Grass Court',
      courtNumber: 5,
      surface: 'Grass',
      indoorOutdoor: 'outdoor',
      lights: false,
      status: 'available',
    },
    {
      organizationId: organizations[0].id,
      name: 'Downtown Indoor Court',
      courtNumber: 6,
      surface: 'Hard',
      indoorOutdoor: 'indoor',
      lights: true,
      status: 'available',
    },

    // ==================== ELITE SPORTS ACADEMY COURTS ====================
    // Location: West Los Angeles (456 Academy Lane, Los Angeles)
    {
      organizationId: organizations[1].id,
      name: 'Elite Pro Court 1',
      courtNumber: 1,
      surface: 'Hard',
      indoorOutdoor: 'indoor',
      lights: true,
      status: 'available',
    },
    {
      organizationId: organizations[1].id,
      name: 'Elite Pro Court 2',
      courtNumber: 2,
      surface: 'Hard',
      indoorOutdoor: 'indoor',
      lights: true,
      status: 'available',
    },
    {
      organizationId: organizations[1].id,
      name: 'Elite Pro Court 3',
      courtNumber: 3,
      surface: 'Hard',
      indoorOutdoor: 'indoor',
      lights: true,
      status: 'available',
    },
    {
      organizationId: organizations[1].id,
      name: 'Elite Training Clay Court',
      courtNumber: 4,
      surface: 'Clay',
      indoorOutdoor: 'outdoor',
      lights: true,
      status: 'available',
    },
    {
      organizationId: organizations[1].id,
      name: 'Elite Grass Court',
      courtNumber: 5,
      surface: 'Grass',
      indoorOutdoor: 'outdoor',
      lights: true,
      status: 'available',
    },
    {
      organizationId: organizations[1].id,
      name: 'Elite Junior Training Court',
      courtNumber: 6,
      surface: 'Hard',
      indoorOutdoor: 'outdoor',
      lights: true,
      status: 'available',
    },

    // ==================== COMMUNITY TENNIS COURTS ====================
    // Location: Central Park, Chicago (789 Park Avenue, Chicago)
    {
      organizationId: organizations[2].id,
      name: 'Central Park Court 1',
      courtNumber: 1,
      surface: 'Hard',
      indoorOutdoor: 'outdoor',
      lights: false,
      status: 'available',
    },
    {
      organizationId: organizations[2].id,
      name: 'Central Park Court 2',
      courtNumber: 2,
      surface: 'Hard',
      indoorOutdoor: 'outdoor',
      lights: false,
      status: 'available',
    },
    {
      organizationId: organizations[2].id,
      name: 'Central Park Clay Court 1',
      courtNumber: 3,
      surface: 'Clay',
      indoorOutdoor: 'outdoor',
      lights: true,
      status: 'available',
    },
    {
      organizationId: organizations[2].id,
      name: 'Central Park Clay Court 2',
      courtNumber: 4,
      surface: 'Clay',
      indoorOutdoor: 'outdoor',
      lights: true,
      status: 'available',
    },
    {
      organizationId: organizations[2].id,
      name: 'Central Park Grass Court',
      courtNumber: 5,
      surface: 'Grass',
      indoorOutdoor: 'outdoor',
      lights: false,
      status: 'available',
    },
    {
      organizationId: organizations[2].id,
      name: 'Central Park Indoor Court',
      courtNumber: 6,
      surface: 'Hard',
      indoorOutdoor: 'indoor',
      lights: true,
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
