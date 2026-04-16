import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const coachId = url.searchParams.get('coachId');
    const status = url.searchParams.get('status');

    if (!coachId) {
      return NextResponse.json({ error: 'coachId required' }, { status: 400 });
    }

    const payouts = await prisma.coachPayout.findMany({
      where: {
        coachId,
        ...(status && { status }),
      },
      orderBy: { requestedAt: 'desc' },
    });

    return NextResponse.json(payouts);
  } catch (error) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { coachId, amount, paymentMethod, bankDetails, notes } = body;

    if (!coachId || !amount || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify wallet balance
    const wallet = await prisma.coachWallet.findUnique({
      where: { coachId },
    });

    if (!wallet || wallet.balance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const payout = await prisma.coachPayout.create({
      data: {
        coachId,
        amount,
        paymentMethod,
        bankDetails,
        notes,
        status: 'pending',
      },
    });

    // Update wallet balance
    await prisma.coachWallet.update({
      where: { coachId },
      data: {
        balance: { decrement: amount },
        pendingBalance: { increment: amount },
      },
    });

    // Log transaction
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'debit',
        amount,
        description: `Payout request - ${paymentMethod}`,
        reference: payout.id,
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance - amount,
      },
    });

    return NextResponse.json(payout, { status: 201 });
  } catch (error) {
    console.error('Error creating payout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
