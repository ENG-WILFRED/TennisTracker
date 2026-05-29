import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ coachId: string }> }
) {
  try {
    const { coachId } = await params;

    // Get earnings from completed sessions this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonthAggregate = await prisma.coachEarning.aggregate({
      where: {
        coachId,
        createdAt: {
          gte: startOfMonth,
          lte: now,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const thisMonth = Number(thisMonthAggregate._sum.amount ?? 0);

    // Get wallet info
    const wallet = await prisma.coachWallet.findUnique({
      where: { coachId },
    });

    const balance = Number(wallet?.balance ?? 0);
    const totalWithdrawn = Number(wallet?.totalWithdrawn ?? 0);
    const pending = balance - totalWithdrawn;
    const perSession = 60; // Default rate, can be fetched from coach profile if available

    return NextResponse.json({
      thisMonth: Math.round(thisMonth),
      pending: Math.round(Math.max(0, pending)),
      perSession,
      totalEarned: Number(wallet?.totalEarned ?? 0),
      balance,
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
