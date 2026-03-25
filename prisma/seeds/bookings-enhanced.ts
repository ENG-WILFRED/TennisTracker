import { PrismaClient } from '../../src/generated/prisma/index.js';

const prisma = new PrismaClient();

/**
 * Enhanced booking seeding with realistic patterns
 * Creates bookings for all users with:
 * - Realistic time distributions (peak vs off-peak)
 * - Player skill-based booking patterns
 * - Variety in duration (1h-3h)
 * - Historical + future bookings
 */

export async function seedEnhancedBookings(
  organizations: any[],
  users: any[],
  courts: any[]
) {
  console.log('📅 Seeding enhanced booking data with realistic patterns...\n');

  const allClubMembers = await prisma.clubMember.findMany({
    include: { 
      player: {
        include: {
          user: true,
        }
      }
    },
  });

  if (allClubMembers.length === 0) {
    console.log('  ℹ️  No club members found. Skipping booking seeding.');
    return [];
  }

  // Group by organization
  const membersByOrg: { [key: string]: any[] } = {};
  for (const member of allClubMembers) {
    if (!membersByOrg[member.organizationId]) {
      membersByOrg[member.organizationId] = [];
    }
    membersByOrg[member.organizationId].push(member);
  }

  const courtsByOrg: { [key: string]: any[] } = {};
  for (const court of courts) {
    if (!courtsByOrg[court.organizationId]) {
      courtsByOrg[court.organizationId] = [];
    }
    courtsByOrg[court.organizationId].push(court);
  }

  const bookings: any[] = [];
  let bookingCount = 0;

  // Time slot patterns
  const timePatterns = [
    { hour: 6, min: 0, name: 'Early Morning', probability: 0.3, duration: 1 },
    { hour: 7, min: 0, name: 'Morning', probability: 0.5, duration: 1 },
    { hour: 8, min: 0, name: 'Peak Morning', probability: 0.8, duration: 2 },
    { hour: 9, min: 0, name: 'Mid Morning', probability: 0.6, duration: 1 },
    { hour: 10, min: 0, name: 'Late Morning', probability: 0.4, duration: 1 },
    { hour: 12, min: 0, name: 'Lunch', probability: 0.3, duration: 1 },
    { hour: 14, min: 0, name: 'Afternoon', probability: 0.5, duration: 1 },
    { hour: 15, min: 30, name: 'Late Afternoon', probability: 0.6, duration: 1 },
    { hour: 17, min: 0, name: 'Peak Evening', probability: 0.95, duration: 1 },
    { hour: 18, min: 0, name: 'Peak Evening', probability: 0.95, duration: 1 },
    { hour: 19, min: 0, name: 'Peak Evening', probability: 0.9, duration: 1 },
    { hour: 20, min: 0, name: 'Evening', probability: 0.7, duration: 1 },
  ];

  // For each organization
  for (const orgId in membersByOrg) {
    const orgCourts = courtsByOrg[orgId] || [];
    const orgMembers = membersByOrg[orgId];

    if (orgCourts.length === 0 || orgMembers.length === 0) continue;

    console.log(`📝 ${membersByOrg[orgId][0]?.organization?.name || orgId}: Creating bookings for ${orgMembers.length} members...`);

    // Create bookings for next 60 days (mix of past and future)
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // 30 days ago

    for (let dayOffset = -30; dayOffset <= 30; dayOffset++) {
      const bookingDate = new Date(startDate);
      bookingDate.setDate(bookingDate.getDate() + Math.abs(dayOffset));

      // Skip some days randomly for variety
      if (Math.random() > 0.75 && dayOffset < 0) continue; // Less bookings in past
      if (Math.random() > 0.7 && dayOffset >= 0) continue; // Regular density for future

      for (const timePattern of timePatterns) {
        // Decide whether to book this slot based on probability
        if (Math.random() > timePattern.probability) continue;

        // Randomly select 1-4 members to fill this slot
        const numBookings = Math.floor(Math.random() * 2) + 1; // 1-2 bookings per slot
        
        for (let b = 0; b < numBookings; b++) {
          const randomMember = orgMembers[Math.floor(Math.random() * orgMembers.length)];
          const randomCourt = orgCourts[Math.floor(Math.random() * orgCourts.length)];

          if (!randomMember || !randomCourt) continue;

          // Check for conflicts
          const startTime = new Date(bookingDate);
          startTime.setHours(timePattern.hour, timePattern.min, 0, 0);

          const endTime = new Date(startTime);
          endTime.setHours(startTime.getHours() + timePattern.duration, 0, 0, 0);

          const existing = await prisma.courtBooking.findFirst({
            where: {
              courtId: randomCourt.id,
              organizationId: orgId,
              memberId: randomMember.id,
              startTime: { lt: endTime },
              endTime: { gt: startTime },
              status: { in: ['confirmed', 'no-show'] },
            },
          });

          if (existing) continue; // Skip if slot taken for this member

          // Determine pricing
          const isPeak = timePattern.hour >= 17 && timePattern.hour < 21;
          const basePriceMap: { [key: string]: number } = {
            'Hard': isPeak ? 80 : 50,
            'Clay': isPeak ? 100 : 60,
            'Grass': isPeak ? 120 : 75,
          };

          const basePrice = basePriceMap[randomCourt.surface] || (isPeak ? 80 : 50);
          const indoorMultiplier = randomCourt.indoorOutdoor === 'indoor' ? 1.2 : 1.0;
          const price = Math.round(basePrice * indoorMultiplier);

          // Determine status based on date
          let status = 'confirmed';
          if (bookingDate < new Date() && Math.random() > 0.8) {
            status = 'no-show'; // Some past bookings are no-shows
          }
          if (bookingDate < new Date() && Math.random() > 0.95) {
            status = 'cancelled'; // Few are cancelled
          }

          try {
            const booking = await prisma.courtBooking.create({
              data: {
                courtId: randomCourt.id,
                organizationId: orgId,
                memberId: randomMember.id,
                startTime,
                endTime,
                bookingType: 'regular',
                status,
                isPeak,
                price,
                guestCount: Math.random() > 0.8 ? 2 : 1, // Some with guest
              },
            });

            bookings.push(booking);
            bookingCount++;
          } catch (error) {
            // Silently skip conflicts
          }
        }
      }
    }

    console.log(`  ✓ Created ${bookings.filter(b => b.organizationId === orgId).length} bookings`);
  }

  console.log(`\n📊 Total court bookings created: ${bookingCount}\n`);
  return bookings;
}
