import { PrismaClient } from './src/generated/prisma/index.js';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3002';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

function generateToken(user) {
  return jwt.sign(
    {
      playerId: user.id,
      email: user.email,
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

async function testCommunityAndMessaging() {
  try {
    console.log('🧪 Testing Community & Messaging Features\n');

    // Get a referee
    const referee = await prisma.referee.findFirst({
      include: { user: true },
    });

    if (!referee) {
      console.error('❌ No referees found');
      process.exit(1);
    }

    const refereeId = referee.userId;
    const refToken = generateToken(referee.user);

    console.log(`✅ Testing with referee: ${referee.user.firstName} ${referee.user.lastName}\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Test 1: Get all users (for messaging)
    console.log('📋 Test 1: Fetching all users for messaging\n');
    const usersRes = await fetch(`${BASE_URL}/api/users?exclude=${refereeId}`, {
      headers: {
        'Authorization': `Bearer ${refToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!usersRes.ok) {
      console.error(`❌ Failed to fetch users: ${usersRes.status}`);
      const error = await usersRes.text();
      console.error(error);
    } else {
      const users = await usersRes.json();
      console.log(`✅ Successfully fetched ${users.length} other users`);
      console.log(`   Sample users: ${users.slice(0, 3).map(u => `${u.firstName} (${u.role})`).join(', ')}\n`);
    }

    // Test 2: Get community feed
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📋 Test 2: Fetching community feed\n');
    const feedRes = await fetch(
      `${BASE_URL}/api/community?action=feed&userId=${refereeId}`,
      {
        headers: {
          'Authorization': `Bearer ${refToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!feedRes.ok) {
      console.error(`❌ Failed to fetch feed: ${feedRes.status}`);
      const error = await feedRes.text();
      console.error(error);
    } else {
      const feed = await feedRes.json();
      console.log(`✅ Successfully fetched community feed`);
      console.log(`   Posts: ${feed.posts?.length || 0}`);
      if (feed.posts && feed.posts.length > 0) {
        console.log(`   Sample post: "${feed.posts[0].content?.substring(0, 50)}..."`);
      }
      console.log(`   Pagination: Page ${feed.pagination?.page} of ${feed.pagination?.pages}\n`);
    }

    // Test 3: Check referee organization
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📋 Test 3: Checking referee organization connection\n');
    
    const refWithOrg = await prisma.referee.findUnique({
      where: { userId: refereeId },
      include: {
        user: {
          include: {
            player: {
              include: {
                organization: true,
              },
            },
          },
        },
      },
    });

    console.log(`✅ Referee details:`);
    console.log(`   Organization: ${refWithOrg?.user.player?.organization?.name || 'None (shared across orgs)'}`);
    console.log(`   Matches Refereed: ${refWithOrg?.matchesRefereed || 0}`);
    console.log(`   Ball Crew Matches: ${refWithOrg?.ballCrewMatches || 0}`);
    console.log(`   Certifications: ${refWithOrg?.certifications?.length || 0}\n`);

    // Test 4: Check referee follows
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📋 Test 4: Checking referee community engagement\n');

    const followCount = await prisma.userFollower.count({
      where: { followerId: refereeId },
    });

    const postCount = await prisma.communityPost.count({
      where: { authorId: refereeId },
    });

    console.log(`✅ Referee community engagement:`);
    console.log(`   Players being followed: ${followCount}`);
    console.log(`   Posts created: ${postCount}`);
    console.log(`   Can see posts from: ${followCount} players + their own posts\n`);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✨ All tests completed!\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCommunityAndMessaging();
