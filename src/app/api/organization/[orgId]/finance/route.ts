import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    const finances = await prisma.clubFinance.findMany({
      where: {
        organizationId: orgId,
        month: { lte: month },
        year: { lte: year },
      },
      include: {
        transactionRecords: true,
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
      take: 12,
    });

    return new Response(JSON.stringify(finances), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching organization finances:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}