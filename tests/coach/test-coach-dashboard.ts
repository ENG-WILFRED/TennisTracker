import { getCoachDashboard } from './src/actions/dashboards';

async function testCoachDashboard() {
  const elenaId = '8217805e-a165-428c-9b1b-b847941023bb';
  
  try {
    console.log('Testing getCoachDashboard for Elena...');
    const result = await getCoachDashboard(elenaId);
    console.log('✅ Success! Dashboard data:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

testCoachDashboard();
