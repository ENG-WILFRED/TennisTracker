import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

/**
 * POST /api/referee/tasks/[taskId]/matches
 * Create a new tournament match for a task
 * 
 * Body: {
 *   playerAId: string (ClubMember ID),
 *   playerBId: string (ClubMember ID),
 *   scheduledTime: DateTime (optional),
 *   courtId?: string,
 *   round?: number,
 *   matchPosition?: number
 * }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { taskId } = await params;

    const body = await request.json();
    const { playerAId, playerBId, scheduledTime, courtId, round = 1, matchPosition = 0 } = body;

    if (!playerAId || !playerBId) {
      return new Response(
        JSON.stringify({ error: 'Both players are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (playerAId === playerBId) {
      return new Response(
        JSON.stringify({ error: 'Players must be different' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get task and verify it's assigned to referee
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        assignedToId: true,
        context: true,
        status: true,
        organizationId: true,
      }
    });

    if (!task) {
      return new Response(
        JSON.stringify({ error: 'Task not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (task.assignedToId !== auth.playerId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const context = task.context as any;
    if (!context?.eventId) {
      return new Response(
        JSON.stringify({ error: 'This task is not an event task' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const existingMatchCount = await prisma.tournamentMatch.count({
      where: { eventId: context.eventId },
    });
    const isGroupStageGeneration = body.groupStageGeneration === true;
    if (existingMatchCount > 0) {
      return new Response(
        JSON.stringify({ error: 'Matches already exist for this event. No additional task matches can be created.' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get or create bracket
    let bracket = await prisma.tournamentBracket.findFirst({
      where: { eventId: context.eventId },
    });

    if (!bracket) {
      bracket = await prisma.tournamentBracket.create({
        data: {
          eventId: context.eventId,
          organizationId: task.organizationId,
          bracketType: 'single_elimination',
          totalRounds: 1,
        }
      });
    }

    // Create tournament match
    const match = await prisma.tournamentMatch.create({
      data: {
        eventId: context.eventId,
        bracketId: bracket.id,
        organizationId: task.organizationId,
        playerAId,
        playerBId,
        courtId: courtId || null,
        round,
        matchPosition,
        status: 'pending',
        scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
      }
    });

    return new Response(JSON.stringify({
      success: true,
      match,
      message: 'Match created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating match:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create match' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * PUT /api/referee/tasks/[taskId]/matches
 * Update tournament match (score, status, etc.)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { taskId } = await params;

    const body = await request.json();
    const { matchId, scoreSetA, scoreSetB, scoreSetC, status, scheduledTime, winnerId } = body;

    if (!matchId) {
      return new Response(
        JSON.stringify({ error: 'Match ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify task assignment
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { assignedToId: true }
    });

    if (!task || task.assignedToId !== auth.playerId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (scoreSetA !== undefined) updateData.scoreSetA = scoreSetA;
    if (scoreSetB !== undefined) updateData.scoreSetB = scoreSetB;
    if (scoreSetC !== undefined) updateData.scoreSetC = scoreSetC;
    if (status) updateData.status = status;
    if (scheduledTime) updateData.scheduledTime = new Date(scheduledTime);
    if (winnerId) updateData.winnerId = winnerId;
    if (status === 'done' || status === 'completed') {
      updateData.resultSubmittedAt = new Date();
      updateData.resultSubmittedBy = auth.playerId;
    }

    const updatedMatch = await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: updateData,
    });

    return new Response(JSON.stringify({
      success: true,
      match: updatedMatch,
      message: 'Match updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating match:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update match' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
