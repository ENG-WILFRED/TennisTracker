/**
 * Diagnose membership and role configuration for coach dashboard
 */

import prisma from './src/lib/prisma.js';

const COACH_ID = 'dcd1fb1c-e342-45a0-b252-3f69e8be027d';

async function diagnoseMembership() {
  console.log('\n=== MEMBERSHIP & ROLE DIAGNOSIS ===\n');
  console.log(`Coach ID: ${COACH_ID}\n`);

  try {
    // 1. Get user with all relationships
    console.log('1️⃣ User Details:');
    const user = await prisma.user.findUnique({
      where: { id: COACH_ID },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        memberships: {
          select: {
            id: true,
            role: true,
            status: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        staff: {
          select: {
            userId: true,
            role: true,
            bio: true,
          },
        },
        player: {
          select: {
            userId: true,
          },
        },
        referee: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!user) {
      console.log('   ❌ User not found!\n');
      return;
    }

    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user.id}\n`);

    // 2. Check memberships
    console.log('2️⃣ Memberships:');
    if (user.memberships.length === 0) {
      console.log('   ❌ NO MEMBERSHIPS! This is likely the issue.');
      console.log('   The user has no organization membership.\n');
    } else {
      user.memberships.forEach((m, i) => {
        console.log(`   Membership ${i + 1}:`);
        console.log(`     - Role: ${m.role}`);
        console.log(`     - Status: ${m.status}`);
        console.log(`     - Organization: ${m.organization.name} (${m.organization.id})\n`);
      });
    }

    // 3. Check staff role
    console.log('3️⃣ Staff Role:');
    if (!user.staff) {
      console.log('   ❌ NO STAFF RECORD!\n');
    } else {
      console.log(`   Role: ${user.staff.role}`);
      console.log(`   Bio: ${user.staff.bio || '(empty)'}\n`);
    }

    // 4. Check if user has player/referee roles
    console.log('4️⃣ Other Roles:');
    console.log(`   Player: ${user.player ? 'Yes' : 'No'}`);
    console.log(`   Referee: ${user.referee ? 'Yes' : 'No'}\n`);

    // 5. Check if user has any organization membership with Coach-related role
    console.log('5️⃣ Membership Role Analysis:');
    const coachMembers = user.memberships.filter(m => 
      m.role && (m.role.includes('Coach') || m.role.includes('coach') || m.role.includes('Staff'))
    );
    
    if (coachMembers.length === 0) {
      console.log('   ⚠️  User has no membership with Coach/Staff role!');
      console.log('   Membership roles found:', user.memberships.map(m => m.role).join(', ') || 'None');
      console.log('\n   This might be the issue - need to add Coach membership\n');
    } else {
      console.log('   ✅ User has Coach/Staff membership role\n');
    }

    // 6. Check page route requirements
    console.log('6️⃣ Page Route Requirements:');
    console.log('   The route /dashboard/coach/[userId] needs:');
    console.log('   - User authenticated ✅ (user exists)');
    console.log(`   - Staff record with Coach role: ${user.staff && user.staff.role.includes('Coach') ? '✅' : '❌'}`);
    console.log(`   - Membership active: ${user.memberships.some(m => m.status === 'active') ? '✅' : '❌'}\n`);

    // 7. Check if there's an issue with the membership
    console.log('7️⃣ Potential Issues:');
    const issues: string[] = [];
    
    if (user.memberships.length === 0) {
      issues.push('• No organization membership at all');
    }
    
    if (!user.staff) {
      issues.push('• Missing staff record');
    } else if (!user.staff.role.includes('Coach')) {
      issues.push(`• Staff role is "${user.staff.role}" not "Coach"`);
    }
    
    const inactiveMemberships = user.memberships.filter(m => m.status !== 'active');
    if (inactiveMemberships.length > 0) {
      issues.push(`• ${inactiveMemberships.length} inactive membership(s)`);
    }

    if (issues.length === 0) {
      console.log('   ✅ No obvious issues found\n');
    } else {
      issues.forEach(issue => console.log(`   ${issue}`));
      console.log();
    }

  } catch (error: any) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseMembership();
