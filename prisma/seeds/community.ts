import { PrismaClient } from '../../src/generated/prisma/index.js';

const prisma = new PrismaClient();

export async function seedCommunity(users: any[]) {
  console.log('👥 Seeding community posts, comments, and follows...\n');

  // Filter for users who have a player profile
  const players = users.filter((u) => u.player).map((u) => ({
    userId: u.id,
    playerUserId: u.player.userId,
    email: u.email,
    name: u.firstName + ' ' + u.lastName,
  }));

  if (players.length < 2) {
    console.log('  ℹ️  Not enough players for community seeding.');
    return { posts: [], comments: [], reactions: [], follows: [] };
  }

  const posts = [];
  const comments = [];
  const reactions = [];
  const follows = [];

  console.log('📝 Creating community posts...');

  // Create realistic posts
  const postContents = [
    '🎾 Just had an amazing match this morning! Feeling great about my serve technique lately. #TennisLife',
    'Anyone else practicing their backhand slice? I find it so useful in doubles play! 💪',
    'Excited to announce I\'ve achieved a new personal ranking! Thanks to my coach for the guidance. 🏆',
    'Weather is perfect for tennis today! Who else is heading to the court? 🌞',
    'Lost a tough match today, but learned so much from my opponent. That\'s what makes tennis great! 🎾',
    'New tennis racket arrived today! Can\'t wait to test it out on the court 🤩',
    'Remember to stretch before and after your matches! Injury prevention is key 💪',
    'Celebrating 50 matches played this season! Here\'s to many more. 🎉',
    'Just finished a coaching session focusing on net play. Game changer! 🥎',
    'Tournament season is upon us! Who\'s competing? Let\'s support each other! 🏅',
    'Morning practice is the best way to start the day! 🌅 #EarlyBird',
    'Finally broke through a mental barrier in my game today. Consistency is key! 🔑',
    'Love the community here at the club. Playing with such passionate people! ❤️',
    'Working on my service return. It\'s the most important shot in tennis according to my coach.',
    'Doubles match this weekend! Looking for partners! 🤝 DM me if interested.',
  ];

  // Create posts from different players
  for (let i = 0; i < Math.min(12, players.length); i++) {
    const player = players[i];
    const postContent = postContents[i % postContents.length];
    const daysAgo = Math.floor(Math.random() * 15) + 1;

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);

    try {
      const post = await prisma.communityPost.create({
        data: {
          authorId: player.playerUserId,
          content: postContent,
          visibility: 'public',
          createdAt,
        },
      });

      posts.push(post);
    } catch (error) {
      // Post might already exist
      continue;
    }
  }

  console.log(`  ✓ Created ${posts.length} community posts\n`);

  console.log('👥 Creating user follows...');

  // Create realistic follows (each player follows 2-3 others)
  for (let i = 0; i < players.length; i++) {
    const follower = players[i];
    const followCount = Math.floor(Math.random() * 2) + 2; // 2-3 follows

    for (let j = 0; j < followCount; j++) {
      const randomIndex = Math.floor(Math.random() * players.length);
      if (randomIndex !== i) {
        const followingPlayer = players[randomIndex];

        try {
          const follow = await prisma.userFollower.create({
            data: {
              followerId: follower.playerUserId,
              followingId: followingPlayer.playerUserId,
            },
          });

          follows.push(follow);
        } catch (error) {
          // Follow might already exist or violate constraints
          continue;
        }
      }
    }
  }

  console.log(`  ✓ Created ${follows.length} follow relationships\n`);

  console.log('💬 Creating comments on posts...');

  // Add comments to posts
  for (let i = 0; i < Math.min(8, posts.length); i++) {
    const post = posts[i];
    const commentCount = Math.floor(Math.random() * 3) + 1; // 1-3 comments

    const commentTexts = [
      'Great post! Keep it up! 👏',
      'This resonates with me so much! ❤️',
      'Would love to play with you sometime!',
      'Totally agree with this perspective.',
      'Amazing progress! You inspire me! 💪',
      'Thanks for sharing this tip!',
      'Let\'s organize a doubles match!',
      'This is exactly what I needed to hear.',
      'Love your positive attitude! 🙌',
      'Count me in for the next tournament!',
    ];

    for (let j = 0; j < commentCount; j++) {
      const randomCommentIndex = Math.floor(Math.random() * commentTexts.length);
      const randomPlayerIndex = Math.floor(Math.random() * players.length);

      if (randomPlayerIndex !== players.findIndex((p) => p.playerUserId === post.authorId)) {
        const commentAuthor = players[randomPlayerIndex];

        try {
          const comment = await prisma.postComment.create({
            data: {
              postId: post.id,
              authorId: commentAuthor.playerUserId,
              content: commentTexts[randomCommentIndex],
            },
          });

          comments.push(comment);
        } catch (error) {
          // Comment creation might fail, continue
          continue;
        }
      }
    }
  }

  console.log(`  ✓ Created ${comments.length} comments\n`);

  console.log('👍 Creating post reactions...');

  // Add reactions (likes) to posts
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const reactionCount = Math.floor(Math.random() * 5) + 1; // 1-5 likes

    for (let j = 0; j < reactionCount; j++) {
      const randomPlayerIndex = Math.floor(Math.random() * players.length);
      const reactor = players[randomPlayerIndex];

      if (reactor.playerUserId !== post.authorId) {
        try {
          const reaction = await prisma.postReaction.create({
            data: {
              postId: post.id,
              userId: reactor.playerUserId,
              type: 'like',
            },
          });

          reactions.push(reaction);
        } catch (error) {
          // Reaction might already exist
          continue;
        }
      }
    }
  }

  console.log(`  ✓ Created ${reactions.length} reactions\n`);

  return { posts, comments, reactions, follows };
}
