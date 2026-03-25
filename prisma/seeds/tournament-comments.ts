import { PrismaClient } from '../../src/generated/prisma/index.js';

const prisma = new PrismaClient();

export async function seedTournamentComments() {
  console.log('💬 Seeding tournament comments...');

  try {
    // Get all tournaments
    const tournaments = await prisma.clubEvent.findMany({
      where: {
        eventType: 'tournament',
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (tournaments.length === 0) {
      console.log('⚠️  No tournaments found. Skipping tournament comments seed.');
      return 0;
    }

    // Get all players
    const players = await prisma.player.findMany({
      include: {
        user: true,
      },
    });

    if (players.length === 0) {
      console.log('⚠️  No players found. Skipping tournament comments seed.');
      return 0;
    }

    const commentTemplates = [
      "Excited to play in this tournament! The format looks great.",
      "Looking forward to some competitive matches. Good luck everyone!",
      "This is going to be an amazing event. Can't wait to see the prize distribution.",
      "The court facilities look excellent. Well organized tournament!",
      "Hope the weather holds up for all the matches. Best of luck to all participants!",
      "Great to see such a diverse group of players. Should be some exciting tennis.",
      "The entry fee is very reasonable for the quality of organization.",
      "Really impressed with the tournament setup. Professional organization!",
      "Can't wait to test my skills against these players. Bring it on!",
      "The rules seem fair and well thought out. Good job organizers!",
      "This tournament has everything - great courts, good prizes, excellent organization.",
      "Been training hard for this. Ready to give it my best shot!",
      "Love the single elimination format. Straightforward and exciting.",
      "The location is perfect - easy to get to and great facilities.",
      "Really appreciate the detailed instructions and rules provided.",
      "This looks like a well-run tournament. Respect to the organizers.",
      "Excited to meet other tennis enthusiasts and make new friends.",
      "The prize pool is motivating! Let's play some great tennis.",
      "Great initiative by the club to organize this tournament.",
      "Looking forward to the social aspects as much as the competition.",
      "The court information provided is very helpful. Thanks!",
      "This tournament format suits my playing style perfectly.",
      "Can't wait to see how the bracket shapes up.",
      "The registration process was smooth and easy.",
      "Really impressed with the level of detail in the tournament setup.",
      "This is exactly the kind of competitive tennis I enjoy.",
      "Great to see local talent coming together for this event.",
      "The amenities and facilities look top-notch.",
      "Excited about the networking opportunities this tournament provides.",
      "Well done on organizing such a comprehensive tennis event!",
    ];

    let commentCount = 0;

    // For each tournament, add 3-8 random comments
    for (const tournament of tournaments) {
      const numComments = Math.floor(Math.random() * 6) + 3; // 3-8 comments per tournament

      for (let i = 0; i < numComments; i++) {
        const randomPlayer = players[Math.floor(Math.random() * players.length)];
        const randomComment = commentTemplates[Math.floor(Math.random() * commentTemplates.length)];

        // 20% chance of being a reply to an existing comment
        let parentCommentId = null;
        if (i > 0 && Math.random() < 0.2) {
          // Find existing comments for this tournament
          const existingComments = await prisma.tournamentComment.findMany({
            where: { eventId: tournament.id },
            select: { id: true },
          });

          if (existingComments.length > 0) {
            parentCommentId = existingComments[Math.floor(Math.random() * existingComments.length)].id;
          }
        }

        await prisma.tournamentComment.create({
          data: {
            eventId: tournament.id,
            authorId: randomPlayer.userId,
            content: randomComment,
            parentCommentId,
          },
        });

        commentCount++;
      }
    }

    console.log(`✅ Created ${commentCount} tournament comments across ${tournaments.length} tournaments`);
    return commentCount;
  } catch (error) {
    console.error('❌ Error seeding tournament comments:', error);
    throw error;
  }
}