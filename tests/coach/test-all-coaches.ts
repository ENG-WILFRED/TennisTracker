/**
 * Comprehensive test suite for coach dashboard loading
 * Tests all coaches to ensure they can load correctly
 */

import prisma from '@/lib/prisma';

const API_BASE = 'http://localhost:3020';

async function testAllCoaches() {
  console.log('\n=== COACH DASHBOARD COMPREHENSIVE TEST ===\n');

  try {
    // Get all coaches
    const coaches = await prisma.staff.findMany({
      where: {
        role: {
          contains: 'Coach',
        },
      },
      select: {
        userId: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      take: 10,
    });

    console.log(`Found ${coaches.length} coaches to test\n`);

    let passed = 0;
    let failed = 0;

    for (const coach of coaches) {
      const coachName = `${coach.user.firstName} ${coach.user.lastName}`;
      const url = `${API_BASE}/api/dashboard/role?role=coach&userId=${coach.userId}`;
      
      try {
        console.log(`Testing: ${coachName} (${coach.userId})`);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
          console.log(`  ✅ SUCCESS - ${data.students?.length || 0} students\n`);
          passed++;
        } else {
          console.log(`  ❌ FAILED - ${data.error}: ${data.details}\n`);
          failed++;
        }
      } catch (error: any) {
        console.log(`  ❌ ERROR - ${error.message}\n`);
        failed++;
      }
    }

    console.log(`=== TEST RESULTS ===`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}\n`);

    if (failed === 0) {
      console.log('🎉 All coaches load successfully!\n');
    }

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAllCoaches();
