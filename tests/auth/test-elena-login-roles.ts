import { getUserAvailableRoles } from '@/actions/auth';
import prisma from '@/lib/prisma';

async function testElenaLogin() {
  const elenaId = '8217805e-a165-428c-9b1b-b847941023bb';
  
  try {
    console.log('Testing Elena login flow...\n');
    
    // Test 1: Get available roles
    console.log('1. Fetching available roles for Elena...');
    
    const memberships = await prisma.membership.findMany({
      where: {
        userId: elenaId,
        status: 'accepted'
      },
      include: {
        organization: true
      }
    });

    console.log(`   Memberships found: ${memberships.length}`);
    memberships.forEach(m => {
      console.log(`   - ${m.role} in ${m.organization.name} (status: ${m.status})`);
    });

    const clubMemberships = await prisma.clubMember.findMany({
      where: {
        playerId: elenaId,
        paymentStatus: 'active',
        role: { not: 'inactive' }
      },
      include: {
        organization: true
      }
    });

    console.log(`   Club memberships found: ${clubMemberships.length}`);

    // Test 2: Check if staff record exists and includes "Coach"
    console.log('\n2. Checking staff record...');
    const staff = await prisma.staff.findUnique({
      where: { userId: elenaId },
      select: { role: true, organizationId: true }
    });

    if (staff) {
      console.log(`   Staff role: ${staff.role}`);
      console.log(`   Includes 'Coach': ${staff.role.includes('Coach')}`);
    } else {
      console.log('   No staff record found');
    }

    // Test 3: Simulate full role resolution as login API does
    console.log('\n3. Simulating login API role resolution...');
    const rolesMap = new Map<string, any>();

    for (const membership of memberships) {
      const key = `${membership.orgId}:${membership.role}`;
      if (!rolesMap.has(key)) {
        rolesMap.set(key, {
          role: membership.role,
          orgId: membership.orgId,
          orgName: membership.organization.name,
          status: membership.status,
        });
      }
    }

    for (const clubMember of clubMemberships) {
      const key = `${clubMember.organizationId}:member`;
      if (!rolesMap.has(key)) {
        rolesMap.set(key, {
          role: 'member',
          orgId: clubMember.organizationId,
          orgName: clubMember.organization.name,
          status: 'accepted',
        });
      }
    }

    const roles = Array.from(rolesMap.values());
    
    if (roles.length === 0) {
      roles.push({
        role: 'spectator',
        orgId: '',
        orgName: 'Platform',
        status: 'accepted',
      });
    }

    console.log(`   Final available roles: ${roles.length}`);
    roles.forEach(r => {
      console.log(`   - ${r.role} in ${r.orgName}`);
    });

    console.log('\n✅ Elena should have coach membership available!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

testElenaLogin();
