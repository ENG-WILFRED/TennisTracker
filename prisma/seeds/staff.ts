import { PrismaClient } from '../../src/generated/prisma/index.js';

const prisma = new PrismaClient();

export async function seedStaffForAllOrgs() {
  console.log('👨‍💼 Seeding staff members...');

  try {
    // Get all organizations
    const organizations = await prisma.organization.findMany();

    if (organizations.length === 0) {
      console.log('⚠️  No organizations found. Skipping staff seed.');
      return;
    }

    // Get users with specific roles for seeding
    const coaches = await prisma.user.findMany({
      where: {
        staff: {
          isNot: null,
        },
      },
      take: 10,
    });

    const staffTemplates = [
      {
        name: 'Head Coach',
        role: 'Head Coach',
        expertise: 'advanced_coaching',
        coachingLevel: 'Professional',
        experience: 15,
        studentCount: 25,
      },
      {
        name: 'Assistant Coach',
        role: 'Assistant Coach',
        expertise: 'intermediate_coaching',
        coachingLevel: 'Intermediate',
        experience: 8,
        studentCount: 15,
      },
      {
        name: 'Junior Coach',
        role: 'Junior Coach',
        expertise: 'beginner_coaching',
        coachingLevel: 'Beginner',
        experience: 3,
        studentCount: 8,
      },
      {
        name: 'Court Manager',
        role: 'Court Manager',
        expertise: 'facility_management',
        coachingLevel: 'Manager',
        experience: 5,
        studentCount: 0,
      },
      {
        name: 'Event Coordinator',
        role: 'Event Coordinator',
        expertise: 'event_management',
        coachingLevel: 'Coordinator',
        experience: 4,
        studentCount: 0,
      },
      {
        name: 'Fitness Trainer',
        role: 'Fitness Trainer',
        expertise: 'fitness_training',
        coachingLevel: 'Professional',
        experience: 6,
        studentCount: 12,
      },
    ];

    let totalStaffCreated = 0;

    // For each organization, create staff members
    for (const org of organizations) {
      // Get players from the organization for staff assignment
      const orgMembers = await prisma.clubMember.findMany({
        where: { organizationId: org.id },
        include: { player: true },
        take: 10,
      });

      // Create 3-5 staff members per organization
      const staffCount = Math.min(staffTemplates.length, Math.floor(Math.random() * 3) + 3);

      for (let i = 0; i < staffCount; i++) {
        const template = staffTemplates[i % staffTemplates.length];

        // Get a random member to be the staff
        const staffMember = orgMembers[i % orgMembers.length];
        if (!staffMember?.player?.userId) continue;

        try {
          // Check if staff already exists
          const existingStaff = await prisma.staff.findUnique({
            where: { userId: staffMember.player.userId },
          });

          if (!existingStaff) {
            await prisma.staff.create({
              data: {
                userId: staffMember.player.userId,
                organizationId: org.id,
                role: template.role,
                expertise: template.expertise,
                coachingLevel: template.coachingLevel,
                yearsOfExperience: template.experience,
                studentCount: template.studentCount,
                isActive: Math.random() > 0.1, // 90% chance of being active
                isVerified: Math.random() > 0.3, // 70% chance of verification
              },
            });

            totalStaffCreated++;
            console.log(`  ✓ ${template.role} added to ${org.name}`);
          }
        } catch (err: any) {
          if (!err.message.includes('Unique constraint')) {
            console.log(`  ⚠️  Failed to create ${template.role}: ${err.message}`);
          }
        }
      }
    }

    console.log(`\n✓ Created ${totalStaffCreated} staff members across organizations`);
  } catch (error) {
    console.error('Error seeding staff:', error);
    throw error;
  }
}
