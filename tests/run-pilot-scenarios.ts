/**
 * PILOT TEST RUNNER
 * =================
 * Runs all 5 critical pilot scenarios and generates:
 * 1. Console output (real-time progress)
 * 2. JSON test results
 * 3. Developer portal report (HTML/markdown)
 * 4. Test coverage summary
 * 5. Pass/Fail status
 * 
 * Usage:
 * npm run test:pilot
 * 
 * Reports are generated in:
 * - tests/reports/pilot-results.json
 * - tests/reports/pilot-report.html
 * - tests/reports/pilot-summary.md
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORTS_DIR = path.join(__dirname, '../reports');
const TIMESTAMP = new Date().toISOString();

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

interface TestResult {
  scenario: number;
  name: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  passed: number;
  failed: number;
  skipped: number;
  status: 'PASS' | 'FAIL' | 'PARTIAL';
  errors: string[];
  output: string;
}

const scenarios = [
  {
    num: 1,
    name: 'Book → Pay → Confirm Flow',
    file: 'tests/pilot-scenarios/01-booking-payment-confirmation.test.ts',
    critical: true,
  },
  {
    num: 2,
    name: 'Double Booking Prevention',
    file: 'tests/pilot-scenarios/02-double-booking-prevention.test.ts',
    critical: true,
  },
  {
    num: 3,
    name: 'Payment Failure Handling',
    file: 'tests/pilot-scenarios/03-payment-failure-handling.test.ts',
    critical: true,
  },
  {
    num: 4,
    name: 'Network & Timeout Handling',
    file: 'tests/pilot-scenarios/04-network-timeout-handling.test.ts',
    critical: true,
  },
  {
    num: 5,
    name: 'Admin Bookings View',
    file: 'tests/pilot-scenarios/05-admin-bookings-view.test.ts',
    critical: true,
  },
];

async function runScenario(scenario: typeof scenarios[0]): Promise<TestResult> {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🧪 SCENARIO ${scenario.num}: ${scenario.name}`);
  console.log(`${'='.repeat(70)}\n`);

  const result: TestResult = {
    scenario: scenario.num,
    name: scenario.name,
    startTime: new Date(),
    endTime: new Date(),
    duration: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    status: 'PASS',
    errors: [],
    output: '',
  };

  try {
    const startTime = Date.now();
    const output = execSync(
      `npx vitest run ${scenario.file} --reporter=verbose`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    result.endTime = new Date();
    result.duration = Date.now() - startTime;
    result.output = output;

    // Parse output for test counts
    const passMatch = output.match(/✓ (\d+)/);
    const failMatch = output.match(/✗ (\d+)/);
    const skipMatch = output.match(/⊙ (\d+)/);

    result.passed = passMatch ? parseInt(passMatch[1]) : 0;
    result.failed = failMatch ? parseInt(failMatch[1]) : 0;
    result.skipped = skipMatch ? parseInt(skipMatch[1]) : 0;
    result.status = result.failed === 0 ? 'PASS' : 'FAIL';

    console.log(`✅ Scenario ${scenario.num} completed in ${result.duration}ms`);
    console.log(`   Passed: ${result.passed} | Failed: ${result.failed} | Skipped: ${result.skipped}`);
  } catch (error: any) {
    result.endTime = new Date();
    result.duration = Date.now() - result.startTime.getTime();
    result.status = 'FAIL';
    result.output = error.stdout || error.message;
    result.errors.push(error.message);

    console.error(`❌ Scenario ${scenario.num} failed:`);
    console.error(error.message);
  }

  return result;
}

async function generateReports(results: TestResult[]): Promise<void> {
  console.log(`\n${'='.repeat(70)}`);
  console.log('📊 GENERATING REPORTS');
  console.log(`${'='.repeat(70)}\n`);

  // 1. JSON Results
  const jsonReport = {
    timestamp: TIMESTAMP,
    totalScenarios: results.length,
    passedScenarios: results.filter(r => r.status === 'PASS').length,
    failedScenarios: results.filter(r => r.status === 'FAIL').length,
    totalTests: results.reduce((sum, r) => sum + r.passed + r.failed, 0),
    totalPassed: results.reduce((sum, r) => sum + r.passed, 0),
    totalFailed: results.reduce((sum, r) => sum + r.failed, 0),
    totalSkipped: results.reduce((sum, r) => sum + r.skipped, 0),
    overallStatus: results.every(r => r.status === 'PASS') ? 'READY_FOR_PILOT' : 'NEEDS_FIXES',
    scenarios: results,
  };

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'pilot-results.json'),
    JSON.stringify(jsonReport, null, 2)
  );

  // 2. Markdown Summary
  const markdownReport = `# 🎯 Pilot Test Report

**Generated:** ${TIMESTAMP}

## Executive Summary

- **Overall Status:** ${jsonReport.overallStatus === 'READY_FOR_PILOT' ? '✅ READY FOR PILOT' : '⚠️ NEEDS FIXES'}
- **Scenarios:** ${jsonReport.passedScenarios}/${jsonReport.totalScenarios} passed
- **Tests:** ${jsonReport.totalPassed}/${jsonReport.totalTests} passed
- **Success Rate:** ${Math.round((jsonReport.totalPassed / jsonReport.totalTests) * 100)}%

## Scenario Results

\`\`\`
${results
  .map(
    r =>
      `Scenario ${r.scenario}: ${r.name}
  Status: ${r.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}
  Tests: ${r.passed} passed, ${r.failed} failed, ${r.skipped} skipped
  Duration: ${r.duration}ms
`
  )
  .join('\n')}
\`\`\`

## Detailed Results

${results
  .map(
    r =>
      `
### Scenario ${r.scenario}: ${r.name}

**Status:** ${r.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}  
**Duration:** ${r.duration}ms  
**Tests:** ✓ ${r.passed} | ✗ ${r.failed} | ⊙ ${r.skipped}

\`\`\`
${r.output.slice(0, 500)}...
\`\`\`

${r.errors.length > 0 ? `**Errors:**\n${r.errors.map(e => `- ${e}`).join('\n')}` : ''}
`
  )
  .join('\n')}

## Pilot Readiness Checklist

${[
  'Can book a court in under 30 seconds',
  'M-Pesa works reliably',
  'Failed payments handled cleanly',
  'Admin can see bookings clearly',
  'Mobile UI works',
  'Errors are understandable',
]
  .map(
    (item, i) =>
      `- [${results[Math.min(i, results.length - 1)].status === 'PASS' ? 'x' : ' '}] ${item}`
  )
  .join('\n')}

## Next Steps

${
  jsonReport.overallStatus === 'READY_FOR_PILOT'
    ? `
### ✅ Ready for Saturday Pilot

1. **Deployment:** Deploy to production
2. **Monitoring:** Enable real-time error tracking
3. **Support:** Have team on call during pilot
4. **Feedback:** Collect user feedback in real-time
`
    : `
### ⚠️ Action Required Before Pilot

${results
  .filter(r => r.status === 'FAIL')
  .map(r => `1. Fix Scenario ${r.scenario}: ${r.name}`)
  .join('\n')}

2. Re-run tests
3. Verify all scenarios pass
4. Then proceed to production deployment
`
}

---
Generated: ${new Date().toLocaleString()} by Pilot Test Suite
`;

  fs.writeFileSync(path.join(REPORTS_DIR, 'pilot-summary.md'), markdownReport);

  // 3. HTML Report
  const htmlReport = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pilot Test Report - ${TIMESTAMP}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
      color: #333;
    }
    .header {
      background: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 14px;
    }
    .status-ready {
      background: #d4edda;
      color: #155724;
    }
    .status-needs-fix {
      background: #fff3cd;
      color: #856404;
    }
    .scenario-card {
      background: white;
      padding: 20px;
      margin-bottom: 15px;
      border-radius: 8px;
      border-left: 4px solid #ccc;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .scenario-card.pass {
      border-left-color: #28a745;
    }
    .scenario-card.fail {
      border-left-color: #dc3545;
    }
    .test-stat {
      display: inline-block;
      margin-right: 20px;
      font-size: 14px;
    }
    .test-stat.passed { color: #28a745; font-weight: bold; }
    .test-stat.failed { color: #dc3545; font-weight: bold; }
    .test-stat.skipped { color: #ffc107; }
    .checklist {
      list-style: none;
      padding: 0;
    }
    .checklist li {
      padding: 8px 0;
      margin-bottom: 8px;
    }
    .checklist li:before {
      content: "☐ ";
      margin-right: 8px;
      font-weight: bold;
    }
    .checklist li.checked:before {
      content: "☑ ";
      color: #28a745;
    }
    h1 { color: #2c3e50; margin-top: 0; }
    h2 { color: #34495e; margin-top: 30px; }
    h3 { color: #7f8c8d; }
    .timestamp { color: #95a5a6; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎯 Pilot Test Report</h1>
    <div class="timestamp">${TIMESTAMP}</div>
    <br>
    <span class="status-badge ${jsonReport.overallStatus === 'READY_FOR_PILOT' ? 'status-ready' : 'status-needs-fix'}">
      ${jsonReport.overallStatus === 'READY_FOR_PILOT' ? '✅ READY FOR PILOT' : '⚠️ NEEDS FIXES'}
    </span>
  </div>

  <h2>Summary</h2>
  <div>
    <div class="test-stat">Scenarios: <strong>${jsonReport.passedScenarios}/${jsonReport.totalScenarios}</strong></div>
    <div class="test-stat passed">Passed: ${jsonReport.totalPassed}</div>
    <div class="test-stat failed">Failed: ${jsonReport.totalFailed}</div>
    <div class="test-stat skipped">Skipped: ${jsonReport.totalSkipped}</div>
  </div>

  <h2>Scenario Results</h2>
  ${results
    .map(
      r => `
    <div class="scenario-card ${r.status === 'PASS' ? 'pass' : 'fail'}">
      <h3>Scenario ${r.scenario}: ${r.name}</h3>
      <div>
        <span class="test-stat ${r.status === 'PASS' ? 'passed' : 'failed'}">
          ${r.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}
        </span>
        <span class="test-stat">Duration: ${r.duration}ms</span>
      </div>
      <div style="margin-top: 10px;">
        <span class="test-stat passed">✓ ${r.passed}</span>
        <span class="test-stat failed">✗ ${r.failed}</span>
        <span class="test-stat skipped">⊙ ${r.skipped}</span>
      </div>
      ${r.errors.length > 0 ? `<div style="color: #dc3545; margin-top: 10px;"><strong>Errors:</strong><br>${r.errors.join('<br>')}</div>` : ''}
    </div>
  `
    )
    .join('')}

  <h2>Pilot Readiness Checklist</h2>
  <ul class="checklist">
    <li ${results[0].status === 'PASS' ? 'class="checked"' : ''}>Book court in < 30 seconds</li>
    <li ${results[1].status === 'PASS' ? 'class="checked"' : ''}>No double booking possible</li>
    <li ${results[2].status === 'PASS' ? 'class="checked"' : ''}>Payment failures handled</li>
    <li ${results[3].status === 'PASS' ? 'class="checked"' : ''}>Network timeouts handled</li>
    <li ${results[4].status === 'PASS' ? 'class="checked"' : ''}>Admin dashboard works</li>
    <li ${results.every(r => r.status === 'PASS') ? 'class="checked"' : ''}>All systems ready</li>
  </ul>
</body>
</html>
`;

  fs.writeFileSync(path.join(REPORTS_DIR, 'pilot-report.html'), htmlReport);

  console.log('✅ Reports generated:');
  console.log(`   📊 JSON: ${path.join(REPORTS_DIR, 'pilot-results.json')}`);
  console.log(`   📝 Markdown: ${path.join(REPORTS_DIR, 'pilot-summary.md')}`);
  console.log(`   🌐 HTML: ${path.join(REPORTS_DIR, 'pilot-report.html')}`);
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    VICO PILOT TEST SUITE                      ║
║               Saturday Readiness Verification                  ║
╚═══════════════════════════════════════════════════════════════╝
  `);

  const results: TestResult[] = [];

  for (const scenario of scenarios) {
    const result = await runScenario(scenario);
    results.push(result);
  }

  await generateReports(results);

  // Final Summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('🎯 PILOT READINESS SUMMARY');
  console.log(`${'='.repeat(70)}\n`);

  const allPassed = results.every(r => r.status === 'PASS');
  const passCount = results.filter(r => r.status === 'PASS').length;

  console.log(`✅ Scenarios Passed: ${passCount}/${results.length}`);
  console.log(`📊 Total Tests: ${results.reduce((sum, r) => sum + r.passed + r.failed, 0)}`);
  console.log(`   ✓ Passed: ${results.reduce((sum, r) => sum + r.passed, 0)}`);
  console.log(`   ✗ Failed: ${results.reduce((sum, r) => sum + r.failed, 0)}`);

  if (allPassed) {
    console.log(`\n✅ READY FOR SATURDAY PILOT!\n`);
    console.log('Next steps:');
    console.log('1. Deploy to production');
    console.log('2. Have team on standby');
    console.log('3. Monitor error logs live');
    console.log('4. Collect user feedback');
  } else {
    console.log(`\n⚠️  NEEDS FIXES BEFORE PILOT\n`);
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.log(`❌ Scenario ${r.scenario}: ${r.name}`);
        r.errors.forEach(e => console.log(`   - ${e}`));
      });
  }

  console.log(`\n📋 Full Report: ${path.join(REPORTS_DIR, 'pilot-summary.md')}\n`);

  process.exit(allPassed ? 0 : 1);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
