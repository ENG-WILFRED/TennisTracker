import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function PATCH(request: Request, { params }: { params: Promise<{ orgId: string; applicationId: string }> }) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const { orgId, applicationId } = await params;
    const body = await request.json();
    const action = body?.action;

    if (!['accept', 'reject'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const application = await prisma.membership.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          include: { player: true },
        },
      },
    });
    if (!application || application.orgId !== orgId) {
      return new Response(JSON.stringify({ error: 'Application not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    if (application.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Application is no longer pending' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const updateData: any = {
      status: action === 'accept' ? 'accepted' : 'rejected',
      updatedAt: new Date(),
    };

    if (action === 'accept') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = auth.userId;

      if (!application.user) {
        return new Response(JSON.stringify({ error: 'Application user not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }

      const playerId = application.user.player?.userId || application.userId;
      if (!application.user.player) {
        await prisma.player.create({
          data: {
            userId: application.userId,
            organizationId: orgId,
          },
        });
      }

      const roleToAssign = application.role || 'member';
      const existingClubMember = await prisma.clubMember.findFirst({
        where: {
          organizationId: orgId,
          playerId,
          role: roleToAssign,
        },
      });

      if (!existingClubMember) {
        await prisma.clubMember.create({
          data: {
            organizationId: orgId,
            playerId,
            role: roleToAssign,
            paymentStatus: 'active',
            joinDate: new Date(),
          },
        });
      } else {
        await prisma.clubMember.update({
          where: { id: existingClubMember.id },
          data: {
            paymentStatus: 'active',
            joinDate: existingClubMember.joinDate || new Date(),
          },
        });
      }
    }

    const updatedApplication = await prisma.membership.update({
      where: { id: applicationId },
      data: updateData,
    });

    return new Response(JSON.stringify({ success: true, application: updatedApplication }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating organization application:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
