import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';
import { notify } from '@/app/api/notification/producer';

export async function POST(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { orgId } = await params;
    const body = await request.json();
    const { coachId, playerId } = body as { coachId?: string; playerId?: string };

    if (!coachId || !playerId) {
      return new Response(JSON.stringify({ error: 'coachId and playerId are required' }), { status: 400 });
    }

    const authorizingStaff = await prisma.staff.findFirst({
      where: { userId: auth.userId, organizationId: orgId },
    });

    if (!authorizingStaff) {
      return new Response(
        JSON.stringify({ error: 'You are not authorized to assign coaches for this organization' }),
        { status: 403 }
      );
    }

    const coach = await prisma.staff.findUnique({
      where: { userId: coachId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (!coach || coach.organizationId !== orgId) {
      return new Response(JSON.stringify({ error: 'Coach not found in organization' }), { status: 404 });
    }

    if (coach.role?.toLowerCase() !== 'coach') {
      return new Response(JSON.stringify({ error: 'Selected user is not a coach' }), { status: 400 });
    }

    const player = await prisma.player.findUnique({
      where: { userId: playerId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (!player || player.organizationId !== orgId) {
      return new Response(JSON.stringify({ error: 'Player not found in organization' }), { status: 404 });
    }

    const existingRelationship = await prisma.coachPlayerRelationship.findUnique({
      where: { coachId_playerId: { coachId, playerId } },
    });

    if (existingRelationship) {
      return new Response(JSON.stringify({ error: 'This player already has a relationship with the selected coach' }), { status: 400 });
    }

    const relationship = await prisma.coachPlayerRelationship.create({
      data: {
        coachId,
        playerId,
        status: 'pending',
        joinedAt: new Date(),
      },
      include: {
        coach: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        player: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true },
    });

    const organizationName = organization?.name || 'your organization';
    const appUrl = process.env.APP_URL || 'https://vicotennis.com';

    try {
      await notify({
        to: coach.user.email,
        channel: 'email',
        template: 'coach_assignment_request',
        data: {
          coachName: `${coach.user.firstName} ${coach.user.lastName}`,
          playerName: `${player.user.firstName} ${player.user.lastName}`,
          organizationName,
          playerEmail: player.user.email,
          actionUrl: `${appUrl}/dashboard/coach/assignments`,
        },
      });
    } catch (error) {
      console.error('Failed to send coach assignment notification:', error);
    }

    try {
      await notify({
        to: player.user.email,
        channel: 'email',
        template: 'player_assignment_request',
        data: {
          playerName: `${player.user.firstName} ${player.user.lastName}`,
          coachName: `${coach.user.firstName} ${coach.user.lastName}`,
          organizationName,
          coachEmail: coach.user.email,
          actionUrl: `${appUrl}/dashboard/player/assignments`,
        },
      });
    } catch (error) {
      console.error('Failed to send player assignment notification:', error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        relationship,
        message: 'Coach assignment request created successfully and both parties have been notified.',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating coach assignment request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
