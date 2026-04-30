#!/usr/bin/env node

/**
 * Test Results Query Utilities
 * Helper functions for querying test results from the database
 */

import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

/**
 * Get all test runs with optional filters
 */
export async function getTestRuns(options: {
  days?: number;
  limit?: number;
  status?: string;
} = {}) {
  const { days = 7, limit = 20, status } = options;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const testRuns = await prisma.testRun.findMany({
    where: {
      createdAt: { gte: cutoffDate },
      ...(status && { status }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return testRuns;
}

/**
 * Get test results for a specific run
 */
export async function getTestResultsForRun(runId: string) {
  const testRun = await prisma.testRun.findUnique({
    where: { id: runId },
    include: {
      results: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return testRun;
}

/**
 * Get test results statistics
 */
export async function getTestStatistics(options: {
  days?: number;
  suite?: string;
} = {}) {
  const { days = 7, suite } = options;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const where: any = { createdAt: { gte: cutoffDate } };
  if (suite) where.suiteName = suite;

  const [totalTests, passedTests, failedTests, avgDuration] = await Promise.all([
    prisma.testResult.count({ where }),
    prisma.testResult.count({ where: { ...where, status: 'PASS' } }),
    prisma.testResult.count({ where: { ...where, status: 'FAIL' } }),
    prisma.testResult.aggregate({
      where,
      _avg: { duration: true },
    }),
  ]);

  return {
    totalTests,
    passedTests,
    failedTests,
    skippedTests: totalTests - passedTests - failedTests,
    passRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
    failRate: totalTests > 0 ? (failedTests / totalTests) * 100 : 0,
    avgDuration: avgDuration._avg.duration || 0,
    dateRange: {
      from: cutoffDate.toISOString(),
      to: new Date().toISOString(),
      days,
    },
  };
}

/**
 * Get failed tests with error details
 */
export async function getFailedTests(options: {
  days?: number;
  limit?: number;
} = {}) {
  const { days = 7, limit = 20 } = options;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const failedTests = await prisma.testResult.findMany({
    where: {
      createdAt: { gte: cutoffDate },
      status: 'FAIL',
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      testRun: {
        select: {
          id: true,
          name: true,
          runType: true,
          createdAt: true,
        },
      },
    },
  });

  return failedTests;
}

/**
 * Get test suite statistics
 */
export async function getTestSuiteStats(options: {
  days?: number;
} = {}) {
  const { days = 7 } = options;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const suiteStats = await prisma.testResult.groupBy({
    by: ['suiteName'],
    where: {
      createdAt: { gte: cutoffDate },
    },
    _count: {
      id: true,
    },
  });

  // Get pass/fail counts per suite
  const stats = await Promise.all(
    suiteStats.map(async (suite) => {
      const [passCount, failCount] = await Promise.all([
        prisma.testResult.count({
          where: {
            suiteName: suite.suiteName,
            status: 'PASS',
            createdAt: { gte: cutoffDate },
          },
        }),
        prisma.testResult.count({
          where: {
            suiteName: suite.suiteName,
            status: 'FAIL',
            createdAt: { gte: cutoffDate },
          },
        }),
      ]);

      return {
        suite: suite.suiteName,
        total: suite._count.id,
        passed: passCount,
        failed: failCount,
        passRate: suite._count.id > 0 ? (passCount / suite._count.id) * 100 : 0,
      };
    })
  );

  return stats;
}

async function main() {
  console.log('\n📊 Test Results Query Utilities\n');
  
  try {
    const testRuns = await getTestRuns({ days: 7, limit: 5 });
    console.log('Recent Test Runs:', testRuns.length);
    testRuns.forEach(run => {
      console.log(`  - ${run.name} (${run.status}): ${run.passedTests}✓ ${run.failedTests}✗ ${run.skippedTests}⊘`);
    });

    const stats = await getTestStatistics({ days: 7 });
    console.log('\nOverall Statistics (7 days):');
    console.log(`  Total Tests: ${stats.totalTests}`);
    console.log(`  Passed: ${stats.passedTests} (${stats.passRate.toFixed(1)}%)`);
    console.log(`  Failed: ${stats.failedTests} (${stats.failRate.toFixed(1)}%)`);
    console.log(`  Average Duration: ${(stats.avgDuration / 1000).toFixed(2)}s`);

    const suiteStats = await getTestSuiteStats({ days: 7 });
    console.log('\nSuite Statistics:');
    suiteStats.forEach(suite => {
      console.log(`  ${suite.suite}: ${suite.passed}✓ ${suite.failed}✗ (${suite.passRate.toFixed(1)}%)`);
    });

    const failedTests = await getFailedTests({ days: 7, limit: 5 });
    if (failedTests.length > 0) {
      console.log('\nRecent Failures:');
      failedTests.forEach(test => {
        console.log(`  - ${test.testName}: ${test.error?.substring(0, 80) || 'No error message'}`);
      });
    }
  } catch (error) {
    console.error('Error querying test results:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.endsWith('test-results-queries.ts')) {
  main();
}

export default {
  getTestRuns,
  getTestResultsForRun,
  getTestStatistics,
  getFailedTests,
  getTestSuiteStats,
};
