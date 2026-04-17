import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function PATCH(request: Request, { params }: { params: Promise<{ orgId: string; memberId: string }> }) {
  try {
    console.log('PATCH /api/organization/[orgId]/members/[memberId] called');

    const auth = verifyApiAuth(request);
    if (!auth) {
      console.log('Authentication failed');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { orgId, memberId } = await params;
    console.log(`Processing request for orgId: ${orgId}, memberId: ${memberId}`);

    const body = await request.json();
    const action = body?.action;
    console.log(`Action: ${action}, body:`, body);

    if (!['dismiss', 'suspend', 'deactivate', 'activate', 'approve', 'reject'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
    }

    const member = await prisma.clubMember.findUnique({ where: { id: memberId } });
    if (!member || member.organizationId !== orgId) {
      return new Response(JSON.stringify({ error: 'Member not found' }), { status: 404 });
    }

    let updateData: any = {};

    if (action === 'dismiss') {
      updateData = {
        paymentStatus: 'inactive',
        suspensionReason: 'Dismissed by organization admin',
        suspendedUntil: new Date(),
        role: 'inactive',
      };
    } else if (action === 'suspend') {
      const until = body?.until ? new Date(body.until) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      updateData = {
        paymentStatus: 'inactive',
        suspensionReason: body?.reason || 'Temporarily suspended by organization admin',
        suspendedUntil: until,
        role: 'inactive',
      };
    } else if (action === 'deactivate') {
      updateData = {
        paymentStatus: 'inactive',
        suspensionReason: 'Deactivated by organization admin',
        suspendedUntil: null,
        role: 'inactive',
      };
    } else if (action === 'approve') {
      updateData = {
        paymentStatus: 'active',
        suspensionReason: null,
        suspendedUntil: null,
        role: body?.role || member.role || 'member',
      };
    } else if (action === 'reject') {
      updateData = {
        paymentStatus: 'rejected',
        suspensionReason: body?.reason || 'Rejected by organization admin',
        suspendedUntil: null,
        role: 'inactive',
      };
    } else if (action === 'activate') {
      updateData = {
        paymentStatus: 'active',
        suspensionReason: null,
        suspendedUntil: null,
        role: body?.role || 'member',
      };
    }

    const updatedMember = await prisma.clubMember.update({
      where: { id: memberId },
      data: updateData,
    });

    return new Response(JSON.stringify({ success: true, member: updatedMember }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating organization member:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ orgId: string; memberId: string }> }) {
  try {
    console.log('DELETE /api/organization/[orgId]/members/[memberId] called');

    const auth = verifyApiAuth(request);
    if (!auth) {
      console.log('Authentication failed');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { orgId, memberId } = await params;
    console.log(`Processing DELETE request for orgId: ${orgId}, memberId: ${memberId}`);

    const existing = await prisma.clubMember.findUnique({ where: { id: memberId } });
    if (!existing || existing.organizationId !== orgId) {
      return new Response(JSON.stringify({ error: 'Member not found' }), { status: 404 });
    }

    await prisma.clubMember.delete({ where: { id: memberId } });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting organization member:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
