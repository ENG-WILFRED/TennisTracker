import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const coachId = url.searchParams.get('coachId');

    if (!coachId) {
      return NextResponse.json({ error: 'coachId required' }, { status: 400 });
    }

    const stats = await prisma.coachStats.findUnique({
      where: { coachId },
    });

    if (!stats) {
      // Create stats if they don't exist
      const newStats = await prisma.coachStats.create({
        data: { coachId },
      });
      return NextResponse.json(newStats);
    }

    // Get additional data
    const totalSessions = await prisma.coachSession.count({
      where: { coachId },
    });

    const completedSessions = await prisma.coachSession.count({
      where: { coachId, status: 'completed' },
    });

    const totalPlayers = await prisma.coachPlayerRelationship.count({
      where: { coachId },
    });

    const activePlayers = await prisma.coachPlayerRelationship.count({
      where: { coachId, status: 'active' },
    });

    const totalRevenue = await prisma.walletTransaction.aggregate({
      where: { wallet: { coachId }, type: 'credit' },
      _sum: { amount: true },
    });

    const reviews = await prisma.coachSessionReview.findMany({
      where: { coachId },
    });

    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    return NextResponse.json({
      ...stats,
      totalSessions,
      completedSessions,
      totalPlayers,
      activePlayers,
      totalRevenue: totalRevenue._sum.amount || 0,
      avgRating,
      reviewCount: reviews.length,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
