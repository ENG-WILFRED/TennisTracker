import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const playerId = url.searchParams.get('playerId');


    if (!playerId) {
      return NextResponse.json({ error: 'playerId required' }, { status: 400 });
    }

    // Get coaches this player is assigned to, include coach stats and organization
    const relationships = await prisma.coachPlayerRelationship.findMany({
      where: { playerId },
      include: {
        coach: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                photo: true,
                bio: true,
              },
            },
            stats: {
              select: {
                avgRating: true,
                ratingCount: true,
                totalSessions: true,
                completedSessions: true,
              },
            },
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    console.log(`   Found ${relationships.length} coaches`);

    if (relationships.length > 0) {
      console.log('   Coaches:');
      relationships.forEach((rel: typeof relationships[number], idx: number) => {
        const coachName = `${rel.coach.user.firstName} ${rel.coach.user.lastName}`;
        console.log(`     ${idx + 1}. ${coachName} — rating: ${rel.coach.stats?.avgRating ?? 'n/a'} (${rel.coach.stats?.ratingCount ?? 0})`);
      });
    } else {
      console.log('   ⚠️  No coaches found!');
    }

    // Map to a cleaner response shape for the client UI
    const response = relationships.map((rel) => ({
      id: rel.id,
      status: rel.status,
      joinedAt: rel.joinedAt,
      lastSessionAt: rel.lastSessionAt,
      sessionsCount: rel.sessionsCount,
      coach: {
        id: rel.coach.userId,
        firstName: rel.coach.user.firstName,
        lastName: rel.coach.user.lastName,
        email: rel.coach.user.email,
        photo: rel.coach.user.photo,
        bio: rel.coach.user.bio,
        stats: rel.coach.stats || null,
        organization: rel.coach.organization || null,
      },
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching coaches:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
