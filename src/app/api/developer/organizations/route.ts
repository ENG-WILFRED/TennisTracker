import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

/**
 * GET /api/developer/organizations
 * Get all pending organizations for developer approval
 */
export async function GET(request: Request) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    const whereClause = status === 'all' ? {} : { status: status || 'pending' };

    const orgs = await prisma.organization.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        city: true,
        country: true,
        phone: true,
        email: true,
        logo: true,
        createdAt: true,
        approvedAt: true,
        createdBy: true,
        approvedBy: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const enrichedOrgs = await Promise.all(
      orgs.map(async (org) => {
        const creator = org.createdBy
          ? await prisma.user.findUnique({
              where: { id: org.createdBy },
              select: { firstName: true, lastName: true, email: true, phone: true },
            })
          : null;

        return {
          ...org,
          creator,
        };
      })
    );

    if (status === 'all') {
      return new Response(JSON.stringify({ organizations: enrichedOrgs }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ pending: enrichedOrgs }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching developer organizations:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
