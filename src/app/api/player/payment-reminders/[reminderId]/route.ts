import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';
import { NextResponse } from 'next/server';

/**
 * PATCH /api/player/payment-reminders/[reminderId]
 * Update a payment reminder (mark as read, resolved, etc.)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ reminderId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reminderId } = await params;
    const body = await request.json();
    const { isRead, isResolved } = body;

    // Get the reminder to verify ownership (optional, depends on your security model)
    const reminder = await prisma.paymentReminder.findUnique({
      where: { id: reminderId },
      include: {
        member: {
          include: {
            player: true,
          },
        },
      },
    });

    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }

    // Optional: Verify the reminder belongs to the authenticated player
    if (reminder.member.player.userId !== auth.userId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to update this reminder' },
        { status: 403 }
      );
    }

    // Update the reminder
    const updatedReminder = await prisma.paymentReminder.update({
      where: { id: reminderId },
      data: {
        ...(isRead !== undefined && { isRead }),
        ...(isResolved !== undefined && { isResolved }),
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      reminder: updatedReminder,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Update payment reminder error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update reminder' },
      { status: 500 }
    );
  }
}
