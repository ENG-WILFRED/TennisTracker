import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// PATCH /api/tournaments/[tournamentId]/appeals/[appealId] - Respond to an appeal
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string; appealId: string }> }
) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tournamentId, appealId } = await params;
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

    const userPlayer = await prisma.player.findUnique({
      where: { userId: auth.playerId },
      select: { organizationId: true }
    });

    const isOrganizer = userPlayer?.organizationId === tournament.organizationId;

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

    return NextResponse.json(appeal);
  } catch (error) {
    console.error('Error responding to appeal:', error);
    return NextResponse.json({ error: 'Failed to respond to appeal' }, { status: 500 });
  }
}