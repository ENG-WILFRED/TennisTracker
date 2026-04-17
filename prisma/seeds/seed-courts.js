// seed-courts.mjs - Seed courts, bookings, comments and complaints
import { PrismaClient } from '../../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Starting courts and bookings seed...');

    // Get or create an organization
    let org = await prisma.organization.findFirst();
    if (!org) {
      console.log('❌ No organization found. Please run the main seed first.');
      return;
    }

    const orgId = org.id;
    console.log(`✅ Using organization: ${org.name} (${orgId})`);

    // Get some players for creating comments and complaints
    const playersRaw = await prisma.player.findMany({ take: 5, include: { user: true } });
    if (playersRaw.length === 0) {
      console.log('❌ No players found. Please run the main seed first.');
      return;
    }
    const players = playersRaw;
    console.log(`✅ Found ${players.length} players`);

    // Create courts
    const courts = [];
    const courtData = [
      { name: 'Court A - Premium', number: 1, surface: 'Clay', indoor: 'Outdoor', lights: true },
      { name: 'Court B - Standard', number: 2, surface: 'Hard', indoor: 'Outdoor', lights: true },
      { name: 'Court C - Practice', number: 3, surface: 'Grass', indoor: 'Indoor', lights: false },
      { name: 'Court D - Tournament', number: 4, surface: 'Hard', indoor: 'Indoor', lights: true },
      { name: 'Court E - Junior', number: 5, surface: 'Clay', indoor: 'Outdoor', lights: false },
      { name: 'Court F - VIP', number: 6, surface: 'Hard', indoor: 'Indoor', lights: true },
    ];

    for (const data of courtData) {
      const court = await prisma.court.upsert({
        where: { organizationId_courtNumber: { organizationId: orgId, courtNumber: data.number } },
        update: {},
        create: {
          name: data.name,
          courtNumber: data.number,
          surface: data.surface,
          indoorOutdoor: data.indoor,
          lights: data.lights,
          status: 'Active',
          organizationId: orgId,
        },
      });
      courts.push(court);
      console.log(`✅ Created/updated court: ${court.name}`);
    }

    // Create bookings for each court
    const now = new Date();
    const bookingStatusOptions = ['confirmed', 'pending', 'cancelled'];
    let bookingCount = 0;

    for (const court of courts) {
      // Create 5-10 bookings per court
      const bookingsPerCourt = Math.floor(Math.random() * 6) + 5;
      
      for (let i = 0; i < bookingsPerCourt; i++) {
        const startDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days
        const startTime = new Date(startDate);
        startTime.setHours(Math.floor(Math.random() * 18) + 6); // 6 AM to 11 PM
        startTime.setMinutes(0);

        const endTime = new Date(startTime.getTime() + (60 + Math.floor(Math.random() * 120)) * 60 * 1000); // 1-3 hours

        const booking = await prisma.courtBooking.create({
          data: {
            courtId: court.id,
            organizationId: orgId,
            playerName: `${players[Math.floor(Math.random() * players.length)].user.firstName} ${players[Math.floor(Math.random() * players.length)].user.lastName}`,
            startTime,
            endTime,
            status: bookingStatusOptions[Math.floor(Math.random() * bookingStatusOptions.length)],
            price: [500, 750, 1000, 1200, 1500][Math.floor(Math.random() * 5)],
            guestCount: Math.floor(Math.random() * 4) + 1,
            isPeak: Math.random() > 0.6,
            bookingType: 'regular',
          },
        });
        bookingCount++;
      }
    }
    console.log(`✅ Created ${bookingCount} bookings`);

    // Create comments for courts
    let commentCount = 0;
    for (const court of courts) {
      const commentsForCourt = Math.floor(Math.random() * 4) + 1;
      
      for (let i = 0; i < commentsForCourt; i++) {
        const player = players[Math.floor(Math.random() * players.length)];
        const ratings = [4, 4, 4.5, 5, 3.5, 4.5, 5];
        
        const comment = await prisma.courtComment.create({
          data: {
            courtId: court.id,
            authorId: player.userId,
            content: [
              'Excellent court condition! Loved playing here.',
              'Great facilities and very well maintained.',
              'The lighting is perfect for evening matches.',
              'Surface quality is top-notch.',
              'Professional maintenance team, very impressed.',
              'Best court in the city!',
              'Good atmosphere and friendly staff.',
            ][Math.floor(Math.random() * 7)],
            rating: ratings[Math.floor(Math.random() * ratings.length)],
          },
        });
        commentCount++;
      }
    }
    console.log(`✅ Created ${commentCount} comments`);

    // Create complaints for courts
    let complaintCount = 0;
    for (const court of courts) {
      if (Math.random() > 0.5) { // 50% chance of having complaints
        const complaintsForCourt = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < complaintsForCourt; i++) {
          const player = players[Math.floor(Math.random() * players.length)];
          const categories = ['condition', 'maintenance', 'facility', 'other'];
          const severities = ['low', 'medium', 'high'];
          const statuses = ['pending', 'resolved', 'dismissed'];
          
          const complaint = await prisma.courtComplaint.create({
            data: {
              courtId: court.id,
              authorId: player.userId,
              title: [
                'Crack in the surface',
                'Broken lighting',
                'Poor drainage',
                'Inadequate seating',
                'Maintenance issues',
                'Safety concern',
              ][Math.floor(Math.random() * 6)],
              description: [
                'There is a visible crack in the court surface during the last booking.',
                'Some of the lights are not working properly, affecting visibility.',
                'Water accumulation noticed after recent rain.',
                'Spectator area needs better arrangement.',
                'General maintenance needed for better playing experience.',
                'Net post seems unstable, potential safety hazard.',
              ][Math.floor(Math.random() * 6)],
              category: categories[Math.floor(Math.random() * categories.length)],
              severity: severities[Math.floor(Math.random() * severities.length)],
              status: statuses[Math.floor(Math.random() * statuses.length)],
              resolvedNotes: Math.random() > 0.5 ? 'Issue has been resolved and verified.' : undefined,
            },
          });
          complaintCount++;
        }
      }
    }
    console.log(`✅ Created ${complaintCount} complaints`);

    console.log('\n✅ Court seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Courts: ${courts.length}`);
    console.log(`   - Bookings: ${bookingCount}`);
    console.log(`   - Comments: ${commentCount}`);
    console.log(`   - Complaints: ${complaintCount}`);

  } catch (error) {
    console.error('❌ Error seeding courts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
