import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request: NextRequest, context: any) {
  const params = await context.params;
  const registrationId = params?.registrationId || null;

  if (!registrationId) {
    return NextResponse.json(
      { error: 'Registration ID missing from route' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { action, rejectionReason } = body;

    if (!action || !['approve', 'reject', 'undo'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve", "reject", or "undo"' },
        { status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'approved' : action === 'undo' ? 'pending' : 'rejected';

    // If rejecting, rejectionReason is optional but recommended
    const updateData: any = { status: newStatus };
    if (action === 'reject' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    if (action === 'undo') {
      updateData.rejectionReason = null;
    }

    const updatedRegistration = await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: updateData,
      include: {
        event: true,
        member: true,
      },
    });

    return NextResponse.json(updatedRegistration);
  } catch (error) {
    console.error('Error updating registration:', error);
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update registration' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: NextRequest, context: any) {
  const params = await context.params;
  const registrationId = params?.registrationId || null;

  if (!registrationId) {
    return NextResponse.json(
      { error: 'Registration ID missing from route' },
      { status: 400 }
    );
  }

  try {
    // Get userId from headers
    const userIdHeader = request.headers.get('x-user-id');
    if (!userIdHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reason } = body;

    // Get the registration to verify ownership
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: {
        member: {
          include: {
            player: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Verify that the user owns this registration
    if (registration.member.player?.user?.id !== userIdHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - you can only cancel your own registration' },
        { status: 403 }
      );
    }

    // Check if user paid (status is 'registered')
    const userPaid = registration.status === 'registered';

    // Delete the registration
    await prisma.eventRegistration.delete({
      where: { id: registrationId },
    });

    // Log cancellation (optional - could store in a separate table if needed)
    console.log(`Registration ${registrationId} cancelled with reason: ${reason}`);

    return NextResponse.json({
      message: 'Registration cancelled successfully',
      userPaid,
      refundMessage: userPaid ? 'Your payment was made. Please contact the organizer for refund.' : 'No refund needed - you had not yet paid.',
    });
  } catch (error) {
    console.error('Error cancelling registration:', error);
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to cancel registration' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
