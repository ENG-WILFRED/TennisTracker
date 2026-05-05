import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST send reminders to players
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

    const players: any[] = [];

    if (players.length === 0) {
      return NextResponse.json(
        { message: 'No players enrolled in this session' },
        { status: 200 }
      );
    }

    // TODO: Implement actual notification sending
    // This could be:
    // 1. Email notifications via nodemailer or SendGrid
    // 2. In-app notifications via database
    // 3. SMS via Twilio
    // 4. Push notifications via Firebase
    
    // For now, we'll simulate the notification process
    const remindersSent = [];
    for (const player of players) {
      remindersSent.push({
        playerId: player.id,
        playerName: `${player.firstName} ${player.lastName}`,
        email: player.email,
        status: 'queued',
        message: `Reminder: You have a session "${activity.title}" scheduled for ${activity.date} at ${activity.startTime}`,
      });
    }

    // Store reminder history in metadata
    const updatedActivity = await prisma.activity.update({
      where: { id: sessionId },
      data: {
        metadata: {
          ...(activity.metadata as object || {}),
          reminders: [
            ...(Array.isArray((activity.metadata as any)?.reminders) ? (activity.metadata as any).reminders : []),
            {
              sentAt: new Date().toISOString(),
              count: players.length,
              players: remindersSent.map(r => r.playerId),
            },
          ],
        },
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: `Reminders sent to ${players.length} player${players.length !== 1 ? 's' : ''}`,
      remindersSent,
      activity: updatedActivity,
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 });
  }
}
