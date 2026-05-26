import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const coachId = url.searchParams.get('coachId');

    if (!coachId) {
      return NextResponse.json({ error: 'coachId required' }, { status: 400 });
    }

    const coach = await prisma.staff.findUnique({
      where: { userId: coachId },
    });

    if (!coach) {
      return NextResponse.json({
        coachId,
        balance: 0,
        currency: 'USD',
        totalEarned: 0,
        totalWithdrawn: 0,
        pendingBalance: 0,
        transactions: [],
      });
    }

    const wallet = await prisma.coachWallet.findUnique({
      where: { coachId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!wallet) {
      // Create wallet if it doesn't exist
      const newWallet = await prisma.coachWallet.create({
        data: { coachId },
        include: { transactions: true },
      });
      return NextResponse.json(newWallet);
    }

    return NextResponse.json(wallet);
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
