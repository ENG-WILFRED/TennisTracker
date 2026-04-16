import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const playerId = url.searchParams.get('playerId');


    if (!playerId) {
      return NextResponse.json({ error: 'playerId required' }, { status: 400 });
    }

    // Get coaches this player is assigned to
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
        console.log(`     ${idx + 1}. ${rel.coach.user.firstName} ${rel.coach.user.lastName}`);
      });
    } else {
      console.log('   ⚠️  No coaches found!');
    }

    return NextResponse.json(relationships);
  } catch (error) {
    console.error('Error fetching coaches:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
