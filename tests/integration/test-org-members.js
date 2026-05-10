import fetch from 'node-fetch';

const BASE_URL = process.env.TEST_BASE_URL || process.env.BASE_URL || 'http://localhost:3001';

async function testOrgMembers() {
  const orgId = 'cc06f187-b786-4410-8869-2218f6b591df'; // Central Tennis Club
  const url = `${BASE_URL.replace(/\/$/, '')}/api/organization/${orgId}/members`;

  try {
    console.log(`Testing API: ${url}`);
    const response = await fetch(url);
    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Members returned: ${data.length}`);

    if (data.length > 0) {
      console.log('\nFirst member sample:');
      console.log(JSON.stringify(data[0], null, 2));
    }

    console.log('\nAll members:');
    data.forEach((member, index) => {
      const name = `${member.player?.user?.firstName} ${member.player?.user?.lastName}`;
      const email = member.player?.user?.email;
      const role = member.role;
      const tier = member.membershipTier?.name;
      console.log(`${index + 1}. ${name} (${email}) - ${role} - ${tier}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

testOrgMembers();