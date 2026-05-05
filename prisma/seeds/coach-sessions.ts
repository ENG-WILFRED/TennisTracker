import { PrismaClient } from '../../src/generated/prisma/index.js';

const prisma = new PrismaClient();

export async function seedCoachSessions() {
  console.log('📅 Seeding coach sessions and activity links...');

  const coaches = await prisma.staff.findMany({
    where: {
      role: {
        contains: 'Coach',
      },
    },
    include: {
      user: true,
      organization: true,
    },
  });

  const players = await prisma.player.findMany({
    include: { user: true },
  });

  const courts = await prisma.court.findMany({
    select: { id: true, courtNumber: true, name: true },
  });

  if (coaches.length === 0) {
    console.log('⚠️  No coach staff found. Skipping coach session seed.');
    return;
  }

  if (players.length === 0) {
    console.log('⚠️  No players found. Skipping coach session seed.');
    return;
  }

  const sessionTemplates = [
    {
      title: 'Advanced Serve Clinic',
      type: 'clinic',
      description: 'Sharpen serve placement, speed, and accuracy in a focused clinic.',
      maxParticipants: 6,
      price: 45,
      startHour: 9,
      offsetDays: -4,
    },
    {
      title: 'Court Footwork Drill',
      type: 'group',
      description: 'Speed and balance drills for competitive match movement.',
      maxParticipants: 5,
      price: 40,
      startHour: 11,
      offsetDays: -2,
    },
    {
      title: 'Individual Match Strategy',
      type: '1-on-1',
      description: 'One-on-one review session with tactical coaching.',
      maxParticipants: 1,
      price: 65,
      startHour: 14,
      offsetDays: 1,
    },
    {
      title: 'Game Readiness Session',
      type: 'group',
      description: 'Tactical practice and match-scenario coaching for teams.',
      maxParticipants: 4,
      price: 55,
      startHour: 16,
      offsetDays: 3,
    },
  ];

  let createdActivities = 0;
  let createdSessions = 0;

  for (const coach of coaches) {
    const availablePlayers = players.filter(player => player.userId !== coach.userId);
    if (availablePlayers.length === 0) continue;

    const selectedPlayers = availablePlayers
      .sort(() => Math.random() - 0.5)
      .slice(0, 8);

    const coachCourtNames = courts.length > 0
      ? courts.map(court => court.name ?? `Court ${court.courtNumber || '1'}`)
      : ['Court 1', 'Court 2', 'Court 3'];

    for (let index = 0; index < sessionTemplates.length; index += 1) {
      const template = sessionTemplates[index];
      const sessionDate = new Date();
      sessionDate.setDate(sessionDate.getDate() + template.offsetDays);
      sessionDate.setHours(template.startHour, 0, 0, 0);

      const endDate = new Date(sessionDate.getTime() + 60 * 60 * 1000);
      const sessionType = template.type;
      const courtName = coachCourtNames[index % coachCourtNames.length];
      const selectedPlayer = selectedPlayers[index % selectedPlayers.length];
      const status = sessionDate < new Date() ? 'completed' : 'scheduled';
      const isOneOnOne = sessionType === '1-on-1';
      const playerId = isOneOnOne ? selectedPlayer.userId : undefined;
      const description = `${template.description} ${isOneOnOne ? 'Includes one-on-one coaching and match feedback.' : 'Includes drills and group strategy.'}`;
      const dateString = sessionDate.toISOString().slice(0, 10);
      const startTimeString = sessionDate.toISOString().slice(11, 16);
      const endTimeString = endDate.toISOString().slice(11, 16);

      const existingSession = await prisma.coachSession.findFirst({
        where: {
          coachId: coach.userId,
          title: template.title,
          startTime: sessionDate,
        },
      });

      if (!existingSession) {
        const coachSession = await prisma.coachSession.create({
          data: {
            coachId: coach.userId,
            organizationId: coach.organization?.id,
            playerId,
            sessionType,
            title: template.title,
            description,
            startTime: sessionDate,
            endTime: endDate,
            timezone: 'UTC',
            courtId: courts[index % courts.length]?.id,
            maxParticipants: template.maxParticipants,
            price: template.price,
            status,
          },
        });

        const activityExists = await prisma.activity.findFirst({
          where: {
            coachId: coach.userId,
            title: template.title,
            date: dateString,
            startTime: startTimeString,
          },
        });

        if (!activityExists) {
          await prisma.activity.create({
            data: {
              coachId: coach.userId,
              type: 'session',
              date: dateString,
              startTime: startTimeString,
              endTime: endTimeString,
              title: template.title,
              description,
              metadata: {
                sessionType,
                court: courtName,
                courtId: courts[index % courts.length]?.id,
                maxParticipants: template.maxParticipants,
                price: template.price,
              },
              completed: status === 'completed',
            },
          });
          createdActivities += 1;
        }

        const bookedPlayers = isOneOnOne
          ? [selectedPlayer]
          : selectedPlayers.slice(0, Math.min(3, selectedPlayers.length));

        for (const bookedPlayer of bookedPlayers) {
          await prisma.coachPlayerRelationship.upsert({
            where: {
              coachId_playerId: {
                coachId: coach.userId,
                playerId: bookedPlayer.userId,
              },
            },
            update: {
              status: 'active',
              sessionsCount: { increment: 1 },
              lastSessionAt: sessionDate,
            },
            create: {
              coachId: coach.userId,
              playerId: bookedPlayer.userId,
              status: 'active',
              sessionsCount: 1,
              lastSessionAt: sessionDate,
            },
          });

          await prisma.sessionBooking.upsert({
            where: {
              sessionId_playerId: {
                sessionId: coachSession.id,
                playerId: bookedPlayer.userId,
              },
            },
            update: {
              status: status === 'completed' ? 'completed' : 'confirmed',
              attendanceStatus: status === 'completed' ? 'attended' : 'pending',
            },
            create: {
              sessionId: coachSession.id,
              playerId: bookedPlayer.userId,
              status: status === 'completed' ? 'completed' : 'confirmed',
              attendanceStatus: status === 'completed' ? 'attended' : 'pending',
            },
          });
        }

        createdSessions += 1;
      }
    }
  }

  console.log(`✓ Created ${createdSessions} coach sessions and ${createdActivities} activity records.`);
}

async function main() {
  try {
    await seedCoachSessions();
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
