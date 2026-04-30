import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import prisma from '@/lib/prisma';
import { broadcastToDevelopers } from '@/lib/socket';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function POST(request: NextRequest) {
  try {
    const { suite = 'all', concurrent = '50', duration = '60' } = await request.json();

    // Validate suite parameter
    const validSuites = ['all', 'court-booking', 'auth', 'websocket', 'payment'];
    if (!validSuites.includes(suite)) {
      return NextResponse.json(
        { error: `Invalid test suite. Must be one of: ${validSuites.join(', ')}` },
        { status: 400 }
      );
    }

    // Create a test run record
    const testRun = await prisma.testRun.create({
      data: {
        name: `Dashboard-triggered ${suite} test run - ${new Date().toISOString()}`,
        runType: 'integration',
        status: 'RUNNING',
        environment: 'development',
        nodeVersion: process.version,
        triggeredBy: 'dashboard',
      },
    });

    // Return immediately with test run ID so UI can show "Running" state
    // Tests will run in the background
    triggerTestsInBackground(suite, concurrent, duration, testRun.id);

    return NextResponse.json({
      success: true,
      testRunId: testRun.id,
      message: `Test suite "${suite}" has been triggered. Results will be available shortly.`,
      estimatedDuration: suite === 'all' ? 120 : 60,
    });
  } catch (error) {
    console.error('Error triggering tests:', error);
    return NextResponse.json(
      { error: 'Failed to trigger tests' },
      { status: 500 }
    );
  }
}

function triggerTestsInBackground(
  suite: string,
  concurrent: string,
  duration: string,
  testRunId: string
) {
  setImmediate(async () => {
    const startTime = new Date();
    try {
      const command = `npx tsx tests/test-runner-with-db.ts --suite ${suite} --concurrent ${concurrent} --duration ${duration}`;

      // Execute tests - this will save results to DB automatically
      execSync(command, {
        cwd: process.cwd(),
        env: {
          ...process.env,
          TEST_RUN_ID: testRunId,
        },
        stdio: 'pipe', // Don't output to server logs
      });

      // Tests completed successfully - emit event via Socket.IO
      try {
        const testRunFinal = await prisma.testRun.findUnique({
          where: { id: testRunId }
        });
        
        broadcastToDevelopers('test_run_completed', {
          testRunId,
          suite,
          status: 'completed',
          passed: testRunFinal?.passedTests || 0,
          failed: testRunFinal?.failedTests || 0,
          total: testRunFinal?.totalTests || 0
        });
      } catch (broadcastError) {
        console.warn('Failed to broadcast test completion:', broadcastError);
      }
    } catch (error) {
      const endTime = new Date();
      const durationMs = endTime.getTime() - startTime.getTime();

      // Always create a failure report, even if tests couldn't run
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.error('Background test execution failed:', errorMessage);

      // Save a failure test result
      try {
        await prisma.testResult.create({
          data: {
            testRunId,
            suiteName: suite,
            testName: `${suite}-suite-execution`,
            status: 'FAIL',
            startTime,
            endTime,
            duration: Math.round(durationMs / 1000),
            message: `Test suite execution failed: ${errorMessage}`,
            error: errorMessage,
            environment: 'development',
            nodeVersion: process.version,
            appVersion: '1.0.0',
          }
        });
      } catch (dbError) {
        console.error('Failed to save test failure result:', dbError);
      }

      // Update test run with failure status and partial data
      try {
        await prisma.testRun.update({
          where: { id: testRunId },
          data: {
            status: 'FAILED',
            endTime,
            duration: Math.round(durationMs / 1000),
            totalTests: 1,
            failedTests: 1,
            passedTests: 0,
            skippedTests: 0,
          },
        });
      } catch (dbError) {
        console.error('Failed to update test run status:', dbError);
      }

      // Broadcast failure event via Socket.IO
      try {
        broadcastToDevelopers('test_run_completed', {
          testRunId,
          suite,
          status: 'failed',
          passed: 0,
          failed: 1,
          total: 1
        });
      } catch (broadcastError) {
        console.warn('Failed to broadcast test failure:', broadcastError);
      }
    }
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const testRunId = searchParams.get('testRunId');

    if (!testRunId) {
      return NextResponse.json(
        { error: 'testRunId parameter is required' },
        { status: 400 }
      );
    }

    // Get the current status of a test run
    const testRun = await prisma.testRun.findUnique({
      where: { id: testRunId },
      select: {
        id: true,
        name: true,
        status: true,
        startTime: true,
        endTime: true,
        duration: true,
        totalTests: true,
        passedTests: true,
        failedTests: true,
        skippedTests: true,
        _count: {
          select: { results: true },
        },
      },
    });

    if (!testRun) {
      return NextResponse.json(
        { error: 'Test run not found' },
        { status: 404 }
      );
    }

    // Check if test is still running
    const isRunning = testRun.status === 'RUNNING';
    const estimatedProgress = isRunning
      ? Math.min(
          ((testRun._count.results || 0) / (testRun.totalTests || 5)) * 100,
          99
        )
      : 100;

    return NextResponse.json({
      id: testRun.id,
      name: testRun.name,
      status: testRun.status,
      isRunning,
      startTime: testRun.startTime,
      endTime: testRun.endTime,
      duration: testRun.duration,
      progress: estimatedProgress,
      summary: {
        total: testRun.totalTests,
        passed: testRun.passedTests,
        failed: testRun.failedTests,
        skipped: testRun.skippedTests,
        resultsRecorded: testRun._count.results,
      },
    });
  } catch (error) {
    console.error('Error checking test status:', error);
    return NextResponse.json(
      { error: 'Failed to check test status' },
      { status: 500 }
    );
  }
}
