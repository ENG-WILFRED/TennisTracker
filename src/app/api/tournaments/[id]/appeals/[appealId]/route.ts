import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';


// PATCH /api/tournaments/[id]/appeals/[appealId] - Respond to an appeal
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; appealId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: tournamentId, appealId } = await params;
    const { status, responseText } = await request.json();

    if (!['approved', 'denied'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be approved or denied' }, { status: 400 });
    }

    if (!responseText?.trim()) {
      return NextResponse.json({ error: 'Response text is required' }, { status: 400 });
    }

    // Check if user is organizer
    const tournament = await prisma.clubEvent.findUnique({
      where: { id: tournamentId },
      select: { organizationId: true }
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Check if user is owner of the organization
    const ownedOrg = await prisma.organization.findFirst({
      where: { 
        id: tournament.organizationId,
        createdBy: auth.playerId 
      }
    });

    // Check if user is a member with admin/owner role
    const memberRole = await prisma.clubMember.findFirst({
      where: { 
        playerId: auth.playerId,
        organizationId: tournament.organizationId,
        role: { in: ['admin', 'owner'] }
      },
      select: { role: true }
    });

    const isOrganizer = !!ownedOrg || !!memberRole;

    if (!isOrganizer) {
      return NextResponse.json({ error: 'Only organizers can respond to appeals' }, { status: 403 });
    }

    // Update the appeal
    const appeal = await prisma.ruleAppeal.update({
      where: { id: appealId },
      data: {
        status,
        responseText: responseText.trim(),
        respondedBy: auth.playerId,
        respondedAt: new Date()
      },
      include: {
        user: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                username: true
              }
            }
          }
        },
        organization: {
          select: {
            name: true
          }
        }
      }
    });

    // If appeal is approved, try to mark targeted rule as Must in tournament rules
    if (appeal.status === 'approved' && (appeal.ruleLabel || appeal.ruleCategory)) {
      const targetText = appeal.ruleLabel ? appeal.ruleLabel.trim() : appeal.ruleCategory?.trim();
      if (targetText) {
        const event = await prisma.clubEvent.findUnique({
          where: { id: tournamentId },
          select: { rules: true }
        });

        if (event) {
          const updatedRules = event.rules || '';
          const lines = updatedRules
            .split('\n')
            .map((ln: string) => ln.trim())
            .filter((ln: string) => ln.length > 0);

          let changed = false;
          const normalizedTarget = targetText.toLowerCase();

          const rewritten = lines.map((ln: string) => {
            if (ln.toLowerCase().includes(normalizedTarget)) {
              changed = true;
              return ln.replace(/\s*\(.*\)$/,'') + ' (approved appeal - MUST)';
            }
            return ln;
          });

          if (!changed) {
            rewritten.push(`* ${targetText} (approved appeal - MUST)`);
          }

          await prisma.clubEvent.update({
            where: { id: tournamentId },
            data: { rules: rewritten.join('\n') }
          });
        }
      }
    }

    return NextResponse.json(appeal);
  } catch (error) {
    console.error('Error responding to appeal:', error);
    return NextResponse.json({ error: 'Failed to respond to appeal' }, { status: 500 });
  }
}