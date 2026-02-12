import { PrismaClient } from '../src/generated/prisma';
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Password for all demo users (hashed)
  const password = await bcrypt.hash("tennis123", 10);

  await prisma.player.createMany({
    data: [
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
        phone: '0700000006',
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
        phone: '0700000006',
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
    ],
    skipDuplicates: true,
  });

  console.log('Seeded 8 players with full details!');
  // mark 'peter' as club account
  const peter = await prisma.player.findUnique({ where: { username: 'peter' } });
  if (peter) {
    await prisma.player.update({ where: { id: peter.id }, data: { isClub: true } });

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
      inventorySeed.push({ name, count: Math.floor(Math.random() * 20), condition: ['Good','Fair','New'][i % 3], clubId: peter.id });
    }
    await prisma.inventoryItem.createMany({ data: inventorySeed, skipDuplicates: true });
    console.log('Seeded inventory items.');
  }

  // Seed referees and ball crew
  await prisma.referee.createMany({
    data: [
      {
        username: 'ref_smith',
        email: 'smith@referee.com',
        phone: '+254722222001',
        passwordHash: await bcrypt.hash("tennis123", 10),
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
        passwordHash: await bcrypt.hash("tennis123", 10),
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
        passwordHash: await bcrypt.hash("tennis123", 10),
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
        passwordHash: await bcrypt.hash("tennis123", 10),
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
        passwordHash: await bcrypt.hash("tennis123", 10),
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
    ],
    skipDuplicates: true,
  });

  console.log('Seeded 5 referees!');

  // Fetch all players early for use in coach seeding
  const allPlayers = await prisma.player.findMany();

  // Seed staff and coaches attached to the club (peter)
  if (peter) {
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
        employedById: peter.id,
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
        employedById: peter.id,
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
        employedById: peter.id,
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
        employedById: peter.id,
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
        employedById: peter.id,
      },
    ];
    try {
      await prisma.staff.createMany({ data: staffSeed, skipDuplicates: true });
      console.log('Seeded comprehensive coach/staff data.');
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
          data: { staffId: coach.id, ...cert }
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
          data: { staffId: coach.id, ...spec }
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
          data: { staffId: coach.id, ...slot }
        }).catch(() => {}); // ignore duplicates
      }

      // Add pricing
      const basePrice = 50 + Math.random() * 100; // $50-150 per session
      await prisma.coachPricing.create({
        data: {
          staffId: coach.id,
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
            staffId: coach.id,
            playerId: player.id,
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
        pbData.push({ playerId: allPlayers[i].id, badgeId: badge.id });
      }
      if (i === 0) {
        const badge = allBadges.find(b => b.name === 'First Victory') || allBadges[0];
        pbData.push({ playerId: allPlayers[i].id, badgeId: badge.id });
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
          playerA: { connect: { id: playerA.id } },
          playerB: { connect: { id: playerB.id } },
          winner: { connect: { id: winner.id } },
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
          playerA: { connect: { id: playerA.id } },
          playerB: { connect: { id: playerB.id } },
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
        attendanceSeed.push({ playerId: p.id, date, present: true });
      });
    }

    // For performance, create 12 weekly ratings per player
    for (const p of allPlayers) {
      for (let w = 12; w >= 0; w--) {
        const date = new Date(today);
        date.setDate(today.getDate() - w * 7);
        const rating = 50 + Math.round(Math.random() * 50) + (Math.random() - 0.5) * 10; // 40-110-ish
        const points = Math.max(0, Math.round(Math.random() * 1000));
        performanceSeed.push({ playerId: p.id, date, rating: Math.round(rating * 10) / 10, points });
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });