// When running under ESM (package.json has "type": "module"), importing a directory
// path fails with ERR_UNSUPPORTED_DIR_IMPORT. Point directly at the generated entry file.
// Using the .js extension ensures Node resolves the file instead of the directory.
import { PrismaClient } from '../src/generated/prisma/index.js';
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Password for all demo users (hashed)
  const password = await bcrypt.hash("tennis123", 10);

  // ==================== CREATE PLAYERS ====================
  console.log('📝 Creating players...');

  const playerInfos = [
    {
      username: 'julius',
      email: 'federer@pwani.ac.ke',
      phone: '0700000001',
      passwordHash: password,
      firstName: 'julius',
      lastName: 'nyerere',
      photo: 'https://images.unsplash.com/photo-1505228395891-9a51e7e86e81?w=500&q=80',
      gender: 'Male',
      dateOfBirth: new Date('1981-08-08'),
      nationality: 'Switzerland',
      bio: '20-time Grand Slam champion.',
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
    },
    {
      username: 'joe',
      email: 'nadal@pwani.ac.ke',
      phone: '0700000002',
      passwordHash: password,
      firstName: 'joe',
      lastName: 'kazungu',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80',
      gender: 'Male',
      dateOfBirth: new Date('1986-06-03'),
      nationality: 'Spain',
      bio: 'King of Clay.',
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
    },
    {
      username: 'leah',
      email: 'djokovic@pwani.ac.ke',
      phone: '0700000003',
      passwordHash: password,
      firstName: 'leah',
      lastName: 'crush',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&q=80',
      gender: 'female',
      dateOfBirth: new Date('1987-05-22'),
      nationality: 'Serbia',
      bio: 'Serbian tennis legend.',
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
    },
    {
      username: 'winnie',
      email: 'serena@pwani.ac.ke',
      phone: '0700000004',
      passwordHash: password,
      firstName: 'winnie',
      lastName: 'mueni',
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&q=80',
      gender: 'Female',
      dateOfBirth: new Date('1981-09-26'),
      nationality: 'USA',
      bio: 'Greatest women\'s player.',
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
    },
    {
      username: 'wilfred',
      email: 'sharapova@pwani.ac.ke',
      phone: '0700000005',
      passwordHash: password,
      firstName: 'wilfred',
      lastName: 'kimani',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80',
      gender: 'male',
      dateOfBirth: new Date('1987-04-19'),
      nationality: 'Russia',
      bio: 'Siberian Siren.',
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
    },
    {
      username: 'peter',
      email: 'murray@pwani.ac.ke',
      phone: '0700000006',
      passwordHash: password,
      firstName: 'peter',
      lastName: 'mwangi',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80',
      gender: 'Male',
      dateOfBirth: new Date('1987-05-15'),
      nationality: 'UK',
      bio: 'Scottish tennis star.',
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
    },
    {
      username: 'morris',
      email: 'murray1@pwani.ac.ke',
      phone: '0700000007', // unique phone
      passwordHash: password,
      firstName: 'morris',
      lastName: 'morris',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80',
      gender: 'Male',
      dateOfBirth: new Date('1987-05-15'),
      nationality: 'UK',
      bio: 'Scottish tennis star.',
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
    },
    {
      username: 'jojo',
      email: 'murray2@pwani.ac.ke',
      phone: '0700000008', // unique phone
      passwordHash: password,
      firstName: 'jojo',
      lastName: 'jbouy',
      photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&q=80',
      gender: 'Male',
      dateOfBirth: new Date('1987-05-15'),
      nationality: 'UK',
      bio: 'Scottish tennis star.',
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
    },
  ];

  const players = await Promise.all(
    playerInfos.map(async (info) => {
      const user = await prisma.user.upsert({
        where: { email: info.email },
        update: {},
        create: {
          username: info.username,
          email: info.email,
          phone: info.phone,
          passwordHash: info.passwordHash,
          firstName: info.firstName,
          lastName: info.lastName,
          photo: info.photo,
          gender: info.gender,
          dateOfBirth: info.dateOfBirth,
          nationality: info.nationality,
          bio: info.bio,
        },
      });

      const player = await prisma.player.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          matchesPlayed: info.matchesPlayed,
          matchesWon: info.matchesWon,
          matchesLost: info.matchesLost,
        },
      });

      return { user, player };
    })
  );

  console.log('Seeded players with full details!');

  console.log('Seeded players with full details!');
  // mark 'peter' as club account
  let peterPlayer: typeof players[number]['player'] | undefined;
  const peterEntry = players.find(p => p.user.username === 'peter');
  if (peterEntry) {
    peterPlayer = peterEntry.player;
    await prisma.player.update({ where: { userId: peterPlayer.userId }, data: { isClub: true } });

    // create a larger inventory attached to club
    const inventorySeed = [];
    const sampleItems = [
      'Tennis Racket - Wilson Pro', 'Tennis Racket - Head Speed', 'Tennis Racket - Babolat Pure',
      'Tennis Balls (Can)', 'Tennis Balls (Box)', 'Ball Hopper', 'Net Tape', 'Court Tape', 'Scoreboard',
      'First Aid Kit', 'Water Bottles (Pack)', 'Sunscreen', 'Sweat Towels', 'Extra Shoes', 'Grip Tape',
      'Practice Cones', 'Resistance Bands', 'Ball Machine', 'Tennis Bag', 'Umbrella', 'Lines Brush', 'Marker Chalk'
    ];
    for (let i = 0; i < 60; i++) {
      const name = sampleItems[i % sampleItems.length] + (i > 20 ? ` #${i}` : '');
      inventorySeed.push({ name, count: Math.floor(Math.random() * 20), condition: ['Good','Fair','New'][i % 3], clubId: peterPlayer.userId });
    }
    await prisma.inventoryItem.createMany({ data: inventorySeed, skipDuplicates: true });
    console.log('Seeded inventory items.');
    // Create an organization for the club and link peter, inventory and staff later
    const org = await prisma.organization.upsert({
      where: { name: 'Pwani University Tennis Club' },
      create: {
        name: 'Pwani University Tennis Club',
        slug: 'pwani-university',
        description: 'Official tennis club for Pwani University',
        city: 'Mombasa',
        country: 'Kenya',
        phone: '+254700000006',
        email: 'info@pwani.ac.ke',
        logo: null,
        primaryColor: '#0ea5e9',
        createdBy: peterPlayer.userId,
      },
      update: {},
    });

    // Attach the club player to the organization
    await prisma.player.update({ where: { userId: peterPlayer.userId }, data: { organizationId: org.id } });

    // Attach existing inventory items to the organization
    await prisma.inventoryItem.updateMany({ where: { clubId: peterPlayer.userId }, data: { organizationId: org.id } });

    // Create an org admin user and attach to the organization (password: 123456)
    try {
      const orgAdminPassword = await bcrypt.hash('123456', 10);
      // create/upsert user first
      const orgAdminUser = await prisma.user.upsert({
        where: { username: 'org_admin' },
        update: { email: 'orgadmin@pwani.ac.ke' },
        create: {
          username: 'org_admin',
          email: 'orgadmin@pwani.ac.ke',
          phone: '+254700000010',
          passwordHash: orgAdminPassword,
          firstName: 'Org',
          lastName: 'Admin',
          photo: null,
          gender: 'Other',
          dateOfBirth: new Date('1990-01-01'),
          nationality: 'Kenya',
          bio: 'Organization administrator',
        },
      });
      // then ensure a player profile exists for that user
      const orgAdmin = await prisma.player.upsert({
        where: { userId: orgAdminUser.id },
        update: { organizationId: org.id },
        create: { userId: orgAdminUser.id, organizationId: org.id },
      });

      // Make this admin the organization creator for permission checks
      await prisma.organization.update({ where: { id: org.id }, data: { createdBy: orgAdminUser.id } });
      console.log('Seeded org admin and linked to organization (username: org_admin, password: 123456)');
    } catch (e) {
      console.error('Failed to create org admin', e);
    }
  }

  // Seed referees and ball crew
  {
    const refereeSeedData = [
      {
        username: 'ref_smith',
        email: 'smith@referee.com',
        phone: '+254722222001',
        password: 'tennis123',
        firstName: 'John',
        lastName: 'Smith',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80',
        gender: 'Male',
        dateOfBirth: new Date('1970-03-15'),
        nationality: 'UK',
        bio: 'Senior referee with 20+ years of experience in international tennis.',
        matchesRefereed: 120,
        ballCrewMatches: 45,
        experience: '20+ years',
        certifications: ['ITF Level 3', 'ATP Certified', 'Grand Slam Experience'],
      },
      {
        username: 'ref_johnson',
        email: 'johnson@referee.com',
        phone: '+254722222002',
        password: 'tennis123',
        firstName: 'Sarah',
        lastName: 'Johnson',
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&q=80',
        gender: 'Female',
        dateOfBirth: new Date('1975-07-22'),
        nationality: 'Canada',
        bio: 'WTA certified referee specializing in women\'s professional matches.',
        matchesRefereed: 95,
        ballCrewMatches: 60,
        experience: '15+ years',
        certifications: ['ITF Level 2', 'WTA Certified', 'Umpire Training'],
      },
      {
        username: 'ref_mueller',
        email: 'mueller@referee.com',
        phone: '+254722222003',
        password: 'tennis123',
        firstName: 'Klaus',
        lastName: 'Mueller',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80',
        gender: 'Male',
        dateOfBirth: new Date('1980-11-08'),
        nationality: 'Germany',
        bio: 'Professional line umpire and match referee for regional tournaments.',
        matchesRefereed: 75,
        ballCrewMatches: 50,
        experience: '12+ years',
        certifications: ['ITF Level 2', 'Line Umpire Certified', 'Regional Tournaments'],
      },
      {
        username: 'ref_patel',
        email: 'patel@referee.com',
        phone: '+254722222004',
        password: 'tennis123',
        firstName: 'Priya',
        lastName: 'Patel',
        photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&q=80',
        gender: 'Female',
        dateOfBirth: new Date('1985-05-30'),
        nationality: 'India',
        bio: 'Head of ball crew for major tournaments in South Asia.',
        matchesRefereed: 60,
        ballCrewMatches: 150,
        experience: '10+ years',
        certifications: ['Ball Crew Supervisor', 'Tournament Coordinator'],
      },
      {
        username: 'ref_costa',
        email: 'costa@referee.com',
        phone: '+254722222005',
        password: 'tennis123',
        firstName: 'Marco',
        lastName: 'Costa',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80',
        gender: 'Male',
        dateOfBirth: new Date('1988-09-12'),
        nationality: 'Portugal',
        bio: 'Junior and professional match referee with ATP accreditation.',
        matchesRefereed: 85,
        ballCrewMatches: 40,
        experience: '8+ years',
        certifications: ['ATP Certified', 'ITF Level 2', 'Junior Development'],
      },
    ];

    for (const r of refereeSeedData) {
      const passwordHash = await bcrypt.hash(r.password, 10);
      // use email to avoid potential username collisions
      const user = await prisma.user.upsert({
        where: { email: r.email },
        update: { username: r.username, phone: r.phone },
        create: {
          username: r.username,
          email: r.email,
          phone: r.phone,
          passwordHash,
          firstName: r.firstName,
          lastName: r.lastName,
          photo: r.photo,
          gender: r.gender as any,
          dateOfBirth: r.dateOfBirth,
          nationality: r.nationality,
          bio: r.bio,
        },
      });
      await prisma.referee.upsert({
        where: { userId: user.id },
        update: {
          matchesRefereed: r.matchesRefereed,
          ballCrewMatches: r.ballCrewMatches,
          experience: r.experience,
          certifications: r.certifications,
        },
        create: {
          userId: user.id,
          matchesRefereed: r.matchesRefereed,
          ballCrewMatches: r.ballCrewMatches,
          experience: r.experience,
          certifications: r.certifications,
        },
      });
    }

    console.log('Seeded referees and ball crew.');
  }

  // Fetch all players early for use in coach seeding
  const allPlayers = await prisma.player.findMany();

  // Seed staff and coaches attached to the club (peterPlayer)
  if (peterPlayer) {
    const employedById = peterPlayer.userId;
    const staffSeed = [
      {
        name: 'James Mwangi',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
        role: 'Head Coach',
        email: 'james@club.com',
        phone: '+254722111001',
        gender: 'Male',
        nationality: 'Kenya',
        yearsOfExperience: 15,
        expertise: 'Tactical Coaching',
        coachingLevel: 'Professional',
        formerPlayerBackground: 'Former ATP player, reached top 100',
        bio: 'Head Coach with 15+ years of experience in tactical development and match preparation.',
        coachingPhilosophy: 'Focus on mental resilience and strategic play',
        achievements: 'Trained 5 ATP players, 10+ top-100 juniors',
        playerAgeGroups: ['Teens', 'Adults'],
        skillLevelsTrained: ['Intermediate', 'Advanced', 'Professional'],
        trainingTypes: ['Private sessions', 'Group sessions'],
        languagesSpoken: ['English', 'Swahili'],
        courtLocations: ['Club A Main Court', 'Club B Courts'],
        sessionDurations: [60, 90],
        maxStudentsPerSession: 2,
        isVerified: true,
        isActive: true,
        contact: 'james@club.com',
        employedById,
      },
      {
        name: 'Amara Okoro',
        photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80',
        role: 'Fitness Coach',
        email: 'amara@club.com',
        phone: '+254722111002',
        gender: 'Female',
        nationality: 'Nigeria',
        yearsOfExperience: 10,
        expertise: 'Fitness & Conditioning',
        coachingLevel: 'Advanced',
        formerPlayerBackground: 'Former collegiate tennis player',
        bio: 'Certified fitness trainer specializing in tennis-specific conditioning.',
        coachingPhilosophy: 'Build strength through sport-specific training',
        achievements: 'Improved player fitness levels by average 35%',
        playerAgeGroups: ['Teens', 'Adults'],
        skillLevelsTrained: ['Beginner', 'Intermediate', 'Advanced'],
        trainingTypes: ['Group sessions', 'Private sessions'],
        languagesSpoken: ['English', 'Yoruba'],
        courtLocations: ['Fitness Center A'],
        sessionDurations: [45, 60],
        maxStudentsPerSession: 8,
        isVerified: true,
        isActive: true,
        contact: 'amara@club.com',
        employedById,
      },
      {
        name: 'Carlos Mendes',
        photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80',
        role: 'Junior Coach',
        email: 'carlos@club.com',
        phone: '+254722111003',
        gender: 'Male',
        nationality: 'Portugal',
        yearsOfExperience: 6,
        expertise: 'Technique & Drills',
        coachingLevel: 'Intermediate',
        formerPlayerBackground: 'Juniors national circuit player',
        bio: 'Passionate junior coach focused on technique development and fun.',
        coachingPhilosophy: 'Make learning fun while building solid fundamentals',
        achievements: 'Coached 20+ juniors, 5 reached regional finals',
        playerAgeGroups: ['Kids', 'Teens'],
        skillLevelsTrained: ['Beginner', 'Intermediate'],
        trainingTypes: ['Group sessions', 'Clinics'],
        languagesSpoken: ['English', 'Portuguese', 'Spanish'],
        courtLocations: ['Club A Courts 1-4'],
        sessionDurations: [30, 45],
        maxStudentsPerSession: 6,
        isVerified: true,
        isActive: true,
        contact: 'carlos@club.com',
        employedById,
      },
      {
        name: 'Lina Gomez',
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80',
        role: 'Head Coach',
        email: 'lina@club.com',
        phone: '+254722111004',
        gender: 'Female',
        nationality: 'Spain',
        yearsOfExperience: 12,
        expertise: 'Serve & Return',
        coachingLevel: 'Professional',
        formerPlayerBackground: 'WTA player, career-high ranking 245',
        bio: 'Specialist in serve and return tactics with professional player experience.',
        coachingPhilosophy: 'Precision and consistency in every stroke',
        achievements: 'Improved average serve speed by 15%, raised 2 players to top 50 juniors',
        playerAgeGroups: ['Teens', 'Adults'],
        skillLevelsTrained: ['Intermediate', 'Advanced', 'Professional'],
        trainingTypes: ['Private sessions', 'Online coaching'],
        languagesSpoken: ['English', 'Spanish', 'Catalan'],
        courtLocations: ['Club B Premium Court'],
        sessionDurations: [60, 90],
        maxStudentsPerSession: 1,
        isVerified: true,
        isActive: true,
        contact: 'lina@club.com',
        employedById,
      },
      {
        name: 'Mohamed Hassan',
        photo: 'https://images.unsplash.com/photo-1545996124-1b3d5b84c0b5?w=800&q=80',
        role: 'Assistant Coach',
        email: 'mohamed@club.com',
        phone: '+254722111005',
        gender: 'Male',
        nationality: 'Kenya',
        yearsOfExperience: 8,
        expertise: 'Doubles & Strategy',
        coachingLevel: 'Intermediate',
        formerPlayerBackground: 'Former doubles player',
        bio: 'Specialized in doubles coaching and match strategy.',
        coachingPhilosophy: 'Teamwork and communication are key',
        achievements: 'Coached 3 doubles teams to regional titles',
        playerAgeGroups: ['Teens', 'Adults'],
        skillLevelsTrained: ['Beginner', 'Intermediate', 'Advanced'],
        trainingTypes: ['Group sessions', 'Private sessions'],
        languagesSpoken: ['English', 'Swahili', 'Arabic'],
        courtLocations: ['Club A Courts'],
        sessionDurations: [60, 90],
        maxStudentsPerSession: 4,
        isVerified: true,
        isActive: true,
        contact: 'mohamed@club.com',
        employedById,
      },
    ];

    try {
      // create users and staff profiles individually
      for (const s of staffSeed) {
        const username = s.email.split('@')[0];
        const [firstName, ...rest] = s.name.split(' ');
        const lastName = rest.join(' ');
        const passwordHash = await bcrypt.hash('tennis123', 10);
        // take out properties that belong on the User record rather than Staff
        const { name, email, phone, photo, gender, nationality, bio, ...staffFields } = s;

        // Upsert the User profile. Keep the additional fields (photo, gender,
        // nationality, bio) synced in case they change in the seed data.
        const user = await prisma.user.upsert({
          where: { email: email },
          update: {
            username,
            phone,
            photo,
            gender,
            nationality,
            bio,
          },
          create: {
            username,
            email,
            phone,
            passwordHash,
            firstName,
            lastName,
            photo,
            gender,
            nationality,
            bio,
          },
        });
        // staffFields now only contains fields applicable to the Staff model
        await prisma.staff.upsert({
          where: { userId: user.id },
          update: { ...staffFields },
          create: { userId: user.id, ...staffFields },
        });
      }
      console.log('Seeded comprehensive coach/staff data.');
      // Attach staff employed by the club to the organization if it exists
      const org = await prisma.organization.findUnique({ where: { name: 'Pwani University Tennis Club' } });
      if (org) {
        await prisma.staff.updateMany({ where: { employedById }, data: { organizationId: org.id } });
      }
    } catch (error) {
      console.error('Error creating staff:', error);
      throw error;
    }

    // Now add certifications, specializations, availability, and pricing for coaches
    const coaches = await prisma.staff.findMany({ where: { role: { contains: 'Coach' } } });
    
    for (const coach of coaches) {
      // Add certifications
      const certifications = [
        { name: 'ITF Level 1', issuer: 'ITF', issuedAt: new Date('2015-01-15'), expiresAt: new Date('2025-12-31') },
        { name: 'ATP Certified Coach', issuer: 'ATP', issuedAt: new Date('2018-06-20'), expiresAt: new Date('2026-06-20') },
        { name: 'National Federation License', issuer: 'Kenya Tennis Association', issuedAt: new Date('2020-03-10') },
      ];
      
      for (const cert of certifications.slice(0, Math.floor(Math.random() * 3) + 1)) {
        await prisma.certification.create({
          data: { staffId: coach.userId, ...cert }
        }).catch(() => {}); // ignore duplicates
      }

      // Add specializations
      const specs = [
        { name: 'Singles', level: 'Advanced', yearsOfFocus: 10 },
        { name: 'Doubles', level: 'Intermediate', yearsOfFocus: 5 },
        { name: 'Juniors', level: coach.role.includes('Junior') ? 'Advanced' : 'Intermediate', yearsOfFocus: coach.yearsOfExperience || 5 },
        { name: 'High-performance', level: 'Professional', yearsOfFocus: 8 },
      ];
      
      for (const spec of specs.slice(0, Math.floor(Math.random() * 3) + 2)) {
        await prisma.specialization.create({
          data: { staffId: coach.userId, ...spec }
        }).catch(() => {}); // ignore duplicates
      }

      // Add weekly availability (5 days a week, 8am-6pm with breaks)
      const availability = [
        { dayOfWeek: 0, startTime: '08:00', endTime: '12:00' }, // Monday morning
        { dayOfWeek: 0, startTime: '14:00', endTime: '18:00' }, // Monday afternoon
        { dayOfWeek: 1, startTime: '08:00', endTime: '12:00' }, // Tuesday morning
        { dayOfWeek: 1, startTime: '14:00', endTime: '18:00' }, // Tuesday afternoon
        { dayOfWeek: 2, startTime: '08:00', endTime: '18:00' }, // Wednesday full day
        { dayOfWeek: 3, startTime: '08:00', endTime: '12:00' }, // Thursday morning
        { dayOfWeek: 3, startTime: '14:00', endTime: '18:00' }, // Thursday afternoon
        { dayOfWeek: 4, startTime: '08:00', endTime: '18:00' }, // Friday full day
        { dayOfWeek: 5, startTime: '09:00', endTime: '12:00' }, // Saturday morning
      ];
      
      for (const slot of availability) {
        await prisma.availability.create({
          data: { staffId: coach.userId, ...slot }
        }).catch(() => {}); // ignore duplicates
      }

      // Add pricing
      const basePrice = 50 + Math.random() * 100; // $50-150 per session
      await prisma.coachPricing.create({
        data: {
          staffId: coach.userId,
          pricePerSession: parseFloat(basePrice.toFixed(2)),
          currency: 'USD',
          package3Sessions: parseFloat((basePrice * 2.8).toFixed(2)),
          package10Sessions: parseFloat((basePrice * 9).toFixed(2)),
          juniorDiscount: 10,
          groupSessionDiscount: 15,
          commissionRate: 5,
          paymentMethods: ['credit_card', 'bank_transfer', 'mobile_money'],
        }
      }).catch(() => {});

      // Add some reviews
      const players = allPlayers.slice(0, Math.floor(Math.random() * 3) + 1);
      for (const player of players) {
        await prisma.coachReview.create({
          data: {
            staffId: coach.userId,
            playerId: player.userId,
            rating: Math.round((3 + Math.random() * 2) * 2) / 2, // 3-5 stars
            reviewText: ['Great coach!', 'Very professional', 'Learned a lot', 'Highly recommended'][
              Math.floor(Math.random() * 4)
            ],
          }
        }).catch(() => {});
      }
    }
    
    console.log('Seeded coach certifications, specializations, availability, pricing, and reviews.');
  }

  // Seed badges and assign some to players
  const badgeSeed = [
    { name: 'First Victory', description: 'Awarded for first match win', category: 'Wins', icon: null },
    { name: 'Top Referee', description: 'Outstanding referee performance', category: 'Referee', icon: null },
    { name: 'Participation', description: 'Participated in an event', category: 'Participation', icon: null },
  ];
  await prisma.badge.createMany({ data: badgeSeed, skipDuplicates: true });
  console.log('Seeded badges.');

  const allBadges = await prisma.badge.findMany();

  // Assign some badges to a few players
  if (allPlayers.length > 0 && allBadges.length > 0) {
    const pbData: any[] = [];
    for (let i = 0; i < allPlayers.length; i++) {
      if (i % 2 === 0) {
        const badge = allBadges.find(b => b.name === 'Participation') || allBadges[0];
        pbData.push({ playerId: allPlayers[i].userId, badgeId: badge.id });
      }
      if (i === 0) {
        const badge = allBadges.find(b => b.name === 'First Victory') || allBadges[0];
        pbData.push({ playerId: allPlayers[i].userId, badgeId: badge.id });
      }
    }
    if (pbData.length > 0) await prisma.playerBadge.createMany({ data: pbData, skipDuplicates: true });
    console.log('Seeded player badges.');
  }

  // Seed some sample matches
  if (allPlayers.length >= 2) {
    const matchPairs: Array<[number, number]> = [];
    for (let i = 0; i < Math.min(12, allPlayers.length - 1); i++) {
      matchPairs.push([i, i + 1]);
    }
    
    // Create completed matches
    for (let i = 0; i < matchPairs.length; i++) {
      const [aIdx, bIdx] = matchPairs[i];
      const playerA = allPlayers[aIdx];
      const playerB = allPlayers[bIdx];
      const winner = Math.random() > 0.5 ? playerA : playerB;
      await prisma.match.create({
        data: {
          round: 1,
          playerA: { connect: { userId: playerA.userId } },
          playerB: { connect: { userId: playerB.userId } },
          winner: { connect: { userId: winner.userId } },
          score: Math.random() > 0.5 ? '6-4' : '7-5',
          group: `Pool ${Math.floor(i / 3) + 1}`,
        }
      });
    }
    
    // Create upcoming matches (without winners)
    const upcomingPairs: Array<[number, number]> = [];
    for (let i = 0; i < Math.min(8, allPlayers.length - 1); i++) {
      const idx1 = (i * 2) % allPlayers.length;
      const idx2 = (i * 2 + 1) % allPlayers.length;
      if (idx1 !== idx2) {
        upcomingPairs.push([idx1, idx2]);
      }
    }
    
    for (let i = 0; i < upcomingPairs.length; i++) {
      const [aIdx, bIdx] = upcomingPairs[i];
      const playerA = allPlayers[aIdx];
      const playerB = allPlayers[bIdx];
      await prisma.match.create({
        data: {
          round: 2,
          playerA: { connect: { userId: playerA.userId } },
          playerB: { connect: { userId: playerB.userId } },
          group: `Pool ${Math.floor(i / 2) + 1}`,
        }
      });
    }
    console.log('Seeded sample matches.');
  }

  // Seed attendance and performance data for analytics
  if (allPlayers.length > 0) {
    const attendanceSeed: any[] = [];
    const performanceSeed: any[] = [];
    const days = 90; // last 90 days
    const today = new Date();
    for (let d = days; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(today.getDate() - d);
      // randomly pick attendees (30-70% of players)
      const attendees = allPlayers.filter(() => Math.random() < 0.5 + Math.random() * 0.2);
      attendees.forEach((p) => {
        attendanceSeed.push({ playerId: p.userId, date, present: true });
      });
    }

    // For performance, create 12 weekly ratings per player
    for (const p of allPlayers) {
      for (let w = 12; w >= 0; w--) {
        const date = new Date(today);
        date.setDate(today.getDate() - w * 7);
        const rating = 50 + Math.round(Math.random() * 50) + (Math.random() - 0.5) * 10; // 40-110-ish
        const points = Math.max(0, Math.round(Math.random() * 1000));
        performanceSeed.push({ playerId: p.userId, date, rating: Math.round(rating * 10) / 10, points });
      }
    }

    if (attendanceSeed.length > 0) {
      // chunk inserts to avoid huge single insert
      for (let i = 0; i < attendanceSeed.length; i += 500) {
        const chunk = attendanceSeed.slice(i, i + 500);
        await prisma.attendance.createMany({ data: chunk, skipDuplicates: true });
      }
      console.log('Seeded attendance data.');
    }

    if (performanceSeed.length > 0) {
      for (let i = 0; i < performanceSeed.length; i += 500) {
        const chunk = performanceSeed.slice(i, i + 500);
        await prisma.performancePoint.createMany({ data: chunk, skipDuplicates: true });
      }
      console.log('Seeded performance data.');
    }
  }

  // Seed Tennis Rules
  const rulesSeed = [
    // Scoring System
    { category: 'Scoring', label: '0 points', value: 'Love' },
    { category: 'Scoring', label: '1 point', value: '15' },
    { category: 'Scoring', label: '2 points', value: '30' },
    { category: 'Scoring', label: '3 points', value: '40' },
    { category: 'Scoring', label: '4+ points', value: 'Game (2+ point lead)' },
    { category: 'Scoring', label: '6 games', value: 'Set (2+ game lead)' },
    // Basic Rules
    { category: 'Basic Rules', label: 'Server Position', value: 'Server must stand behind baseline' },
    { category: 'Basic Rules', label: 'Service Box', value: 'Ball must land in opposite service box' },
    { category: 'Basic Rules', label: 'Serving Order', value: 'Players alternate serves each game' },
    { category: 'Basic Rules', label: 'Deuce', value: 'Tie at 40-40 is called "Deuce"' },
    { category: 'Basic Rules', label: 'Match Format', value: 'Best of 3 or 5 sets wins match' },
    { category: 'Basic Rules', label: 'Win Condition', value: 'Must win by 2 points/games' },
    // Court & Equipment
    { category: 'Court & Equipment', label: 'Court Dimensions', value: 'Court: 78 feet long, 27 feet wide' },
    { category: 'Court & Equipment', label: 'Net Height', value: 'Net height: 3 feet 6 inches at edges' },
    { category: 'Court & Equipment', label: 'Ball Weight', value: 'Ball weight: 56-59 grams' },
    { category: 'Court & Equipment', label: 'Racket Length', value: 'Racket max length: 29 inches' },
    { category: 'Court & Equipment', label: 'Court Surfaces', value: 'Surfaces: hard, clay, grass' },
    // Key Violations
    { category: 'Key Violations', label: 'Net Touch', value: 'Touching the net = loss of point' },
    { category: 'Key Violations', label: 'Double Fault', value: 'Double fault = loss of point' },
    { category: 'Key Violations', label: 'Double Bounce', value: 'Ball bounces twice = loss of point' },
    { category: 'Key Violations', label: 'Hindrance', value: 'Hindrance/distraction = violation' },
    { category: 'Key Violations', label: 'Line Calls', value: 'Line calls by officials/players' },
  ];

  try {
    await prisma.tennisRule.createMany({ data: rulesSeed, skipDuplicates: true });
    console.log('Seeded tennis rules.');
  } catch (error) {
    console.error('Error seeding rules:', error);
  }

  // ==================== SEED CLUB MANAGEMENT SYSTEM ====================
  console.log('\n🌱 Seeding club management system...\n');

  try {
    // Fetch created players
    const playersData = await prisma.player.findMany({
      where: { user: { username: { in: ['julius', 'joe', 'leah'] } } },
      take: 3,
    });

    if (playersData.length === 0) {
      console.log('⚠️  No players found to create organizations');
      return;
    }

    // Create Organizations
    const org1 = await prisma.organization.upsert({
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
        primaryColor: '#0ea5e9',
        createdBy: playersData[0].userId,
        rating: 4.7,
        ratingCount: 156,
        verifiedBadge: true,
        activityScore: 92,
        playerDevScore: 85,
        tournamentEngScore: 88,
      },
    });

    const org2 = await prisma.organization.upsert({
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
        primaryColor: '#06b6d4',
        createdBy: playersData[1].userId,
        rating: 4.5,
        ratingCount: 98,
        verifiedBadge: true,
        activityScore: 88,
        playerDevScore: 92,
        tournamentEngScore: 82,
      },
    });

    console.log(`✅ Created ${org1.name} and ${org2.name}`);

    // Create Membership Tiers
    const tierGold = await prisma.membershipTier.upsert({
      where: { name: 'Gold' },
      update: {
        organizationId: org1.id,
        description: 'Premium membership with unlimited court access',
        monthlyPrice: 5000,
        benefitsJson: JSON.stringify(['Unlimited court access', '50% coaching discount', 'Priority tournament registration']),
        courtHoursPerMonth: 999,
        maxConcurrentBookings: 10,
        discountPercentage: 50,
      },
      create: {
        organizationId: org1.id,
        name: 'Gold',
        description: 'Premium membership with unlimited court access',
        monthlyPrice: 5000,
        benefitsJson: JSON.stringify(['Unlimited court access', '50% coaching discount', 'Priority tournament registration']),
        courtHoursPerMonth: 999,
        maxConcurrentBookings: 10,
        discountPercentage: 50,
      },
    });

    const tierSilver = await prisma.membershipTier.upsert({
      where: { name: 'Silver' },
      update: {
        organizationId: org1.id,
        description: 'Standard membership with limited court access',
        monthlyPrice: 2500,
        benefitsJson: JSON.stringify(['40 hours court access', '25% coaching discount']),
        courtHoursPerMonth: 40,
        maxConcurrentBookings: 5,
        discountPercentage: 25,
      },
      create: {
        organizationId: org1.id,
        name: 'Silver',
        description: 'Standard membership with limited court access',
        monthlyPrice: 2500,
        benefitsJson: JSON.stringify(['40 hours court access', '25% coaching discount']),
        courtHoursPerMonth: 40,
        maxConcurrentBookings: 5,
        discountPercentage: 25,
      },
    });

    console.log('✅ Created membership tiers');

    // Create Courts
    const court1 = await prisma.court.upsert({
      where: { organizationId_courtNumber: { organizationId: org1.id, courtNumber: 1 } },
      update: {
        name: 'Court 1',
        surface: 'Hard',
        indoorOutdoor: 'outdoor',
        lights: true,
        status: 'available',
      },
      create: {
        organizationId: org1.id,
        name: 'Court 1',
        courtNumber: 1,
        surface: 'Hard',
        indoorOutdoor: 'outdoor',
        lights: true,
        status: 'available',
      },
    });

    const court2 = await prisma.court.upsert({
      where: { organizationId_courtNumber: { organizationId: org1.id, courtNumber: 2 } },
      update: {
        name: 'Court 2',
        surface: 'Clay',
        indoorOutdoor: 'outdoor',
        lights: true,
        status: 'available',
      },
      create: {
        organizationId: org1.id,
        name: 'Court 2',
        courtNumber: 2,
        surface: 'Clay',
        indoorOutdoor: 'outdoor',
        lights: true,
        status: 'available',
      },
    });

    console.log('✅ Created courts');

    // Create Club Members
    const clubMember1 = await prisma.clubMember.upsert({
      where: { organizationId_playerId: { organizationId: org1.id, playerId: playersData[0].userId } },
      update: {},
      create: {
        organizationId: org1.id,
        playerId: playersData[0].userId,
        tierId: tierGold.id,
        role: 'admin',
        joinDate: new Date('2023-01-15'),
        autoRenew: true,
        paymentStatus: 'active',
        attendanceCount: 156,
      },
    });

    const clubMember2 = await prisma.clubMember.upsert({
      where: { organizationId_playerId: { organizationId: org1.id, playerId: playersData[1].userId } },
      update: {},
      create: {
        organizationId: org1.id,
        playerId: playersData[1].userId,
        tierId: tierGold.id,
        role: 'coach',
        joinDate: new Date('2023-02-10'),
        autoRenew: true,
        paymentStatus: 'active',
        attendanceCount: 142,
      },
    });

    console.log('✅ Created club members');

    // Create Organization Roles (idempotent via upsert on orgId+name unique index)
    const roleAdmin = await prisma.organizationRole.upsert({
      where: { organizationId_name: { organizationId: org1.id, name: 'Admin' } },
      update: { description: 'Full access to all features' },
      create: {
        organizationId: org1.id,
        name: 'Admin',
        description: 'Full access to all features',
      },
    });

    // ensure admin permissions exist separately
    const rolePermissions = ['manage_members', 'manage_courts', 'view_revenue'];
    for (const perm of rolePermissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionName: { roleId: roleAdmin.id, permissionName: perm } },
        update: {},
        create: {
          organizationId: org1.id,
          roleId: roleAdmin.id,
          permissionName: perm,
        },
      });
    }

    console.log('✅ Created organization roles');

    // Create Club Announcements (use deterministic id to allow upsert)
    const announcementId = 'welcome-nairobi';
    await prisma.clubAnnouncement.upsert({
      where: { id: announcementId },
      update: {},
      create: {
        id: announcementId,
        organizationId: org1.id,
        title: 'Welcome to Nairobi Tennis Club',
        message: 'We are excited to have you as a member. Start booking courts today!',
        announcementType: 'general',
        targetRoles: ['member', 'admin', 'coach'],
        createdBy: playersData[0].userId,
        isActive: true,
      },
    });

    console.log('✅ Created announcements');

    // Create Club Event. There is no unique index on (organizationId,name),
    // so we first look for an existing event and create it if missing.
    const now = new Date();
    let event = await prisma.clubEvent.findFirst({
      where: { organizationId: org1.id, name: 'February 2026 Tournament' },
    });
    if (!event) {
      event = await prisma.clubEvent.create({
        data: {
          organizationId: org1.id,
          name: 'February 2026 Tournament',
          description: 'Monthly tournament for all members',
          eventType: 'tournament',
          startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          registrationCap: 32,
          registrationDeadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          location: 'Nairobi Tennis Club',
          prizePool: 50000,
          entryFee: 2000,
        },
      });
    } else {
      // optionally update fields if they changed
      await prisma.clubEvent.update({
        where: { id: event.id },
        data: {
          description: 'Monthly tournament for all members',
          eventType: 'tournament',
          startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          registrationCap: 32,
          registrationDeadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          location: 'Nairobi Tennis Club',
          prizePool: 50000,
          entryFee: 2000,
        },
      });
    }

    await prisma.eventRegistration.upsert({
      where: { eventId_memberId: { eventId: event.id, memberId: clubMember1.id } },
      update: { status: 'registered', signupOrder: 1 },
      create: { eventId: event.id, memberId: clubMember1.id, status: 'registered', signupOrder: 1 },
    });

    console.log('✅ Created club events');

    // Create Club Finance
    await prisma.clubFinance.upsert({
      where: { organizationId_month_year: { organizationId: org1.id, month: now.getMonth() + 1, year: now.getFullYear() } },
      update: {
        membershipRevenue: 45000,
        courtBookingRevenue: 28500,
        coachCommissions: 12000,
        eventRevenue: 36000,
        totalRevenue: 121500,
        totalExpenses: 55000,
        netProfit: 66500,
      },
      create: {
        organizationId: org1.id,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        membershipRevenue: 45000,
        courtBookingRevenue: 28500,
        coachCommissions: 12000,
        eventRevenue: 36000,
        totalRevenue: 121500,
        totalExpenses: 55000,
        netProfit: 66500,
      },
    });

    console.log('✅ Created club finances');

    // Create Organization Badges (use findFirst because there is no unique index)
    const existingBadge = await prisma.organizationBadge.findFirst({
      where: { organizationId: org1.id, badgeName: 'Verified Club' },
    });
    if (!existingBadge) {
      await prisma.organizationBadge.create({
        data: {
          organizationId: org1.id,
          badgeName: 'Verified Club',
          badgeType: 'verified',
          achievementDate: new Date('2023-06-01'),
        },
      });
    } else {
      // optionally update
      await prisma.organizationBadge.update({
        where: { id: existingBadge.id },
        data: { achievementDate: new Date('2023-06-01'), badgeType: 'verified' },
      });
    }

    console.log('✅ Created organization badges');

    // ------------------------------------------------------------------
    // SAMPLE CHAT DATA
    // create a simple chat room between the first two players with
    // a couple of messages demonstrating delivery/read durations
    // ------------------------------------------------------------------
    try {
      const chatPlayers = await prisma.player.findMany({ take: 2, include: { user: true } });
      if (chatPlayers.length >= 2) {
        const [p1, p2] = chatPlayers;
        let room = await prisma.chatRoom.findFirst({ where: { name: 'General' } });
        if (!room) {
          room = await prisma.chatRoom.create({
            data: {
              name: 'General',
              description: 'General discussion',
              createdBy: p1.userId,
              participants: {
                create: [
                  { playerId: p1.userId, isOnline: false, lastSeen: new Date() },
                  { playerId: p2.userId, isOnline: false, lastSeen: new Date() },
                ],
              },
            },
          });
        }

        // sample messages with varying receipt state
        await prisma.chatMessage.createMany({
          data: [
            {
              roomId: room.id,
              playerId: p1.userId,
              content: 'Hello there!',
              createdAt: new Date(),
              // not read yet
            },
            {
              roomId: room.id,
              playerId: p2.userId,
              content: "Hey! I'm online now.",
              createdAt: new Date(),
            },
          ],
          skipDuplicates: true,
        });
        console.log('✅ Seeded sample chat room and messages');
      }
    } catch (chatError) {
      console.error('Error seeding sample chat data:', chatError);
    }

    console.log('\n✅ Club management system seeded successfully!\n');
  } catch (error) {
    console.error('Error seeding club management:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });