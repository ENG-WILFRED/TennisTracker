#!/usr/bin/env node

/**
 * Enhanced Test Runner - Saves results to database
 * Integrates with Vico Sports database to store and track test results
 * 
 * Usage: npx ts-node tests/test-runner-with-db.ts [options]
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '../src/generated/prisma/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

const args = process.argv.slice(2);
const suite = args.includes('--suite') ? args[args.indexOf('--suite') + 1] : 'all';
const concurrent = args.includes('--concurrent') ? args[args.indexOf('--concurrent') + 1] : '50';
const duration = args.includes('--duration') ? args[args.indexOf('--duration') + 1] : '60';
const testUrl = args.includes('--url') ? args[args.indexOf('--url') + 1] : process.env.TEST_BASE_URL || 'http://localhost:3000';

interface LocalTestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'PENDING';
  startTime: number;
  endTime: number;
  duration: number;
  error?: string;
  output?: string;
}

const results: LocalTestResult[] = [];
let testRunId = '';

// Create reports directory
const reportDir = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

async function saveTestResultToDb(result: LocalTestResult, runId: string): Promise<void> {
  try {
    const dbResult = await prisma.testResult.create({
      data: {
        suiteName: suite,
        testName: result.name,
        status: result.status === 'PASS' ? 'PASS' : result.status === 'FAIL' ? 'FAIL' : 'PENDING',
        startTime: new Date(result.startTime),
        endTime: new Date(result.endTime),
        duration: result.duration,
        message: result.error || 'Test completed',
        error: result.error,
        output: result.output,
        environment: 'development',
        nodeVersion: process.version,
        appVersion: JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8')).version,
        testRunId: runId,
        tags: [suite, 'automated'],
        metadata: {
          concurrent: parseInt(concurrent),
          duration: parseInt(duration),
          url: testUrl,
        },
      },
    });
    console.log(`  ✓ Saved to database: ${dbResult.id}`);
  } catch (error) {
    console.error(`  ✗ Failed to save to database:`, error instanceof Error ? error.message : String(error));
  }
}

async function createTestRun(): Promise<string> {
  try {
    const run = await prisma.testRun.create({
      data: {
        name: `Test run - ${suite} - ${new Date().toISOString()}`,
        runType: suite === 'all' ? 'integration' : (suite as 'unit' | 'integration' | 'e2e' | 'stress' | 'pilot'),
        status: 'RUNNING',
        environment: 'development',
        nodeVersion: process.version,
        triggeredBy: 'manual',
      },
    });
    console.log(`📊 Created test run: ${run.id}`);
    return run.id;
  } catch (error) {
    console.error('Failed to create test run:', error);
    throw error;
  }
}

async function updateTestRun(runId: string): Promise<void> {
  try {
    const passedTests = results.filter(r => r.status === 'PASS').length;
    const failedTests = results.filter(r => r.status === 'FAIL').length;
    const skippedTests = results.filter(r => r.status === 'PENDING').length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    await prisma.testRun.update({
      where: { id: runId },
      data: {
        status: failedTests > 0 ? 'FAILED' : 'PASSED',
        endTime: new Date(),
        duration: totalDuration,
        totalTests: results.length,
        passedTests,
        failedTests,
        skippedTests,
      },
    });
  } catch (error) {
    console.error('Failed to update test run:', error);
  }
}

async function emitProgress(runId: string, results: LocalTestResult[]): Promise<void> {
  try {
    const passCount = results.filter(r => r.status === 'PASS').length;
    const failCount = results.filter(r => r.status === 'FAIL').length;
    const skipCount = results.filter(r => r.status === 'PENDING').length;
    const progress = Math.round((results.length > 0 ? (results.length / 20) * 100 : 0)); // Estimate based on total tests

    await fetch('http://localhost:3000/api/developer/test-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testRunId: runId,
        progress,
        passed: passCount,
        failed: failCount,
        skipped: skipCount,
        total: results.length,
      }),
    }).catch(err => console.warn('Failed to emit progress:', err.message));
  } catch (error) {
    // Silently fail - don't block test execution
  }
}

function runTest(testScript: string, testName: string, env: Record<string, string>): LocalTestResult {
  const startTime = Date.now();
  const result: LocalTestResult = {
    name: testName,
    status: 'PENDING',
    startTime,
    endTime: 0,
    duration: 0,
  };

  console.log(`\n🧪 Running: ${testName}`);
  console.log(`📍 Script: ${testScript}`);

  try {
    const envVars = {
      ...process.env,
      STRESS_TEST_URL: testUrl,
      CONCURRENT_USERS: concurrent,
      CONCURRENT_CONNECTIONS: concurrent,
      CONCURRENT_PAYMENTS: concurrent,
      TEST_DURATION: duration,
      ...env,
    };

    const output = execSync(`npx tsx ${testScript}`, {
      stdio: 'pipe',
      cwd: process.cwd(),
      env: envVars,
      encoding: 'utf-8',
    });

    result.status = 'PASS';
    result.endTime = Date.now();
    result.duration = result.endTime - result.startTime;
    result.output = output;
    console.log(`✅ ${testName} completed`);
  } catch (error) {
    result.status = 'FAIL';
    result.endTime = Date.now();
    result.duration = result.endTime - result.startTime;
    result.error = error instanceof Error ? error.message : String(error);
    result.output = error instanceof Error && 'stdout' in error ? String(error.stdout) : '';
    console.error(`❌ ${testName} failed: ${result.error}`);
  }

  return result;
}

async function main(): Promise<void> {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║              VICO SPORTS TEST RUNNER WITH DATABASE STORAGE                ║
╚════════════════════════════════════════════════════════════════════════════╝

🎯 Configuration:
  • Test Suite: ${suite}
  • Base URL: ${testUrl}
  • Concurrent Load: ${concurrent}
  • Test Duration: ${duration}s
`);

  try {
    // Create test run record
    testRunId = await createTestRun();

    const testSuites: Record<string, Array<{ script: string; name: string; env?: Record<string, string> }>> = {
      'court-booking': [
        { script: 'tests/stress/court-booking-stress.ts', name: 'Court Booking Endpoints' },
      ],
      'auth': [
        { script: 'tests/stress/auth-stress.ts', name: 'Authentication - Login', env: { TEST_MODE: 'login' } },
        { script: 'tests/stress/auth-stress.ts', name: 'Authentication - Registration', env: { TEST_MODE: 'register' } },
      ],
      'websocket': [
        { script: 'tests/stress/websocket-stress.ts', name: 'WebSocket Connections' },
      ],
      'payment': [
        { script: 'tests/stress/payment-stress.ts', name: 'Payment Processing' },
      ],
    };

    if (suite === 'all') {
      Object.entries(testSuites).forEach(([, tests]) => {
        tests.forEach(({ script, name, env }) => {
          const result = runTest(script, name, env || {});
          results.push(result);
          emitProgress(testRunId, results);
        });
      });
    } else if (testSuites[suite]) {
      testSuites[suite].forEach(({ script, name, env }) => {
        const result = runTest(script, name, env || {});
        results.push(result);
        emitProgress(testRunId, results);
      });
    } else {
      console.error(`❌ Unknown test suite: ${suite}`);
      process.exit(1);
    }

    // Save results to database
    console.log('\n💾 Saving results to database...');
    for (const result of results) {
      await saveTestResultToDb(result, testRunId);
    }

    // Update test run with final stats
    await updateTestRun(testRunId);

    // Print summary
    const passCount = results.filter(r => r.status === 'PASS').length;
    const failCount = results.filter(r => r.status === 'FAIL').length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                            TEST SUMMARY                                   ║
╚════════════════════════════════════════════════════════════════════════════╝

Total Tests:     ${results.length}
Passed:          ${passCount} (${((passCount / results.length) * 100).toFixed(1)}%)
Failed:          ${failCount} (${((failCount / results.length) * 100).toFixed(1)}%)
Total Duration:  ${(totalDuration / 1000).toFixed(2)}s

📊 Test Run ID:  ${testRunId}
🌐 View in Dashboard: http://localhost:3000/dev/test-results

Status: ${failCount === 0 ? '✅ ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'}
`);

    process.exit(failCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
