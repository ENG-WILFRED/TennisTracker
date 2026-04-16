import { PrismaClient } from './src/generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Kenya locations with coordinates
const kenyaLocations = [
  { city: 'Nairobi', latitude: -1.2866, longitude: 36.8172 },
  { city: 'Mombasa', latitude: -4.0435, longitude: 39.6682 },
  { city: 'Kisumu', latitude: -0.1019, longitude: 34.7680 },
  { city: 'Nakuru', latitude: -0.3031, longitude: 36.0803 },
  { city: 'Eldoret', latitude: 0.5143, longitude: 35.2799 },
  { city: 'Kericho', latitude: -0.3667, longitude: 35.2833 },
  { city: 'Naivasha', latitude: -0.7167, longitude: 36.4667 },
  { city: 'Uasin Gishu', latitude: 0.9, longitude: 35.2 },
  { city: 'Kilifi', latitude: -3.6299, longitude: 39.8474 },
  { city: 'Lamu', latitude: -2.2833, longitude: 40.9 },
];

const firstNames = [
  'James', 'John', 'Robert', 'Michael', 'William',
  'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara',
  'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen',
  'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra',
  'Samuel', 'Patrick', 'Peter', 'Stephen', 'Kevin',
  'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin',
  'George', 'Edward', 'Brian', 'Ronald', 'Anthony',
  'Frank', 'Jacob', 'Joshua', 'Lawrence', 'Henry',
];

const lastNames = [
  'Karanja', 'Kipchoge', 'Mwangi', 'Kamandi', 'Kipngeno',
  'Nyambura', 'Ochieng', 'Koech', 'Kiplagat', 'Bett',
  'Kipchemboi', 'Kiplagat', 'Wanyonyi', 'Kipchoge', 'Kiplagat',
  'Kiprotich', 'Kipchoge', 'Kiplagat', 'Kipchemboi', 'Kiplagat',
  'Mutua', 'Muthami', 'Kariuki', 'Kimani', 'Kipchoge',
  'Njoroge', 'Mwangi', 'Kipchoge', 'Nyambura', 'Karanja',
  'Ochieng', 'Koech', 'Kiplagat', 'Kipchemboi', 'Wanyonyi',
  'Kipchoge', 'Kiplagat', 'Kiprotich', 'Kipchoge', 'Kiplagat',
  'Kipchemboi', 'Kiplagat', 'Wanyonyi', 'Kipchoge', 'Kiplagat',
  'Kiprotich', 'Kipchoge', 'Kiplagat', 'Kipchemboi', 'Nyambura',
];

const photos = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
  'https://images.unsplash.com/photo-1505228395891-9a51e7e86e81?w=400&q=80',
];

const courts = [
  { name: 'Valley Court 1', surface: 'hard' },
  { name: 'Valley Court 2', surface: 'hard' },
  { name: 'Nairobi Club Court 1', surface: 'grass' },
  { name: 'Nairobi Club Court 2', surface: 'grass' },
  { name: 'KLTC Court 1', surface: 'hard' },
  { name: 'KLTC Court 2', surface: 'hard' },
  { name: 'KLTC Court 3', surface: 'clay' },
  { name: 'Mombasa Tennis Club 1', surface: 'hard' },
  { name: 'Mombasa Tennis Club 2', surface: 'hard' },
  { name: 'Kisumu Club Court', surface: 'grass' },
];

async function seedPlayersAndCourts() {
  try {
    console.log('🌱 Starting to seed 50 players from Kenya...');

    const password = await bcrypt.hash('tennis123', 10);

    // Create 50 players
    const playersData = [];
    for (let i = 0; i < 50; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[i % lastNames.length];
      const location = kenyaLocations[Math.floor(Math.random() * kenyaLocations.length)];

      // Add slight variation within each city
      const latVariation = (Math.random() - 0.5) * 0.1;
      const lonVariation = (Math.random() - 0.5) * 0.1;

      playersData.push({
        username: `player_${i + 1}`,
        email: `player${i + 1}@tennisdev.ke`,
        phone: `070000${String(i + 1).padStart(4, '0')}`,
        passwordHash: password,
        firstName,
        lastName,
        photo: photos[Math.floor(Math.random() * photos.length)],
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        dateOfBirth: new Date(1990 + Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        nationality: 'Kenya',
        city: location.city,
        latitude: location.latitude + latVariation,
        longitude: location.longitude + lonVariation,
        bio: `Tennis enthusiast from ${location.city}`,
      });
    }

    // Create users and players in batches
    for (let i = 0; i < playersData.length; i += 10) {
      const batch = playersData.slice(i, Math.min(i + 10, playersData.length));
      
      for (const playerData of batch) {
        try {
          const user = await prisma.user.create({
            data: playerData,
          });

          await prisma.player.create({
            data: {
              userId: user.id,
              matchesPlayed: Math.floor(Math.random() * 50),
              matchesWon: Math.floor(Math.random() * 30),
              matchesLost: Math.floor(Math.random() * 25),
            },
          });

          console.log(`✅ Created player: ${playerData.firstName} ${playerData.lastName} (${playerData.city})`);
        } catch (e: any) {
          if (!e.message.includes('Unique constraint failed')) {
            console.error(`❌ Error creating player ${playerData.firstName}:`, e.message);
          }
        }
      }
    }

    console.log('\n🏐 Starting to seed courts from Kenya...');

    // Get or create an organization for the courts
    let org = await prisma.organization.findUnique({
      where: { name: 'Kenya Tennis federation' },
    });

    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: 'Kenya Tennis federation',
          slug: 'kenya-tennis-federation',
          description: 'National tennis federation managing courts across Kenya',
          city: 'Nairobi',
          country: 'Kenya',
          email: 'info@kenyatennis.ke',
        },
      });
      console.log('✅ Created organization: Kenya Tennis federation');
    }

    // Create courts in different locations
    const courtGroups = [
      {
        location: { city: 'Nairobi', latitude: -1.2866, longitude: 36.8172 },
        courts: ['Valley Court 1', 'Valley Court 2', 'Nairobi Club Court 1', 'Nairobi Club Court 2', 'KLTC Court 1', 'KLTC Court 2', 'KLTC Court 3'],
        surfaces: ['hard', 'hard', 'grass', 'grass', 'hard', 'hard', 'clay'],
      },
      {
        location: { city: 'Mombasa', latitude: -4.0435, longitude: 39.6682 },
        courts: ['Mombasa Tennis Club 1', 'Mombasa Tennis Club 2', 'Mombasa Beach Court'],
        surfaces: ['hard', 'hard', 'grass'],
      },
      {
        location: { city: 'Kisumu', latitude: -0.1019, longitude: 34.7680 },
        courts: ['Kisumu Club Court', 'Kisumu Tennis Academy'],
        surfaces: ['grass', 'hard'],
      },
      {
        location: { city: 'Nakuru', latitude: -0.3031, longitude: 36.0803 },
        courts: ['Nakuru Sports Complex 1', 'Nakuru Sports Complex 2'],
        surfaces: ['hard', 'hard'],
      },
      {
        location: { city: 'Eldoret', latitude: 0.5143, longitude: 35.2799 },
        courts: ['Eldoret Tennis Center'],
        surfaces: ['hard'],
      },
    ];

    for (const group of courtGroups) {
      for (let i = 0; i < group.courts.length; i++) {
        const location = group.location;
        const latVariation = (Math.random() - 0.5) * 0.05;
        const lonVariation = (Math.random() - 0.5) * 0.05;

        try {
          await prisma.court.create({
            data: {
              organizationId: org.id,
              name: group.courts[i],
              courtNumber: i + 1,
              surface: group.surfaces[i] || 'hard',
              indoorOutdoor: 'outdoor',
              lights: Math.random() > 0.5,
              status: 'available',
              address: `${group.courts[i]}, ${location.city}`,
              city: location.city,
              country: 'Kenya',
              latitude: location.latitude + latVariation,
              longitude: location.longitude + lonVariation,
              width: 23.77,
              length: 10.97,
              maxCapacity: 4,
              amenities: ['parking', 'changing-rooms', 'showers'],
              rules: ['No metal studs', 'Professional dress code', 'Booking required'],
              availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
              openTime: '06:00',
              closeTime: '20:00',
            },
          });

          console.log(`✅ Created court: ${group.courts[i]} in ${location.city}`);
        } catch (e: any) {
          if (!e.message.includes('Unique constraint failed')) {
            console.error(`❌ Error creating court ${group.courts[i]}:`, e.message);
          }
        }
      }
    }

    console.log('\n✅ Seeding completed successfully!');
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedPlayersAndCourts();
