import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ coachId: string }> }
) {
  try {
    const { coachId } = await params;

    // Get today's sessions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessions = await prisma.coachSession.findMany({
      where: {
        coachId,
        startTime: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        player: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        court: {
          select: {
            id: true,
            name: true,
          },
        },
        bookings: {
          include: {
            player: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    const schedule = sessions.map((s) => ({
      id: s.id,
      time: s.startTime.toISOString().split('T')[1].substring(0, 5), // HH:MM
      participantName: s.player
        ? `${s.player.user.firstName} ${s.player.user.lastName}`
        : `Group (${s.bookings.length})`,
      court: s.court?.name || 'Court TBD',
      duration: Math.round((s.endTime.getTime() - s.startTime.getTime()) / 60000), // minutes
      sessionType: s.sessionType,
      status: s.status,
    }));

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
