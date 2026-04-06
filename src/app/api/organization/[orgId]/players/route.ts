import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    const url = new URL(request.url);
    const filterType = url.searchParams.get('type') || 'all'; // 'all', 'managed', 'available'
    const coachId = url.searchParams.get('coachId'); // Optional filter by coach

    console.log('🔍 Players API called:', { orgId, filterType, coachId });

    const whereClause: any = { organizationId: orgId };

    // If filtering by coach's managed players
    if (filterType === 'managed' && coachId) {
      // Get players this coach is managing
      const relationships = await prisma.coachPlayerRelationship.findMany({
        where: { coachId },
        include: {
          player: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  username: true,
                  photo: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      const data = relationships.map((rel) => ({
        id: rel.playerId,
        userId: rel.playerId,
        firstName: rel.player.user.firstName,
        lastName: rel.player.user.lastName,
        name: `${rel.player.user.firstName} ${rel.player.user.lastName}`,
        username: rel.player.user.username,
        email: rel.player.user.email,
        photo: rel.player.user.photo,
        img: rel.player.user.photo,
        matchesPlayed: rel.player.matchesPlayed,
        matchesWon: rel.player.matchesWon,
        matchesLost: rel.player.matchesLost,
        winRate: rel.player.matchesPlayed > 0 ? ((rel.player.matchesWon / rel.player.matchesPlayed) * 100).toFixed(1) : '0',
        sessionsCompleted: rel.sessionsCount || 0,
        lastSessionAt: rel.lastSessionAt,
        joinedAt: rel.joinedAt,
        status: rel.status,
        createdAt: rel.createdAt,
      }));

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=5, s-maxage=5, stale-while-revalidate=10',
        },
      });
    }

    // Otherwise get all organization players
    const players = await prisma.player.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
            photo: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`📊 Found ${players.length} players for org ${orgId}`);

    const data = players.map((p) => ({
      id: p.userId,
      userId: p.userId,
      firstName: p.user.firstName,
      lastName: p.user.lastName,
      name: `${p.user.firstName} ${p.user.lastName}`,
      username: p.user.username,
      email: p.user.email,
      photo: p.user.photo,
      img: p.user.photo,
      matchesPlayed: p.matchesPlayed,
      matchesWon: p.matchesWon,
      matchesLost: p.matchesLost,
      winRate: p.matchesPlayed > 0 ? ((p.matchesWon / p.matchesPlayed) * 100).toFixed(1) : '0',
      createdAt: p.createdAt,
    }));

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=5, s-maxage=5, stale-while-revalidate=10',
      },
    });
  } catch (error) {
    console.error('Error listing organization players:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
