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

async function testRefereeEndpoints() {
  try {
    console.log('🏀 Testing Referee API Endpoints\n');

    // Get a referee from the database
    const referee = await prisma.referee.findFirst({
      include: { user: true },
    });

    if (!referee) {
      console.error('❌ No referees found in database. Run seed first.');
      process.exit(1);
    }

    console.log(`✅ Found referee: ${referee.user.firstName} ${referee.user.lastName}`);
    console.log(`   User ID: ${referee.userId}\n`);

    const token = generateToken(referee.user);
    const refereeId = referee.userId;
    const endpoints = [
      { name: 'Matches', url: `/api/referees/${refereeId}/matches` },
      { name: 'Performance', url: `/api/referees/${refereeId}/performance` },
      { name: 'VAR Cases', url: `/api/referees/${refereeId}/var-cases` },
      { name: 'Certificates', url: `/api/referees/${refereeId}/certificates` },
    ];

    console.log('📋 Testing Endpoints:\n');

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint.url}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint.name.padEnd(15)} - Status: ${response.status}`);
          
          // Show summary of data
          if (data.matches) console.log(`   → Matches: ${data.matches.length}`);
          if (data.stats) console.log(`   → Stats present: yes`);
          if (data.upcomingMatches) console.log(`   → Upcoming: ${data.upcomingMatches.length}`);
          if (data.varCases) console.log(`   → VAR Cases: ${data.varCases.length}`);
          if (data.certificates) console.log(`   → Certificates: ${data.certificates.length}`);
        } else {
          console.log(`❌ ${endpoint.name.padEnd(15)} - Status: ${response.status}`);
          const errorText = await response.text();
          console.log(`   Error: ${errorText.substring(0, 100)}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name.padEnd(15)} - Error: ${error.message}`);
      }
      console.log();
    }

    console.log('✨ Test Complete!\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRefereeEndpoints();
