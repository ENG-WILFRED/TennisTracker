import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function POST(request: Request) {
  const auth = await verifyApiAuth(request);

  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { termsDeclineCount: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentDeclineCount = user.termsDeclineCount || 0;
    const newDeclineCount = currentDeclineCount + 1;

    // If 5th decline, delete account
    if (newDeclineCount >= 5) {
      await prisma.user.delete({
        where: { id: auth.userId },
      });

      return NextResponse.json({ 
        success: true, 
        accountDeleted: true,
        message: 'Account has been deleted due to repeated term declines'
      });
    }

    // Otherwise, update decline count
    await prisma.user.update({
      where: { id: auth.userId },
      data: { termsDeclineCount: newDeclineCount },
    });

    // Return warning on 4th decline
    if (newDeclineCount === 4) {
      return NextResponse.json({ 
        success: true, 
        declineCount: newDeclineCount,
        warning: 'One more decline will result in account deletion'
      });
    }

    return NextResponse.json({ 
      success: true, 
      declineCount: newDeclineCount
    });
  } catch (error: any) {
    console.error('Decline terms error:', error);
    return NextResponse.json({ error: error.message || 'Could not decline terms' }, { status: 500 });
  }
}
