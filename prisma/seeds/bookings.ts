import { PrismaClient } from '../../src/generated/prisma/index.js';

const prisma = new PrismaClient();

export async function seedBookings(
  organizations: any[],
  users: any[],
  courts: any[]
) {
  console.log('📅 Seeding court bookings...\n');

  const bookings: any[] = [];

  // Get club members grouped by organization
  const allClubMembers = await prisma.clubMember.findMany({
    include: { player: true },
  });

  if (allClubMembers.length === 0) {
    console.log('  ℹ️  No club members found. Skipping booking seeding.');
    return bookings;
  }

  // Group members by organization
  const membersByOrg: { [key: string]: any[] } = {};
  for (const member of allClubMembers) {
    if (!membersByOrg[member.organizationId]) {
      membersByOrg[member.organizationId] = [];
    }
    membersByOrg[member.organizationId].push(member);
  }

  console.log(`📝 Creating rich booking data for ${allClubMembers.length} members across ${Object.keys(membersByOrg).length} organizations...\n`);

  // Create diverse bookings
  const timeSlots = [
    { hour: 6, isPeakFactor: 0.5, name: 'Early Morning' },  // 6 AM - 7 AM
    { hour: 7, isPeakFactor: 0.7, name: 'Morning' },        // 7 AM - 8 AM
    { hour: 8, isPeakFactor: 1.0, name: 'Peak Morning' },   // 8 AM - 9 AM (peak)
    { hour: 9, isPeakFactor: 0.8, name: 'Mid Morning' },    // 9 AM - 10 AM
    { hour: 10, isPeakFactor: 0.6, name: 'Late Morning' },  // 10 AM - 11 AM
    { hour: 12, isPeakFactor: 0.5, name: 'Noon' },          // 12 PM - 1 PM
    { hour: 14, isPeakFactor: 0.7, name: 'Afternoon' },     // 2 PM - 3 PM
    { hour: 16, isPeakFactor: 0.9, name: 'Late Afternoon' },// 4 PM - 5 PM
    { hour: 17, isPeakFactor: 1.2, name: 'Peak Evening' },  // 5 PM - 6 PM (peak)
    { hour: 18, isPeakFactor: 1.3, name: 'Peak Evening' },  // 6 PM - 7 PM (peak)
    { hour: 19, isPeakFactor: 1.2, name: 'Peak Evening' },  // 7 PM - 8 PM (peak)
    { hour: 20, isPeakFactor: 1.1, name: 'Evening' },       // 8 PM - 9 PM
  ];

  const courtsByOrg: { [key: string]: any[] } = {};
  for (const court of courts) {
    if (!courtsByOrg[court.organizationId]) {
      courtsByOrg[court.organizationId] = [];
    }
    courtsByOrg[court.organizationId].push(court);
  }

  // Create bookings for each organization's courts and members
  for (const orgId in membersByOrg) {
    const orgCourts = courtsByOrg[orgId] || [];
    const orgMembers = membersByOrg[orgId];

    if (orgCourts.length === 0) continue;

    // Create bookings for the next 30 days
    for (let dayOffset = 1; dayOffset <= 30; dayOffset++) {
      const bookingDate = new Date();
      bookingDate.setDate(bookingDate.getDate() + dayOffset);

      // Skip some random days for variety
      if (Math.random() > 0.85) continue;

      for (const timeSlot of timeSlots) {
        // Randomly decide whether to book this slot
        const shouldBook = Math.random() < (0.4 + timeSlot.isPeakFactor * 0.2);
        if (!shouldBook) continue;

        const randomCourt = orgCourts[Math.floor(Math.random() * orgCourts.length)];
        const randomMember = orgMembers[Math.floor(Math.random() * orgMembers.length)];

        if (!randomCourt || !randomMember) continue;

        const startTime = new Date(bookingDate);
        startTime.setHours(timeSlot.hour, 0, 0, 0);

        const endTime = new Date(startTime);
        endTime.setHours(timeSlot.hour + 1, 0, 0, 0);

        // Determine if peak based on time slot factor
        const isPeak = timeSlot.isPeakFactor > 1.0;
        const basePriceMap: { [key: string]: number } = {
          'Hard': isPeak ? 80 : 50,
          'Clay': isPeak ? 100 : 60,
          'Grass': isPeak ? 120 : 75,
        };

        const basePrice = basePriceMap[randomCourt.surface] || (isPeak ? 80 : 50);
        const indoorMultiplier = randomCourt.indoorOutdoor === 'indoor' ? 1.2 : 1.0;
        const price = Math.round(basePrice * indoorMultiplier);

        try {
          // Check if booking already exists
          const existingBooking = await prisma.courtBooking.findFirst({
            where: {
              courtId: randomCourt.id,
              startTime,
              endTime,
              status: { in: ['confirmed', 'no-show'] },
            },
          });

          if (existingBooking) continue;

          const booking = await prisma.courtBooking.create({
            data: {
              courtId: randomCourt.id,
              organizationId: orgId,
              memberId: randomMember.id,
              startTime,
              endTime,
              bookingType: 'regular',
              status: 'confirmed',
              isPeak,
              price,
            },
          });

          bookings.push(booking);
        } catch (error) {
          // Booking might already exist or have conflict, continue
          continue;
        }
      }
    }
  }

  console.log(`  ✓ Created ${bookings.length} test bookings across all organizations`);
  console.log(`  • Peak hour bookings (5 PM - 9 PM): $80-$120/hour`);
  console.log(`  • Standard bookings: $50-$75/hour`);
  console.log(`  • Prices vary by surface type and indoor/outdoor\n`);

  return bookings;
}
