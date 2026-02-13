import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    const players = await prisma.player.findMany({ where: { organizationId: orgId }, select: { id: true, firstName: true, lastName: true, username: true, photo: true } });
    const data = players.map((p) => ({ id: p.id, name: `${p.firstName} ${p.lastName}`, username: p.username, img: p.photo }));
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error listing organization players:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
