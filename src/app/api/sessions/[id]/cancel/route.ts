import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST cancel session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    const activity = await prisma.activity.findUnique({
      where: { id: sessionId },
    });

    if (!activity) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Mark the activity as completed/cancelled
    // We'll set a status in metadata to indicate cancellation
    const updatedActivity = await prisma.activity.update({
      where: { id: sessionId },
      data: {
        completed: true,
        metadata: {
          ...(activity.metadata as object || {}),
          cancelledAt: new Date().toISOString(),
          status: 'cancelled',
        },
        updatedAt: new Date(),
      },
    });

    // TODO: Send cancellation notifications to all assigned players
    // This would typically be done via email or in-app notifications

    return NextResponse.json({ 
      message: 'Session cancelled successfully',
      activity: updatedActivity,
    });
  } catch (error) {
    console.error('Error cancelling session:', error);
    return NextResponse.json({ error: 'Failed to cancel session' }, { status: 500 });
  }
}
