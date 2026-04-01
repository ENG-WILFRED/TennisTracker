import { PrismaClient } from '../../src/generated/prisma/index.js';

const prisma = new PrismaClient();

export async function seedTournaments() {
  console.log('🏆 Seeding tournaments...');

  try {
    // Get all organizations
    const organizations = await prisma.organization.findMany({ take: 1 });
    if (organizations.length === 0) {
      console.log('⚠️  No organizations found. Skipping tournament seed.');
      return;
    }

    const organization = organizations[0];

    // Get all club members from the organization, then filter to those with players
    const allMembers = await prisma.clubMember.findMany({
      where: {
        organizationId: organization.id,
      },
      include: {
        player: true,
      },
      take: 8,
    });

    // Filter to get only members who are actual players
    const clubMembers = allMembers.filter((m) => m.player !== null);

    if (clubMembers.length === 0) {
      console.log('⚠️  No players found. Skipping tournament seed.');
      return;
    }

    // Create tournament 1: Spring Championship (Completed)
    const tournament1 = await prisma.clubEvent.create({
      data: {
        organizationId: organization.id,
        name: 'Spring Championship 2026',
        description: 'Our annual spring tennis tournament featuring players from all levels',
        eventType: 'tournament',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-03-15'),
        registrationDeadline: new Date('2026-02-20'),
        location: 'Main Courts',
        prizePool: 5000,
        entryFee: 50,
        registrationCap: 32,
        rules: 'Standard ITF rules apply. Matches are best of 3 sets. Tiebreaks at 6-6 in sets. No-ad scoring. Players must arrive 30 minutes before their match time.',
        instructions: 'Check-in at the main desk 1 hour before the tournament starts. Bring your own tennis balls. Water stations available on all courts. Medical assistance available at the clubhouse.',
        eatingAreas: 'Clubhouse cafeteria open from 8 AM to 8 PM. Food trucks available during peak hours. Picnic areas near Court 3.',
        sleepingAreas: 'On-site accommodation available for out-of-town players. Contact the tournament director for reservations. Local hotels within 2km.',
        courtInfo: '6 clay courts and 4 hard courts available. All courts have lighting for evening matches. Practice courts available for warm-up.',
      },
    });

    // Create bracket for tournament 1
    const bracket1 = await prisma.tournamentBracket.create({
      data: {
        organizationId: organization.id,
        eventId: tournament1.id,
        bracketType: 'single_elimination',
        totalRounds: 3,
      },
    });

    // Create amenities for tournament 1
    await prisma.eventAmenity.create({
      data: {
        eventId: tournament1.id,
        name: 'Clubhouse Dining',
        type: 'eating',
        description: 'Full-service cafeteria with hot meals and snacks',
        capacity: 50,
        price: 15,
        availableFrom: new Date('2026-03-01T08:00:00'),
        availableUntil: new Date('2026-03-15T20:00:00'),
      },
    });

    await prisma.eventAmenity.create({
      data: {
        eventId: tournament1.id,
        name: 'On-site Accommodation',
        type: 'sleeping',
        description: 'Basic dormitory-style rooms for participants',
        capacity: 20,
        price: 50,
        availableFrom: new Date('2026-03-01T18:00:00'),
        availableUntil: new Date('2026-03-15T10:00:00'),
      },
    });

    await prisma.eventAmenity.create({
      data: {
        eventId: tournament1.id,
        name: 'Restroom Facilities',
        type: 'restroom',
        description: 'Modern restrooms and shower facilities available 24/7 for athletes and visitors.',
        capacity: 30,
        price: 0,
        availableFrom: new Date('2026-03-01T06:00:00'),
        availableUntil: new Date('2026-03-15T23:59:00'),
      },
    });

    await prisma.eventAmenity.create({
      data: {
        eventId: tournament1.id,
        name: 'Food Lounge',
        type: 'eating',
        description: 'Relaxing lounge with coffee, smoothies, and light meals for all participants.',
        capacity: 40,
        price: 5,
        availableFrom: new Date('2026-03-01T07:00:00'),
        availableUntil: new Date('2026-03-15T21:00:00'),
      },
    });

    // Register players for tournament 1
    for (let i = 0; i < Math.min(8, clubMembers.length); i++) {
      await prisma.eventRegistration.create({
        data: {
          eventId: tournament1.id,
          memberId: clubMembers[i].id,
          status: 'registered',
          signupOrder: i + 1,
        },
      });
    }

    // Create matches for tournament 1 (Round 1)
    if (clubMembers.length >= 2) {
      await prisma.tournamentMatch.create({
        data: {
          organizationId: organization.id,
          eventId: tournament1.id,
          bracketId: bracket1.id,
          round: 1,
          matchPosition: 1,
          playerAId: clubMembers[0].id,
          playerBId: clubMembers[1].id,
          scoreSetA: '6-4',
          scoreSetB: '7-5',
          winnerId: clubMembers[0].id,
          status: 'completed',
          resultSubmittedAt: new Date('2026-03-02'),
        },
      });
    }

    if (clubMembers.length >= 4) {
      await prisma.tournamentMatch.create({
        data: {
          organizationId: organization.id,
          eventId: tournament1.id,
          bracketId: bracket1.id,
          round: 1,
          matchPosition: 2,
          playerAId: clubMembers[2].id,
          playerBId: clubMembers[3].id,
          scoreSetA: '6-3',
          scoreSetB: '6-4',
          winnerId: clubMembers[3].id,
          status: 'completed',
          resultSubmittedAt: new Date('2026-03-03'),
        },
      });
    }

    if (clubMembers.length >= 6) {
      await prisma.tournamentMatch.create({
        data: {
          organizationId: organization.id,
          eventId: tournament1.id,
          bracketId: bracket1.id,
          round: 1,
          matchPosition: 3,
          playerAId: clubMembers[4].id,
          playerBId: clubMembers[5].id,
          scoreSetA: '7-6',
          scoreSetB: '6-2',
          winnerId: clubMembers[4].id,
          status: 'completed',
          resultSubmittedAt: new Date('2026-03-04'),
        },
      });
    }

    if (clubMembers.length >= 8) {
      await prisma.tournamentMatch.create({
        data: {
          organizationId: organization.id,
          eventId: tournament1.id,
          bracketId: bracket1.id,
          round: 1,
          matchPosition: 4,
          playerAId: clubMembers[6].id,
          playerBId: clubMembers[7].id,
          scoreSetA: '6-1',
          scoreSetB: '6-2',
          winnerId: clubMembers[6].id,
          status: 'completed',
          resultSubmittedAt: new Date('2026-03-05'),
        },
      });
    }

    // Semi-finals - Round 2
    if (clubMembers.length >= 4) {
      await prisma.tournamentMatch.create({
        data: {
          organizationId: organization.id,
          eventId: tournament1.id,
          bracketId: bracket1.id,
          round: 2,
          matchPosition: 1,
          playerAId: clubMembers[0].id,
          playerBId: clubMembers[3].id,
          scoreSetA: '6-2',
          scoreSetB: '6-3',
          winnerId: clubMembers[0].id,
          status: 'completed',
          resultSubmittedAt: new Date('2026-03-10'),
        },
      });
    }

    // Semi-finals - Round 2 (second match, requires 7 members)
    if (clubMembers.length >= 7) {
      await prisma.tournamentMatch.create({
        data: {
          organizationId: organization.id,
          eventId: tournament1.id,
          bracketId: bracket1.id,
          round: 2,
          matchPosition: 2,
          playerAId: clubMembers[4].id,
          playerBId: clubMembers[6].id,
          scoreSetA: '6-4',
          scoreSetB: '7-6',
          winnerId: clubMembers[4].id,
          status: 'completed',
          resultSubmittedAt: new Date('2026-03-11'),
        },
      });
    }

    // Finals - Round 3
    if (clubMembers.length >= 5) {
      await prisma.tournamentMatch.create({
        data: {
          organizationId: organization.id,
          eventId: tournament1.id,
          bracketId: bracket1.id,
          round: 3,
          matchPosition: 1,
          playerAId: clubMembers[0].id,
          playerBId: clubMembers[4].id,
          scoreSetA: '6-3',
          scoreSetB: '7-5',
          winnerId: clubMembers[0].id,
          status: 'completed',
          resultSubmittedAt: new Date('2026-03-15'),
        },
      });
    }

    // Create tournament 2: Summer Open (In Progress)
    const tournament2 = await prisma.clubEvent.create({
      data: {
        organizationId: organization.id,
        name: 'Summer Open 2026',
        description: 'Open tournament for intermediate and advanced players',
        eventType: 'tournament',
        startDate: new Date('2026-06-15'),
        endDate: new Date('2026-07-01'),
        registrationDeadline: new Date('2026-06-01'),
        location: 'Premier Courts',
        prizePool: 10000,
        entryFee: 75,
        registrationCap: 64,
        rules: 'ITF rules with modifications for advanced play. Best of 3 sets with tiebreaks. No coaching allowed during matches. Electronic line calling on main courts.',
        instructions: 'Advanced players only. Rating verification required at check-in. Professional umpires for all matches. Media coverage available.',
        eatingAreas: 'Fine dining restaurant on-site. Multiple food courts with international cuisine. VIP dining area for finalists.',
        sleepingAreas: 'Luxury hotel accommodations available. Shuttle service to nearby resorts. Recovery center with massage therapy.',
        courtInfo: '8 professional-grade courts including 2 show courts. All courts equipped with Hawk-Eye technology. Premium seating for spectators.',
      },
    });

    // Create bracket for tournament 2
    const bracket2 = await prisma.tournamentBracket.create({
      data: {
        organizationId: organization.id,
        eventId: tournament2.id,
        bracketType: 'single_elimination',
        totalRounds: 4,
      },
    });

    // Create tournament 2 facility amenities
    await prisma.eventAmenity.create({
      data: {
        eventId: tournament2.id,
        name: 'Restroom Facilities',
        type: 'restroom',
        description: 'Spacious restrooms with full hygiene and towel services.',
        capacity: 35,
        price: 0,
        availableFrom: new Date('2026-06-15T06:00:00'),
        availableUntil: new Date('2026-07-01T23:59:00'),
      },
    });

    await prisma.eventAmenity.create({
      data: {
        eventId: tournament2.id,
        name: 'Food Lounge',
        type: 'eating',
        description: 'Executive food lounge with international cuisine and nutrition stations.',
        capacity: 45,
        price: 10,
        availableFrom: new Date('2026-06-15T07:00:00'),
        availableUntil: new Date('2026-07-01T21:00:00'),
      },
    });

    // Register players for tournament 2
    for (let i = 0; i < Math.min(8, clubMembers.length); i++) {
      await prisma.eventRegistration.create({
        data: {
          eventId: tournament2.id,
          memberId: clubMembers[i].id,
          status: 'registered',
          signupOrder: i + 1,
        },
      });
    }

    // Create matches for tournament 2
    if (clubMembers.length >= 2) {
      await prisma.tournamentMatch.create({
        data: {
          organizationId: organization.id,
          eventId: tournament2.id,
          bracketId: bracket2.id,
          round: 1,
          matchPosition: 1,
          playerAId: clubMembers[0].id,
          playerBId: clubMembers[1].id,
          scoreSetA: '6-4',
          scoreSetB: '6-3',
          winnerId: clubMembers[1].id,
          status: 'completed',
          resultSubmittedAt: new Date('2026-06-17'),
        },
      });
    }

    if (clubMembers.length >= 4) {
      await prisma.tournamentMatch.create({
        data: {
          organizationId: organization.id,
          eventId: tournament2.id,
          bracketId: bracket2.id,
          round: 1,
          matchPosition: 2,
          playerAId: clubMembers[2].id,
          playerBId: clubMembers[3].id,
          status: 'in_progress',
        },
      });
    }

    if (clubMembers.length >= 6) {
      await prisma.tournamentMatch.create({
        data: {
          organizationId: organization.id,
          eventId: tournament2.id,
          bracketId: bracket2.id,
          round: 1,
          matchPosition: 3,
          playerAId: clubMembers[4].id,
          playerBId: clubMembers[5].id,
          status: 'pending',
        },
      });
    }

    if (clubMembers.length >= 8) {
      await prisma.tournamentMatch.create({
        data: {
          organizationId: organization.id,
          eventId: tournament2.id,
          bracketId: bracket2.id,
          round: 1,
          matchPosition: 4,
          playerAId: clubMembers[6].id,
          playerBId: clubMembers[7].id,
          status: 'pending',
        },
      });
    }

    // Create tournament 3: Fall Championship (Upcoming)
    const tournament3 = await prisma.clubEvent.create({
      data: {
        organizationId: organization.id,
        name: 'Fall Championship 2026',
        description: 'Annual fall championship tournament',
        eventType: 'tournament',
        startDate: new Date('2026-09-15'),
        endDate: new Date('2026-10-01'),
        registrationDeadline: new Date('2026-09-01'),
        location: 'Championship Court',
        prizePool: 15000,
        entryFee: 100,
        registrationCap: 128,
        rules: 'Championship level rules. Best of 5 sets for finals. Professional officiating. Medical timeout rules apply.',
        instructions: 'Championship event. Professional attire required. Media accreditation available. VIP areas for sponsors and guests.',
        eatingAreas: 'Multiple dining options including gourmet restaurant, casual dining, and VIP catering. Nutritional guidance available.',
        sleepingAreas: 'Premium accommodations with recovery suites. On-site medical facility. Transportation to/from airport.',
        courtInfo: '12 championship courts with premium facilities. All courts have professional lighting and sound systems. Live streaming available.',
      },
    });

    // Create bracket for tournament 3
    await prisma.tournamentBracket.create({
      data: {
        organizationId: organization.id,
        eventId: tournament3.id,
        bracketType: 'double_elimination',
        totalRounds: 5,
      },
    });

    // Create tournament 3 facility amenities
    await prisma.eventAmenity.create({
      data: {
        eventId: tournament3.id,
        name: 'Restroom Facilities',
        type: 'restroom',
        description: 'Fully accessible restrooms with fresh water stations.',
        capacity: 40,
        price: 0,
        availableFrom: new Date('2026-09-15T06:00:00'),
        availableUntil: new Date('2026-10-01T23:59:00'),
      },
    });

    await prisma.eventAmenity.create({
      data: {
        eventId: tournament3.id,
        name: 'Food Lounge',
        type: 'eating',
        description: 'Relaxed food lounge offering healthy snack bars and local dishes.',
        capacity: 50,
        price: 12,
        availableFrom: new Date('2026-09-15T07:00:00'),
        availableUntil: new Date('2026-10-01T20:00:00'),
      },
    });

    // Register players for tournament 3
    for (let i = 0; i < Math.min(8, clubMembers.length); i++) {
      await prisma.eventRegistration.create({
        data: {
          eventId: tournament3.id,
          memberId: clubMembers[i].id,
          status: 'registered',
          signupOrder: i + 1,
        },
      });
    }

    // Create tournament 4: Weekly Singles
    const tournament4 = await prisma.clubEvent.create({
      data: {
        organizationId: organization.id,
        name: 'Weekly Singles Ladder',
        description: 'Weekly singles tournament for all skill levels',
        eventType: 'tournament',
        startDate: new Date('2026-03-14'),
        endDate: new Date('2026-03-21'),
        registrationDeadline: new Date('2026-03-13'),
        location: 'Courts 1-3',
        prizePool: 500,
        entryFee: 25,
        registrationCap: 16,
        rules: 'Round-robin format with playoffs. Standard scoring. All levels welcome. Sportsmanship emphasized.',
        instructions: 'Casual tournament. Bring your own balls. Refreshments provided. Social mixer after finals.',
        eatingAreas: 'Clubhouse bar and grill. Light refreshments available. BYO picnic allowed.',
        sleepingAreas: 'Day tournament only. No overnight accommodations needed.',
        courtInfo: '3 courts available. Basic facilities. Practice time available before matches.',
      },
    });

    const bracket4 = await prisma.tournamentBracket.create({
      data: {
        organizationId: organization.id,
        eventId: tournament4.id,
        bracketType: 'round_robin',
        totalRounds: 3,
      },
    });

    // Create tournament 4 facility amenities
    await prisma.eventAmenity.create({
      data: {
        eventId: tournament4.id,
        name: 'Restroom Facilities',
        type: 'restroom',
        description: 'Clean restrooms with dedicated athlete hygiene zone.',
        capacity: 25,
        price: 0,
        availableFrom: new Date('2026-03-14T06:00:00'),
        availableUntil: new Date('2026-03-21T23:59:00'),
      },
    });

    await prisma.eventAmenity.create({
      data: {
        eventId: tournament4.id,
        name: 'Food Lounge',
        type: 'eating',
        description: 'Community food lounge with quick bites and drink stations.',
        capacity: 35,
        price: 8,
        availableFrom: new Date('2026-03-14T07:00:00'),
        availableUntil: new Date('2026-03-21T20:00:00'),
      },
    });

    for (let i = 0; i < Math.min(6, clubMembers.length); i++) {
      await prisma.eventRegistration.create({
        data: {
          eventId: tournament4.id,
          memberId: clubMembers[i].id,
          status: 'registered',
          signupOrder: i + 1,
        },
      });
    }

    if (clubMembers.length >= 4) {
      await prisma.tournamentMatch.create({
        data: {
          organizationId: organization.id,
          eventId: tournament4.id,
          bracketId: bracket4.id,
          round: 1,
          matchPosition: 1,
          playerAId: clubMembers[0].id,
          playerBId: clubMembers[1].id,
          scoreSetA: '6-3',
          scoreSetB: '6-4',
          winnerId: clubMembers[1].id,
          status: 'completed',
          resultSubmittedAt: new Date('2026-03-15'),
        },
      });

      await prisma.tournamentMatch.create({
        data: {
          organizationId: organization.id,
          eventId: tournament4.id,
          bracketId: bracket4.id,
          round: 1,
          matchPosition: 2,
          playerAId: clubMembers[2].id,
          playerBId: clubMembers[3].id,
          scoreSetA: '7-5',
          scoreSetB: '6-7',
          winnerId: clubMembers[2].id,
          status: 'completed',
          resultSubmittedAt: new Date('2026-03-15'),
        },
      });

      await prisma.tournamentMatch.create({
        data: {
          organizationId: organization.id,
          eventId: tournament4.id,
          bracketId: bracket4.id,
          round: 2,
          matchPosition: 1,
          playerAId: clubMembers[1].id,
          playerBId: clubMembers[2].id,
          scoreSetA: '4-6',
          scoreSetB: '6-3',
          winnerId: clubMembers[2].id,
          status: 'in_progress',
        },
      });
    }

    // Create tournament 5: Doubles Championship
    const tournament5 = await prisma.clubEvent.create({
      data: {
        organizationId: organization.id,
        name: 'Doubles Championship 2026',
        description: 'Mixed doubles championship tournament',
        eventType: 'tournament',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-04-15'),
        registrationDeadline: new Date('2026-03-25'),
        location: 'Premier Courts',
        prizePool: 8000,
        entryFee: 80,
        registrationCap: 32,
        rules: 'Mixed doubles format. ITF doubles rules apply. Team registration required. No-ad scoring with tiebreaks.',
        instructions: 'Find a partner or register as a team. Mixed gender encouraged. Team check-in required. Social events planned.',
        eatingAreas: 'Team dining areas available. Catered meals for participants. Family picnic areas.',
        sleepingAreas: 'Family accommodations available. Nearby hotels with shuttle service.',
        courtInfo: '6 doubles courts available. All courts have professional surfaces. Spectator areas for families.',
      },
    });

    await prisma.tournamentBracket.create({
      data: {
        organizationId: organization.id,
        eventId: tournament5.id,
        bracketType: 'single_elimination',
        totalRounds: 3,
      },
    });

    // Create tournament 5 facility amenities
    await prisma.eventAmenity.create({
      data: {
        eventId: tournament5.id,
        name: 'Restroom Facilities',
        type: 'restroom',
        description: 'Convenient restroom facilities with hygiene stations and ambient lighting.',
        capacity: 30,
        price: 0,
        availableFrom: new Date('2026-04-01T06:00:00'),
        availableUntil: new Date('2026-04-15T23:59:00'),
      },
    });

    await prisma.eventAmenity.create({
      data: {
        eventId: tournament5.id,
        name: 'Food Lounge',
        type: 'eating',
        description: 'Lounge kitchen with power bowls, sandwiches, and hydration stations.',
        capacity: 40,
        price: 10,
        availableFrom: new Date('2026-04-01T07:00:00'),
        availableUntil: new Date('2026-04-15T21:00:00'),
      },
    });

    for (let i = 0; i < Math.min(8, clubMembers.length); i++) {
      await prisma.eventRegistration.create({
        data: {
          eventId: tournament5.id,
          memberId: clubMembers[i].id,
          status: 'registered',
          signupOrder: i + 1,
        },
      });
    }

    console.log('✅ Tournaments seeded successfully!');
    console.log(`   - Tournament 1: ${tournament1.name} (Completed)`);
    console.log(`   - Tournament 2: ${tournament2.name} (In Progress)`);
    console.log(`   - Tournament 3: ${tournament3.name} (Upcoming)`);
    console.log(`   - Tournament 4: ${tournament4.name} (Ongoing)`);
    console.log(`   - Tournament 5: ${tournament5.name} (Upcoming)`);
  } catch (error) {
    console.error('❌ Error seeding tournaments:', error);
    throw error;
  }
}
