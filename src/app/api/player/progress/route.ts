import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json(
        { error: 'Missing playerId parameter' },
        { status: 400 }
      );
    }

    // Get player basic info
    const player = await prisma.player.findUnique({
      where: { userId: playerId },
      include: { user: true },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Get match history with dates
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { playerAId: playerId },
          { playerBId: playerId },
        ],
      },
      include: {
        playerA: { include: { user: true } },
        playerB: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate progress metrics
    const totalMatches = matches.length;
    const wins = matches.filter(m => m.winnerId === playerId).length;
    const losses = totalMatches - wins;
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    // Group matches by month for progress tracking
    const matchesByMonth: Record<string, typeof matches> = matches.reduce((acc, match) => {
      const month = match.createdAt.toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) acc[month] = [];
      acc[month].push(match);
      return acc;
    }, {} as Record<string, typeof matches>);

    // Calculate monthly progress
    const monthlyProgress = Object.entries(matchesByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, monthMatches]) => {
        const monthWins = monthMatches.filter((m: any) => m.winnerId === playerId).length;
        const monthTotal = monthMatches.length;
        const monthWinRate = monthTotal > 0 ? Math.round((monthWins / monthTotal) * 100) : 0;

        return {
          month,
          matches: monthTotal,
          wins: monthWins,
          losses: monthTotal - monthWins,
          winRate: monthWinRate,
        };
      });

    // Get coach relationships and sessions
    const coachRelationships = await prisma.coachPlayerRelationship.findMany({
      where: { playerId },
      include: {
        coach: { include: { user: true } },
      },
    });

    const coachSessions = await prisma.coachSession.count({
      where: {
        coachId: { in: coachRelationships.map(r => r.coachId) },
        bookings: {
          some: {
            playerId,
            status: 'completed',
          },
        },
      },
    });

    // Get attendance records
    const attendanceRecords = await prisma.attendance.findMany({
      where: { playerId },
      orderBy: { date: 'desc' },
      take: 30, // Last 30 records
    });

    const attendanceRate = attendanceRecords.length > 0
      ? Math.round((attendanceRecords.filter(a => a.present).length / attendanceRecords.length) * 100)
      : 0;

    // Get badges earned
    const badges = await prisma.playerBadge.findMany({
      where: { playerId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });

    // Calculate improvement trends
    const recentMatches = matches.slice(0, 10); // Last 10 matches
    const recentWinRate = recentMatches.length > 0
      ? Math.round((recentMatches.filter(m => m.winnerId === playerId).length / recentMatches.length) * 100)
      : 0;

    const overallWinRate = winRate;
    const improvement = recentWinRate - overallWinRate;

    const level = player.matchesPlayed >= 50
      ? 'Advanced'
      : player.matchesPlayed >= 20
        ? 'Intermediate'
        : 'Beginner';

    return NextResponse.json({
      player: {
        id: player.userId,
        name: `${player.user.firstName} ${player.user.lastName}`,
        level,
        joinedAt: player.createdAt,
      },
      stats: {
        totalMatches,
        wins,
        losses,
        winRate,
        coachSessions,
        attendanceRate,
        badgesEarned: badges.length,
      },
      progress: {
        monthly: monthlyProgress,
        recentWinRate,
        overallWinRate,
        improvement,
      },
      badges: badges.map(b => ({
        id: b.badge.id,
        name: b.badge.name,
        description: b.badge.description,
        icon: b.badge.icon,
        earnedAt: b.earnedAt,
      })),
      attendance: attendanceRecords.map(a => ({
        date: a.date,
        present: a.present,
      })),
      coaches: coachRelationships.map(r => ({
        id: r.coach.userId,
        name: `${r.coach.user.firstName} ${r.coach.user.lastName}`,
        status: r.status,
        joinedAt: r.joinedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching player progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player progress' },
      { status: 500 }
    );
  }
}