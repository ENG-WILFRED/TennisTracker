import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function POST(request: Request) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await request.json();
    const { orgId, role } = body as { orgId?: string; role?: string };

    if (!orgId || !role) {
      return new Response(JSON.stringify({ error: 'Organization and role are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!['player', 'coach', 'referee'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Role must be player, coach, or referee' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const organization = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!organization) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const existingMembership = await prisma.clubMember.findUnique({
      where: {
        organizationId_playerId: {
          organizationId: orgId,
          playerId: auth.playerId,
        },
      },
    });

    if (existingMembership) {
      return new Response(JSON.stringify({ error: 'You have already applied or are already a member of this organization' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }

    const membership = await prisma.clubMember.create({
      data: {
        organizationId: orgId,
        playerId: auth.playerId,
        role,
        paymentStatus: 'pending',
        joinDate: new Date(),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Application submitted to ${organization.name}.`,
        membershipId: membership.id,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Organization apply error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to submit application' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
