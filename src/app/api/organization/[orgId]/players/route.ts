import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    const players = await prisma.player.findMany({ where: { organizationId: orgId }, include: { user: true } });
    const data = players.map((p) => ({ id: p.userId, name: `${p.user.firstName} ${p.user.lastName}`, username: p.user.username, img: p.user.photo }));
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error listing organization players:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
