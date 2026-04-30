/**
 * Debug script to test Coach Dashboard loading issue
 * Tests the specific URL: http://localhost:3020/dashboard/coach/dcd1fb1c-e342-45a0-b252-3f69e8be027d
 */

import fetch from 'node-fetch';
import { readFileSync } from 'fs';

const COACH_ID = 'dcd1fb1c-e342-45a0-b252-3f69e8be027d';
const BASE_URL = 'http://localhost:3020';
const API_ENDPOINT = `${BASE_URL}/api/dashboard/role?role=coach&userId=${COACH_ID}`;

// Read environment variables from .env.local
function getEnvVar(key: string): string | null {
  try {
    const envContent = readFileSync('.env.local', 'utf-8');
    const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

const getAuthHeader = (): string | null => {
  // In a real test, we'd use an actual token
  // For now, we'll log that auth is needed
  return null;
};

async function testCoachDashboardLoading() {
  console.log('\n=== COACH DASHBOARD DEBUG TEST ===\n');
  console.log(`Testing coach ID: ${COACH_ID}`);
  console.log(`API Endpoint: ${API_ENDPOINT}\n`);

  // Test 1: Check if coach exists in database
  console.log('TEST 1: Checking if coach exists in database...');
  try {
    const response = await fetch(`${BASE_URL}/api/dashboard/role?role=coach&userId=${COACH_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`  Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('  ❌ ISSUE: API returned 401 (Unauthorized)');
      console.log('     This means the request is not authenticated');
      console.log('     The browser may not have a valid auth token');
    } else if (response.status === 404) {
      console.log('  ❌ ISSUE: API returned 404 (Not Found)');
      console.log('     This means the coach/staff record does not exist');
    } else if (response.status === 500) {
      console.log('  ❌ ISSUE: API returned 500 (Internal Server Error)');
      const errorData = await response.json();
      console.log('     Error details:', errorData);
    } else if (response.ok) {
      const data = await response.json();
      console.log('  ✅ SUCCESS: API returned data');
      console.log('     Coach name:', data.coach?.name);
      console.log('     Students count:', data.students?.length);
      console.log('     Stats:', data.stats);
    } else {
      const text = await response.text();
      console.log(`  ⚠️  Unexpected status: ${response.status}`);
      console.log(`     Response: ${text.substring(0, 200)}`);
    }
  } catch (error: any) {
    console.log(`  ❌ FETCH ERROR: ${error.message}`);
    console.log('     The request failed completely');
  }

  // Test 2: Check database for this coach directly
  console.log('\nTEST 2: Checking database for this coach...');
  try {
    // This requires database access - would need to run in Node with Prisma
    console.log('  (Requires Prisma/database access - run in separate script)');
  } catch (error: any) {
    console.log(`  Error: ${error.message}`);
  }

  // Test 3: Check if the route even exists
  console.log('\nTEST 3: Checking if route is accessible...');
  try {
    const response = await fetch(`${BASE_URL}/api/dashboard/role`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`  Status: ${response.status}`);
    if (response.status === 400) {
      const errorData = await response.json();
      console.log('  ✅ Route exists (error is validation-related)');
      console.log('     Error:', errorData.error);
    } else {
      console.log(`  Route returned status: ${response.status}`);
    }
  } catch (error: any) {
    console.log(`  ❌ Cannot reach route: ${error.message}`);
  }

  // Test 4: Log common issues
  console.log('\n=== COMMON ISSUES ===\n');
  console.log('1. ❌ 401 Unauthorized:');
  console.log('   - User is not logged in');
  console.log('   - Session token expired');
  console.log('   - AuthContext not initialized\n');
  
  console.log('2. ❌ Staff record not found:');
  console.log('   - User exists but has no staff/coach record');
  console.log('   - Role mismatch: user is not marked as a coach\n');
  
  console.log('3. ⏳ Request timeout:');
  console.log('   - Database query is slow');
  console.log('   - Network connectivity issues');
  console.log('   - Server is unresponsive\n');
  
  console.log('4. 🔄 useEffect dependency issue:');
  console.log('   - user?.id is undefined when component mounts');
  console.log('   - AuthContext takes time to initialize\n');

  console.log('=== NEXT STEPS ===\n');
  console.log('1. Check browser console (F12) for error messages');
  console.log('2. Check server logs for API errors');
  console.log('3. Verify the user is logged in and has coach role');
  console.log('4. Check database for staff record with userId:', COACH_ID);
}

// Run tests
testCoachDashboardLoading().catch(console.error);
