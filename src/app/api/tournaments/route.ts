import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cacheResponse } from '@/lib/apiCache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');

    // Build filter conditions
    const filters: any = {};

    if (organizationId) {
      filters.organizationId = organizationId;
    }

    // Filter by tournament status based on dates
    const now = new Date();

    const tournaments = await cacheResponse(`tournaments:${organizationId || 'all'}:${status || 'all'}`, async () => {
      return prisma.clubEvent.findMany({
        where: filters,
        include: {
        registrations: {
          select: {
            id: true,
          },
        },
        bracket: true,
        matches: {
          select: {
            id: true,
            status: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        amenities: {
          include: {
            bookings: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });
  }, 30_000);

    // Format tournaments with computed status
    const formattedTournaments = tournaments
      .filter((t) => t.eventType === 'tournament')
      .map((tournament) => {
        let tournamentStatus = 'upcoming';

        if (tournament.endDate && tournament.endDate < now) {
          tournamentStatus = 'completed';
        } else if (tournament.startDate <= now && (!tournament.endDate || tournament.endDate >= now)) {
          tournamentStatus = 'ongoing';
        }

        return {
          id: tournament.id,
          name: tournament.name,
          description: tournament.description,
          status: tournamentStatus,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          registrationDeadline: tournament.registrationDeadline,
          location: tournament.location,
          prizePool: tournament.prizePool || 0,
          entryFee: tournament.entryFee || 0,
          participantsCount: tournament.registrations.length,
          maxParticipants: tournament.registrationCap,
          format: tournament.bracket?.bracketType || 'single_elimination',
          matchesTotal: tournament.matches.length,
          matchesCompleted: tournament.matches.filter((m) => m.status === 'completed').length,
          organization: tournament.organization,
          rules: tournament.rules,
          instructions: tournament.instructions,
          eatingAreas: tournament.eatingAreas,
          sleepingAreas: tournament.sleepingAreas,
          courtInfo: tournament.courtInfo,
          amenities: tournament.amenities.map(amenity => ({
            id: amenity.id,
            name: amenity.name,
            type: amenity.type,
            description: amenity.description,
            capacity: amenity.capacity,
            price: amenity.price,
            availableFrom: amenity.availableFrom,
            availableUntil: amenity.availableUntil,
            bookingsCount: amenity.bookings.length,
          })),
        };
      });

    return NextResponse.json(formattedTournaments);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json({ error: 'Failed to fetch tournaments' }, { status: 500 });
  }
}
