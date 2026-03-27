import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// GET /api/tournaments/[tournamentId]/appeals - Get appeals for a tournament
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tournamentId } = await params;
    const { status } = Object.fromEntries(request.nextUrl.searchParams);

    // Check if user is organizer or player
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

    let whereClause: any = { eventId: tournamentId };

    if (status) {
      whereClause.status = status;
    }

    // If not organizer, only show user's own appeals
    if (!isOrganizer) {
      whereClause.userId = auth.playerId;
    }

    const appeals = await prisma.ruleAppeal.findMany({
      where: whereClause,
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
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(appeals);
  } catch (error) {
    console.error('Error fetching appeals:', error);
    return NextResponse.json({ error: 'Failed to fetch appeals' }, { status: 500 });
  }
}

// POST /api/tournaments/[tournamentId]/appeals - Create a new appeal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tournamentId } = await params;
    const { ruleCategory, ruleLabel, appealText } = await request.json();

    if (!appealText?.trim()) {
      return NextResponse.json({ error: 'Appeal text is required' }, { status: 400 });
    }

    // Verify tournament exists and user is registered
    const tournament = await prisma.clubEvent.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        organizationId: true,
        registrations: {
          where: { member: { player: { userId: auth.playerId } } },
          select: { id: true }
        }
      }
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    if (tournament.registrations.length === 0) {
      return NextResponse.json({ error: 'You must be registered for this tournament to appeal rules' }, { status: 403 });
    }

    // Check if user already has a pending appeal for this rule
    const existingAppeal = await prisma.ruleAppeal.findFirst({
      where: {
        userId: auth.playerId,
        eventId: tournamentId,
        ruleCategory: ruleCategory || null,
        ruleLabel: ruleLabel || null,
        status: 'pending'
      }
    });

    if (existingAppeal) {
      return NextResponse.json({ error: 'You already have a pending appeal for this rule' }, { status: 409 });
    }

    const appeal = await prisma.ruleAppeal.create({
      data: {
        userId: auth.playerId,
        eventId: tournamentId,
        organizationId: tournament.organizationId,
        ruleCategory,
        ruleLabel,
        appealText: appealText.trim()
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
        }
      }
    });

    return NextResponse.json(appeal, { status: 201 });
  } catch (error) {
    console.error('Error creating appeal:', error);
    return NextResponse.json({ error: 'Failed to create appeal' }, { status: 500 });
  }
}