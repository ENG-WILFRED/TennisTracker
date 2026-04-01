import { PrismaClient } from '../../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function seedEventsForAllOrgs() {
  try {
    console.log('🌱 Starting to seed events for all organizations...\n');

    // Get all organizations
    const organizations = await prisma.organization.findMany({
      select: { id: true, name: true }
    });

    if (!organizations.length) {
      console.log('❌ No organizations found');
      return;
    }

    const now = new Date();

    for (const org of organizations) {
      console.log(`\n📍 Seeding events for: ${org.name}`);

      // Create diverse events for each organization
      const eventTemplates = [
        {
          name: `Spring Championship 2026 - ${org.name}`,
          description: 'Annual spring tournament featuring players of all levels',
          eventType: 'tournament',
          startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          endDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
          registrationDeadline: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
          registrationCap: 64,
          prizePool: 10000,
          entryFee: 100,
          location: `${org.name} Main Courts`,
          rules: 'Standard ITF rules apply. Best of 3 sets for finals.',
          instructions: 'Please arrive 15 minutes early. Bring your own racket.',
        },
        {
          name: `Doubles League - ${org.name}`,
          description: 'Mixed doubles round-robin tournament',
          eventType: 'tournament',
          startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
          registrationDeadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          registrationCap: 32,
          prizePool: 5000,
          entryFee: 50,
          location: `${org.name} Side Courts`,
          rules: 'No-ad scoring. One tiebreak at 6-6.',
          instructions: 'Teams of 2. Pre-registration required.',
        },
        {
          name: `Beginner Clinic - ${org.name}`,
          description: 'Coaching clinic for beginners',
          eventType: 'clinic',
          startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
          endDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
          registrationDeadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
          registrationCap: 20,
          prizePool: 0,
          entryFee: 25,
          location: `${org.name} Training Courts`,
          rules: 'Beginner level only. Drills and technique focus.',
          instructions: 'Bring water and towel. Courts provide rackets.',
        },
        {
          name: `Advanced Coaching - ${org.name}`,
          description: 'Personalized coaching sessions for intermediate+ players',
          eventType: 'coaching',
          startDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          endDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
          registrationDeadline: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
          registrationCap: 10,
          prizePool: 0,
          entryFee: 75,
          location: `${org.name} Pro Courts`,
          rules: 'Intermediate or higher. Video analysis included.',
          instructions: 'One-on-one sessions. 30 min slots available.',
        },
        {
          name: `Social Tournament - ${org.name}`,
          description: 'Casual mixed tournament with refreshments',
          eventType: 'tournament',
          startDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
          endDate: new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000),
          registrationDeadline: new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000),
          registrationCap: 48,
          prizePool: 3000,
          entryFee: 40,
          location: `${org.name} All Courts`,
          rules: 'Relaxed format. Handicap scoring available.',
          instructions: 'BBQ and drinks after tournament. Signup required.',
        },
        {
          name: `Completed: Regional Championship - ${org.name}`,
          description: 'Past regional championship tournament',
          eventType: 'tournament',
          startDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
          endDate: new Date(now.getTime() - 38 * 24 * 60 * 60 * 1000),
          registrationDeadline: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000),
          registrationCap: 128,
          prizePool: 25000,
          entryFee: 200,
          location: `${org.name} Main Courts`,
          rules: 'Seeded draw. Best of 3 sets.',
          instructions: 'Completed event. Results archived.',
        }
      ];

      // Create each event
      for (const template of eventTemplates) {
        try {
          const event = await prisma.clubEvent.create({
            data: {
              organizationId: org.id,
              ...template
            }
          });

          console.log(`  ✅ Created: ${event.name}`);

          // Get some club members to register for the event
          const members = await prisma.clubMember.findMany({
            where: { organizationId: org.id },
            take: Math.floor(Math.random() * 5) + 2
          });

          // Register some members
          for (let i = 0; i < members.length; i++) {
            try {
              await prisma.eventRegistration.create({
                data: {
                  eventId: event.id,
                  memberId: members[i].id,
                  status: 'confirmed',
                  signupOrder: i + 1,
                  registeredAt: new Date(now.getTime() - Math.random() * 5 * 24 * 60 * 60 * 1000)
                }
              });
            } catch (e) {
              // Skip duplicate registrations
            }
          }

          console.log(`     └─ Registered ${members.length} members`);
        } catch (error) {
          console.error(`  ❌ Failed to create event:`, error);
        }
      }
    }

    console.log('\n✅ Event seeding completed!');
    console.log(`\n📊 Summary:`);
    console.log(`   • ${organizations.length} organizations processed`);
    console.log(`   • ~${organizations.length * 6} events created`);
    console.log(`   • Multiple registrations per event`);
  } catch (error) {
    console.error('❌ Error seeding events:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedEventsForAllOrgs();
