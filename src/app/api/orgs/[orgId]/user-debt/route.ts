import { NextRequest, NextResponse } from 'next/server';
import { coachingSessionPaymentService } from '@/services/coaching-session-payment.service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

/**
 * GET /api/orgs/[orgId]/user-debt
 * Get user's outstanding debt to an organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userDebt = await coachingSessionPaymentService.getUserOrgDebt(userId, orgId);

    return NextResponse.json({
      success: true,
      data: userDebt || {
        userId,
        organizationId: orgId,
        totalAmount: 0,
        paidAmount: 0,
        outstandingAmount: 0,
        status: 'active',
        message: 'No outstanding debt',
      },
    });
  } catch (error: any) {
    console.error('Error fetching user debt:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user debt' },
      { status: 500 }
    );
  }
}
