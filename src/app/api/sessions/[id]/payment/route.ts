import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { coachingSessionPaymentService } from '@/services/coaching-session-payment.service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

/**
 * POST /api/sessions/[id]/payment
 * Handle session payment actions
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'coach-complete') {
      // Get session to verify organization
      const coachSession = await prisma.coachSession.findUnique({
        where: { id },
      });

      if (!coachSession) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      if (coachSession.coachId !== userId) {
        return NextResponse.json(
          { error: 'Only the coach can complete the session' },
          { status: 403 }
        );
      }

      if (!coachSession.organizationId) {
        return NextResponse.json(
          { error: 'Session must belong to an organization' },
          { status: 400 }
        );
      }

      // Mark session complete and process payment
      const result = await coachingSessionPaymentService.markSessionComplete({
        sessionId: id,
        coachId: userId,
        organizationId: coachSession.organizationId,
      });

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Session marked as complete. Player has been charged and coach earnings credited.',
      });
    } else if (action === 'player-confirm') {
      // Get the booking to verify player
      const { attendanceStatus } = body;

      const booking = await prisma.sessionBooking.findUnique({
        where: {
          sessionId_playerId: {
            sessionId: id,
            playerId: userId,
          },
        },
      });

      if (!booking) {
        return NextResponse.json(
          { error: 'You are not booked for this session' },
          { status: 403 }
        );
      }

      const result = await coachingSessionPaymentService.confirmPlayerSessionComplete({
        sessionId: id,
        playerId: userId,
        attendanceStatus: attendanceStatus || 'attended',
      });

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Session confirmed by player',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Session completion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process session completion' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sessions/[id]/payment-details
 * Get payment and debt details for a session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const paymentDetails = await coachingSessionPaymentService.getSessionPaymentDetails(id);

    if (!paymentDetails) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Verify user has access to this session payment
    const hasAccess =
      userId === paymentDetails.sessionPayment.coachId ||
      userId === paymentDetails.sessionPayment.playerId;

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this payment' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: paymentDetails });
  } catch (error: any) {
    console.error('Error fetching payment details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payment details' },
      { status: 500 }
    );
  }
}
