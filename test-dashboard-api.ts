import fetch from 'node-fetch';
import { generateAccessToken } from '@/lib/jwt';

async function testDashboardAPI() {
  const elenaId = '8217805e-a165-428c-9b1b-b847941023bb';
  
  try {
    console.log('Testing coach dashboard API...\n');
    
    // Generate a valid token for Elena
    const token = generateAccessToken({
      playerId: elenaId,
      email: 'elena.coach@example.com',
      username: 'coach_elena'
    });
    
    console.log('Generated token:', token.substring(0, 50) + '...\n');
    
    // Test the API with the token
    const response = await fetch('http://localhost:3020/api/dashboard/role?role=coach&userId=' + elenaId, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API Response Status:', response.status);
    
    const data = await response.text();
    console.log('Response Body:', data.substring(0, 500) + (data.length > 500 ? '...' : ''));
    
    if (response.ok) {
      const jsonData = JSON.parse(data);
      console.log('\n✅ API is working!');
      console.log('Dashboard data keys:', Object.keys(jsonData));
    } else {
      console.log('\n❌ API returned error');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testDashboardAPI();
