import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    const { searchParams } = new URL(request.url);
    const week = parseInt(searchParams.get('week') || '1');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    const rankings = await prisma.playerRanking.findMany({
      where: {
        organizationId: orgId,
        weekNumber: week,
        year: year,
      },
      include: {
        member: {
          include: {
            player: {
              include: { user: true },
            },
          },
        },
      },
      orderBy: { currentRank: 'asc' },
    });

    return new Response(JSON.stringify(rankings), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching organization rankings:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}