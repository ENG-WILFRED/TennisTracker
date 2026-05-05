import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PATCH reschedule session
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await request.json();
    const { newDate, newStartTime, newEndTime } = body;

    if (!newDate || !newStartTime || !newEndTime) {
      return NextResponse.json(
        { error: 'Missing required fields: newDate, newStartTime, newEndTime' },
        { status: 400 }
      );
    }

    const activity = await prisma.activity.findUnique({
      where: { id: sessionId },
    });

    if (!activity) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Update the activity with new date and time
    const updatedActivity = await prisma.activity.update({
      where: { id: sessionId },
      data: {
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        updatedAt: new Date(),
      },
    });

    // TODO: Send notifications to all assigned players about the reschedule
    // This would typically be done via email or in-app notifications

    const session = {
      id: updatedActivity.id,
      title: updatedActivity.title,
      description: updatedActivity.description,
      startTime: new Date(`${updatedActivity.date}T${updatedActivity.startTime}:00Z`).toISOString(),
      endTime: new Date(`${updatedActivity.date}T${updatedActivity.endTime}:00Z`).toISOString(),
      sessionType: (updatedActivity.metadata as any)?.sessionType || 'session',
      status: updatedActivity.completed ? 'completed' : 'scheduled',
      maxParticipants: (updatedActivity.metadata as any)?.maxParticipants || 1,
      price: (updatedActivity.metadata as any)?.price,
      bookings: [],
      court: (updatedActivity.metadata as any)?.court || (updatedActivity.metadata as any)?.courtId,
      coachId: updatedActivity.coachId,
      players: [],
    };

    return NextResponse.json({ session, message: 'Session rescheduled successfully' });
  } catch (error) {
    console.error('Error rescheduling session:', error);
    return NextResponse.json({ error: 'Failed to reschedule session' }, { status: 500 });
  }
}
