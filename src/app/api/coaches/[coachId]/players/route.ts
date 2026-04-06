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

    // Get players that have had sessions with this coach
    const relationships = await prisma.coachPlayerRelationship.findMany({
      where: { coachId },
      include: {
        player: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                photo: true,
              },
            },
          },
        },
        notes: {
          select: {
            content: true,
            category: true,
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const players = relationships.map((rel) => ({
      id: rel.playerId,
      userId: rel.playerId,
      firstName: rel.player.user.firstName,
      lastName: rel.player.user.lastName,
      email: rel.player.user.email,
      photo: rel.player.user.photo,
      sessionsCompleted: rel.sessionsCount || 0,
      totalHours: Math.floor((rel.sessionsCount || 0) * 1.5), // Estimate: ~1.5 hours per session
      notes: rel.notes[0]?.content || '',
      createdAt: rel.createdAt,
    }));

    return NextResponse.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
