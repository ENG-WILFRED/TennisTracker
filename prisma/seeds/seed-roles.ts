import { PrismaClient } from '../../src/generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'tennis123';

async function main() {
  console.log('🌱 Starting comprehensive role-based seeding...\n');

  // Hash password once
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  try {
    // ==========================================
    // 1. PLAYER ROLE (Blue - 🎾)
    // ==========================================
    console.log('🎾 Creating PLAYER role users...');

    const playerUser = await prisma.user.upsert({
      where: { email: 'player@example.com' },
      update: {},
      create: {
        username: 'demo_player',
        email: 'player@example.com',
        phone: '+1234567890',
        passwordHash: hashedPassword,
        firstName: 'John',
        lastName: 'Player',
        photo: null,
        gender: 'Male',
        dateOfBirth: new Date('1998-05-15'),
        nationality: 'USA',
        bio: 'Passionate tennis player looking to improve my game',
        player: {
          create: {
            matchesPlayed: 25,
            matchesWon: 15,
            matchesLost: 10,
            isClub: false,
          },
        },
      },
      include: { player: true },
    });

    console.log(`  ✓ Player created: ${playerUser.email}`);

    // ==========================================
    // 2. COACH ROLE (Green - 👨‍🏫)
    // ==========================================
    console.log('\n👨‍🏫 Creating COACH role user...');

    const coachUser = await prisma.user.upsert({
      where: { email: 'coach@example.com' },
      update: {},
      create: {
        username: 'demo_coach',
        email: 'coach@example.com',
        phone: '+1987654321',
        passwordHash: hashedPassword,
        firstName: 'Sarah',
        lastName: 'Coach',
        photo: null,
        gender: 'Female',
        dateOfBirth: new Date('1990-03-20'),
        nationality: 'USA',
        bio: 'Professional tennis coach with 10 years experience',
        player: {
          create: {
            matchesPlayed: 150,
            matchesWon: 120,
            matchesLost: 30,
            isClub: false,
          },
        },
        staff: {
          create: {
            role: 'Head Coach',
            contact: 'coach@example.com',
            yearsOfExperience: 10,
            expertise: 'Tennis coaching',
            coachingLevel: 'Professional',
            formerPlayerBackground: 'Professional player for 8 years',
            certifications: {
              create: [
                {
                  name: 'ITF Level 3',
                  issuer: 'International Tennis Federation',
                  issuedAt: new Date('2020-06-15'),
                  expiresAt: new Date('2026-06-15'),
                },
              ],
            },
            specializations: {
              create: [
                { name: 'Singles', level: 'Advanced' },
                { name: 'Doubles', level: 'Advanced' },
              ],
            },
            availability: {
              create: [
                { dayOfWeek: 0, startTime: '09:00', endTime: '17:00' },
                { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
                { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
              ],
            },
            pricing: {
              create: {
                pricePerSession: 75,
                currency: 'USD',
                package3Sessions: 200,
                package10Sessions: 650,
              },
            },
            playerAgeGroups: ['Teens', 'Adults'],
            skillLevelsTrained: ['Beginner', 'Intermediate', 'Advanced'],
            trainingTypes: ['Private sessions', 'Group sessions'],
            isVerified: true,
            isActive: true,
          },
        },
      },
      include: { player: true, staff: true },
    });

    console.log(`  ✓ Coach created: ${coachUser.email}`);

    // ==========================================
    // 3. ADMIN ROLE (Red - ⚙️)
    // ==========================================
    console.log('\n⚙️ Creating ADMIN role user...');

    // First create a player for the admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        username: 'demo_admin',
        email: 'admin@example.com',
        phone: '+1555123456',
        passwordHash: hashedPassword,
        firstName: 'Mike',
        lastName: 'Admin',
        photo: null,
        gender: 'Male',
        dateOfBirth: new Date('1985-08-10'),
        nationality: 'USA',
        bio: 'Club administrator managing operations',
        player: {
          create: {
            matchesPlayed: 50,
            matchesWon: 35,
            matchesLost: 15,
            isClub: false,
          },
        },
      },
      include: { player: true },
    });

    // Create organization and set admin as member
    const org = await prisma.organization.upsert({
      where: { name: 'Demo Tennis Club' },
      update: {},
      create: {
        name: 'Demo Tennis Club',
        slug: 'demo-tennis-club',
        description: 'A demonstration tennis club for testing',
        address: '123 Tennis Lane',
        city: 'San Francisco',
        country: 'USA',
        phone: '+1234567890',
        email: 'admin@vico.club',
        createdBy: adminUser.id,
        logo: null,
        primaryColor: '#dc2626',
        rating: 4.5,
        verifiedBadge: true,
      },
    });

    // Add admin as club member
    await prisma.clubMember.upsert({
      where: {
        organizationId_playerId: {
          organizationId: org.id,
          playerId: adminUser.id,
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        playerId: adminUser.id,
        role: 'admin',
        joinDate: new Date(),
      },
    });

    console.log(`  ✓ Admin created: ${adminUser.email}`);
    console.log(`  ✓ Organization created: ${org.name}`);

    // ==========================================
    // 4. FINANCE OFFICER ROLE (Purple - 💰)
    // ==========================================
    console.log('\n💰 Creating FINANCE OFFICER role user...');

    const financeUser = await prisma.user.upsert({
      where: { email: 'finance@example.com' },
      update: {},
      create: {
        username: 'demo_finance',
        email: 'finance@example.com',
        phone: '+1555987654',
        passwordHash: hashedPassword,
        firstName: 'Lisa',
        lastName: 'Finance',
        photo: null,
        gender: 'Female',
        dateOfBirth: new Date('1992-11-25'),
        nationality: 'USA',
        bio: 'Finance officer handling club finances',
        player: {
          create: {
            matchesPlayed: 30,
            matchesWon: 18,
            matchesLost: 12,
            isClub: false,
          },
        },
      },
      include: { player: true },
    });

    // Add finance officer as club member
    await prisma.clubMember.upsert({
      where: {
        organizationId_playerId: {
          organizationId: org.id,
          playerId: financeUser.id,
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        playerId: financeUser.id,
        role: 'finance_officer',
        joinDate: new Date(),
      },
    });

    console.log(`  ✓ Finance officer created: ${financeUser.email}`);

    // ==========================================
    // 5. REFEREE ROLE (Yellow - 🏆)
    // ==========================================
    console.log('\n🏆 Creating REFEREE role user...');

    const refereeUser = await prisma.user.upsert({
      where: { email: 'referee@example.com' },
      update: {},
      create: {
        username: 'demo_referee',
        email: 'referee@example.com',
        phone: '+1555111222',
        passwordHash: hashedPassword,
        firstName: 'David',
        lastName: 'Referee',
        photo: null,
        gender: 'Male',
        dateOfBirth: new Date('1988-07-05'),
        nationality: 'USA',
        bio: 'Certified tennis match referee',
        referee: {
          create: {
            matchesRefereed: 120,
            ballCrewMatches: 45,
            experience: '12 years',
            certifications: ['ITF Certified', 'ATP Certified', 'WTA Certified'],
          },
        },
      },
      include: { referee: true },
    });

    console.log(`  ✓ Referee created: ${refereeUser.email}`);

    // ==========================================
    // 6. ORGANIZATION OWNER ROLE (Indigo - 🏛️)
    // ==========================================
    console.log('\n🏛️ Creating ORGANIZATION OWNER role user...');

    const ownerUser = await prisma.user.upsert({
      where: { email: 'owner@example.com' },
      update: {},
      create: {
        username: 'demo_owner',
        email: 'owner@example.com',
        phone: '+1555999888',
        passwordHash: hashedPassword,
        firstName: 'Robert',
        lastName: 'Owner',
        photo: null,
        gender: 'Male',
        dateOfBirth: new Date('1980-02-14'),
        nationality: 'USA',
        bio: 'Owner of OwnerCorp Tennis Academy',
        player: {
          create: {
            matchesPlayed: 200,
            matchesWon: 160,
            matchesLost: 40,
            isClub: true,
          },
        },
      },
      include: { player: true },
    });

    // Create organization owned by this user
    const ownedOrg = await prisma.organization.upsert({
      where: { name: 'OwnerCorp Tennis Academy' },
      update: {},
      create: {
        name: 'OwnerCorp Tennis Academy',
        slug: 'ownercorp-academy',
        description: 'Premium tennis academy owned by Robert',
        address: '456 Academy Road',
        city: 'Los Angeles',
        country: 'USA',
        phone: '+1888777666',
        email: 'academy@ownercorp.com',
        createdBy: ownerUser.id,
        logo: null,
        primaryColor: '#4f46e5',
        rating: 4.8,
        verifiedBadge: true,
      },
    });

    console.log(`  ✓ Organization owner created: ${ownerUser.email}`);
    console.log(`  ✓ Owned organization created: ${ownedOrg.name}`);

    // ==========================================
    // 7. SPECTATOR ROLE (Gray - 👁️)
    // ==========================================
    console.log('\n👁️ Creating SPECTATOR role user...');

    const spectatorUser = await prisma.user.upsert({
      where: { email: 'spectator@example.com' },
      update: {},
      create: {
        username: 'demo_spectator',
        email: 'spectator@example.com',
        phone: '+1555333444',
        passwordHash: hashedPassword,
        firstName: 'Emma',
        lastName: 'Spectator',
        photo: null,
        gender: 'Female',
        dateOfBirth: new Date('2000-09-30'),
        nationality: 'USA',
        bio: 'Tennis enthusiast watching matches',
        spectator: {
          create: {},
        },
      },
      include: { spectator: true },
    });

    console.log(`  ✓ Spectator created: ${spectatorUser.email}`);

    // ==========================================
    // 8. ADDITIONAL DEMO USERS FOR TESTING
    // ==========================================
    console.log('\n📝 Creating additional demo players for testing...');

    const additionalPlayers = [
      {
        username: 'alice_player',
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Player',
        phone: '+1555101112',
      },
      {
        username: 'bob_player',
        email: 'bob@example.com',
        firstName: 'Bob',
        lastName: 'Player',
        phone: '+1555121314',
      },
      {
        username: 'charlie_coach',
        email: 'charlie@example.com',
        firstName: 'Charlie',
        lastName: 'Coach',
        phone: '+1555151617',
      },
    ];

    for (const playerData of additionalPlayers) {
      await prisma.user.upsert({
        where: { email: playerData.email },
        update: {},
        create: {
          ...playerData,
          passwordHash: hashedPassword,
          gender: 'Male',
          dateOfBirth: new Date('1995-01-01'),
          nationality: 'USA',
          bio: 'Demo player for testing',
          player: {
            create: {
              matchesPlayed: Math.floor(Math.random() * 50),
              matchesWon: Math.floor(Math.random() * 35),
              matchesLost: Math.floor(Math.random() * 20),
            },
          },
        },
      });
      console.log(`  ✓ Additional player created: ${playerData.email}`);
    }

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('\n✨ Seeding completed successfully!\n');
    console.log('📊 CREATED USERS AND ROLES:');
    console.log('  🎾 Player:          player@example.com / tennis123');
    console.log('  👨‍🏫 Coach:           coach@example.com / tennis123');
    console.log('  ⚙️  Admin:           admin@example.com / tennis123');
    console.log('  💰 Finance Officer: finance@example.com / tennis123');
    console.log('  🏆 Referee:         referee@example.com / tennis123');
    console.log('  🏛️  Organization:   owner@example.com / tennis123');
    console.log('  👁️  Spectator:      spectator@example.com / tennis123');
    console.log('\n🌐 ORGANIZATIONS CREATED:');
    console.log(`  • ${org.name} (Admin: admin@example.com)`);
    console.log(`  • ${ownedOrg.name} (Owner: owner@example.com)`);
    console.log('\n💡 All demo users use password: tennis123');
    console.log('🚀 Ready to test role-based dashboards!\n');
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
