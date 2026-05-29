import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';
import { notify } from '@/app/api/notification/producer';

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyApiAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      coachId,
      playerId,
      orgId,
      introMessage,
      reason,
      offerMode,
      sessionFormat,
      paymentType,
      weeklySessions,
      personalAnalysis,
    } = body;

    if (!coachId || !playerId || !orgId || !introMessage || !reason || !offerMode || !sessionFormat || !paymentType) {
      return NextResponse.json(
        { error: 'Missing required recruitment fields' },
        { status: 400 }
      );
    }

    if (coachId === playerId) {
      return NextResponse.json(
        { error: 'You cannot recruit yourself' },
        { status: 400 }
      );
    }

    if (auth.userId !== coachId) {
      return NextResponse.json(
        { error: 'Authenticated coach does not match coachId' },
        { status: 403 }
      );
    }

    const coach = await prisma.staff.findUnique({
      where: { userId: coachId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        organization: { select: { id: true, name: true } },
      },
    });

    if (!coach || coach.organizationId !== orgId || !coach.role?.toLowerCase().includes('coach')) {
      return NextResponse.json(
        { error: 'Coach not found in organization' },
        { status: 404 }
      );
    }

    const player = await prisma.player.findUnique({
      where: { userId: playerId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        organization: { select: { id: true, name: true } },
      },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    const isSameOrganization = player.organization?.id === coach.organization?.id;

    const existingRelationship = await prisma.coachPlayerRelationship.findUnique({
      where: {
        coachId_playerId: { coachId, playerId },
      },
    });

    if (existingRelationship) {
      return NextResponse.json(
        { error: 'A coaching relationship or pending request already exists for this player' },
        { status: 400 }
      );
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
            organization: { select: { id: true, name: true } },
          },
        },
        player: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            organization: { select: { id: true, name: true } },
          },
        },
      },
    });

    const requestTone = isSameOrganization ? 'personal coach' : 'general coach';
    const requestLabel = isSameOrganization ? 'Personal coach invitation' : 'General coaching request';

    await prisma.coachPlayerNote.create({
      data: {
        relationshipId: relationship.id,
        title: requestLabel,
        category: 'recruitment',
        content: `Intro: ${introMessage.trim()}
Reason: ${reason}
Offer: ${offerMode} · ${sessionFormat} · ${paymentType} · ${weeklySessions} sessions/week
Analysis: ${personalAnalysis?.trim() || 'None'}`,
      },
    });

    try {
      await notify({
        to: player.user.email,
        channel: 'email',
        template: 'coach_recruit_request',
        data: {
          playerName: `${player.user.firstName} ${player.user.lastName}`.trim(),
          coachName: `${coach.user.firstName} ${coach.user.lastName}`.trim(),
          coachEmail: coach.user.email,
          coachRole: coach.role,
          coachOrganization: coach.organization?.name || 'Independent',
          coachOrganizationId: coach.organization?.id || null,
          playerOrganization: player.organization?.name || null,
          isSameOrganization,
          requestTone,
          introMessage: introMessage.trim(),
          reason,
          offerMode,
          sessionFormat,
          paymentType,
          weeklySessions,
          personalAnalysis: personalAnalysis?.trim() || null,
        },
      });
    } catch (notificationError) {
      console.error('Failed to send recruitment notification:', notificationError);
    }

    return NextResponse.json(
      {
        message: 'Recruitment request sent successfully. The player will receive your invitation by email.',
        relationship,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error recruiting player:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
