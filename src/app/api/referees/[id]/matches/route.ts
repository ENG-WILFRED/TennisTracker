import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Referee ID is required' }, { status: 400 });
    }

    // Get referee info
    const referee = await prisma.referee.findUnique({
      where: { userId: id },
      select: {
        matchesRefereed: true,
        ballCrewMatches: true,
        experience: true,
        certifications: true,
      },
    });

    if (!referee) {
      return NextResponse.json({ error: 'Referee not found' }, { status: 404 });
    }

    // Get matches refereed by this referee
    const matches = await prisma.match.findMany({
      where: { refereeId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        playerA: {
          include: { user: true },
        },
        playerB: {
          include: { user: true },
        },
      },
    });

    // Parse certificates from JSON strings
    const parsedCertifications = referee.certifications.map((cert: string) => {
      try {
        return JSON.parse(cert);
      } catch {
        return { name: cert, status: 'Active' };
      }
    });

    // Get upcoming matches to referee (simply use most recent)
    const upcomingMatches = matches.slice(0, 5);

    return NextResponse.json({
      referee: {
        ...referee,
        certifications: parsedCertifications,
      },
      matches: matches.map(m => ({
        id: m.id,
        round: m.round,
        score: m.score,
        group: m.group,
        createdAt: m.createdAt.toISOString(),
        title: `${m.playerA.user.firstName} ${m.playerA.user.lastName} vs ${m.playerB.user.firstName} ${m.playerB.user.lastName}`,
      })),
      upcomingMatches: upcomingMatches.map(m => ({
        id: m.id,
        round: m.round,
        score: m.score,
        group: m.group,
        createdAt: m.createdAt.toISOString(),
        title: `${m.playerA.user.firstName} ${m.playerA.user.lastName} vs ${m.playerB.user.firstName} ${m.playerB.user.lastName}`,
      })),
      stats: {
        totalMatches: referee.matchesRefereed,
        ballCrewMatches: referee.ballCrewMatches,
        experience: referee.experience,
      },
    });
  } catch (error) {
    console.error('GET /api/referees/[id]/matches error:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}
