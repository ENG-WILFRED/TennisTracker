import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ refereeId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { refereeId } = await params;

    if (!refereeId) {
      return NextResponse.json({ error: 'Referee ID is required' }, { status: 400 });
    }

    // Get referee info
    const referee = await prisma.referee.findUnique({
      where: { userId: refereeId },
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

    // Get event task IDs for this referee
    const assignedTasks = await prisma.task.findMany({
      where: {
        assignedToId: refereeId,
        context: {
          path: ['eventId'],
          not: {
            equals: null,
          },
        },
      },
      select: {
        context: true,
      },
    });

    const eventIds = Array.from(new Set(assignedTasks
      .map((task: typeof assignedTasks[number]) => (task.context as any)?.eventId)
      .filter(Boolean)
    ));

    // Get matches refereed by this referee
    const matches = await prisma.match.findMany({
      where: { refereeId: refereeId },
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

    const incomingMatches = eventIds.length > 0 ? await prisma.tournamentMatch.findMany({
      where: { eventId: { in: eventIds } },
      orderBy: { createdAt: 'asc' },
      include: {
        playerA: {
          include: {
            player: {
              include: { user: true },
            }
          }
        },
        playerB: {
          include: {
            player: {
              include: { user: true },
            }
          }
        },
        event: true,
      },
    }) : [];

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
      matches: matches.map((m: typeof matches[number]) => ({
        id: m.id,
        round: m.round,
        score: m.score,
        group: m.group,
        createdAt: m.createdAt.toISOString(),
        title: `${m.playerA.user.firstName} ${m.playerA.user.lastName} vs ${m.playerB.user.firstName} ${m.playerB.user.lastName}`,
      })),
      upcomingMatches: upcomingMatches.map((m: typeof upcomingMatches[number]) => ({
        id: m.id,
        round: m.round,
        score: m.score,
        group: m.group,
        createdAt: m.createdAt.toISOString(),
        title: `${m.playerA.user.firstName} ${m.playerA.user.lastName} vs ${m.playerB.user.firstName} ${m.playerB.user.lastName}`,
      })),
      incomingMatches: incomingMatches.map((m: typeof incomingMatches[number]) => ({
        id: m.id,
        eventName: m.event?.name || 'Tournament',
        playerA: m.playerA?.player?.user ? `${m.playerA.player.user.firstName} ${m.playerA.player.user.lastName}` : 'TBD',
        playerB: m.playerB?.player?.user ? `${m.playerB.player.user.firstName} ${m.playerB.player.user.lastName}` : 'TBD',
        status: m.status,
        scheduledTime: m.scheduledTime,
        group: m.matchPosition !== null && m.matchPosition !== undefined ? `Match ${m.matchPosition + 1}` : undefined,
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
