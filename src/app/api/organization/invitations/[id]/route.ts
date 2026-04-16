import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { invitationId, userId, action } = body;

    if (!invitationId || !userId || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'invitationId, userId, and action (accept/reject) are required' },
        { status: 400 }
      );
    }

    // Get the invitation
    const invitation = await prisma.membershipInvitation.findUnique({
      where: { id: invitationId },
      include: {
        organization: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: `Invitation has already been ${invitation.status}` },
        { status: 400 }
      );
    }

    // Check if invitation has expired
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Verify the user exists and matches the email
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.email !== invitation.email) {
      return NextResponse.json(
        { error: 'User email does not match invitation' },
        { status: 403 }
      );
    }

    if (action === 'accept') {
      // Create membership
      const existingMembership = await prisma.membership.findUnique({
        where: {
          userId_orgId: {
            userId,
            orgId: invitation.orgId,
          },
        },
      });

      if (existingMembership) {
        return NextResponse.json(
          { error: 'User is already a member of this organization' },
          { status: 400 }
        );
      }

      // Create the membership and update the invitation
      const [membership] = await Promise.all([
        prisma.membership.create({
          data: {
            userId,
            orgId: invitation.orgId,
            role: invitation.role,
            status: 'accepted',
            approvedAt: new Date(),
          },
        }),
        prisma.membershipInvitation.update({
          where: { id: invitationId },
          data: {
            status: 'accepted',
            acceptedAt: new Date(),
            acceptedBy: userId,
          },
        }),
      ]);

      return NextResponse.json(
        {
          success: true,
          message: `Successfully joined ${invitation.organization.name} as ${invitation.role}`,
          membership: {
            id: membership.id,
            role: membership.role,
            organizationName: invitation.organization.name,
          },
        },
        {
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    } else {
      // Reject the invitation
      await prisma.membershipInvitation.update({
        where: { id: invitationId },
        data: {
          status: 'rejected',
          acceptedAt: new Date(),
          acceptedBy: userId,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Invitation rejected',
        },
        {
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }
  } catch (err) {
    console.error('API /api/organization/invitations/[id] error:', err);
    return NextResponse.json(
      { error: 'Failed to process invitation' },
      { status: 500 }
    );
  }
}
