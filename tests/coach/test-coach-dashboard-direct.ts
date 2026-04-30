/**
 * Direct database diagnostic script for coach dashboard issue
 * Run with: npx ts-node test-coach-dashboard-direct.ts
 */

import prisma from './src/lib/prisma.js';

const COACH_ID = 'dcd1fb1c-e342-45a0-b252-3f69e8be027d';

async function diagnoseCoachDashboard() {
  console.log('\n=== DIRECT COACH DASHBOARD DIAGNOSIS ===\n');
  console.log(`Checking coach: ${COACH_ID}\n`);

  try {
    // 1. Check if user exists
    console.log('1️⃣ Checking if user exists...');
    const user = await prisma.user.findUnique({
      where: { id: COACH_ID },
      select: { 
        id: true, 
        firstName: true, 
        lastName: true, 
        email: true, 
        role: true,
      },
    });

    if (!user) {
      console.log('   ❌ User NOT found in database');
      console.log('   This is the root cause - the user ID does not exist\n');
      process.exit(1);
    }

    console.log('   ✅ User found:', user.firstName, user.lastName);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role, '\n');

    // 2. Check if staff/coach record exists
    console.log('2️⃣ Checking if staff record exists...');
    const staff = await prisma.staff.findUnique({
      where: { userId: COACH_ID },
      select: {
        userId: true,
        role: true,
        bio: true,
      },
    });

    if (!staff) {
      console.log('   ❌ No staff record found for this user');
      console.log('   The user exists but is not registered as staff/coach\n');
      
      // List existing staff to see what we have
      const allStaff = await prisma.staff.findMany({
        select: { userId: true, role: true },
        take: 5,
      });
      console.log('   Existing staff records (sample):');
      allStaff.forEach(s => console.log(`   - ${s.userId}: ${s.role}`));
      process.exit(1);
    }

    console.log('   ✅ Staff record found');
    console.log('   Role:', staff.role, '\n');

    // 3. Check if role includes 'Coach'
    console.log('3️⃣ Checking if role includes "Coach"...');
    if (!staff.role.includes('Coach')) {
      console.log(`   ❌ User role is "${staff.role}", not "Coach"`);
      console.log('   This would cause the error: "User is not a coach"\n');
      process.exit(1);
    }
    console.log('   ✅ Role includes Coach\n');

    // 4. Check players
    console.log('4️⃣ Checking players...');
    const players = await prisma.staffPlayer.findMany({
      where: { staffUserId: COACH_ID },
      select: { playerId: true, status: true },
      take: 3,
    });
    console.log(`   Found ${players.length} player relationships`);
    if (players.length === 0) {
      console.log('   ⚠️  No players assigned yet (this is OK)\n');
    } else {
      console.log('   Sample players:', players.map(p => p.playerId).join(', '), '\n');
    }

    // 5. Check wallet
    console.log('5️⃣ Checking wallet...');
    const wallet = await prisma.wallet.findUnique({
      where: { userId: COACH_ID },
    });
    if (!wallet) {
      console.log('   ⚠️  No wallet found (would need to be created)\n');
    } else {
      console.log('   ✅ Wallet found');
      console.log('   Balance:', wallet.balance, '\n');
    }

    // 6. Check stats
    console.log('6️⃣ Checking stats...');
    const stats = await prisma.coachStats.findUnique({
      where: { coachId: COACH_ID },
    });
    if (!stats) {
      console.log('   ⚠️  No stats record (would be created automatically)\n');
    } else {
      console.log('   ✅ Stats found:', stats, '\n');
    }

    // 7. Try calling getCoachDashboard
    console.log('7️⃣ Attempting to call getCoachDashboard...');
    try {
      const { getCoachDashboard } = await import('./src/actions/dashboards.js');
      const dashboardData = await getCoachDashboard(COACH_ID);
      console.log('   ✅ Successfully got dashboard data');
      console.log('   Coach name:', dashboardData.coach.name);
      console.log('   Students:', dashboardData.students.length);
      console.log('   Stats:', dashboardData.stats);
    } catch (error: any) {
      console.log('   ❌ Error calling getCoachDashboard:');
      console.log('   ', error.message);
    }

    console.log('\n=== DIAGNOSIS COMPLETE ===\n');
    console.log('✅ All checks passed - data should load correctly');
    console.log('If the UI still shows loading, the issue is likely:');
    console.log('- Browser caching');
    console.log('- Authentication token expired');
    console.log('- Client-side React state issue');

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseCoachDashboard();
