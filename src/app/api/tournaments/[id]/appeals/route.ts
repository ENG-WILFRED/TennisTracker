import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';


// GET /api/tournaments/[id]/appeals - Get appeals for a tournament
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: tournamentId } = await params;
    const { status } = Object.fromEntries(request.nextUrl.searchParams);
    // Check if user is organizer or player
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

    const whereClause: any = { eventId: tournamentId };

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
console.log(`Found ${appeals.length} appeals for tournamentId=${tournamentId} with status=${status}`);
    return NextResponse.json(appeals);
  } catch (error) {
    console.error('Error fetching appeals:', error);
    return NextResponse.json({ error: 'Failed to fetch appeals' }, { status: 500 });
  }
}

// POST /api/tournaments/[id]/appeals - Create a new appeal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: tournamentId } = await params;
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