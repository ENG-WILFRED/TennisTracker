import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/players/sessions?playerId=<playerId>&status=<status>
 * Get all scheduled sessions for a player
 * Sessions can come from:
 * - Direct CoachSession assignments (playerId match)
 * - SessionBooking entries (player booked for a session)
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const playerId = url.searchParams.get('playerId');
    const status = url.searchParams.get('status'); // Optional: 'scheduled', 'confirmed', 'completed', etc.

    if (!playerId) {
      return NextResponse.json({ error: 'playerId required' }, { status: 400 });
    }

    // Build where clause
    const whereClause: any = {
      OR: [
        // Direct session assignments
        { playerId },
        // Sessions booked through SessionBooking
        { bookings: { some: { playerId } } },
      ],
    };

    if (status) {
      whereClause.status = status;
    }

    // Get all sessions for the player
    const sessions = await prisma.coachSession.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        sessionType: true,
        status: true,
        maxParticipants: true,
        price: true,
        coachId: true,
        playerId: true,
        organizationId: true,
        courtId: true,
        coach: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                photo: true,
              },
            },
          },
        },
        court: {
          select: {
            id: true,
            name: true,
            courtNumber: true,
            surface: true,
          },
        },
        bookings: {
          where: { playerId },
          select: {
            id: true,
            status: true,
            attendanceStatus: true,
            feedbackRating: true,
            feedbackText: true,
            completedAt: true,
          },
          take: 1,
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Transform the sessions to a more user-friendly format
    const transformedSessions = sessions.map(session => ({
      id: session.id,
      title: session.title,
      description: session.description,
      startTime: session.startTime,
      endTime: session.endTime,
      sessionType: session.sessionType,
      status: session.status,
      coach: {
        id: session.coachId,
        name: `${session.coach.user.firstName} ${session.coach.user.lastName}`,
        photo: session.coach.user.photo,
      },
      court: session.court ? {
        id: session.court.id,
        name: session.court.name,
        courtNumber: session.court.courtNumber,
        surface: session.court.surface,
      } : null,
      organization: session.organization ? {
        id: session.organization.id,
        name: session.organization.name,
      } : null,
      price: session.price,
      maxParticipants: session.maxParticipants,
      isDirectAssignment: session.playerId === playerId,
      booking: session.bookings.length > 0 ? session.bookings[0] : null,
    }));

    // Group by status for better UX
    const groupedByStatus = transformedSessions.reduce((acc, session) => {
      if (!acc[session.status]) {
        acc[session.status] = [];
      }
      acc[session.status].push(session);
      return acc;
    }, {} as Record<string, typeof transformedSessions>);

    return NextResponse.json({
      sessions: transformedSessions,
      groupedByStatus,
      total: transformedSessions.length,
    });
  } catch (error) {
    console.error('Error fetching player sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
