import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: testRunId } = await params;

    const testRun = await prisma.testRun.findUnique({
      where: { id: testRunId },
      include: {
        results: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            suiteName: true,
            testName: true,
            status: true,
            startTime: true,
            endTime: true,
            duration: true,
            message: true,
            error: true,
            avgResponseTime: true,
            requestsCompleted: true,
            requestsFailed: true,
            throughput: true,
            createdAt: true,
          },
        },
      },
    });

    if (!testRun) {
      return NextResponse.json(
        { error: 'Test run not found' },
        { status: 404 }
      );
    }

    // Calculate statistics
    const stats = {
      passRate: testRun.totalTests > 0 ? (testRun.passedTests / testRun.totalTests) * 100 : 0,
      failRate: testRun.totalTests > 0 ? (testRun.failedTests / testRun.totalTests) * 100 : 0,
      skipRate: testRun.totalTests > 0 ? (testRun.skippedTests / testRun.totalTests) * 100 : 0,
      avgDuration: testRun.results.length > 0
        ? testRun.results.reduce((sum, r) => sum + r.duration, 0) / testRun.results.length
        : 0,
    };

    return NextResponse.json({
      testRun,
      stats,
    });
  } catch (error) {
    console.error('Error fetching test run:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test run' },
      { status: 500 }
    );
  }
}
