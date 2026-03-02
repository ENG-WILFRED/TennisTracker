import { PrismaClient } from '../src/generated/prisma';
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("tennis123", 10);

  console.log('🌱 Starting comprehensive club management seed...\n');

  // ==================== CREATE PLAYERS ====================
  console.log('📝 Creating players...');
  const players = await Promise.all([
    prisma.player.upsert({
      where: { email: 'julius@pwani.ac.ke' },
      update: {},
      create: {
        username: 'julius',
        email: 'julius@pwani.ac.ke',
        phone: '0700000001',
        passwordHash: password,
        firstName: 'Julius',
        lastName: 'Nyerere',
        gender: 'Male',
        bio: 'Club founder and lead coach',
        matchesPlayed: 45,
        matchesWon: 35,
        matchesLost: 10,
      },
    }),
    prisma.player.upsert({
      where: { email: 'juma@pwani.ac.ke' },
      update: {},
      create: {
        username: 'juma',
        email: 'juma@pwani.ac.ke',
        phone: '0700000002',
        passwordHash: password,
        firstName: 'Juma',
        lastName: 'Hassan',
        gender: 'Male',
        bio: 'Professional player',
        matchesPlayed: 120,
        matchesWon: 85,
        matchesLost: 35,
      },
    }),
    prisma.player.upsert({
      where: { email: 'fatima@pwani.ac.ke' },
      update: {},
      create: {
        username: 'fatima',
        email: 'fatima@pwani.ac.ke',
        phone: '0700000003',
        passwordHash: password,
        firstName: 'Fatima',
        lastName: 'Mahmoud',
        gender: 'Female',
        bio: 'Rising star in womens tennis',
        matchesPlayed: 78,
        matchesWon: 52,
        matchesLost: 26,
      },
    }),
    prisma.player.upsert({
      where: { email: 'ali@pwani.ac.ke' },
      update: {},
      create: {
        username: 'ali',
        email: 'ali@pwani.ac.ke',
        phone: '0700000004',
        passwordHash: password,
        firstName: 'Ali',
        lastName: 'Mwangi',
        gender: 'Male',
        bio: 'Junior tennis enthusiast',
        matchesPlayed: 34,
        matchesWon: 18,
        matchesLost: 16,
      },
    }),
    prisma.player.upsert({
      where: { email: 'amina@pwani.ac.ke' },
      update: {},
      create: {
        username: 'amina',
        email: 'amina@pwani.ac.ke',
        phone: '0700000005',
        passwordHash: password,
        firstName: 'Amina',
        lastName: 'Kariuki',
        gender: 'Female',
        bio: 'Weekend player',
        matchesPlayed: 28,
        matchesWon: 16,
        matchesLost: 12,
      },
    }),
    prisma.player.upsert({
      where: { email: 'kofi@pwani.ac.ke' },
      update: {},
      create: {
        username: 'kofi',
        email: 'kofi@pwani.ac.ke',
        phone: '0700000006',
        passwordHash: password,
        firstName: 'Kofi',
        lastName: 'Adeyemi',
        gender: 'Male',
        bio: 'Competitive senior player',
        matchesPlayed: 92,
        matchesWon: 64,
        matchesLost: 28,
      },
    }),
  ]);

  // ==================== CREATE ORGANIZATIONS ====================
  console.log('🏛️  Creating organizations...');
  const orgs = await Promise.all([
    prisma.organization.upsert({
      where: { name: 'Nairobi Tennis Club' },
      update: {},
      create: {
        name: 'Nairobi Tennis Club',
        slug: 'nairobi-tc',
        description: 'Premier tennis facility in Nairobi with world-class amenities',
        address: '123 Ngong Road',
        city: 'Nairobi',
        country: 'Kenya',
        phone: '+254-20-2720000',
        email: 'info@nairobitennis.com',
        logo: 'https://images.unsplash.com/photo-1554224311-beee415c15e7?w=500&q=80',
        primaryColor: '#0ea5e9',
        createdBy: players[0].id,
        rating: 4.7,
        ratingCount: 156,
        verifiedBadge: true,
        activityScore: 92,
        playerDevScore: 85,
        tournamentEngScore: 88,
      },
    }),
    prisma.organization.upsert({
      where: { name: 'Westlands Tennis Academy' },
      update: {},
      create: {
        name: 'Westlands Tennis Academy',
        slug: 'westlands-academy',
        description: 'Modern tennis academy focusing on youth development',
        address: '456 Limuru Road',
        city: 'Nairobi',
        country: 'Kenya',
        phone: '+254-20-7000000',
        email: 'academy@westlandstennis.com',
        logo: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&q=80',
        primaryColor: '#06b6d4',
        createdBy: players[1].id,
        rating: 4.5,
        ratingCount: 98,
        verifiedBadge: true,
        activityScore: 88,
        playerDevScore: 92,
        tournamentEngScore: 82,
      },
    }),
  ]);

  // ==================== CREATE MEMBERSHIP TIERS ====================
  console.log('💳 Creating membership tiers...');
  const tiers = await Promise.all([
    prisma.membershipTier.create({
      data: {
        organizationId: orgs[0].id,
        name: 'Gold',
        description: 'Premium membership with unlimited court access',
        monthlyPrice: 5000,
        benefitsJson: JSON.stringify(['Unlimited court access', '50% coaching discount', 'Priority tournament registration', 'Free facilities usage']),
        courtHoursPerMonth: 999,
        maxConcurrentBookings: 10,
        discountPercentage: 50,
      },
    }),
    prisma.membershipTier.create({
      data: {
        organizationId: orgs[0].id,
        name: 'Silver',
        description: 'Standard membership with limited court access',
        monthlyPrice: 2500,
        benefitsJson: JSON.stringify(['40 hours court access', '25% coaching discount', 'Tournament registration']),
        courtHoursPerMonth: 40,
        maxConcurrentBookings: 5,
        discountPercentage: 25,
      },
    }),
    prisma.membershipTier.create({
      data: {
        organizationId: orgs[0].id,
        name: 'Junior',
        description: 'Membership for players under 18',
        monthlyPrice: 1000,
        benefitsJson: JSON.stringify(['20 hours court access', '40% coaching discount', 'Youth tournaments']),
        courtHoursPerMonth: 20,
        maxConcurrentBookings: 3,
        discountPercentage: 40,
      },
    }),
    prisma.membershipTier.create({
      data: {
        organizationId: orgs[1].id,
        name: 'Premium',
        description: 'Full access premium tier',
        monthlyPrice: 4500,
        benefitsJson: JSON.stringify(['Unlimited access', 'Free coaching clinics', 'Tournament hosting']),
        courtHoursPerMonth: 999,
        maxConcurrentBookings: 8,
        discountPercentage: 45,
      },
    }),
  ]);

  // ==================== CREATE COURTS ====================
  console.log('🎾 Creating courts...');
  const courts = await Promise.all([
    prisma.court.create({
      data: {
        organizationId: orgs[0].id,
        name: 'Court 1',
        courtNumber: 1,
        surface: 'Hard',
        indoorOutdoor: 'outdoor',
        lights: true,
        status: 'available',
      },
    }),
    prisma.court.create({
      data: {
        organizationId: orgs[0].id,
        name: 'Court 2',
        courtNumber: 2,
        surface: 'Hard',
        indoorOutdoor: 'outdoor',
        lights: true,
        status: 'available',
      },
    }),
    prisma.court.create({
      data: {
        organizationId: orgs[0].id,
        name: 'Court 3',
        courtNumber: 3,
        surface: 'Clay',
        indoorOutdoor: 'outdoor',
        lights: false,
        status: 'available',
      },
    }),
    prisma.court.create({
      data: {
        organizationId: orgs[1].id,
        name: 'Academy Court 1',
        courtNumber: 1,
        surface: 'Hard',
        indoorOutdoor: 'indoor',
        lights: true,
        status: 'available',
      },
    }),
    prisma.court.create({
      data: {
        organizationId: orgs[1].id,
        name: 'Academy Court 2',
        courtNumber: 2,
        surface: 'Hard',
        indoorOutdoor: 'indoor',
        lights: true,
        status: 'available',
      },
    }),
  ]);

  // ==================== CREATE CLUB MEMBERS ====================
  console.log('👥 Creating club members...');
  const members = await Promise.all([
    prisma.clubMember.create({
      data: {
        organizationId: orgs[0].id,
        playerId: players[0].id,
        tierId: tiers[0].id,
        role: 'admin',
        joinDate: new Date('2023-01-15'),
        expiryDate: new Date('2026-01-15'),
        autoRenew: true,
        paymentStatus: 'active',
        attendanceCount: 156,
      },
    }),
    prisma.clubMember.create({
      data: {
        organizationId: orgs[0].id,
        playerId: players[1].id,
        tierId: tiers[0].id,
        role: 'coach',
        joinDate: new Date('2023-02-10'),
        expiryDate: new Date('2026-02-10'),
        autoRenew: true,
        paymentStatus: 'active',
        attendanceCount: 142,
      },
    }),
    prisma.clubMember.create({
      data: {
        organizationId: orgs[0].id,
        playerId: players[2].id,
        tierId: tiers[1].id,
        role: 'member',
        joinDate: new Date('2023-06-20'),
        expiryDate: new Date('2026-06-20'),
        autoRenew: true,
        paymentStatus: 'active',
        attendanceCount: 98,
      },
    }),
    prisma.clubMember.create({
      data: {
        organizationId: orgs[0].id,
        playerId: players[3].id,
        tierId: tiers[2].id,
        role: 'member',
        joinDate: new Date('2024-01-05'),
        expiryDate: new Date('2025-01-05'),
        autoRenew: true,
        paymentStatus: 'active',
        attendanceCount: 64,
      },
    }),
    prisma.clubMember.create({
      data: {
        organizationId: orgs[0].id,
        playerId: players[4].id,
        tierId: tiers[1].id,
        role: 'member',
        joinDate: new Date('2023-08-12'),
        expiryDate: new Date('2026-08-12'),
        autoRenew: true,
        paymentStatus: 'active',
        attendanceCount: 72,
      },
    }),
    prisma.clubMember.create({
      data: {
        organizationId: orgs[1].id,
        playerId: players[5].id,
        tierId: tiers[3].id,
        role: 'admin',
        joinDate: new Date('2023-03-01'),
        expiryDate: new Date('2026-03-01'),
        autoRenew: true,
        paymentStatus: 'active',
        attendanceCount: 128,
      },
    }),
  ]);

  // ==================== CREATE COURT BOOKINGS ====================
  console.log('📅 Creating court bookings...');
  const now = new Date();
  const bookings = await Promise.all([
    prisma.courtBooking.create({
      data: {
        organizationId: orgs[0].id,
        courtId: courts[0].id,
        memberId: members[0].id,
        startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        bookingType: 'regular',
        status: 'confirmed',
        price: 0,
        isPeak: false,
      },
    }),
    prisma.courtBooking.create({
      data: {
        organizationId: orgs[0].id,
        courtId: courts[1].id,
        memberId: members[1].id,
        startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        bookingType: 'regular',
        status: 'confirmed',
        price: 1000,
        isPeak: true,
      },
    }),
    prisma.courtBooking.create({
      data: {
        organizationId: orgs[0].id,
        courtId: courts[2].id,
        memberId: members[2].id,
        startTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        bookingType: 'regular',
        status: 'confirmed',
        price: 0,
        isPeak: false,
      },
    }),
  ]);

  // ==================== CREATE RANKINGS ====================
  console.log('🏆 Creating player rankings...');
  const weekNumber = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7);
  const rankings = await Promise.all([
    prisma.playerRanking.create({
      data: {
        organizationId: orgs[0].id,
        memberId: members[1].id,
        weekNumber,
        year: now.getFullYear(),
        currentRank: 1,
        ratingPoints: 2150,
        matchesWon: 24,
        matchesLost: 6,
        winRate: 0.8,
      },
    }),
    prisma.playerRanking.create({
      data: {
        organizationId: orgs[0].id,
        memberId: members[0].id,
        weekNumber,
        year: now.getFullYear(),
        currentRank: 2,
        ratingPoints: 1950,
        matchesWon: 18,
        matchesLost: 5,
        winRate: 0.78,
      },
    }),
    prisma.playerRanking.create({
      data: {
        organizationId: orgs[0].id,
        memberId: members[2].id,
        weekNumber,
        year: now.getFullYear(),
        currentRank: 3,
        ratingPoints: 1750,
        matchesWon: 16,
        matchesLost: 8,
        winRate: 0.67,
      },
    }),
  ]);

  // ==================== CREATE EVENTS ====================
  console.log('📆 Creating club events...');
  const events = await Promise.all([
    prisma.clubEvent.create({
      data: {
        organizationId: orgs[0].id,
        name: 'Monthly Tournament - February 2026',
        description: 'Regular monthly tournament for all members',
        eventType: 'tournament',
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
        registrationCap: 32,
        registrationDeadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        location: 'Nairobi Tennis Club',
        prizePool: 50000,
        entryFee: 2000,
      },
    }),
    prisma.clubEvent.create({
      data: {
        organizationId: orgs[0].id,
        name: 'Beginner Training Clinic',
        description: 'Coaching clinic for beginner players',
        eventType: 'clinic',
        startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        registrationCap: 20,
        registrationDeadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        location: 'Nairobi Tennis Club',
        entryFee: 500,
      },
    }),
    prisma.clubEvent.create({
      data: {
        organizationId: orgs[1].id,
        name: 'Youth Championship 2026',
        description: 'Annual youth tournament for academy members',
        eventType: 'tournament',
        startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
        registrationCap: 64,
        registrationDeadline: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        location: 'Westlands Academy',
        prizePool: 100000,
        entryFee: 3000,
      },
    }),
  ]);

  // ==================== CREATE EVENT REGISTRATIONS ====================
  console.log('✍️  Creating event registrations...');
  const registrations = await Promise.all([
    prisma.eventRegistration.create({
      data: {
        eventId: events[0].id,
        memberId: members[0].id,
        registeredAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        status: 'registered',
        signupOrder: 1,
      },
    }),
    prisma.eventRegistration.create({
      data: {
        eventId: events[0].id,
        memberId: members[1].id,
        registeredAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        status: 'registered',
        signupOrder: 2,
      },
    }),
    prisma.eventRegistration.create({
      data: {
        eventId: events[0].id,
        memberId: members[2].id,
        registeredAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        status: 'registered',
        signupOrder: 3,
      },
    }),
    prisma.eventRegistration.create({
      data: {
        eventId: events[1].id,
        memberId: members[3].id,
        registeredAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        status: 'registered',
        signupOrder: 1,
      },
    }),
  ]);

  // ==================== CREATE ANNOUNCEMENTS ====================
  console.log('📢 Creating announcements...');
  const announcements = await Promise.all([
    prisma.clubAnnouncement.create({
      data: {
        organizationId: orgs[0].id,
        title: 'Court Maintenance Notice',
        message: 'Court 3 will be under maintenance on February 20-22. Alternative courts available.',
        announcementType: 'maintenance',
        targetRoles: ['member', 'admin', 'coach'],
        createdBy: players[0].id,
        isActive: true,
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.clubAnnouncement.create({
      data: {
        organizationId: orgs[0].id,
        title: 'Monthly Tournament Registration Open',
        message: 'Registration for February tournament is now open. Register before Feb 21!',
        announcementType: 'alert',
        targetRoles: ['member', 'coach'],
        createdBy: players[0].id,
        isActive: true,
        expiresAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.clubAnnouncement.create({
      data: {
        organizationId: orgs[0].id,
        title: 'New Court Booking Policy',
        message: 'Peak hours (4pm-8pm) now have dynamic pricing. Members receive 25% discount.',
        announcementType: 'policy',
        targetRoles: ['member', 'admin'],
        createdBy: players[0].id,
        isActive: true,
      },
    }),
  ]);

  // ==================== CREATE ORGANIZATION ROLES ====================
  console.log('👤 Creating organization roles...');
  const roles = await Promise.all([
    prisma.organizationRole.create({
      data: {
        organizationId: orgs[0].id,
        name: 'Admin',
        description: 'Full access to all organization features',
        permissions: {
          create: [
            { organizationId: orgs[0].id, permissionName: 'manage_members' },
            { organizationId: orgs[0].id, permissionName: 'manage_courts' },
            { organizationId: orgs[0].id, permissionName: 'manage_bookings' },
            { organizationId: orgs[0].id, permissionName: 'manage_events' },
            { organizationId: orgs[0].id, permissionName: 'manage_rankings' },
            { organizationId: orgs[0].id, permissionName: 'view_revenue' },
            { organizationId: orgs[0].id, permissionName: 'manage_roles' },
          ],
        },
      },
    }),
    prisma.organizationRole.create({
      data: {
        organizationId: orgs[0].id,
        name: 'Coach',
        description: 'Can manage players and schedule coaching',
        permissions: {
          create: [
            { organizationId: orgs[0].id, permissionName: 'manage_members' },
            { organizationId: orgs[0].id, permissionName: 'manage_rankings' },
            { organizationId: orgs[0].id, permissionName: 'manage_bookings' },
          ],
        },
      },
    }),
    prisma.organizationRole.create({
      data: {
        organizationId: orgs[0].id,
        name: 'Member',
        description: 'Regular member with standard access',
        permissions: {
          create: [
            { organizationId: orgs[0].id, permissionName: 'book_courts' },
            { organizationId: orgs[0].id, permissionName: 'view_rankings' },
            { organizationId: orgs[0].id, permissionName: 'register_events' },
          ],
        },
      },
    }),
    prisma.organizationRole.create({
      data: {
        organizationId: orgs[0].id,
        name: 'Finance Officer',
        description: 'Can view and manage financial records',
        permissions: {
          create: [
            { organizationId: orgs[0].id, permissionName: 'view_revenue' },
            { organizationId: orgs[0].id, permissionName: 'manage_finances' },
            { organizationId: orgs[0].id, permissionName: 'export_reports' },
          ],
        },
      },
    }),
  ]);

  // ==================== CREATE CLUB FINANCES ====================
  console.log('💰 Creating club finances...');
  const finances = await Promise.all([
    prisma.clubFinance.create({
      data: {
        organizationId: orgs[0].id,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        membershipRevenue: 45000,
        courtBookingRevenue: 28500,
        coachCommissions: 12000,
        eventRevenue: 36000,
        totalRevenue: 121500,
        totalExpenses: 55000,
        netProfit: 66500,
        transactionRecords: {
          create: [
            {
              description: 'Gold membership - Julius Nyerere',
              category: 'membership',
              amount: 5000,
              transactionType: 'credit',
              memberId: members[0].id,
            },
            {
              description: 'Court booking - Peak hours',
              category: 'court_booking',
              amount: 3000,
              transactionType: 'credit',
            },
            {
              description: 'Monthly facility maintenance',
              category: 'expense',
              amount: 15000,
              transactionType: 'debit',
            },
          ],
        },
      },
    }),
    prisma.clubFinance.create({
      data: {
        organizationId: orgs[1].id,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        membershipRevenue: 35000,
        courtBookingRevenue: 22000,
        coachCommissions: 10500,
        eventRevenue: 28000,
        totalRevenue: 95500,
        totalExpenses: 42000,
        netProfit: 53500,
      },
    }),
  ]);

  // ==================== CREATE ORGANIZATION BADGES ====================
  console.log('🏅 Creating organization badges...');
  const badges = await Promise.all([
    prisma.organizationBadge.create({
      data: {
        organizationId: orgs[0].id,
        badgeName: 'Verified Club',
        badgeType: 'verified',
        achievementDate: new Date('2023-06-01'),
      },
    }),
    prisma.organizationBadge.create({
      data: {
        organizationId: orgs[0].id,
        badgeName: 'High Engagement',
        badgeType: 'engagement',
        achievementDate: new Date('2024-01-15'),
      },
    }),
    prisma.organizationBadge.create({
      data: {
        organizationId: orgs[0].id,
        badgeName: 'Player Developer',
        badgeType: 'development',
        achievementDate: new Date('2024-02-01'),
      },
    }),
  ]);

  // ==================== CREATE CLUB RATINGS ====================
  console.log('⭐ Creating club ratings...');
  await Promise.all([
    prisma.clubRating.create({
      data: {
        organizationId: orgs[0].id,
        ratedBy: players[1].id,
        rating: 5,
        category: 'facilities',
        comment: 'Excellent court conditions and maintenance',
      },
    }),
    prisma.clubRating.create({
      data: {
        organizationId: orgs[0].id,
        ratedBy: players[2].id,
        rating: 4,
        category: 'coaching',
        comment: 'Great coaches, very professional',
      },
    }),
    prisma.clubRating.create({
      data: {
        organizationId: orgs[0].id,
        ratedBy: players[3].id,
        rating: 5,
        category: 'community',
        comment: 'Amazing community, very welcoming',
      },
    }),
    prisma.clubRating.create({
      data: {
        organizationId: orgs[1].id,
        ratedBy: players[5].id,
        rating: 5,
        category: 'overall',
        comment: 'Best academy in the city',
      },
    }),
  ]);

  console.log('\n✅ Club management seed completed successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`   • Organizations: ${orgs.length}`);
  console.log(`   • Players: ${players.length}`);
  console.log(`   • Club Members: ${members.length}`);
  console.log(`   • Courts: ${courts.length}`);
  console.log(`   • Bookings: ${bookings.length}`);
  console.log(`   • Events: ${events.length}`);
  console.log(`   • Announcements: ${announcements.length}`);
  console.log(`   • Roles: ${roles.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
