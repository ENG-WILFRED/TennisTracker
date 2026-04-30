/**
 * Test script to verify the coach dashboard loads completely
 */

const COACH_ID = 'dcd1fb1c-e342-45a0-b252-3f69e8be027d';
const API_URL = `http://localhost:3020/api/dashboard/role?role=coach&userId=${COACH_ID}`;

async function testCoachDashboardLoad() {
  console.log('\n=== TESTING COACH DASHBOARD LOAD ===\n');
  console.log(`Testing: ${API_URL}\n`);

  try {
    console.log('⏳ Fetching dashboard data...');
    const startTime = Date.now();
    
    const response = await fetch(API_URL);
    const responseTime = Date.now() - startTime;
    
    console.log(`⏱️  Response time: ${responseTime}ms`);
    console.log(`📊 Status code: ${response.status}\n`);
    
    if (!response.ok) {
      console.log(`❌ ERROR: Status ${response.status}`);
      const error = await response.json();
      console.log(`Error: ${error.error}`);
      console.log(`Details: ${error.details}`);
      return false;
    }
    
    const data = await response.json();
    
    console.log('✅ Dashboard data loaded successfully!\n');
    console.log('📋 Data Summary:');
    console.log(`   Coach: ${data.coach?.name}`);
    console.log(`   Photo: ${data.coach?.photo ? 'Yes' : 'No'}`);
    console.log(`   Bio: ${data.coach?.bio || '(empty)'}`);
    console.log(`   Students: ${data.students?.length || 0}`);
    console.log(`   Stats:`);
    console.log(`     - Student Count: ${data.stats?.studentCount}`);
    console.log(`     - Rating: ${data.stats?.rating}`);
    console.log(`     - Total Sessions: ${data.stats?.totalSessions}`);
    console.log(`   Next Session: ${data.nextSession ? 'Yes' : 'No'}`);
    console.log(`   Activities: ${data.activities?.length || 0}\n`);
    
    return true;
  } catch (error: any) {
    console.log(`❌ FETCH ERROR: ${error.message}\n`);
    return false;
  }
}

testCoachDashboardLoad().then(success => {
  if (success) {
    console.log('✅ DASHBOARD IS READY TO LOAD!\n');
    console.log('🌐 Open browser and navigate to:');
    console.log(`   http://localhost:3020/dashboard/coach/${COACH_ID}\n`);
    process.exit(0);
  } else {
    console.log('❌ Dashboard load failed\n');
    process.exit(1);
  }
});
