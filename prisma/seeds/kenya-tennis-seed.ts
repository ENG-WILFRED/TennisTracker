import { PrismaClient } from '../../src/generated/prisma/index.js';
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

// Coast region locations with precise coordinates for radius testing
const coastLocations = [
  { city: 'Mombasa', region: 'Old Town', latitude: -4.0435, longitude: 39.6682 },
  { city: 'Mombasa', region: 'Nyali', latitude: -4.0220, longitude: 39.7398 },
  { city: 'Mombasa', region: 'Diani', latitude: -4.2699, longitude: 39.5869 },
  { city: 'Mombasa', region: 'Bamburi', latitude: -3.9830, longitude: 39.7030 },
  { city: 'Mombasa', region: 'Likoni', latitude: -4.1299, longitude: 39.6580 },
  { city: 'Kilifi', region: 'Town Center', latitude: -3.6299, longitude: 39.8474 },
  { city: 'Kilifi', region: 'Watamu', latitude: -3.3847, longitude: 40.0289 },
  { city: 'Kilifi', region: 'Malindi', latitude: -3.2180, longitude: 40.1173 },
  { city: 'Lamu', region: 'Town Center', latitude: -2.2833, longitude: 40.9 },
  { city: 'Lamu', region: 'Pate Island', latitude: -2.0500, longitude: 41.1500 },
  { city: 'Mombasa', region: 'Shanzu', latitude: -3.9600, longitude: 39.7500 },
  { city: 'Mombasa', region: 'Ukunda', latitude: -4.2950, longitude: 39.5420 },
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

export async function seedKenyaPlayersAndCourts() {
  try {
    console.log('🌱 Starting comprehensive Kenya tennis seeding...');

    const password = await bcrypt.hash('tennis123', 10);

    // 1. Create Kenya Tennis Federation organization if it doesn't exist
    let federation = await prisma.organization.findUnique({
      where: { name: 'Kenya Tennis Federation' },
    });

    if (!federation) {
      federation = await prisma.organization.create({
        data: {
          name: 'Kenya Tennis Federation',
          slug: 'kenya-tennis-federation',
          description: 'National tennis federation managing courts and players across Kenya',
          address: 'Westlands, Nairobi',
          city: 'Nairobi',
          country: 'Kenya',
          phone: '+254-20-1234567',
          email: 'info@kenyatennis.ke',
          logo: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&q=80',
          primaryColor: '#006B3F',
          rating: 4.6,
          ratingCount: 89,
          verifiedBadge: true,
          activityScore: 85,
          playerDevScore: 82,
          tournamentEngScore: 78,
        },
      });
      console.log('✅ Created organization: Kenya Tennis Federation');
    }

    // 2. Create 250+ Kenyan players with heavy focus on coast region
    console.log('\n👥 Creating 250+ Kenyan players (150+ in coast region)...');
    const playersData = [];
    
    // Function to add radius variation to coordinates
    const getCoordinateWithRadius = (baseLat: number, baseLon: number, radiusKm: number) => {
      // 1 degree ≈ 111 km
      const latVariation = (Math.random() - 0.5) * (radiusKm / 111);
      const lonVariation = (Math.random() - 0.5) * (radiusKm / 111);
      return { latitude: baseLat + latVariation, longitude: baseLon + lonVariation };
    };
    
    const mombasaCenter = { latitude: -4.0435, longitude: 39.6682 };
    
    // Create coast region players distributed at different radius distances
    let playerIndex = 0;
    const radiusDistances = [1, 2, 5, 10, 15, 20]; // kilometers
    const playersPerRadiusPerRegion = 15; // 15 players per radius = 90 per region
    
    // For each coast location, create players at various distances
    for (const location of coastLocations) {
      for (const radius of radiusDistances) {
        for (let i = 0; i < playersPerRadiusPerRegion; i++) {
          const coords = getCoordinateWithRadius(location.latitude, location.longitude, radius);
          const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
          const lastName = lastNames[playerIndex % lastNames.length];
          
          playersData.push({
            username: `coast_player_${playerIndex + 1}`,
            email: `coast.player${playerIndex + 1}@kenyatennis.ke`,
            phone: `+254700${String(playerIndex + 1).padStart(5, '0')}`,
            passwordHash: password,
            firstName,
            lastName,
            photo: photos[Math.floor(Math.random() * photos.length)],
            gender: Math.random() > 0.5 ? 'Male' : 'Female',
            dateOfBirth: new Date(1985 + Math.floor(Math.random() * 25), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            nationality: 'Kenya',
            bio: `Tennis player from ${location.region}, ${location.city} - ${radius}km radius`,
            city: location.city,
            latitude: coords.latitude,
            longitude: coords.longitude,
            player: {
              create: {
                matchesPlayed: Math.floor(Math.random() * 80) + 10,
                matchesWon: Math.floor(Math.random() * 50) + 5,
                matchesLost: Math.floor(Math.random() * 35) + 3,
                organization: { connect: { id: federation.id } },
                isClub: Math.random() > 0.5, // 50% are club members
              },
            },
          });
          playerIndex++;
        }
      }
    }
    
    // Add 50 players to other regions
    for (let i = 0; i < 50; i++) {
      const location = kenyaLocations[Math.floor(Math.random() * kenyaLocations.length)];
      const latVariation = (Math.random() - 0.5) * 0.1;
      const lonVariation = (Math.random() - 0.5) * 0.1;
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[playerIndex % lastNames.length];

      playersData.push({
        username: `kenya_player_${playerIndex + 1}`,
        email: `player${playerIndex + 1}@kenyatennis.ke`,
        phone: `+254700${String(playerIndex + 1).padStart(5, '0')}`,
        passwordHash: password,
        firstName,
        lastName,
        photo: photos[Math.floor(Math.random() * photos.length)],
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        dateOfBirth: new Date(1990 + Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        nationality: 'Kenya',
        bio: `Tennis enthusiast from ${location.city}`,
        city: location.city,
        latitude: location.latitude + latVariation,
        longitude: location.longitude + lonVariation,
        player: {
          create: {
            matchesPlayed: Math.floor(Math.random() * 50),
            matchesWon: Math.floor(Math.random() * 30),
            matchesLost: Math.floor(Math.random() * 25),
            organization: { connect: { id: federation.id } },
            isClub: Math.random() > 0.7,
          },
        },
      });
      playerIndex++;
    }

    // Create users and players in batches
    const createdPlayers = [];
    for (let i = 0; i < playersData.length; i += 10) {
      const batch = playersData.slice(i, Math.min(i + 10, playersData.length));

      for (const playerData of batch) {
        try {
          const user = await prisma.user.create({
            data: playerData,
            include: { player: true },
          });
          createdPlayers.push(user);
          console.log(`✅ Created player: ${user.firstName} ${user.lastName} (${user.city})`);
        } catch (e: any) {
          if (!e.message.includes('Unique constraint failed')) {
            console.error(`❌ Error creating player ${playerData.firstName}:`, e.message);
          }
        }
      }
    }

    // 3. Create comprehensive courts across Kenya with heavy focus on coast
    console.log('\n🏐 Creating 100+ courts (60+ in coast region)...');

    const courtGroups = [
      // Coast Region - Extensive expansion
      {
        location: { city: 'Mombasa', region: 'Old Town', latitude: -4.0435, longitude: 39.6682 },
        courts: [
          { name: 'Mombasa Club Court 1', surface: 'hard', indoor: false, lights: true },
          { name: 'Mombasa Club Court 2', surface: 'hard', indoor: false, lights: true },
          { name: 'Mombasa Club Court 3', surface: 'clay', indoor: true, lights: true },
          { name: 'Old Town Tennis Courts 1', surface: 'hard', indoor: false, lights: true },
          { name: 'Old Town Tennis Courts 2', surface: 'grass', indoor: false, lights: false },
          { name: 'Fort Jesus Community Court', surface: 'hard', indoor: false, lights: true },
          { name: 'Mombasa Racquet Club 1', surface: 'hard', indoor: false, lights: true },
          { name: 'Mombasa Racquet Club 2', surface: 'grass', indoor: false, lights: true },
        ],
      },
      {
        location: { city: 'Mombasa', region: 'Nyali', latitude: -4.0220, longitude: 39.7398 },
        courts: [
          { name: 'Nyali Beach Courts 1', surface: 'hard', indoor: false, lights: true },
          { name: 'Nyali Beach Courts 2', surface: 'hard', indoor: false, lights: true },
          { name: 'Nyali Beach Courts 3', surface: 'grass', indoor: false, lights: false },
          { name: 'Nyali Sports Club 1', surface: 'hard', indoor: false, lights: true },
          { name: 'Nyali Sports Club 2', surface: 'hard', indoor: false, lights: true },
          { name: 'Nyali Recreational Courts', surface: 'clay', indoor: true, lights: true },
          { name: 'Nyali Tennis Academy 1', surface: 'hard', indoor: false, lights: true },
          { name: 'Nyali Tennis Academy 2', surface: 'hard', indoor: false, lights: true },
        ],
      },
      {
        location: { city: 'Mombasa', region: 'Diani', latitude: -4.2699, longitude: 39.5869 },
        courts: [
          { name: 'Diani Beach Club 1', surface: 'hard', indoor: false, lights: true },
          { name: 'Diani Beach Club 2', surface: 'grass', indoor: false, lights: false },
          { name: 'Diani Reef Resort Courts', surface: 'hard', indoor: false, lights: true },
          { name: 'Diani Sports Complex 1', surface: 'hard', indoor: false, lights: true },
          { name: 'Diani Sports Complex 2', surface: 'hard', indoor: false, lights: true },
          { name: 'Diani Tennis Academy 1', surface: 'clay', indoor: true, lights: true },
          { name: 'Diani Community Courts', surface: 'hard', indoor: false, lights: true },
        ],
      },
      {
        location: { city: 'Mombasa', region: 'Bamburi', latitude: -3.9830, longitude: 39.7030 },
        courts: [
          { name: 'Bamburi Beach Courts 1', surface: 'grass', indoor: false, lights: false },
          { name: 'Bamburi Beach Courts 2', surface: 'hard', indoor: false, lights: true },
          { name: 'Bamburi Sports Center 1', surface: 'hard', indoor: false, lights: true },
          { name: 'Bamburi Sports Center 2', surface: 'hard', indoor: false, lights: true },
          { name: 'Bamburi Wildlife Club Courts', surface: 'grass', indoor: false, lights: true },
          { name: 'Bamburi Tennis Courts 1', surface: 'hard', indoor: false, lights: true },
          { name: 'Bamburi Tennis Courts 2', surface: 'hard', indoor: false, lights: true },
        ],
      },
      {
        location: { city: 'Mombasa', region: 'Likoni', latitude: -4.1299, longitude: 39.6580 },
        courts: [
          { name: 'Likoni Community Courts 1', surface: 'hard', indoor: false, lights: true },
          { name: 'Likoni Community Courts 2', surface: 'hard', indoor: false, lights: true },
          { name: 'Likoni Sports Club', surface: 'grass', indoor: false, lights: false },
          { name: 'Likoni Tennis Academy', surface: 'hard', indoor: false, lights: true },
          { name: 'Likoni Ferry Area Courts', surface: 'hard', indoor: false, lights: true },
        ],
      },
      {
        location: { city: 'Mombasa', region: 'Shanzu', latitude: -3.9600, longitude: 39.7500 },
        courts: [
          { name: 'Shanzu Beach Courts 1', surface: 'hard', indoor: false, lights: true },
          { name: 'Shanzu Beach Courts 2', surface: 'grass', indoor: false, lights: false },
          { name: 'Shanzu Sports Complex', surface: 'hard', indoor: false, lights: true },
          { name: 'Shanzu Recreational Center 1', surface: 'hard', indoor: false, lights: true },
          { name: 'Shanzu Recreational Center 2', surface: 'hard', indoor: false, lights: true },
        ],
      },
      {
        location: { city: 'Mombasa', region: 'Ukunda', latitude: -4.2950, longitude: 39.5420 },
        courts: [
          { name: 'Ukunda Community Courts 1', surface: 'hard', indoor: false, lights: true },
          { name: 'Ukunda Community Courts 2', surface: 'hard', indoor: false, lights: true },
          { name: 'Ukunda Beach Club', surface: 'grass', indoor: false, lights: false },
          { name: 'Ukunda Tennis Center', surface: 'hard', indoor: false, lights: true },
        ],
      },
      {
        location: { city: 'Kilifi', region: 'Town Center', latitude: -3.6299, longitude: 39.8474 },
        courts: [
          { name: 'Kilifi Town Tennis Club 1', surface: 'hard', indoor: false, lights: true },
          { name: 'Kilifi Town Tennis Club 2', surface: 'grass', indoor: false, lights: false },
          { name: 'Kilifi Community Courts 1', surface: 'hard', indoor: false, lights: true },
          { name: 'Kilifi Community Courts 2', surface: 'hard', indoor: false, lights: true },
          { name: 'Kilifi Sports Center', surface: 'hard', indoor: false, lights: true },
          { name: 'Kilifi Racquet Club', surface: 'clay', indoor: true, lights: true },
        ],
      },
      {
        location: { city: 'Kilifi', region: 'Watamu', latitude: -3.3847, longitude: 40.0289 },
        courts: [
          { name: 'Watamu Beach Courts 1', surface: 'hard', indoor: false, lights: true },
          { name: 'Watamu Beach Courts 2', surface: 'grass', indoor: false, lights: false },
          { name: 'Watamu Marine Park Courts', surface: 'hard', indoor: false, lights: true },
          { name: 'Watamu Community Center', surface: 'hard', indoor: false, lights: true },
          { name: 'Watamu Tennis Academy', surface: 'hard', indoor: false, lights: true },
        ],
      },
      {
        location: { city: 'Kilifi', region: 'Malindi', latitude: -3.2180, longitude: 40.1173 },
        courts: [
          { name: 'Malindi Beach Club 1', surface: 'hard', indoor: false, lights: true },
          { name: 'Malindi Beach Club 2', surface: 'grass', indoor: false, lights: false },
          { name: 'Malindi Golf & Tennis Club', surface: 'hard', indoor: false, lights: true },
          { name: 'Malindi Town Courts 1', surface: 'hard', indoor: false, lights: true },
          { name: 'Malindi Town Courts 2', surface: 'hard', indoor: false, lights: true },
          { name: 'Malindi Sports Academy', surface: 'clay', indoor: true, lights: true },
        ],
      },
      {
        location: { city: 'Lamu', region: 'Town Center', latitude: -2.2833, longitude: 40.9 },
        courts: [
          { name: 'Lamu Island Tennis Club 1', surface: 'hard', indoor: false, lights: true },
          { name: 'Lamu Island Tennis Club 2', surface: 'grass', indoor: false, lights: false },
          { name: 'Lamu Community Sports Courts', surface: 'hard', indoor: false, lights: true },
          { name: 'Lamu Beach Courts', surface: 'hard', indoor: false, lights: true },
        ],
      },
      // Mainland Kenya locations
      {
        location: { city: 'Nairobi', latitude: -1.2866, longitude: 36.8172 },
        courts: [
          { name: 'Valley Road Court 1', surface: 'hard', indoor: false, lights: true },
          { name: 'Valley Road Court 2', surface: 'hard', indoor: false, lights: true },
          { name: 'Nairobi Club Court 1', surface: 'grass', indoor: false, lights: true },
          { name: 'Nairobi Club Court 2', surface: 'grass', indoor: false, lights: true },
          { name: 'KLTC Court 1', surface: 'hard', indoor: false, lights: true },
          { name: 'KLTC Court 2', surface: 'hard', indoor: false, lights: true },
          { name: 'KLTC Court 3', surface: 'clay', indoor: true, lights: true },
          { name: 'Westlands Court 1', surface: 'hard', indoor: false, lights: true },
          { name: 'Westlands Court 2', surface: 'hard', indoor: false, lights: true },
          { name: 'Karen Country Club 1', surface: 'grass', indoor: false, lights: true },
          { name: 'Karen Country Club 2', surface: 'grass', indoor: false, lights: true },
          { name: 'Lavington Court 1', surface: 'hard', indoor: false, lights: false },
          { name: 'Lavington Court 2', surface: 'hard', indoor: false, lights: false },
        ],
      },
      {
        location: { city: 'Kisumu', latitude: -0.1019, longitude: 34.7680 },
        courts: [
          { name: 'Kisumu Club Court 1', surface: 'grass', indoor: false, lights: true },
          { name: 'Kisumu Club Court 2', surface: 'hard', indoor: false, lights: true },
          { name: 'Kisumu Tennis Academy 1', surface: 'hard', indoor: false, lights: true },
          { name: 'Kisumu Tennis Academy 2', surface: 'hard', indoor: false, lights: true },
        ],
      },
      {
        location: { city: 'Nakuru', latitude: -0.3031, longitude: 36.0803 },
        courts: [
          { name: 'Nakuru Sports Complex 1', surface: 'hard', indoor: false, lights: true },
          { name: 'Nakuru Sports Complex 2', surface: 'hard', indoor: false, lights: true },
          { name: 'Nakuru Club Court', surface: 'grass', indoor: false, lights: false },
        ],
      },
      {
        location: { city: 'Eldoret', latitude: 0.5143, longitude: 35.2799 },
        courts: [
          { name: 'Eldoret Tennis Center 1', surface: 'hard', indoor: false, lights: true },
          { name: 'Eldoret Tennis Center 2', surface: 'hard', indoor: false, lights: true },
        ],
      },
      {
        location: { city: 'Kericho', latitude: -0.3667, longitude: 35.2833 },
        courts: [
          { name: 'Kericho Tea Estate Courts', surface: 'grass', indoor: false, lights: false },
        ],
      },
      {
        location: { city: 'Naivasha', latitude: -0.7167, longitude: 36.4667 },
        courts: [
          { name: 'Naivasha Country Club 1', surface: 'grass', indoor: false, lights: true },
          { name: 'Naivasha Country Club 2', surface: 'hard', indoor: false, lights: true },
        ],
      },
    ];

    const createdCourts = [];
    let courtNumber = 1;

    for (const group of courtGroups) {
      for (let i = 0; i < group.courts.length; i++) {
        const location = group.location;
        const courtInfo = group.courts[i];
        const latVariation = (Math.random() - 0.5) * 0.05;
        const lonVariation = (Math.random() - 0.5) * 0.05;

        try {
          const court = await prisma.court.create({
            data: {
              organizationId: federation.id,
              name: courtInfo.name,
              courtNumber: courtNumber++,
              surface: courtInfo.surface,
              indoorOutdoor: courtInfo.indoor ? 'indoor' : 'outdoor',
              lights: courtInfo.lights,
              status: 'available',
              address: `${courtInfo.name}, ${location.city}, Kenya`,
              city: location.city,
              country: 'Kenya',
              latitude: location.latitude + latVariation,
              longitude: location.longitude + lonVariation,
              width: 23.77,
              length: 10.97,
              maxCapacity: 4,
              amenities: ['parking', 'changing-rooms', 'showers', 'equipment-rental'],
              rules: ['No metal studs', 'Professional dress code', 'Booking required', 'Maximum 4 players per court'],
              availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
              openTime: '06:00',
              closeTime: '20:00',
            },
          });
          createdCourts.push(court);
          console.log(`✅ Created court: ${court.name} in ${location.city}`);
        } catch (e: any) {
          if (!e.message.includes('Unique constraint failed')) {
            console.error(`❌ Error creating court ${courtInfo.name}:`, e.message);
          }
        }
      }
    }

    // 4. Create bookings, comments, and complaints for courts
    console.log('\n📅 Creating bookings, comments, and complaints...');

    const now = new Date();
    const bookingStatusOptions = ['confirmed', 'pending', 'cancelled'];
    const players = createdPlayers.filter(u => u.player).slice(0, 20); // Use first 20 players

    let bookingCount = 0;
    let commentCount = 0;
    let complaintCount = 0;

    for (const court of createdCourts) {
      // Create 3-8 bookings per court
      const bookingsPerCourt = Math.floor(Math.random() * 6) + 3;

      for (let i = 0; i < bookingsPerCourt; i++) {
        const startDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days
        const startTime = new Date(startDate);
        startTime.setHours(Math.floor(Math.random() * 14) + 6); // 6 AM to 8 PM
        startTime.setMinutes(0);

        const duration = 60 + Math.floor(Math.random() * 120); // 1-3 hours
        const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

        const player = players[Math.floor(Math.random() * players.length)];

        try {
          await prisma.courtBooking.create({
            data: {
              courtId: court.id,
              organizationId: federation.id,
              memberId: player.id,
              startTime,
              endTime,
              status: bookingStatusOptions[Math.floor(Math.random() * bookingStatusOptions.length)],
              price: [500, 750, 1000, 1200, 1500][Math.floor(Math.random() * 5)],
              guestCount: Math.floor(Math.random() * 4) + 1,
              isPeak: startTime.getHours() >= 17 && startTime.getHours() <= 19,
              bookingType: 'regular',
            },
          });
          bookingCount++;
        } catch (e: any) {
          // Skip if booking conflicts
        }
      }

      // Create 1-3 comments per court
      const commentsForCourt = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < commentsForCourt; i++) {
        const player = players[Math.floor(Math.random() * players.length)];
        const ratings = [4, 4, 4.5, 5, 3.5, 4.5, 5];

        try {
          await prisma.courtComment.create({
            data: {
              courtId: court.id,
              authorId: player.id,
              content: [
                'Excellent court condition! Loved playing here.',
                'Great facilities and very well maintained.',
                'The lighting is perfect for evening matches.',
                'Surface quality is top-notch.',
                'Professional maintenance team, very impressed.',
                'Best court in Kenya!',
                'Good atmosphere and friendly staff.',
                'Perfect for competitive play.',
                'Well-maintained and clean facilities.',
                'Great location and easy to access.',
              ][Math.floor(Math.random() * 10)],
              rating: ratings[Math.floor(Math.random() * ratings.length)],
            },
          });
          commentCount++;
        } catch (e: any) {
          // Skip if comment creation fails
        }
      }

      // Create 0-2 complaints per court (30% chance)
      if (Math.random() > 0.7) {
        const complaintsForCourt = Math.floor(Math.random() * 2) + 1;

        for (let i = 0; i < complaintsForCourt; i++) {
          const player = players[Math.floor(Math.random() * players.length)];
          const categories = ['condition', 'maintenance', 'facility', 'other'];
          const severities = ['low', 'medium', 'high'];
          const statuses = ['pending', 'resolved', 'dismissed'];

          try {
            await prisma.courtComplaint.create({
              data: {
                courtId: court.id,
                authorId: player.id,
                title: [
                  'Crack in the surface',
                  'Broken lighting',
                  'Poor drainage',
                  'Inadequate seating',
                  'Maintenance issues',
                  'Safety concern',
                  'Equipment malfunction',
                  'Cleanliness issue',
                ][Math.floor(Math.random() * 8)],
                description: [
                  'There is a visible crack in the court surface during the last booking.',
                  'Some of the lights are not working properly, affecting visibility.',
                  'Water accumulation noticed after recent rain.',
                  'Spectator area needs better arrangement.',
                  'General maintenance needed for better playing experience.',
                  'Net post seems unstable, potential safety hazard.',
                  'Equipment storage area needs organization.',
                  'Facilities could be cleaner.',
                ][Math.floor(Math.random() * 8)],
                category: categories[Math.floor(Math.random() * categories.length)],
                severity: severities[Math.floor(Math.random() * severities.length)],
                status: statuses[Math.floor(Math.random() * statuses.length)],
                resolvedNotes: Math.random() > 0.5 ? 'Issue has been resolved and verified.' : undefined,
              },
            });
            complaintCount++;
          } catch (e: any) {
            // Skip if complaint creation fails
          }
        }
      }
    }

    console.log('\n✅ Kenya tennis seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Players: ${createdPlayers.length} (150+ in coast region with multi-radius distribution)`);
    console.log(`   - Courts: ${createdCourts.length} (60+ in coast region)`);
    console.log(`   - Bookings: ${bookingCount}`);
    console.log(`   - Comments: ${commentCount}`);
    console.log(`   - Complaints: ${complaintCount}`);
    console.log(`   - Coast Regions: Mombasa (Old Town, Nyali, Diani, Bamburi, Likoni, Shanzu, Ukunda), Kilifi (Town, Watamu, Malindi), Lamu`);
    console.log(`   - Radius Distribution: Players distributed at 1km, 2km, 5km, 10km, 15km, 20km radii for testing`);
    console.log(`   - Locations: ${courtGroups.length} cities/regions across Kenya`);

    return {
      players: createdPlayers,
      courts: createdCourts,
      bookings: bookingCount,
      comments: commentCount,
      complaints: complaintCount,
    };

  } catch (err) {
    console.error('❌ Error during Kenya seeding:', err);
    throw err;
  }
}