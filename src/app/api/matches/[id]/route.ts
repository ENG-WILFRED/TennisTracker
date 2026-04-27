import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // First try to find a TournamentMatch
    let match = await prisma.tournamentMatch.findUnique({
      where: { id },
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
        event: {
          select: {
            name: true,
          },
        },
      },
    });

    if (match) {
      // Return TournamentMatch data
      return NextResponse.json({
        id: match.id,
        playerA: match.playerA ? {
          id: match.playerA.id,
          user: {
            firstName: match.playerA.player.user.firstName,
            lastName: match.playerA.player.user.lastName,
          }
        } : null,
        playerB: match.playerB ? {
          id: match.playerB.id,
          user: {
            firstName: match.playerB.player.user.firstName,
            lastName: match.playerB.player.user.lastName,
          }
        } : null,
        event: match.event,
        status: match.status,
        scoreSetA: match.scoreSetA,
        scoreSetB: match.scoreSetB,
        scoreSetC: match.scoreSetC,
        winnerId: match.winnerId,
        servingPlayerId: match.servingPlayerId,
        lastResetReason: match.lastResetReason,
        lastResetAt: match.lastResetAt,
        scheduledTime: match.scheduledTime,
      });
    }

    // If not found, try regular Match
    const regularMatch = await prisma.match.findUnique({
      where: { id },
      include: {
        playerA: { include: { user: true } },
        playerB: { include: { user: true } },
        referee: { include: { user: true } },
        winner: { include: { user: true } },
      },
    });

    if (!regularMatch) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }

    const data = {
      id: regularMatch.id,
      round: regularMatch.round,
      createdAt: regularMatch.createdAt,
      status: regularMatch.score ? 'COMPLETED' : 'PENDING',
      playerA: regularMatch.playerA != null
          ? { id: regularMatch.playerA.userId, name: `${regularMatch.playerA.user.firstName} ${regularMatch.playerA.user.lastName}` }
          : null,
      playerB: regularMatch.playerB != null
          ? { id: regularMatch.playerB.userId, name: `${regularMatch.playerB.user.firstName} ${regularMatch.playerB.user.lastName}` }
          : null,
      score: regularMatch.score,
      winner: regularMatch.winner ? { id: regularMatch.winner.user.id, name: `${regularMatch.winner.user.firstName} ${regularMatch.winner.user.lastName}` } : null,
    };
    return NextResponse.json(data);
  } catch (err) {
    console.error('API /api/matches/[id] error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { scoreSetA, scoreSetB, scoreSetC, status, winnerId, servingPlayerId, resetReason } = body;

    // Check if this is a TournamentMatch
    const tournamentMatch = await prisma.tournamentMatch.findUnique({
      where: { id },
    });

    if (tournamentMatch) {
      // Update TournamentMatch
      const updateData: any = {};

      if (status !== undefined) {
        updateData.status = status;
      }
      if (status === 'completed') {
        updateData.resultSubmittedAt = new Date();
        updateData.resultSubmittedBy = auth.playerId;
      }

      if (scoreSetA !== undefined) updateData.scoreSetA = scoreSetA;
      if (scoreSetB !== undefined) updateData.scoreSetB = scoreSetB;
      if (scoreSetC !== undefined) updateData.scoreSetC = scoreSetC;
      if (winnerId !== undefined) updateData.winnerId = winnerId;
      if (servingPlayerId !== undefined) updateData.servingPlayerId = servingPlayerId;
      if (resetReason !== undefined) {
        updateData.lastResetReason = resetReason;
        updateData.lastResetAt = new Date();
      }

      const updatedMatch = await prisma.tournamentMatch.update({
        where: { id },
        data: updateData,
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
          event: {
            select: {
              name: true,
            },
          },
        },
      });

      return NextResponse.json({
        id: updatedMatch.id,
        playerA: updatedMatch.playerA ? {
          id: updatedMatch.playerA.id,
          user: {
            firstName: updatedMatch.playerA.player.user.firstName,
            lastName: updatedMatch.playerA.player.user.lastName,
          }
        } : null,
        playerB: updatedMatch.playerB ? {
          id: updatedMatch.playerB.id,
          user: {
            firstName: updatedMatch.playerB.player.user.firstName,
            lastName: updatedMatch.playerB.player.user.lastName,
          }
        } : null,
        event: updatedMatch.event,
        status: updatedMatch.status,
        scoreSetA: updatedMatch.scoreSetA,
        scoreSetB: updatedMatch.scoreSetB,
        scoreSetC: updatedMatch.scoreSetC,
        winnerId: updatedMatch.winnerId,
        servingPlayerId: updatedMatch.servingPlayerId,
      });
    }

    // If not a TournamentMatch, this endpoint doesn't support updating regular matches
    return NextResponse.json({ error: 'Match type not supported for updates' }, { status: 400 });
  } catch (error) {
    console.error('Error updating match:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}