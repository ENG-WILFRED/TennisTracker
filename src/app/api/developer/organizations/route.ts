import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET() {
  try {
    const auth = verifyApiAuth();
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Verify user is a developer
    const userWithRole = await prisma.player.findFirst({
      where: { userId: auth.playerId },
      include: { user: true },
    });

    if (!userWithRole || userWithRole.role !== 'developer') {
      return new Response(JSON.stringify({ error: 'Access denied: developer role required' }), { status: 403 });
    }

    // Get pending organizations
    const pendingOrgs = await prisma.organization.findMany({
      where: { status: 'pending' },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get approved organizations count
    const approvedCount = await prisma.organization.count({
      where: { status: 'approved' },
    });

    return new Response(JSON.stringify({
      pending: pendingOrgs,
      approvedCount,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching organizations for developer:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Verify user is a developer
    const userWithRole = await prisma.player.findFirst({
      where: { userId: auth.playerId },
      include: { user: true },
    });

    if (!userWithRole || userWithRole.role !== 'developer') {
      return new Response(JSON.stringify({ error: 'Access denied: developer role required' }), { status: 403 });
    }

    const body = await request.json();
    const { action, id } = body as { action?: string; id?: string };

    if (!action || !id) {
      return new Response(JSON.stringify({ error: 'Action and id are required' }), { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Action must be approve or reject' }), { status: 400 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: { creator: true },
    });

    if (!organization) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), { status: 404 });
    }

    if (organization.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Organization is not pending approval' }), { status: 400 });
    }

    // Update organization status
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const updatedOrg = await prisma.organization.update({
      where: { id },
      data: { status: newStatus },
    });

    // If approved, create membership for the creator
    if (action === 'approve') {
      await prisma.clubMember.create({
        data: {
          organizationId: id,
          playerId: organization.createdBy,
          role: 'admin',
          paymentStatus: 'completed',
          joinDate: new Date(),
        },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Organization ${action}d successfully`,
      organization: {
        id: updatedOrg.id,
        name: updatedOrg.name,
        status: newStatus,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error managing organization approval:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500 });
  }
}