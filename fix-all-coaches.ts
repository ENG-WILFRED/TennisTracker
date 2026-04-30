/**
 * Find and fix all coaches with incorrect roles
 */

import prisma from './src/lib/prisma.js';

async function fixAllCoaches() {
  console.log('\n=== FINDING ALL COACHES WITH INCORRECT ROLES ===\n');

  try {
    // Find all staff that should be coaches but aren't
    const staffRecords = await prisma.staff.findMany({
      select: {
        userId: true,
        role: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const nonCoaches = staffRecords.filter(s => !s.role.includes('Coach'));
    
    if (nonCoaches.length === 0) {
      console.log('✅ All staff have correct roles!\n');
      return;
    }

    console.log(`Found ${nonCoaches.length} staff with non-Coach roles:\n`);
    
    for (const staff of nonCoaches) {
      console.log(`  - ${staff.user.firstName} ${staff.user.lastName} (${staff.userId})`);
      console.log(`    Current role: ${staff.role}`);
      console.log(`    Updating to: Coach...\n`);
      
      await prisma.staff.update({
        where: { userId: staff.userId },
        data: { role: 'Coach' },
      });
      
      console.log(`    ✅ Updated\n`);
    }

    console.log(`=== ALL ${nonCoaches.length} COACHES FIXED ===\n`);

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllCoaches();
