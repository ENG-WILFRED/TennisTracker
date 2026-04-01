import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest,{ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const tournamentId = resolvedParams.id;
    if (!tournamentId) {
      return NextResponse.json({ error: 'Tournament id missing from route' }, { status: 400 });
    }
  try {
    const tournament = await prisma.clubEvent.findUnique({
      where: { id: tournamentId },
      include: {
        registrations: {
          include: {
            member: {
              include: {
                player: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
        organization: true,
        bracket: true,
        amenities: true,
        matches: true,
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    return NextResponse.json(tournament);
  } catch (error) {
    console.error('Error fetching tournament by id:', error);
    return NextResponse.json({ error: 'Failed to fetch tournament' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PATCH(request: NextRequest,{ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const tournamentId = resolvedParams.id;
    if (!tournamentId) {
      return NextResponse.json({ error: 'Tournament id missing from route' }, { status: 400 });
    }
  try {
    const body = await request.json();
    const updatedFields: any = {};

    const allowed = [
      'name',
      'description',
      'startDate',
      'endDate',
      'registrationDeadline',
      'location',
      'prizePool',
      'entryFee',
      'registrationCap',
      'rules',
      'instructions',
      'eatingAreas',
      'sleepingAreas',
      'courtInfo',
      'status',
    ];

    for (const key of allowed) {
      if (body[key] !== undefined) {
        updatedFields[key] = body[key];
      }
    }

    if (Object.keys(updatedFields).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
    }

    if (updatedFields.startDate) {
      updatedFields.startDate = new Date(updatedFields.startDate);
    }
    if (updatedFields.endDate) {
      updatedFields.endDate = new Date(updatedFields.endDate);
    }
    if (updatedFields.registrationDeadline) {
      updatedFields.registrationDeadline = new Date(updatedFields.registrationDeadline);
    }

    const updatedTournament = await prisma.clubEvent.update({
      where: { id: tournamentId },
      data: updatedFields,
    });

    return NextResponse.json(updatedTournament);
  } catch (error) {
    console.error('Error updating tournament:', error);
    return NextResponse.json({ error: 'Failed to update tournament' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
