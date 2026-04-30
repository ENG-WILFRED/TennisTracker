import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const testRunId = searchParams.get('testRunId');
    const suite = searchParams.get('suite');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};
    if (testRunId) where.testRunId = testRunId;
    if (suite) where.suiteName = suite;
    if (status) where.status = status;

    const [results, total] = await Promise.all([
      prisma.testResult.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          testRun: {
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
            },
          },
        },
      }),
      prisma.testResult.count({ where }),
    ]);

    return NextResponse.json({
      data: results,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching test results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test results' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const testRunId = searchParams.get('testRunId');
    const daysOld = parseInt(searchParams.get('daysOld') || '30');

    if (testRunId) {
      // Delete specific test run and its results
      await prisma.testRun.delete({
        where: { id: testRunId },
      });
      return NextResponse.json({ success: true, message: 'Test run deleted' });
    }

    // Delete old test results
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const deleted = await prisma.testResult.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted.count} old test results`,
    });
  } catch (error) {
    console.error('Error deleting test results:', error);
    return NextResponse.json(
      { error: 'Failed to delete test results' },
      { status: 500 }
    );
  }
}
