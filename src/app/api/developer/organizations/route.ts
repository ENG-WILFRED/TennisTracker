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

    // Get pending organizations
    const pending = await prisma.organization.findMany({
      where: { status: 'pending' },
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
        createdBy: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with creator info
    const enrichedOrgs = await Promise.all(
      pending.map(async (org) => {
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

    return new Response(JSON.stringify({ pending: enrichedOrgs }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching pending organizations:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
