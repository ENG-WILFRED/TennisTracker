#!/usr/bin/env node

/**
 * Master Test Runner - Vico Sports Stress Testing Suite
 * Runs all stress tests and generates comprehensive reports
 * 
 * Usage: npx ts-node tests/run-all-tests.ts [options]
 * Options:
 *   --suite <name>        Run specific test suite (court-booking, auth, websocket, payment, all)
 *   --concurrent <number> Set concurrent users/connections
 *   --duration <seconds>  Set test duration
 *   --url <url>          Override base URL
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const suite = args.includes('--suite') ? args[args.indexOf('--suite') + 1] : 'all';
const concurrent = args.includes('--concurrent') ? args[args.indexOf('--concurrent') + 1] : '50';
const duration = args.includes('--duration') ? args[args.indexOf('--duration') + 1] : '60';
const testUrl = args.includes('--url') ? args[args.indexOf('--url') + 1] : 'http://localhost:3000';

const reportDir = path.join(__dirname, '..', 'reports');
const timestamp = new Date().toISOString().replace(/:/g, '-');
const reportFile = path.join(reportDir, `stress-test-report-${timestamp}.txt`);
const reportJsonFile = path.join(reportDir, `stress-test-report-${timestamp}.json`);
const reportHtmlFile = path.join(reportDir, `stress-test-report-${timestamp}.html`);
const logFile = path.join(reportDir, `stress-test-log-${timestamp}.log`);

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'PENDING';
  startTime: number;
  endTime: number;
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

// Create reports directory
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

fs.writeFileSync(logFile, `Stress test log created: ${new Date().toISOString()}\n\n`);

function appendLog(message: string): void {
  fs.appendFileSync(logFile, `${new Date().toISOString()} - ${message}\n`);
}

/**
 * Run a stress test
 */
function runTest(testScript: string, testName: string, env: Record<string, string>): TestResult {
  const startTime = Date.now();
  const result: TestResult = {
    name: testName,
    status: 'PENDING',
    startTime,
    endTime: 0,
    duration: 0,
  };

  console.log(`\n🧪 Running: ${testName}`);
  console.log(`📍 Script: ${testScript}`);
  appendLog(`START: ${testName} (${testScript})`);

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

    execSync(`npx tsx ${testScript}`, {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: envVars,
    });

    result.status = 'PASS';
    result.endTime = Date.now();
    result.duration = result.endTime - result.startTime;
    console.log(`✅ ${testName} completed`);
    appendLog(`PASS: ${testName} (${testScript})`);
  } catch (error) {
    result.status = 'FAIL';
    appendLog(`FAIL: ${testName} (${testScript}) - ${error instanceof Error ? error.message : String(error)}`);
    result.endTime = Date.now();
    result.duration = result.endTime - result.startTime;
    result.error = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${testName} failed: ${result.error}`);
  }

  return result;
}

/**
 * Generate test report
 */
function generateReport(results: TestResult[]): void {
  let reportContent = `
╔════════════════════════════════════════════════════════════════════════════╗
║                   VICO SPORTS STRESS TEST REPORT                          ║
╚════════════════════════════════════════════════════════════════════════════╝

📅 Test Date: ${new Date().toISOString()}
🎯 Base URL: ${testUrl}
👥 Concurrent Load: ${concurrent}
⏱️  Duration: ${duration}s

─────────────────────────────────────────────────────────────────────────────
TEST RESULTS SUMMARY
─────────────────────────────────────────────────────────────────────────────
`;

  let passCount = 0;
  let failCount = 0;
  let totalDuration = 0;

  results.forEach((result) => {
    const status = result.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    const duration = (result.duration / 1000).toFixed(2);
    reportContent += `\n${status} | ${result.name.padEnd(35)} | ${duration}s`;

    if (result.status === 'PASS') {
      passCount++;
    } else {
      failCount++;
      if (result.error) {
        reportContent += `\n   └─ Error: ${result.error}`;
      }
    }
    totalDuration += result.duration;
  });

  reportContent += `

─────────────────────────────────────────────────────────────────────────────
SUMMARY
─────────────────────────────────────────────────────────────────────────────

Total Tests:     ${results.length}
Passed:          ${passCount} (${((passCount / results.length) * 100).toFixed(1)}%)
Failed:          ${failCount} (${((failCount / results.length) * 100).toFixed(1)}%)
Total Duration:  ${(totalDuration / 1000).toFixed(2)}s

─────────────────────────────────────────────────────────────────────────────
SYSTEM HEALTH STATUS
─────────────────────────────────────────────────────────────────────────────
`;

  if (failCount === 0) {
    reportContent += '\n✅ EXCELLENT: All tests passed. System handles stress well.';
  } else if (failCount <= 1) {
    reportContent += '\n⚠️  WARNING: Some tests failed. Review logs above.';
  } else {
    reportContent += '\n❌ CRITICAL: Multiple test failures. Investigate immediately.';
  }

  reportContent += `

─────────────────────────────────────────────────────────────────────────────
RECOMMENDATIONS
─────────────────────────────────────────────────────────────────────────────

• Review failed tests in detail
• Check system logs for errors and warnings
• Monitor database connection pool usage
• Verify caching is functioning properly
• Consider horizontal scaling for production
• Implement rate limiting if not already active
• Monitor memory and CPU usage

─────────────────────────────────────────────────────────────────────────────
NEXT STEPS
─────────────────────────────────────────────────────────────────────────────

1. Run individual tests for detailed analysis:
   - npx ts-node tests/stress/court-booking-stress.ts
   - npx ts-node tests/stress/auth-stress.ts
   - npx ts-node tests/stress/websocket-stress.ts
   - npx ts-node tests/stress/payment-stress.ts

2. Run Artillery load test:
   - artillery run tests/artillery/vico-load-test.yml

3. Monitor system metrics:
   - Check CPU and memory usage
   - Review database query performance
   - Analyze WebSocket connection stability

4. Generate load under production-like conditions:
   - Test with realistic data volumes
   - Include cache warming
   - Test with database replication

═════════════════════════════════════════════════════════════════════════════
Report generated: ${new Date().toISOString()}
`;

  fs.writeFileSync(reportFile, reportContent);
  appendLog(`REPORT: Saved to ${reportFile}`);

  const jsonReport = {
    generatedAt: new Date().toISOString(),
    suite,
    baseUrl: testUrl,
    concurrent,
    durationSeconds: duration,
    results,
    summary: {
      totalTests: results.length,
      passCount,
      failCount,
      passRate: results.length > 0 ? (passCount / results.length) * 100 : 0,
      totalDurationSeconds: totalDuration / 1000,
    },
  };

  fs.writeFileSync(reportJsonFile, JSON.stringify(jsonReport, null, 2));
  appendLog(`REPORT JSON: Saved to ${reportJsonFile}`);

  const htmlReport = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Stress Test Run Report</title>
  <style>
    body { font-family: Inter, system-ui, sans-serif; background:#f8fafc; color:#111827; padding:24px; }
    h1,h2 { margin:0 0 16px; }
    .card { background:#ffffff; border:1px solid #e5e7eb; border-radius:18px; padding:20px; margin-bottom:20px; box-shadow:0 12px 24px rgba(15,23,42,0.08); }
    table { width:100%; border-collapse:collapse; margin-top:12px; }
    td, th { padding:12px 10px; border-bottom:1px solid #e5e7eb; }
    th { text-align:left; background:#f9fafb; }
    .status-pass { color:#16a34a; }
    .status-fail { color:#dc2626; }
  </style>
</head>
<body>
  <h1>Stress Test Run Report</h1>
  <p>Generated at ${new Date().toLocaleString()}</p>
  <div class="card">
    <h2>Summary</h2>
    <table>
      <tr><th>Base URL</th><td>${testUrl}</td></tr>
      <tr><th>Suite</th><td>${suite}</td></tr>
      <tr><th>Concurrent</th><td>${concurrent}</td></tr>
      <tr><th>Duration</th><td>${duration}s</td></tr>
      <tr><th>Total Tests</th><td>${results.length}</td></tr>
      <tr><th>Passed</th><td>${passCount} (${results.length ? ((passCount / results.length) * 100).toFixed(1) : 0}%)</td></tr>
      <tr><th>Failed</th><td>${failCount} (${results.length ? ((failCount / results.length) * 100).toFixed(1) : 0}%)</td></tr>
      <tr><th>Total Duration</th><td>${(totalDuration / 1000).toFixed(2)}s</td></tr>
    </table>
  </div>
  <div class="card">
    <h2>Test Results</h2>
    <table>
      <thead><tr><th>Test</th><th>Status</th><th>Duration</th><th>Error</th></tr></thead>
      <tbody>
        ${results
          .map((result) => `
            <tr>
              <td>${result.name}</td>
              <td class="${result.status === 'PASS' ? 'status-pass' : 'status-fail'}">${result.status}</td>
              <td>${(result.duration / 1000).toFixed(2)}s</td>
              <td>${result.error ? result.error : '—'}</td>
            </tr>`)
          .join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;

  fs.writeFileSync(reportHtmlFile, htmlReport);
  appendLog(`REPORT HTML: Saved to ${reportHtmlFile}`);

  fs.appendFileSync(logFile, `\n${reportContent}`);
  console.log(`\n📊 Report saved to: ${reportFile}`);
  console.log(`📊 JSON report saved to: ${reportJsonFile}`);
  console.log(`📊 HTML report saved to: ${reportHtmlFile}`);
}

/**
 * Main test runner
 */
async function main(): Promise<void> {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                  VICO SPORTS STRESS TEST SUITE                            ║
╚════════════════════════════════════════════════════════════════════════════╝

🎯 Configuration:
  • Test Suite: ${suite}
  • Base URL: ${testUrl}
  • Concurrent Load: ${concurrent}
  • Test Duration: ${duration}s
  • Report: ${reportFile}
`);

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
    // Run all tests
    Object.entries(testSuites).forEach(([, tests]) => {
      tests.forEach(({ script, name, env }) => {
        results.push(runTest(script, name, env || {}));
      });
    });
  } else if (testSuites[suite]) {
    // Run specific suite
    testSuites[suite].forEach(({ script, name, env }) => {
      results.push(runTest(script, name, env || {}));
    });
  } else {
    console.error(`❌ Unknown test suite: ${suite}`);
    console.log('Available suites: court-booking, auth, websocket, payment, all');
    process.exit(1);
  }

  generateReport(results);

  const failCount = results.filter(r => r.status === 'FAIL').length;
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
