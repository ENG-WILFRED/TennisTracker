import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const auth = verifyApiAuth(request);

  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.user.update({
      where: { id: auth.playerId },
      data: { 
        acceptedTermsAt: new Date(),
        termsDeclineCount: 0  // Reset decline count on acceptance
      },
    });

    return NextResponse.json({ success: true, acceptedTerms: true });
  } catch (error: any) {
    console.error('Accept terms error:', error);
    return NextResponse.json({ error: error.message || 'Could not accept terms' }, { status: 500 });
  }
}
