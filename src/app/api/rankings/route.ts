/**
 * Ranking API Routes
 * 
 * GET /api/rankings/player/:playerId - Get player's current rankings
 * GET /api/rankings/leaderboard/:type - Get leaderboard (global, development, activity, overall)
 * GET /api/rankings/history/:playerId - Get player's ranking history with traceability
 * GET /api/rankings/events/:eventId/trace - Trace ranking event to source
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getPlayerRankingSummary, computeGlobalLeaderboard, computeDevelopmentLeaderboard, computeActivityLeaderboard, computeOverallIndexLeaderboard } from '@/modules/ranking/projections';

/**
 * GET /api/rankings/player/:playerId
 * Returns current rankings for a player across all dimensions
 */
async function getPlayerRankings(
  req: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const { playerId } = params;
    const organizationId = req.headers.get('x-organization-id');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      );
    }

    const summary = await getPlayerRankingSummary(organizationId, playerId);

    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    console.error('Error fetching player rankings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player rankings' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rankings/leaderboard/:type
 * Returns leaderboard for specified type (global, development, activity, overall)
 */
async function getLeaderboard(
  req: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const { type } = params;
    const organizationId = req.headers.get('x-organization-id');
    const limit = req.nextUrl.searchParams.get('limit') || '100';

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      );
    }

    let leaderboard;

    switch (type.toUpperCase()) {
      case 'GLOBAL':
        leaderboard = await computeGlobalLeaderboard(organizationId, parseInt(limit));
        break;
      case 'DEVELOPMENT':
        leaderboard = await computeDevelopmentLeaderboard(organizationId, parseInt(limit));
        break;
      case 'ACTIVITY':
        leaderboard = await computeActivityLeaderboard(organizationId, parseInt(limit));
        break;
      case 'OVERALL':
        leaderboard = await computeOverallIndexLeaderboard(organizationId, parseInt(limit));
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid leaderboard type' },
          { status: 400 }
        );
    }

    return NextResponse.json(
      {
        type,
        leaderboard,
        count: leaderboard.length,
        generatedAt: new Date(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rankings/history/:playerId
 * Returns ranking history with full traceability
 */
async function getRankingHistory(
  req: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const { playerId } = params;
    const organizationId = req.headers.get('x-organization-id');
    const limit = req.nextUrl.searchParams.get('limit') || '50';
    const type = req.nextUrl.searchParams.get('type'); // Filter by ranking type

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      );
    }

    const where = {
      organizationId,
      playerId,
      ...(type && { rankingType: type }),
    };

    const history = await prisma.rankingHistory.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: parseInt(limit),
    });

    // Enrich with event details
    const enrichedHistory = await Promise.all(
      history.map(async entry => {
        const event = await prisma.rankingEvent.findFirst({
          where: {
            organizationId,
            playerId,
            createdAt: {
              lte: new Date(entry.recordedAt.getTime() + 1000), // Within 1 second
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        return {
          ...entry,
          linkedEvent: event ? {
            id: event.id,
            eventType: event.eventType,
            eventId: event.eventId,
            reason: event.reason,
            sourceData: event.sourceData,
          } : null,
        };
      })
    );

    return NextResponse.json(
      {
        playerId,
        type: type || 'all',
        history: enrichedHistory,
        count: enrichedHistory.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching ranking history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ranking history' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rankings/events/:eventId/trace
 * Traces a ranking event back to its source (match/session/rating/booking)
 */
async function traceRankingEvent(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;
    const organizationId = req.headers.get('x-organization-id');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      );
    }

    const rankingEvent = await prisma.rankingEvent.findUnique({
      where: { id: eventId },
      include: {
        player: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!rankingEvent) {
      return NextResponse.json(
        { error: 'Ranking event not found' },
        { status: 404 }
      );
    }

    // Fetch source based on event type
    let sourceDetails = null;

    switch (rankingEvent.eventType) {
      case 'MATCH_COMPLETED':
        sourceDetails = await prisma.match.findUnique({
          where: { id: rankingEvent.eventId },
          include: {
            playerA: { include: { user: { select: { firstName: true, lastName: true } } } },
            playerB: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        });
        break;

      case 'COACHING_SESSION_ATTENDED':
        sourceDetails = await prisma.coachSession.findUnique({
          where: { id: rankingEvent.eventId },
          include: {
            coach: { include: { user: { select: { firstName: true, lastName: true } } } },
            sessionRatings: true,
          },
        });
        break;

      case 'BOOKING_COMPLETED':
        sourceDetails = await prisma.courtBooking.findUnique({
          where: { id: rankingEvent.eventId },
          include: {
            court: true,
            member: {
              include: {
                player: {
                  include: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });
        break;

      case 'COACH_FEEDBACK_SUBMITTED':
        sourceDetails = await prisma.coachPlayerRating.findUnique({
          where: { id: rankingEvent.eventId },
          include: {
            coach: { include: { user: { select: { firstName: true, lastName: true } } } },
            player: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        });
        break;
    }

    return NextResponse.json(
      {
        rankingEvent: {
          id: rankingEvent.id,
          eventType: rankingEvent.eventType,
          eventId: rankingEvent.eventId,
          playerId: rankingEvent.playerId,
          impactedDimensions: rankingEvent.impactedDimensions,
          scoreChange: rankingEvent.scoreChange,
          reason: rankingEvent.reason,
          createdAt: rankingEvent.createdAt,
          player: {
            userId: rankingEvent.player?.userId,
            firstName: rankingEvent.player?.user?.firstName ?? undefined,
            lastName: rankingEvent.player?.user?.lastName ?? undefined,
            email: rankingEvent.player?.user?.email ?? undefined,
          },
        },
        source: {
          type: rankingEvent.eventType,
          details: sourceDetails,
          metadata: rankingEvent.sourceData,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error tracing ranking event:', error);
    return NextResponse.json(
      { error: 'Failed to trace ranking event' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Ranking API route is not directly callable. Use dedicated endpoints.' },
    { status: 400 }
  );
}
