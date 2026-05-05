import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET session details
export async function GET(
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

    const session = {
      id: activity.id,
      title: activity.title,
      description: activity.description,
      startTime: new Date(`${activity.date}T${activity.startTime}:00Z`).toISOString(),
      endTime: new Date(`${activity.date}T${activity.endTime}:00Z`).toISOString(),
      sessionType: (activity.metadata as any)?.sessionType || 'session',
      status: activity.completed ? 'completed' : 'scheduled',
      maxParticipants: (activity.metadata as any)?.maxParticipants || 1,
      price: (activity.metadata as any)?.price,
      bookings: [],
      court: (activity.metadata as any)?.court || (activity.metadata as any)?.courtId,
      coachId: activity.coachId,
      players: [],
    };

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}
