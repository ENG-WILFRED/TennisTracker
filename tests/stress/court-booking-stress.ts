/**
 * Court Booking System - Stress Testing
 * Tests the system's ability to handle concurrent court booking requests
 * 
 * Run: npx ts-node tests/stress/court-booking-stress.ts
 */

import fetch from 'node-fetch';
import { writeStressReport } from './reporting';

const BASE_URL = process.env.STRESS_TEST_URL || 'http://localhost:3000';
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS || '50', 10);
const REQUESTS_PER_USER = parseInt(process.env.REQUESTS_PER_USER || '10', 10);
const TEST_DURATION_SECONDS = parseInt(process.env.TEST_DURATION || '60', 10);
const REPORT_NAME = 'court-booking-stress';

interface TestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errorCounts: Record<string, number>;
  responseTimes: number[];
}

const metrics: TestMetrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  averageResponseTime: 0,
  minResponseTime: Infinity,
  maxResponseTime: 0,
  requestsPerSecond: 0,
  errorCounts: {},
  responseTimes: [],
};

const startTime = Date.now();
const tokenCache: Record<string, string> = {};
let cachedAmenity: { id: string; availableFrom?: string; availableUntil?: string } | null = null;

async function getValidAmenity(): Promise<{ id: string; availableFrom?: string; availableUntil?: string }> {
  if (cachedAmenity) return cachedAmenity;

  const response = await fetch(`${BASE_URL}/api/tournaments`);
  const tournaments = await response.json().catch(() => []);
  if (!Array.isArray(tournaments) || tournaments.length === 0) {
    throw new Error('Unable to discover tournament amenities for stress test');
  }

  for (const tournament of tournaments) {
    if (!Array.isArray(tournament.amenities)) continue;
    const amenity = tournament.amenities[0];
    if (amenity?.id) {
      cachedAmenity = {
        id: amenity.id,
        availableFrom: amenity.availableFrom,
        availableUntil: amenity.availableUntil,
      };
      return cachedAmenity;
    }
  }

  throw new Error('No valid amenity found from tournament data');
}

async function getAuthToken(userId: string): Promise<string> {
  if (tokenCache[userId]) return tokenCache[userId];

  const email = `stress-${userId}@test.com`;
  const password = 'TestPass123!';
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail: email, password }),
  });

  if (loginResponse.ok) {
    const data: any = await loginResponse.json().catch(() => null);
    if (data?.accessToken) {
      tokenCache[userId] = data.accessToken;
      return data.accessToken;
    }
  }

  await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `stress-${userId}`,
      email,
      password,
      firstName: `Stress${userId}`,
      lastName: 'User',
    }),
  }).catch(() => null);

  const retryLoginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail: email, password }),
  });
  const retryData: any = await retryLoginResponse.json().catch(() => null);
  const token = retryData?.accessToken || '';
  tokenCache[userId] = token;
  return token;
}

function makeBookingWindow(amenity: { availableFrom?: string; availableUntil?: string }) {
  const now = Date.now();
  const earliest = amenity.availableFrom ? new Date(amenity.availableFrom).getTime() : now + 60_000;
  const latest = amenity.availableUntil ? new Date(amenity.availableUntil).getTime() : now + 7 * 24 * 60 * 60 * 1000;
  const start = Math.max(earliest, now + 60_000);
  const end = Math.min(latest, start + 60 * 60 * 1000);
  return {
    startTime: new Date(start).toISOString(),
    endTime: new Date(end).toISOString(),
  };
}

/**
 * Simulate a court booking request
 */
async function makeBookingRequest(userId: string, authToken: string): Promise<{ success: boolean; responseTime: number; error?: string }> {
  const requestStart = Date.now();

  try {
    const amenity = await getValidAmenity();
    const bookingWindow = makeBookingWindow(amenity);
    const response = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({
        amenityId: amenity.id,
        memberId: null,
        guestName: `Stress user ${userId}`,
        startTime: bookingWindow.startTime,
        endTime: bookingWindow.endTime,
        notes: 'Stress booking request',
      }),
    }) as any;

    const responseTime = Date.now() - requestStart;
    metrics.responseTimes.push(responseTime);
    metrics.totalRequests++;

    const responseBody = await response.json().catch(() => null);
    if (response.ok) {
      metrics.successfulRequests++;
      return { success: true, responseTime };
    } else {
      const errorMsg = responseBody?.error ? `HTTP ${response.status} - ${responseBody.error}` : `HTTP ${response.status}`;
      metrics.failedRequests++;
      metrics.errorCounts[errorMsg] = (metrics.errorCounts[errorMsg] || 0) + 1;
      return { success: false, responseTime, error: errorMsg };
    }
  } catch (error) {
    const responseTime = Date.now() - requestStart;
    const errorMsg = error instanceof Error ? error.message : String(error);
    metrics.failedRequests++;
    metrics.errorCounts[errorMsg] = (metrics.errorCounts[errorMsg] || 0) + 1;
    metrics.totalRequests++;
    return { success: false, responseTime, error: errorMsg };
  }
}

/**
 * Simulate a single user making multiple booking requests
 */
async function simulateUser(userId: string): Promise<void> {
  const authToken = await getAuthToken(userId);
  for (let i = 0; i < REQUESTS_PER_USER; i++) {
    await makeBookingRequest(`user-${userId}-${i}`, authToken);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
  }
}

/**
 * Calculate metrics from collected response times
 */
function calculateMetrics(): void {
  if (metrics.responseTimes.length > 0) {
    metrics.minResponseTime = Math.min(...metrics.responseTimes);
    metrics.maxResponseTime = Math.max(...metrics.responseTimes);
    metrics.averageResponseTime = metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length;
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    metrics.requestsPerSecond = metrics.totalRequests / elapsedSeconds;
  }
}

/**
 * Print results in a formatted table
 */
function printResults(): void {
  calculateMetrics();

  console.log('\n========================================');
  console.log('COURT BOOKING STRESS TEST - RESULTS');
  console.log('========================================\n');

  console.log('📊 Test Configuration:');
  console.log(`  • Concurrent Users: ${CONCURRENT_USERS}`);
  console.log(`  • Requests per User: ${REQUESTS_PER_USER}`);
  console.log(`  • Total Planned Requests: ${CONCURRENT_USERS * REQUESTS_PER_USER}\n`);

  console.log('✅ Response Summary:');
  console.log(`  • Total Requests: ${metrics.totalRequests}`);
  console.log(`  • Successful: ${metrics.successfulRequests} (${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2)}%)`);
  console.log(`  • Failed: ${metrics.failedRequests} (${((metrics.failedRequests / metrics.totalRequests) * 100).toFixed(2)}%)\n`);

  console.log('⏱️  Performance Metrics:');
  console.log(`  • Min Response Time: ${metrics.minResponseTime}ms`);
  console.log(`  • Max Response Time: ${metrics.maxResponseTime}ms`);
  console.log(`  • Avg Response Time: ${metrics.averageResponseTime.toFixed(2)}ms`);
  console.log(`  • Requests per Second: ${metrics.requestsPerSecond.toFixed(2)}\n`);

  if (Object.keys(metrics.errorCounts).length > 0) {
    console.log('⚠️  Error Summary:');
    Object.entries(metrics.errorCounts).forEach(([error, count]) => {
      console.log(`  • ${error}: ${count}`);
    });
    console.log();
  }

  const elapsedSeconds = (Date.now() - startTime) / 1000;
  console.log(`⏱️  Test Duration: ${elapsedSeconds.toFixed(2)}s\n`);

  // Health check
  console.log('🏥 System Health:');
  if (metrics.successfulRequests / metrics.totalRequests > 0.95) {
    console.log('  ✅ PASS: System handles stress well (>95% success rate)');
  } else {
    console.log('  ⚠️  WARNING: Success rate below 95% - system may need optimization');
  }
}

/**
 * Main stress test runner
 */
async function runStressTest(): Promise<void> {
  console.log('\n🚀 Starting Court Booking Stress Test...');
  console.log(`📍 Target: ${BASE_URL}`);
  console.log(`👥 Concurrent Users: ${CONCURRENT_USERS}`);
  console.log(`🔄 Requests per User: ${REQUESTS_PER_USER}\n`);

  const userPromises: Promise<void>[] = [];

  for (let i = 0; i < CONCURRENT_USERS; i++) {
    userPromises.push(simulateUser(String(i)));
  }

  try {
    await Promise.all(userPromises);
    printResults();
    writeStressReport(
      {
        testName: REPORT_NAME,
        testType: 'Court Booking',
        baseUrl: BASE_URL,
        concurrent: CONCURRENT_USERS,
        durationSeconds: TEST_DURATION_SECONDS,
        extraConfig: {
          requestsPerUser: REQUESTS_PER_USER,
        },
      },
      {
        totalRequests: metrics.totalRequests,
        successfulRequests: metrics.successfulRequests,
        failedRequests: metrics.failedRequests,
        averageResponseTime: metrics.averageResponseTime,
        minResponseTime: metrics.minResponseTime,
        maxResponseTime: metrics.maxResponseTime,
        requestsPerSecond: metrics.requestsPerSecond,
      },
      metrics.errorCounts,
      metrics.responseTimes,
      ['Court booking stress test completed']
    );
  } catch (error) {
    writeStressReport(
      {
        testName: REPORT_NAME,
        testType: 'Court Booking',
        baseUrl: BASE_URL,
        concurrent: CONCURRENT_USERS,
        durationSeconds: TEST_DURATION_SECONDS,
        extraConfig: {
          requestsPerUser: REQUESTS_PER_USER,
        },
      },
      {
        totalRequests: metrics.totalRequests,
        successfulRequests: metrics.successfulRequests,
        failedRequests: metrics.failedRequests,
        averageResponseTime: metrics.averageResponseTime,
        minResponseTime: metrics.minResponseTime,
        maxResponseTime: metrics.maxResponseTime,
        requestsPerSecond: metrics.requestsPerSecond,
      },
      metrics.errorCounts,
      metrics.responseTimes,
      [`Court booking stress test failed: ${error instanceof Error ? error.message : String(error)}`]
    );
    console.error('❌ Stress test failed:', error);
    process.exit(1);
  }
}

// Run the stress test
runStressTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
