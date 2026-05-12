const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function seedTestData() {
  try {
    console.log('Creating test user...');
    const user = await prisma.user.create({
      data: {
        id: '6ef1c957-44e2-4029-8bb4-a4457f2cbfc1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'Player',
        password: 'hashedpassword',
      }
    });

    console.log('Creating test player...');
    const player = await prisma.player.create({
      data: {
        userId: user.id,
        skillLevel: 'intermediate',
      }
    });

    console.log('Creating test coach user...');
    const coachUser = await prisma.user.create({
      data: {
        id: 'coach-123',
        email: 'coach@example.com',
        firstName: 'Test',
        lastName: 'Coach',
        password: 'hashedpassword',
      }
    });

    console.log('Creating test staff/coach...');
    const coach = await prisma.staff.create({
      data: {
        userId: coachUser.id,
        role: 'Coach',
        organizationId: 'org-123', // This might need to exist
      }
    });

    console.log('Creating coach-player relationship...');
    const relationship = await prisma.coachPlayerRelationship.create({
      data: {
        coachId: coach.userId,
        playerId: player.userId,
        status: 'active',
      }
    });

    console.log('Test data created successfully!');
    console.log('Player ID:', player.userId);
    console.log('Coach ID:', coach.userId);
    
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestData();
