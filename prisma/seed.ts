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
        photo: '/images/federer.jpg',
        gender: 'Male',
        dateOfBirth: new Date('1981-08-08'),
        nationality: 'Switzerland',
        bio: '20-time Grand Slam champion.',
        matchesPlayed: 0,
        matchesRefereed: 0,
        matchesBallCrew: 0,
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
        photo: '/images/nadal.jpg',
        gender: 'Male',
        dateOfBirth: new Date('1986-06-03'),
        nationality: 'Spain',
        bio: 'King of Clay.',
        matchesPlayed: 0,
        matchesRefereed: 0,
        matchesBallCrew: 0,
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
        photo: '/images/djokovic.jpg',
        gender: 'female',
        dateOfBirth: new Date('1987-05-22'),
        nationality: 'Serbia',
        bio: 'Serbian tennis legend.',
        matchesPlayed: 0,
        matchesRefereed: 0,
        matchesBallCrew: 0,
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
        photo: '/images/williams.jpg',
        gender: 'Female',
        dateOfBirth: new Date('1981-09-26'),
        nationality: 'USA',
        bio: 'Greatest women\'s player.',
        matchesPlayed: 0,
        matchesRefereed: 0,
        matchesBallCrew: 0,
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
        photo: '/images/sharapova.jpg',
        gender: 'male',
        dateOfBirth: new Date('1987-04-19'),
        nationality: 'Russia',
        bio: 'Siberian Siren.',
        matchesPlayed: 0,
        matchesRefereed: 0,
        matchesBallCrew: 0,
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
        photo: '/images/murray.jpg',
        gender: 'Male',
        dateOfBirth: new Date('1987-05-15'),
        nationality: 'UK',
        bio: 'Scottish tennis star.',
        matchesPlayed: 0,
        matchesRefereed: 0,
        matchesBallCrew: 0,
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
        photo: '/images/murray.jpg',
        gender: 'Male',
        dateOfBirth: new Date('1987-05-15'),
        nationality: 'UK',
        bio: 'Scottish tennis star.',
        matchesPlayed: 0,
        matchesRefereed: 0,
        matchesBallCrew: 0,
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
        photo: '/images/murray.jpg',
        gender: 'Male',
        dateOfBirth: new Date('1987-05-15'),
        nationality: 'UK',
        bio: 'Scottish tennis star.',
        matchesPlayed: 0,
        matchesRefereed: 0,
        matchesBallCrew: 0,
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

  // Seed staff and coaches attached to the club (peter)
  if (peter) {
    const staffSeed = [
      { name: 'James Mwangi', role: 'Head Coach', expertise: 'Tactical Coaching', contact: 'james@club.com', photo: null, employedById: peter.id },
      { name: 'Amara Okoro', role: 'Assistant Coach', expertise: 'Fitness & Conditioning', contact: 'amara@club.com', photo: null, employedById: peter.id },
      { name: 'Carlos Mendes', role: 'Junior Coach', expertise: 'Technique & Drills', contact: 'carlos@club.com', photo: null, employedById: peter.id },
      { name: 'Aisha Sule', role: 'Physio', expertise: 'Physiotherapy', contact: 'aisha@club.com', photo: null, employedById: peter.id },
      { name: 'Peter Kimani', role: 'Equipment Manager', expertise: 'Inventory', contact: 'peter@club.com', photo: null, employedById: peter.id },
      { name: 'Lina Gomez', role: 'Coach', expertise: 'Serve & Return', contact: 'lina@club.com', photo: null, employedById: peter.id },
    ];
    await prisma.staff.createMany({ data: staffSeed, skipDuplicates: true });
    console.log('Seeded staff/coaches.');
  }

  // Seed badges and assign some to players
  const badgeSeed = [
    { name: 'First Victory', description: 'Awarded for first match win', category: 'Wins', icon: null },
    { name: 'Top Referee', description: 'Outstanding referee performance', category: 'Referee', icon: null },
    { name: 'Participation', description: 'Participated in an event', category: 'Participation', icon: null },
  ];
  await prisma.badge.createMany({ data: badgeSeed, skipDuplicates: true });
  console.log('Seeded badges.');

  const allPlayers = await prisma.player.findMany();
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });