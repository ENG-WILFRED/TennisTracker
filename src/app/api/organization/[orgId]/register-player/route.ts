import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function POST(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { orgId } = await params;
    const body = await request.json();
    const { playerId } = body;

    if (!playerId) return new Response(JSON.stringify({ error: 'playerId required' }), { status: 400 });

    // Ensure organization exists
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), { status: 404 });
    }

    // Ensure player exists
    const existing = await prisma.player.findUnique({ where: { userId: playerId } });
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Player not found' }), { status: 404 });
    }

    // Attach player to organization (use connect to be explicit)
    const player = await prisma.player.update({
      where: { userId: playerId },
      data: { organization: { connect: { id: orgId } } },
    });

    return new Response(JSON.stringify(player), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error registering player to org:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
