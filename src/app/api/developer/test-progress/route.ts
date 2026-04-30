import { NextRequest, NextResponse } from 'next/server';
import { broadcastToDevelopers } from '@/lib/socket';

/**
 * Emit test progress update via WebSocket to developers
 * Called by test runner to broadcast progress
 */
export async function POST(request: NextRequest) {
  try {
    const { testRunId, progress, passed, failed, skipped, total } = await request.json();

    if (!testRunId) {
      return NextResponse.json(
        { error: 'testRunId is required' },
        { status: 400 }
      );
    }

    // Emit progress update to all developers
    broadcastToDevelopers('test_progress_update', {
      testRunId,
      isRunning: true,
      progress: progress || 0,
      summary: {
        total: total || 0,
        passed: passed || 0,
        failed: failed || 0,
        skipped: skipped || 0,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error emitting test progress:', error);
    return NextResponse.json(
      { error: 'Failed to emit test progress' },
      { status: 500 }
    );
  }
}
