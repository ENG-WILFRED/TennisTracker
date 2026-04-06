import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

const communityPosts = [
  {
    content: 'Just finished an amazing training session! Really working on my serve consistency. 🎾',
    visibility: 'public',
    type: 'achievement',
  },
  {
    content: 'Looking for players to practice with on weekends. Any takers? 🏆',
    visibility: 'public',
    type: 'general',
  },
  {
    content: 'Tip: Focus on your footwork before worrying about power. Technique first, power comes naturally.',
    visibility: 'public',
    type: 'coaching',
  },
  {
    content: 'Just won my first tournament match this season! Feeling great about the progress.',
    visibility: 'public',
    type: 'achievement',
  },
  {
    content: 'Anyone else struggle with the slice backhand? Share your tips! 👇',
    visibility: 'public',
    type: 'general',
  },
  {
    content: 'Key to staying injury-free: Always warm up properly and cool down. Your future self will thank you.',
    visibility: 'public',
    type: 'coaching',
  },
  {
    content: 'Practicing at the court tomorrow morning. Trying to improve my net game.',
    visibility: 'public',
    type: 'general',
  },
  {
    content: 'Mental game is just as important as physical skill. Work on your confidence!',
    visibility: 'public',
    type: 'coaching',
  },
  {
    content: 'Had a breakthrough moment with my double-handed backhand today. Persistence pays off! 💪',
    visibility: 'public',
    type: 'achievement',
  },
  {
    content: 'What\'s your favorite surface to play on? I\'m currently working with more clay courts.',
    visibility: 'public',
    type: 'general',
  },
  {
    content: 'Remember: Tennis is a game of patterns. Study your opponent\'s tendencies.',
    visibility: 'public',
    type: 'coaching',
  },
  {
    content: 'Excited for the upcoming tournament! Been training hard for the last month. Let\'s go! 🎯',
    visibility: 'public',
    type: 'achievement',
  },
];

async function main() {
  try {
    console.log('🌱 Starting community posts seed...');
    
    // Get all players to use as authors
    console.log('📋 Looking for players...');
    const players = await prisma.player.findMany({
      take: 10,
      include: {
        user: true,
      },
    });

    console.log('👥 Found', players.length, 'players');
    if (players.length === 0) {
      console.log('❌ No players found to assign as post authors');
      return;
    }

    console.log(`📝 Seeding ${communityPosts.length} community posts with ${players.length} potential authors`);

    let createdCount = 0;
    for (const post of communityPosts) {
      // Pick a random player as the author
      const playerRecord = players[Math.floor(Math.random() * players.length)];
      const author = playerRecord.user;

      const createdPost = await prisma.communityPost.create({
        data: {
          ...post,
          authorId: author.id,
        },
      });

      console.log(`✓ Created post by ${author.firstName} ${author.lastName}`);
      createdCount++;

      // Add 1-3 random comments to some posts (about 50% chance)
      if (Math.random() > 0.5 && players.length > 1) {
        const commentCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < commentCount; i++) {
          const commentAuthorRecord = players[Math.floor(Math.random() * players.length)];
          const commentAuthor = commentAuthorRecord.user;
          const comments = [
            'Great work! Keep it up! 💪',
            'Thanks for sharing this tip!',
            'I need to work on this too.',
            'Amazing progress! 🎉',
            'Any other advice on this?',
            'This really helped me!',
            'Love this perspective!',
            'Thanks for the motivation!',
          ];

          await prisma.postComment.create({
            data: {
              content: comments[Math.floor(Math.random() * comments.length)],
              authorId: commentAuthor.id,
              postId: createdPost.id,
            },
          });
        }
      }

      // Add 1-5 random reactions to some posts (about 70% chance)
      if (Math.random() > 0.3) {
        const reactionCount = Math.floor(Math.random() * 5) + 1;
        const reactionUsers = new Set();

        for (let i = 0; i < reactionCount; i++) {
          const reactPlayerRecord = players[Math.floor(Math.random() * players.length)];
          const reactUser = reactPlayerRecord.user;
          if (!reactionUsers.has(reactUser.id)) {
            reactionUsers.add(reactUser.id);
            try {
              await prisma.postReaction.create({
                data: {
                  type: 'like',
                  userId: reactUser.id,
                  postId: createdPost.id,
                },
              });
            } catch (e) {
              // Skip if reaction already exists (unique constraint)
            }
          }
        }
      }
    }

    // Create following relationships so posts are visible in feeds
    console.log('\n👥 Creating following relationships...');
    let followCount = 0;
    if (players.length > 1) {
      for (let i = 0; i < players.length; i++) {
        const follower = players[i];
        // Each player follows 2-5 random other players
        const followCount_ = Math.floor(Math.random() * 4) + 2;
        const following = new Set();
        
        for (let j = 0; j < followCount_; j++) {
          let targetPlayer;
          do {
            targetPlayer = players[Math.floor(Math.random() * players.length)];
          } while (targetPlayer.userId === follower.userId || following.has(targetPlayer.userId));
          
          following.add(targetPlayer.userId);
          try {
            await prisma.userFollower.create({
              data: {
                followerId: follower.userId,
                followingId: targetPlayer.userId,
              },
            });
            followCount++;
          } catch (e) {
            // Skip if follow relationship already exists
          }
        }
      }
    }
    console.log(`✅ Created ${followCount} follow relationships`);
    console.log(`\n✅ Successfully seeded ${createdCount} community posts with comments, reactions, and follow relationships`);
  } catch (error) {
    console.error('Error seeding community posts:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
