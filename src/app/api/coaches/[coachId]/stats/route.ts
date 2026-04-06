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

    // Get coach stats
    const coach = await prisma.staff.findUnique({
      where: { userId: coachId },
      include: {
        stats: true,
      },
    });

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      );
    }

    // Count unique players coached
    const playerCount = await prisma.coachPlayerRelationship.count({
      where: { coachId },
    });

    return NextResponse.json({
      studentCount: playerCount,
      rating: coach.stats?.avgRating || 0,
      totalSessions: coach.stats?.totalSessions || 0,
      completedSessions: coach.stats?.completedSessions || 0,
      expertise: coach.expertise || 'General Coaching',
      role: coach.role,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
