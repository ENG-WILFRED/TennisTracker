import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;

    const courts = await prisma.court.findMany({
      where: { organizationId: orgId },
      orderBy: { courtNumber: 'asc' },
    });

    return new Response(JSON.stringify(courts), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching organization courts:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}