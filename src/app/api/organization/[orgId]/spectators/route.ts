import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { orgId } = await params;
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Get all spectators (users with spectator records but not staff)
    const spectators = await prisma.spectator.findMany({
      where: {
        user: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { username: { contains: search, mode: 'insensitive' } },
          ],
          // Exclude users who are already staff
          staff: null,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            username: true,
            phone: true,
            photo: true,
            city: true,
            country: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Format the response
    const formattedSpectators = spectators.map((spectator) => ({
      id: spectator.userId,
      name: `${spectator.user.firstName} ${spectator.user.lastName}`,
      email: spectator.user.email,
      username: spectator.user.username,
      phone: spectator.user.phone,
      photo: spectator.user.photo,
      location: spectator.user.city ? `${spectator.user.city}, ${spectator.user.country}` : spectator.user.country,
      registeredAt: spectator.createdAt,
      userId: spectator.userId,
    }));

    // Get total count for pagination
    const totalCount = await prisma.spectator.count({
      where: {
        user: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { username: { contains: search, mode: 'insensitive' } },
          ],
          staff: null,
        },
      },
    });

    return new Response(
      JSON.stringify({
        spectators: formattedSpectators,
        totalCount,
        hasMore: offset + limit < totalCount,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching spectators:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}