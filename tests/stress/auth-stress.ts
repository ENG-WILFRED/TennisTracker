/**
 * Authentication System - Stress Testing
 * Tests login/registration endpoints under concurrent load
 * 
 * Run: npx ts-node tests/stress/auth-stress.ts
 */

import fetch from 'node-fetch';
import { writeStressReport } from './reporting';

const BASE_URL = process.env.STRESS_TEST_URL || 'http://localhost:3000';
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS || '100', 10);
const TEST_MODE = process.env.TEST_MODE || 'login'; // 'login' or 'register'
const REPORT_NAME = 'auth-stress';

interface AuthMetrics {
  totalRequests: number;
  successfulAuth: number;
  failedAuth: number;
  averageAuthTime: number;
  minAuthTime: number;
  maxAuthTime: number;
  concurrentSuccessRate: number;
  errorCounts: Record<string, number>;
  authTimes: number[];
}

const metrics: AuthMetrics = {
  totalRequests: 0,
  successfulAuth: 0,
  failedAuth: 0,
  averageAuthTime: 0,
  minAuthTime: Infinity,
  maxAuthTime: 0,
  concurrentSuccessRate: 0,
  errorCounts: {},
  authTimes: [],
};

/**
 * Simulate login attempt
 */
async function simulateLogin(email: string, password: string): Promise<{ success: boolean; authTime: number; error?: string }> {
  const requestStart = Date.now();

  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: email, password }),
    }) as any;

    const authTime = Date.now() - requestStart;
    metrics.authTimes.push(authTime);
    metrics.totalRequests++;

    if (response.ok) {
      const data = await response.json();
      if (data.accessToken) {
        metrics.successfulAuth++;
        return { success: true, authTime };
      }
      const errorDetail = data?.error || 'Missing access token';
      const errorMsg = `HTTP ${response.status} - ${errorDetail}`;
      metrics.failedAuth++;
      metrics.errorCounts[errorMsg] = (metrics.errorCounts[errorMsg] || 0) + 1;
      return { success: false, authTime, error: errorMsg };
    }

    const errorBody = await response.json().catch(() => null);
    const errorMsg = errorBody?.error ? `HTTP ${response.status} - ${errorBody.error}` : `HTTP ${response.status}`;
    metrics.failedAuth++;
    metrics.errorCounts[errorMsg] = (metrics.errorCounts[errorMsg] || 0) + 1;
    return { success: false, authTime, error: errorMsg };
  } catch (error) {
    const authTime = Date.now() - requestStart;
    const errorMsg = error instanceof Error ? error.message : String(error);
    metrics.failedAuth++;
    metrics.errorCounts[errorMsg] = (metrics.errorCounts[errorMsg] || 0) + 1;
    metrics.totalRequests++;
    return { success: false, authTime, error: errorMsg };
  }
}

/**
 * Simulate registration attempt
 */
async function simulateRegister(userId: string): Promise<{ success: boolean; authTime: number; error?: string }> {
  const requestStart = Date.now();

  try {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `user${userId}`,
        email: `user-${userId}@test.com`,
        password: 'TestPass123!',
        firstName: `User${userId}`,
        lastName: 'Load',
        role: 'player',
      }),
    }) as any;

    const authTime = Date.now() - requestStart;
    metrics.authTimes.push(authTime);
    metrics.totalRequests++;

    if (response.ok || response.status === 409) { // 409 = already exists
      metrics.successfulAuth++;
      return { success: true, authTime };
    }

    const errorBody = await response.json().catch(() => null);
    const errorMsg = errorBody?.error ? `HTTP ${response.status} - ${errorBody.error}` : `HTTP ${response.status}`;
    metrics.failedAuth++;
    metrics.errorCounts[errorMsg] = (metrics.errorCounts[errorMsg] || 0) + 1;
    return { success: false, authTime, error: errorMsg };
  } catch (error) {
    const authTime = Date.now() - requestStart;
    const errorMsg = error instanceof Error ? error.message : String(error);
    metrics.failedAuth++;
    metrics.errorCounts[errorMsg] = (metrics.errorCounts[errorMsg] || 0) + 1;
    metrics.totalRequests++;
    return { success: false, authTime, error: errorMsg };
  }
}

/**
 * Calculate metrics
 */
function calculateMetrics(): void {
  if (metrics.authTimes.length > 0) {
    metrics.minAuthTime = Math.min(...metrics.authTimes);
    metrics.maxAuthTime = Math.max(...metrics.authTimes);
    metrics.averageAuthTime = metrics.authTimes.reduce((a, b) => a + b, 0) / metrics.authTimes.length;
    metrics.concurrentSuccessRate = (metrics.successfulAuth / metrics.totalRequests) * 100;
  }
}

/**
 * Print results
 */
function printResults(): void {
  calculateMetrics();

  console.log('\n========================================');
  console.log(`AUTH STRESS TEST - ${TEST_MODE.toUpperCase()} - RESULTS`);
  console.log('========================================\n');

  console.log('📊 Test Configuration:');
  console.log(`  • Concurrent Users: ${CONCURRENT_USERS}`);
  console.log(`  • Test Type: ${TEST_MODE}\n`);

  console.log('✅ Authentication Results:');
  console.log(`  • Total Attempts: ${metrics.totalRequests}`);
  console.log(`  • Successful: ${metrics.successfulAuth}`);
  console.log(`  • Failed: ${metrics.failedAuth}`);
  console.log(`  • Success Rate: ${metrics.concurrentSuccessRate.toFixed(2)}%\n`);

  console.log('⏱️  Performance Metrics:');
  console.log(`  • Min Auth Time: ${metrics.minAuthTime}ms`);
  console.log(`  • Max Auth Time: ${metrics.maxAuthTime}ms`);
  console.log(`  • Avg Auth Time: ${metrics.averageAuthTime.toFixed(2)}ms\n`);

  if (Object.keys(metrics.errorCounts).length > 0) {
    console.log('⚠️  Error Summary:');
    Object.entries(metrics.errorCounts).forEach(([error, count]) => {
      console.log(`  • ${error}: ${count}`);
    });
    console.log();
  }

  console.log('🏥 System Health:');
  if (metrics.concurrentSuccessRate > 98) {
    console.log('  ✅ PASS: Authentication system is resilient');
  } else if (metrics.concurrentSuccessRate > 90) {
    console.log('  ⚠️  WARNING: Some auth failures detected');
  } else {
    console.log('  ❌ FAIL: High failure rate - investigate immediately');
  }
}

/**
 * Main auth stress test
 */
async function runAuthStressTest(): Promise<void> {
  console.log('\n🚀 Starting Auth Stress Test...');
  console.log(`📍 Target: ${BASE_URL}`);
  console.log(`👥 Concurrent Users: ${CONCURRENT_USERS}`);
  console.log(`🔐 Test Mode: ${TEST_MODE}\n`);

  const userPromises: Promise<any>[] = [];

  for (let i = 0; i < CONCURRENT_USERS; i++) {
    if (TEST_MODE === 'login') {
      userPromises.push(simulateLogin(`user-${i}@test.com`, 'TestPass123!'));
    } else {
      userPromises.push(simulateRegister(String(i)));
    }
  }

  try {
    await Promise.all(userPromises);
    printResults();
    writeStressReport(
      {
        testName: REPORT_NAME,
        testType: `Authentication - ${TEST_MODE}`,
        baseUrl: BASE_URL,
        concurrent: CONCURRENT_USERS,
        extraConfig: { mode: TEST_MODE },
      },
      {
        totalRequests: metrics.totalRequests,
        successfulAuth: metrics.successfulAuth,
        failedAuth: metrics.failedAuth,
        averageAuthTime: metrics.averageAuthTime,
        minAuthTime: metrics.minAuthTime,
        maxAuthTime: metrics.maxAuthTime,
        concurrentSuccessRate: metrics.concurrentSuccessRate,
      },
      metrics.errorCounts,
      metrics.authTimes,
      ['Auth stress test completed']
    );
  } catch (error) {
    writeStressReport(
      {
        testName: REPORT_NAME,
        testType: `Authentication - ${TEST_MODE}`,
        baseUrl: BASE_URL,
        concurrent: CONCURRENT_USERS,
        extraConfig: { mode: TEST_MODE },
      },
      {
        totalRequests: metrics.totalRequests,
        successfulAuth: metrics.successfulAuth,
        failedAuth: metrics.failedAuth,
        averageAuthTime: metrics.averageAuthTime,
        minAuthTime: metrics.minAuthTime,
        maxAuthTime: metrics.maxAuthTime,
        concurrentSuccessRate: metrics.concurrentSuccessRate,
      },
      metrics.errorCounts,
      metrics.authTimes,
      [`Auth stress test failed: ${error instanceof Error ? error.message : String(error)}`]
    );
    console.error('❌ Auth stress test failed:', error);
    process.exit(1);
  }
}

runAuthStressTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
