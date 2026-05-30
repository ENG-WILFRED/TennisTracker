import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';
import { notify } from '@/app/api/notification/producer';

export async function POST(request: Request, { params }: { params: Promise<{ playerId: string }> }) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { playerId } = await params;
    const body = await request.json();
    const { coachId } = body as { coachId?: string };

    if (!coachId) {
      return new Response(JSON.stringify({ error: 'coachId is required' }), { status: 400 });
    }

    const relationship = await prisma.coachPlayerRelationship.findUnique({
      where: { coachId_playerId: { coachId, playerId } },
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

    if (!relationship) {
      return new Response(JSON.stringify({ error: 'Assignment request not found' }), { status: 404 });
    }

    if (relationship.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Assignment request must be pending to accept' }), { status: 400 });
    }

    if (auth.userId !== coachId && auth.userId !== playerId) {
      return new Response(JSON.stringify({ error: 'Unauthorized to accept this assignment' }), { status: 403 });
    }

    const updatedRelationship = await prisma.coachPlayerRelationship.update({
      where: { coachId_playerId: { coachId, playerId } },
      data: {
        status: 'active',
        joinedAt: relationship.joinedAt ?? new Date(),
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

    const organization = updatedRelationship.coach.organizationId
      ? await prisma.organization.findUnique({
          where: { id: updatedRelationship.coach.organizationId },
          select: { name: true },
        })
      : null;

    const organizationName = organization?.name || 'your organization';
    const appUrl = process.env.APP_URL || 'https://vicotennis.com';
    const coachName = `${updatedRelationship.coach.user.firstName} ${updatedRelationship.coach.user.lastName}`;
    const playerName = `${updatedRelationship.player.user.firstName} ${updatedRelationship.player.user.lastName}`;

    try {
      const playerEmail = updatedRelationship.player.user.email;
      const coachEmail = updatedRelationship.coach.user.email;

      if (auth.userId === coachId) {
        if (playerEmail) {
          await notify({
            to: playerEmail as string,
            channel: 'email',
            template: 'player_assignment_accepted',
            data: {
              playerName,
              coachName,
              organizationName,
              actionUrl: `${appUrl}/dashboard/player/assignments`,
            },
          });
        }

        if (coachEmail) {
          await notify({
            to: coachEmail as string,
            channel: 'email',
            template: 'coach_assignment_accepted_confirmation',
            data: {
              coachName,
              playerName,
              organizationName,
              actionUrl: `${appUrl}/dashboard/coach/assignments`,
            },
          });
        }
      } else {
        if (coachEmail) {
          await notify({
            to: coachEmail as string,
            channel: 'email',
            template: 'coach_assignment_accepted',
            data: {
              coachName,
              playerName,
              organizationName,
              actionUrl: `${appUrl}/dashboard/coach/assignments`,
            },
          });
        }

        if (playerEmail) {
          await notify({
            to: playerEmail as string,
            channel: 'email',
            template: 'player_assignment_accepted_confirmation',
            data: {
              playerName,
              coachName,
              organizationName,
              actionUrl: `${appUrl}/dashboard/player/assignments`,
            },
          });
        }
      }
    } catch (error) {
      console.error('Failed to send assignment accepted notification:', error);
    }

    return new Response(
      JSON.stringify({ success: true, relationship: updatedRelationship }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error accepting coach assignment:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
