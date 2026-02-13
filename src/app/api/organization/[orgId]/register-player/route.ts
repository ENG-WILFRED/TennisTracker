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

    // Attach player to organization
    const player = await prisma.player.update({
      where: { id: playerId },
      data: { organizationId: orgId },
    });

    return new Response(JSON.stringify(player), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error registering player to org:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
