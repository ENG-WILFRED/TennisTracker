import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    const whereClause: any = { organizationId: orgId };

    if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);

      whereClause.startTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const bookings = await prisma.courtBooking.findMany({
      where: whereClause,
      include: {
        court: true,
        member: {
          include: {
            player: {
              include: { user: true },
            },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return new Response(JSON.stringify(bookings), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching organization bookings:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}