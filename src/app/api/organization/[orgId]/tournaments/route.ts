import prisma from '@/lib/prisma';
import type { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Verify organization exists
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true },
    });

    if (!org) {
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { status: 404 }
      );
    }

    // Build query filter
    const where: any = { organizationId: orgId, eventType: 'tournament' };

    // Fetch tournaments
    const tournaments = await prisma.clubEvent.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        eventType: true,
        startDate: true,
        endDate: true,
        registrationCap: true,
        entryFee: true,
        location: true,
        createdAt: true,
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { startDate: 'desc' as const },
      take: 20,
    });

    return new Response(
      JSON.stringify(tournaments),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}
