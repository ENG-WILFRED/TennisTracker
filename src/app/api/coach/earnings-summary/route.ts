import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { coachingSessionPaymentService } from '@/services/coaching-session-payment.service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

/**
 * GET /api/coach/earnings-summary
 * Get coach's earnings and wallet summary
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Verify user is a coach/staff
    const staff = await prisma.staff.findUnique({
      where: { userId },
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Only coaches can access this endpoint' },
        { status: 403 }
      );
    }

    const summary = await coachingSessionPaymentService.getCoachEarningsSummary(userId);

    return NextResponse.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('Error fetching earnings summary:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch earnings summary' },
      { status: 500 }
    );
  }
}
