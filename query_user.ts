import prisma from './src/lib/prisma';

async function queryUser() {
  try {
    console.log('\n=== Querying for user: elena.coach@example.com ===\n');
    
    // 1. Query the User table
    console.log('1. Checking User table...');
    const user = await prisma.user.findUnique({
      where: { email: 'elena.coach@example.com' },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    if (!user) {
      console.log('   ❌ User not found\n');
      await prisma.$disconnect();
      return;
    }

    console.log('   ✅ User found:');
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Username: ${user.username}`);
    console.log(`   - Name: ${user.firstName} ${user.lastName}`);
    console.log(`   - Created: ${user.createdAt}\n`);

    // 2. Query the Staff table
    console.log('2. Checking Staff table...');
    const staff = await prisma.staff.findUnique({
      where: { userId: user.id },
      select: {
        userId: true,
        role: true,
        expertise: true,
        coachingLevel: true,
        yearsOfExperience: true,
        createdAt: true,
      },
    });

    if (!staff) {
      console.log('   ❌ Staff record not found\n');
    } else {
      console.log('   ✅ Staff record found:');
      console.log(`   - User ID: ${staff.userId}`);
      console.log(`   - Role: ${staff.role}`);
      console.log(`   - Expertise: ${staff.expertise}`);
      console.log(`   - Coaching Level: ${staff.coachingLevel}`);
      console.log(`   - Years of Experience: ${staff.yearsOfExperience}`);
      console.log(`   - Created: ${staff.createdAt}\n`);
    }

    // 3. Query the Membership table
    console.log('3. Checking Membership table...');
    const memberships = await prisma.membership.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        userId: true,
        orgId: true,
        role: true,
        status: true,
        joinedAt: true,
        approvedAt: true,
      },
    });

    if (memberships.length === 0) {
      console.log('   ❌ No memberships found\n');
    } else {
      console.log(`   ✅ Found ${memberships.length} membership(ies):`);
      memberships.forEach((membership, index) => {
        console.log(`\n   Membership ${index + 1}:`);
        console.log(`   - ID: ${membership.id}`);
        console.log(`   - Org ID: ${membership.orgId}`);
        console.log(`   - Role: ${membership.role}`);
        console.log(`   - Status: ${membership.status}`);
        console.log(`   - Joined: ${membership.joinedAt}`);
        console.log(`   - Approved: ${membership.approvedAt}`);
      });
      console.log();
    }

    // Summary
    console.log('=== SUMMARY ===');
    console.log(`User exists: ✅`);
    console.log(`Staff record exists: ${staff ? '✅' : '❌'}`);
    console.log(`Membership record(s) exist: ${memberships.length > 0 ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

queryUser();
