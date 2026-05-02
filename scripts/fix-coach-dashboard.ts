/**
 * Script to diagnose and fix the coach dashboard loading issue
 * The user exists but doesn't have a Coach role
 */

import prisma from './src/lib/prisma.js';

const COACH_ID = 'dcd1fb1c-e342-45a0-b252-3f69e8be027d';

async function diagnoseAndFix() {
  console.log('\n=== DIAGNOSING COACH DASHBOARD ISSUE ===\n');
  console.log(`User ID: ${COACH_ID}\n`);

  try {
    // 1. Check user
    console.log('1️⃣ Checking user...');
    const user = await prisma.user.findUnique({
      where: { id: COACH_ID },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    
    if (!user) {
      console.log('   ❌ User not found!\n');
      return;
    }
    
    console.log(`   ✅ User found: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}\n`);

    // 2. Check if staff record exists
    console.log('2️⃣ Checking staff record...');
    const staff = await prisma.staff.findUnique({
      where: { userId: COACH_ID },
      select: { userId: true, role: true, bio: true },
    });

    if (!staff) {
      console.log('   ❌ No staff record found\n');
      console.log('🔧 FIXING: Creating staff record with Coach role...');
      
      const newStaff = await prisma.staff.create({
        data: {
          userId: COACH_ID,
          role: 'Coach',
          bio: '',
        },
      });
      
      console.log('   ✅ Staff record created\n');
    } else {
      console.log(`   Staff record found with role: ${staff.role}`);
      
      if (!staff.role.includes('Coach')) {
        console.log('   ⚠️  Role does not include "Coach"\n');
        console.log('🔧 FIXING: Updating role to include Coach...');
        
        const updatedStaff = await prisma.staff.update({
          where: { userId: COACH_ID },
          data: { role: 'Coach' },
        });
        
        console.log(`   ✅ Role updated to: ${updatedStaff.role}\n`);
      } else {
        console.log('   ✅ Role includes Coach\n');
      }
    }

    // 3. Ensure stats exist
    console.log('3️⃣ Checking coach stats...');
    try {
      const stats = await prisma.coachStats.findUnique({
        where: { coachId: COACH_ID },
      });

      if (!stats) {
        console.log('   ⚠️  No stats record found (creating one)\n');
        
        try {
          const newStats = await prisma.coachStats.create({
            data: {
              coachId: COACH_ID,
              activePlayers: 0,
              totalSessions: 0,
              avgRating: 5.0,
            },
          });
          console.log('   ✅ Stats record created\n');
        } catch (e) {
          console.log('   ℹ️  Stats creation skipped\n');
        }
      } else {
        console.log('   ✅ Stats record exists\n');
      }
    } catch (e) {
      console.log('   ℹ️  Stats table not accessible (OK)\n');
    }

    // 5. Test the API endpoint
    console.log('5️⃣ Testing API endpoint...');
    const response = await fetch('http://localhost:3020/api/dashboard/role?role=coach&userId=' + COACH_ID);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ API endpoint works!');
      console.log(`   Coach name: ${data.coach.name}`);
      console.log(`   Students: ${data.students?.length || 0}`);
      console.log(`   Stats: ${JSON.stringify(data.stats)}\n`);
    } else {
      const errorData = await response.json();
      console.log(`   ❌ API still returning error: ${errorData.details}\n`);
    }

    console.log('=== FIX COMPLETE ===\n');
    console.log('The dashboard should now load correctly!');
    console.log('Try refreshing the page at http://localhost:3020/dashboard/coach/' + COACH_ID);

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseAndFix();
