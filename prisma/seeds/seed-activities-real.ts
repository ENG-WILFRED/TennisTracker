import prisma from '../../src/lib/prisma';

// Get all coaches
async function main() {
  console.log('🌱 Seeding activity data for coaches...');

  try {
    // Delete existing activities to avoid duplicates
    console.log('🗑️ Clearing existing activities...');
    await prisma.activity.deleteMany({});
    console.log('✓ Cleared existing activities');
    const coaches = await prisma.staff.findMany({
      where: { role: { contains: 'Coach' } },
      select: { userId: true, organizationId: true },
    });

    if (coaches.length === 0) {
      console.log('❌ No coaches found. Skipping activity seeding.');
      return;
    }

    console.log(`✓ Found ${coaches.length} coaches`);

    // Get courts for each organization
    const organizations = await prisma.organization.findMany({
      where: {
        id: {
          in: coaches.map((c: any) => c.organizationId).filter(Boolean) as string[],
        },
      },
      include: { courts: true },
    });

    console.log(`✓ Found ${organizations.length} organizations with courts`);

    let activitiesCreated = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Session types
    const sessionTypes = ['1-on-1', 'group', 'clinic'];
    const sessionCourts = ['Court A', 'Court B', 'Court C', 'Main Court', 'Practice Court'];
    const prices = [30, 45, 60, 75, 100, 120];

    // Tournament details
    const tournaments = [
      { name: 'Spring Championship', level: 'intermediate' },
      { name: 'Junior Circuit', level: 'beginner' },
      { name: 'Elite Pro Tournament', level: 'advanced' },
      { name: 'Regional Championship', level: 'intermediate' },
    ];
    const tournamentLocations = ['Downtown Courts', 'Central Sports Complex', 'Riverside Club', 'City Arena'];

    // Restocking
    const restockItems = [
      { name: 'Tennis Balls', quantity: 50, cost: 75 },
      { name: 'Racquet Strings', quantity: 20, cost: 150 },
      { name: 'Hand Grips', quantity: 30, cost: 60 },
      { name: 'Court Cleaning Supplies', quantity: 1, cost: 200 },
      { name: 'Training Cones', quantity: 100, cost: 40 },
    ];
    const suppliers = ['Wilson', 'Babolat', 'Head', 'Yonex', 'Sports Direct'];

    // Player reachout reasons
    const reachoutReasons = [
      'general',
      'feedback',
      'next-session',
      'motivation',
      'follow-up',
    ];

    // Email subjects
    const emailSubjects = [
      'Session Reminder',
      'Performance Update',
      'Training Schedule',
      'Payment Due',
      'New Class Available',
    ];

    const priorities = ['low', 'medium', 'high'];

    // For each coach, create activities for the next 45 days (including past 15 days for completed ones)
    for (const coach of coaches) {
      for (let dayOffset = -15; dayOffset < 30; dayOffset++) {
        const activityDate = new Date(today);
        activityDate.setDate(activityDate.getDate() + dayOffset);
        const dateStr = activityDate.toISOString().split('T')[0];

        // Create 2-3 activities per day
        const activitiesPerDay = Math.floor(Math.random() * 2) + 2;

        for (let i = 0; i < activitiesPerDay; i++) {
          const hour = 8 + Math.floor(Math.random() * 9); // 8 AM to 5 PM
          const startHour = hour.toString().padStart(2, '0');
          const startTime = `${startHour}:00`;
          const endHour = (hour + 1).toString().padStart(2, '0');
          const endTime = `${endHour}:00`;

          const type = ['session', 'session', 'session', 'tournament', 'restocking', 'player-reachout', 'email'][
            Math.floor(Math.random() * 7)
          ] as any;

          let title = '';
          let metadata: any = {};

          switch (type) {
            case 'session': {
              const sessionType = sessionTypes[Math.floor(Math.random() * sessionTypes.length)];
              const court =
                sessionCourts[Math.floor(Math.random() * sessionCourts.length)] +
                (coach.organizationId ? ' - ' + coach.organizationId.substring(0, 8) : '');
              const price = prices[Math.floor(Math.random() * prices.length)];
              const maxParticipants = sessionType === '1-on-1' ? 1 : Math.floor(Math.random() * 10) + 2;

              title = `${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} Session`;
              metadata = {
                sessionType,
                court,
                courtId: '',
                price,
                maxParticipants,
                playerName: sessionType === '1-on-1' ? `Player ${i + 1}` : '',
              };
              break;
            }

            case 'tournament': {
              const tournament = tournaments[Math.floor(Math.random() * tournaments.length)];
              const location = tournamentLocations[Math.floor(Math.random() * tournamentLocations.length)];

              title = tournament.name;
              metadata = {
                tournamentName: tournament.name,
                location,
                locationId: '',
                level: tournament.level,
              };
              break;
            }

            case 'restocking': {
              const item = restockItems[Math.floor(Math.random() * restockItems.length)];
              const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];

              title = `Restock: ${item.name}`;
              metadata = {
                itemName: item.name,
                quantity: item.quantity,
                supplier,
                cost: item.cost,
              };
              break;
            }

            case 'player-reachout': {
              const reason = reachoutReasons[Math.floor(Math.random() * reachoutReasons.length)];
              const players = ['Alex Johnson', 'Maria Garcia', 'Juan Rodriguez', 'Sarah Chen', 'Michael Smith'];
              const player = players[Math.floor(Math.random() * players.length)];

              title = `Reach out: ${player}`;
              metadata = {
                playerName: player,
                playerEmail: `${player.toLowerCase().replace(' ', '.')}@example.com`,
                reachoutReason: reason,
              };
              break;
            }

            case 'email': {
              const subject = emailSubjects[Math.floor(Math.random() * emailSubjects.length)];
              const priority = priorities[Math.floor(Math.random() * priorities.length)];

              title = subject;
              metadata = {
                emailSubject: subject,
                priority,
              };
              break;
            }
          }

          // Create activity
          await prisma.activity.create({
            data: {
              coachId: coach.userId,
              type: type as string,
              date: dateStr,
              startTime,
              endTime,
              title,
              description: `Activity created for ${dateStr}`,
              metadata,
              completed: dayOffset < 0, // Mark past activities as completed
            },
          });

          activitiesCreated++;
        }
      }
    }

    console.log(`✅ Created ${activitiesCreated} activities`);
    console.log('📅 Activities span from 15 days ago to 30 days in the future');
    console.log('✓ Past activities are marked as completed');
  } catch (error) {
    console.error('❌ Error seeding activities:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
