import { PrismaClient } from '../../src/generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'tennis123';

export async function seedOrganizations() {
  console.log('🏢 Seeding organizations with admin accounts...\n');

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  const organizationData = [
    {
      org: {
        name: 'Central Tennis Club',
        slug: 'central-tennis-club',
        description: 'Premier tennis facility in downtown area with 8 courts',
        address: '123 Main Street',
        city: 'New York',
        country: 'USA',
        phone: '+1-555-0100',
        email: 'contact@centraltennis.com',
        logo: 'https://images.unsplash.com/photo-1554224311-beee415c15ae?w=500&q=80',
        primaryColor: '#2563eb',
        rating: 4.8,
        ratingCount: 156,
        verifiedBadge: true,
        activityScore: 92,
        playerDevScore: 88,
        tournamentEngScore: 85,
      },
      admin: {
        username: 'central_admin',
        email: 'admin@centraltennis.com',
        firstName: 'Central',
        lastName: 'Admin',
        phone: '+1-555-0101',
        gender: 'Male',
        bio: 'Organization admin for Central Tennis Club',
      },
      finance: {
        username: 'central_finance',
        email: 'finance@centraltennis.com',
        firstName: 'Finance',
        lastName: 'Manager',
        phone: '+1-555-0102',
        gender: 'Female',
        bio: 'Finance officer for Central Tennis Club',
      },
    },
    {
      org: {
        name: 'Elite Sports Academy',
        slug: 'elite-sports-academy',
        description: 'International-level coaching and training facility',
        address: '456 Academy Lane',
        city: 'Los Angeles',
        country: 'USA',
        phone: '+1-555-0200',
        email: 'info@elitesports.com',
        logo: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&q=80',
        primaryColor: '#16a34a',
        rating: 4.9,
        ratingCount: 203,
        verifiedBadge: true,
        activityScore: 96,
        playerDevScore: 94,
        tournamentEngScore: 92,
      },
      admin: {
        username: 'elite_admin',
        email: 'admin@elitesports.com',
        firstName: 'Elite',
        lastName: 'Admin',
        phone: '+1-555-0201',
        gender: 'Female',
        bio: 'Organization admin for Elite Sports Academy',
      },
      finance: {
        username: 'elite_finance',
        email: 'finance@elitesports.com',
        firstName: 'Elite',
        lastName: 'Finance',
        phone: '+1-555-0202',
        gender: 'Male',
        bio: 'Finance officer for Elite Sports Academy',
      },
    },
    {
      org: {
        name: 'Community Tennis Courts',
        slug: 'community-tennis-courts',
        description: 'Affordable public tennis facility for the community',
        address: '789 Park Avenue',
        city: 'Chicago',
        country: 'USA',
        phone: '+1-555-0300',
        email: 'admin@communitytennis.org',
        logo: 'https://images.unsplash.com/photo-1638631055336-5c7a2a6e4f4b?w=500&q=80',
        primaryColor: '#dc2626',
        rating: 4.5,
        ratingCount: 98,
        verifiedBadge: false,
        activityScore: 78,
        playerDevScore: 72,
        tournamentEngScore: 80,
      },
      admin: {
        username: 'community_admin',
        email: 'admin@communitytennis.org',
        firstName: 'Community',
        lastName: 'Admin',
        phone: '+1-555-0301',
        gender: 'Female',
        bio: 'Organization admin for Community Tennis Courts',
      },
      finance: {
        username: 'community_finance',
        email: 'finance@communitytennis.org',
        firstName: 'Community',
        lastName: 'Finance',
        phone: '+1-555-0302',
        gender: 'Male',
        bio: 'Finance officer for Community Tennis Courts',
      },
    },
  ];

  const createdOrgs = [];
  const createdOrgAdmins: any[] = [];

  for (const { org: orgData, admin: adminData, finance: financeData } of organizationData) {
    // Create or update organization
    const organization = await prisma.organization.upsert({
      where: { name: orgData.name },
      update: orgData,
      create: orgData,
    });

    // Create admin user for the organization
    const adminUser = await prisma.user.upsert({
      where: { email: adminData.email },
      update: {
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        phone: adminData.phone,
        bio: adminData.bio,
      },
      create: {
        username: adminData.username,
        email: adminData.email,
        passwordHash: hashedPassword,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        phone: adminData.phone,
        gender: adminData.gender,
        bio: adminData.bio,
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80',
      },
    });

    // Create finance officer user for the organization
    const financeUser = await prisma.user.upsert({
      where: { email: financeData.email },
      update: {
        firstName: financeData.firstName,
        lastName: financeData.lastName,
        phone: financeData.phone,
        bio: financeData.bio,
      },
      create: {
        username: financeData.username,
        email: financeData.email,
        passwordHash: hashedPassword,
        firstName: financeData.firstName,
        lastName: financeData.lastName,
        phone: financeData.phone,
        gender: financeData.gender,
        bio: financeData.bio,
        photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&q=80',
      },
    });

    // Update organization with createdBy (org owner)
    const updatedOrg = await prisma.organization.update({
      where: { id: organization.id },
      data: { createdBy: adminUser.id },
    });

    // Create Player records for admin and finance users if they don't exist
    const adminPlayer = await prisma.player.upsert({
      where: { userId: adminUser.id },
      update: {},
      create: {
        userId: adminUser.id,
      },
    });

    const financePlayer = await prisma.player.upsert({
      where: { userId: financeUser.id },
      update: {},
      create: {
        userId: financeUser.id,
      },
    });

    // Add admin as ClubMember with admin role
    await prisma.clubMember.upsert({
      where: {
        organizationId_playerId: {
          playerId: adminUser.id,
          organizationId: updatedOrg.id,
        },
      },
      update: { role: 'admin' },
      create: {
        playerId: adminUser.id,
        organizationId: updatedOrg.id,
        role: 'admin',
        paymentStatus: 'paid',
      },
    });

    // Add finance officer as ClubMember with officer role
    await prisma.clubMember.upsert({
      where: {
        organizationId_playerId: {
          playerId: financeUser.id,
          organizationId: updatedOrg.id,
        },
      },
      update: { role: 'officer' },
      create: {
        playerId: financeUser.id,
        organizationId: updatedOrg.id,
        role: 'officer',
        paymentStatus: 'paid',
      },
    });

    createdOrgs.push(updatedOrg);
    createdOrgAdmins.push({ organization: updatedOrg, admin: adminUser, finance: financeUser });

    console.log(`  ✓ ${orgData.name}`);
    console.log(`    └─ Admin: ${adminData.email} (password: ${DEMO_PASSWORD})`);
    console.log(`    └─ Finance: ${financeData.email} (password: ${DEMO_PASSWORD})`);
  }

  console.log('\n📋 Organization Admin Login Credentials:');
  console.log('───────────────────────────────────────────────────────────────');
  for (const { organization, admin, finance } of createdOrgAdmins) {
    console.log(`\n${organization.name}:`);
    console.log(`  Admin   → ${admin.email} / ${DEMO_PASSWORD}`);
    console.log(`  Finance → ${finance.email} / ${DEMO_PASSWORD}`);
  }
  console.log('\n');

  return createdOrgs;
}
