import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7');
    const limit = parseInt(searchParams.get('limit') || '10');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get recent test runs
    const testRuns = await prisma.testRun.findMany({
      where: {
        createdAt: { gte: cutoffDate },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        runType: true,
        status: true,
        startTime: true,
        endTime: true,
        duration: true,
        totalTests: true,
        passedTests: true,
        failedTests: true,
        skippedTests: true,
        environment: true,
        createdAt: true,
      },
    });

    // Get test result statistics by suite
    const suiteStats = await prisma.testResult.groupBy({
      by: ['suiteName', 'status'],
      where: {
        createdAt: { gte: cutoffDate },
      },
      _count: {
        id: true,
      },
      _avg: {
        duration: true,
      },
    });

    // Get overall statistics
    const totalResults = await prisma.testResult.count({
      where: {
        createdAt: { gte: cutoffDate },
      },
    });

    const passedResults = await prisma.testResult.count({
      where: {
        createdAt: { gte: cutoffDate },
        status: 'PASS',
      },
    });

    const failedResults = await prisma.testResult.count({
      where: {
        createdAt: { gte: cutoffDate },
        status: 'FAIL',
      },
    });

    // Get latest failed tests
    const latestFailures = await prisma.testResult.findMany({
      where: {
        createdAt: { gte: cutoffDate },
        status: 'FAIL',
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        testName: true,
        suiteName: true,
        error: true,
        duration: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      testRuns,
      suiteStats,
      overallStats: {
        totalResults,
        passedResults,
        failedResults,
        passRate: totalResults > 0 ? (passedResults / totalResults) * 100 : 0,
        failRate: totalResults > 0 ? (failedResults / totalResults) * 100 : 0,
        dateRange: {
          from: cutoffDate.toISOString(),
          to: new Date().toISOString(),
          days,
        },
      },
      latestFailures,
    });
  } catch (error) {
    console.error('Error fetching test statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test statistics' },
      { status: 500 }
    );
  }
}
