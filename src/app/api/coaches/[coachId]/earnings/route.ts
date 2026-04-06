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

    // Get earnings from completed sessions this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const completedSessions = await prisma.coachSession.findMany({
      where: {
        coachId,
        status: 'completed',
        endTime: {
          gte: startOfMonth,
          lte: now,
        },
      },
      select: {
        price: true,
      },
    });

    const thisMonth = completedSessions.reduce((sum, s) => sum + (s.price || 0), 0);

    // Get wallet info
    const wallet = await prisma.coachWallet.findUnique({
      where: { coachId },
    });

    const pending = (wallet?.balance || 0) - (wallet?.totalWithdrawn || 0);
    const perSession = 60; // Default rate, can be fetched from coach profile if available

    return NextResponse.json({
      thisMonth: Math.round(thisMonth),
      pending: Math.round(Math.max(0, pending)),
      perSession: perSession,
      totalEarned: wallet?.totalEarned || 0,
      balance: wallet?.balance || 0,
      currency: wallet?.currency || 'USD',
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
