import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const courts = ['Court 1', 'Court 2', 'Court 3', 'Court 4', 'Court 5', 'Main Court', 'Practice Court'];
const suppliers = ['Tennis Pro Supply', 'Wilson Sports', 'Racquet Tech', 'Court Equipment Ltd', 'Sports Direct'];
const reachoutReasons = ['general', 'feedback', 'next-session', 'motivation', 'follow-up'];
const tournamentLevels = ['beginner', 'intermediate', 'advanced', 'professional'];
const emailPriorities = ['low', 'medium', 'high'];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedActivities() {
  try {
    console.log('🌱 Starting to seed activities...');

    // Get all coaches
    const coaches = await prisma.coach.findMany({
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    console.log(`Found ${coaches.length} coaches`);

    if (coaches.length === 0) {
      console.log('No coaches found. Please create coaches first.');
      return;
    }

    // Get all players for player reachouts
    const players = await prisma.player.findMany({
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      take: 50,
    });

    console.log(`Found ${players.length} players`);

    const baseDate = new Date();
    const activitiesPerCoachPerDay = 3;
    const daysToSeed = 30; // Next 30 days

    let totalActivities = 0;

    for (const coach of coaches) {
      const coachUser = coach as unknown as { user: { firstName: string; lastName: string } };
      console.log(`\n📅 Seeding activities for ${coachUser.user.firstName} ${coachUser.user.lastName}...`);

      const coachActivities: any[] = [];

      for (let dayOffset = 0; dayOffset < daysToSeed; dayOffset++) {
        const activityDate = new Date(baseDate);
        activityDate.setDate(activityDate.getDate() + dayOffset);

        // Add multiple activities per day
        for (let i = 0; i < activitiesPerCoachPerDay; i++) {
          const activityTypes = ['session', 'tournament', 'restocking', 'player-reachout', 'email'];
          const activityType = getRandomElement(activityTypes);

          const activity: any = {
            coachId: coach.id,
            type: activityType,
            date: activityDate.toISOString().split('T')[0],
            startTime: `${String(Math.floor(Math.random() * 14) + 8).padStart(2, '0')}:${getRandomElement(['00', '15', '30', '45'])}`,
            endTime: `${String(Math.floor(Math.random() * 14) + 9).padStart(2, '0')}:${getRandomElement(['00', '15', '30', '45'])}`,
            title: '',
            description: `Activity for ${coachUser.user.firstName}`,
            metadata: {},
            createdAt: new Date(),
            completed: Math.random() > 0.7,
          };

          // Generate type-specific data
          if (activityType === 'session') {
            const sessionTypes = ['1-on-1', 'group', 'clinic'];
            const sessionType = getRandomElement(sessionTypes);
            activity.title = `${sessionType === '1-on-1' ? 'One-on-One' : sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} Session`;
            activity.metadata = {
              sessionType,
              court: getRandomElement(courts),
              maxParticipants: sessionType === '1-on-1' ? 1 : Math.floor(Math.random() * 5) + 2,
              price: Math.floor(Math.random() * 100) + 20,
            };
          } else if (activityType === 'tournament') {
            const tournaments = ['City Championship', 'Regional Tournament', 'National Open', 'Summer Series', 'Spring Tournament', 'Winter Cup', 'Mixed Doubles Championship'];
            activity.title = getRandomElement(tournaments);
            activity.metadata = {
              tournamentName: activity.title,
              location: getRandomElement(['Stadium', 'Country Club', 'Sports Complex', 'Community Center']),
              level: getRandomElement(tournamentLevels),
            };
          } else if (activityType === 'restocking') {
            const items = ['Tennis Balls', 'Racquets', 'Strings', 'Grips', 'Shoes', 'Water Bottles', 'Towels', 'Cones', 'Training Vests'];
            const item = getRandomElement(items);
            activity.title = `Restock: ${item}`;
            activity.metadata = {
              itemName: item,
              quantity: Math.floor(Math.random() * 100) + 10,
              supplier: getRandomElement(suppliers),
              cost: Math.floor(Math.random() * 500) + 50,
            };
          } else if (activityType === 'player-reachout') {
            const player = getRandomElement(players) as unknown as { user: { firstName: string; lastName: string; email: string } };
            activity.title = `Reach out to ${player.user.firstName}`;
            activity.metadata = {
              playerName: `${player.user.firstName} ${player.user.lastName}`,
              playerEmail: player.user.email,
              reachoutReason: getRandomElement(reachoutReasons),
            };
          } else if (activityType === 'email') {
            const emailSubjects = ['Tournament Registration Reminder', 'Player Progress Update', 'Training Schedule', 'Payment Invoice', 'Feedback on Performance', 'Session Cancellation Notice', 'New Training Plan'];
            activity.title = getRandomElement(emailSubjects);
            activity.metadata = {
              emailSubject: activity.title,
              priority: getRandomElement(emailPriorities),
            };
          }

          coachActivities.push(activity);
          totalActivities++;
        }
      }

      // Store activities in database (when table exists)
      console.log(`  ✓ Generated ${coachActivities.length} activities`);
      // Example: await prisma.activity.createMany({ data: coachActivities });
    }

    console.log(`\n✅ Successfully generated ${totalActivities} total activities across all coaches!`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Coaches seeded: ${coaches.length}`);
    console.log(`   - Days per coach: ${daysToSeed}`);
    console.log(`   - Activities per day: ${activitiesPerCoachPerDay}`);
    console.log(`   - Total activities: ${totalActivities}`);
    console.log(`\n💡 Note: Activities are generated in memory but not stored in DB yet.`);
    console.log(`    Create an Activity table in your Prisma schema and uncomment the database insert.`);
  } catch (error) {
    console.error('Error seeding activities:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedActivities();
