import { NextRequest, NextResponse } from 'next/server';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/coaches/rate-player
 * 
 * Fetch ratings for players. Query params:
 * - coachId: Coach ID
 * - playerId: Player ID (optional, to get ratings for specific player)
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const coachId = url.searchParams.get('coachId');
    const playerId = url.searchParams.get('playerId');

    if (!coachId) {
      return NextResponse.json({ error: 'coachId required' }, { status: 400 });
    }

    const where: any = { coachId };
    if (playerId) {
      where.playerId = playerId;
    }

    let ratings = [];
    try {
      ratings = await prisma.coachPlayerRating.findMany({
        where,
        include: {
          player: {
            select: {
              userId: true,
              user: { select: { firstName: true, lastName: true, photo: true } },
            },
          },
          session: {
            select: {
              id: true,
              startTime: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        (error as any).code === 'P2021'
      ) {
        console.warn('Coach ratings table does not exist yet', (error as any).message);
        return NextResponse.json([]);
      }
      throw error;
    }

    return NextResponse.json(ratings);
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/coaches/rate-player
 * 
 * Coach submits a rating for a player after a completed session
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      coachId,
      playerId,
      sessionId,
      overallRating,
      techniquRating,
      mentalRating,
      fitnessRating,
      teamworkRating,
      strengths,
      areasForImprovement,
      notes,
    } = body;

    // Validation
    if (!coachId || !playerId || !overallRating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (
      !strengths?.trim() ||
      !areasForImprovement?.trim()
    ) {
      return NextResponse.json(
        { error: 'Strengths and areas for improvement are required' },
        { status: 400 }
      );
    }

    // Verify coach exists
    const coach = await prisma.staff.findUnique({
      where: { userId: coachId },
    });

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      );
    }

    // Verify player exists
    const player = await prisma.player.findUnique({
      where: { userId: playerId },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Verify session if provided
    if (sessionId) {
      const session = await prisma.coachSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
    }

    // Check for existing rating for this session
    if (sessionId) {
      const existingRating = await prisma.coachPlayerRating.findFirst({
        where: {
          coachId,
          playerId,
          sessionId,
        },
      });

      if (existingRating) {
        // Update existing rating
        const updated = await prisma.coachPlayerRating.update({
          where: { id: existingRating.id },
          data: {
            overallRating,
            techniquRating: techniquRating || null,
            mentalRating: mentalRating || null,
            fitnessRating: fitnessRating || null,
            teamworkRating: teamworkRating || null,
            strengths,
            areasForImprovement,
            notes: notes || null,
            isConcluded: true,
            updatedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Rating updated successfully',
          rating: updated,
        });
      }
    }

    // Create new rating
    const rating = await prisma.coachPlayerRating.create({
      data: {
        coachId,
        playerId,
        sessionId: sessionId || null,
        overallRating,
        techniquRating: techniquRating || null,
        mentalRating: mentalRating || null,
        fitnessRating: fitnessRating || null,
        teamworkRating: teamworkRating || null,
        strengths,
        areasForImprovement,
        notes: notes || null,
        isConcluded: true,
      },
    });

    // Optionally update player's average rating in the relationship
    const relationship = await prisma.coachPlayerRelationship.findUnique({
      where: {
        coachId_playerId: {
          coachId,
          playerId,
        },
      },
    });

    if (relationship) {
      // Calculate average rating for this relationship
      const allRatings = await prisma.coachPlayerRating.findMany({
        where: {
          coachId,
          playerId,
          isConcluded: true,
        },
        select: {
          overallRating: true,
        },
      });

      if (allRatings.length > 0) {
        const avgRating =
          allRatings.reduce((sum: number, r) => sum + r.overallRating, 0) /
          allRatings.length;

        // You could store this in the relationship if you want to track it
        // For now, we'll just log it
        console.log(
          `[Rating] Average rating for player ${playerId} by coach ${coachId}: ${avgRating.toFixed(2)}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Rating submitted successfully',
      rating,
    });
  } catch (error) {
    console.error('Error submitting rating:', error);
    if (
      error instanceof PrismaClientKnownRequestError &&
      (error as any).code === 'P2021'
    ) {
      return NextResponse.json(
        { error: 'Coach ratings table does not exist. Please run Prisma migrations.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500 }
    );
  }
}
