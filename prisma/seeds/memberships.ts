import { PrismaClient } from '../../src/generated/prisma/index.js';

const prisma = new PrismaClient();

export async function seedMemberships(organizations: any[], users: any[]) {
  console.log('💳 Seeding membership tiers and members...\n');

  // Create membership tiers for each organization
  const tiersData = [
    {
      organizationId: organizations[0].id, // Central Tennis Club
      name: 'Basic',
      description: 'Access to public courts during off-peak hours',
      monthlyPrice: 29.99,
      courtHoursPerMonth: 8,
      maxConcurrentBookings: 2,
      discountPercentage: 0,
    },
    {
      organizationId: organizations[0].id, // Central Tennis Club
      name: 'Premium',
      description: 'Full court access with exclusive hours',
      monthlyPrice: 79.99,
      courtHoursPerMonth: 40,
      maxConcurrentBookings: 5,
      discountPercentage: 10,
    },
    {
      organizationId: organizations[0].id, // Central Tennis Club
      name: 'Elite',
      description: 'VIP access including coaching sessions',
      monthlyPrice: 199.99,
      courtHoursPerMonth: 120,
      maxConcurrentBookings: 10,
      discountPercentage: 20,
    },

    {
      organizationId: organizations[1].id, // Elite Sports Academy
      name: 'Academy',
      description: 'Professional training program',
      monthlyPrice: 299.99,
      courtHoursPerMonth: 60,
      maxConcurrentBookings: 8,
      discountPercentage: 15,
    },

    {
      organizationId: organizations[2].id, // Community Courts
      name: 'Member',
      description: 'Basic community membership',
      monthlyPrice: 19.99,
      courtHoursPerMonth: 10,
      maxConcurrentBookings: 3,
      discountPercentage: 0,
    },
  ];

  const createdTiers = [];

  console.log('📋 Creating membership tiers...');
  for (const tierData of tiersData) {
    try {
      const tier = await prisma.membershipTier.upsert({
        where: { name: tierData.name },
        update: tierData,
        create: {
          ...tierData,
          benefitsJson: JSON.stringify({
            courtAccess: true,
            peakHourAccess: tierData.name !== 'Basic',
            coachingDiscount: tierData.name === 'Elite' || tierData.name === 'Academy',
            priority: tierData.name === 'Elite',
          }),
        },
      });
      createdTiers.push(tier);
      console.log(`  ✓ ${tierData.name} tier (${tierData.monthlyPrice}/month)`);
    } catch (error) {
      console.error(`  ✗ Error creating tier ${tierData.name}:`, error);
    }
  }

  console.log('\n👥 Creating club members...');

  // Map users to memberships (players belong to multiple organizations)
  const membershipsData = [
    // Central Tennis Club members
    {
      playerEmail: 'sophia.chen@example.com',
      organizationId: organizations[0].id,
      tierName: 'Premium',
      role: 'member',
    },
    {
      playerEmail: 'david.kim@example.com',
      organizationId: organizations[0].id,
      tierName: 'Elite',
      role: 'member',
    },
    {
      playerEmail: 'marcus.johnson@example.com',
      organizationId: organizations[0].id,
      tierName: 'Basic',
      role: 'member',
    },
    {
      playerEmail: 'anna.martinez@example.com',
      organizationId: organizations[0].id,
      tierName: 'Basic',
      role: 'member',
    },
    {
      playerEmail: 'james.wilson@example.com',
      organizationId: organizations[0].id,
      tierName: 'Premium',
      role: 'member',
    },

    // Elite Sports Academy members
    {
      playerEmail: 'lucas.santos@example.com',
      organizationId: organizations[1].id,
      tierName: 'Academy',
      role: 'member',
    },
    {
      playerEmail: 'sophia.chen@example.com',
      organizationId: organizations[1].id,
      tierName: 'Academy',
      role: 'member',
    },
    {
      playerEmail: 'david.kim@example.com',
      organizationId: organizations[1].id,
      tierName: 'Academy',
      role: 'member',
    },
    {
      playerEmail: 'marcus.johnson@example.com',
      organizationId: organizations[1].id,
      tierName: 'Academy',
      role: 'member',
    },

    // Community Courts members
    {
      playerEmail: 'emma.turner@example.com',
      organizationId: organizations[2].id,
      tierName: 'Member',
      role: 'member',
    },
    {
      playerEmail: 'james.wilson@example.com',
      organizationId: organizations[2].id,
      tierName: 'Member',
      role: 'member',
    },
    {
      playerEmail: 'anna.martinez@example.com',
      organizationId: organizations[2].id,
      tierName: 'Member',
      role: 'member',
    },
    {
      playerEmail: 'lucas.santos@example.com',
      organizationId: organizations[2].id,
      tierName: 'Member',
      role: 'member',
    },
    {
      playerEmail: 'david.kim@example.com',
      organizationId: organizations[2].id,
      tierName: 'Member',
      role: 'member',
    },
  ];

  const createdMembers = [];

  for (const membershipData of membershipsData) {
    try {
      const user = users.find((u) => u.email === membershipData.playerEmail);
      const tier = createdTiers.find(
        (t) => t.name === membershipData.tierName && t.organizationId === membershipData.organizationId
      );

      if (!user || !tier) {
        console.log(`  ⚠ Skipping ${membershipData.playerEmail} - missing user or tier`);
        continue;
      }

      // Check if user has a player record (coaches/staff don't have player records)
      const playerRecord = await prisma.player.findUnique({
        where: { userId: user.id },
      });

      if (!playerRecord) {
        console.log(`  ⚠ Skipping ${membershipData.playerEmail} - not a player (is staff/coach)`);
        continue;
      }

      const member = await prisma.clubMember.upsert({
        where: {
          organizationId_playerId: {
            organizationId: membershipData.organizationId,
            playerId: user.id,
          },
        },
        update: {
          tierId: tier.id,
          role: membershipData.role,
          paymentStatus: 'active',
        },
        create: {
          organizationId: membershipData.organizationId,
          playerId: user.id,
          tierId: tier.id,
          role: membershipData.role,
          joinDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          autoRenew: true,
          paymentStatus: 'active',
          attendanceCount: Math.floor(Math.random() * 20) + 5,
          lastAttendance: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      });
      createdMembers.push(member);
      console.log(`  ✓ ${membershipData.playerEmail} - ${membershipData.tierName} at ${membershipData.organizationId.substring(0, 8)}`);
    } catch (error) {
      console.error(`  ✗ Error creating member ${membershipData.playerEmail}:`, error);
    }
  }

  console.log('');
  return { tiers: createdTiers, members: createdMembers };
}
