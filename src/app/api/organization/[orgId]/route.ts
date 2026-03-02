import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  try {
    const { orgId } = await params;

    let org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        members: {
          select: {
            id: true,
            playerId: true,
            role: true,
            joinDate: true,
            paymentStatus: true,
            attendanceCount: true,
            player: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true,
                photo: true,
              },
            },
          },
          take: 10,
        },
        courts: {
          select: {
            id: true,
            name: true,
            courtNumber: true,
            surface: true,
            indoorOutdoor: true,
            lights: true,
            status: true,
          },
        },
        events: {
          select: {
            id: true,
            name: true,
            eventType: true,
            startDate: true,
            registrationCap: true,
            entryFee: true,
          },
          take: 5,
          orderBy: [{ startDate: 'asc' }],
        },
        rankings: {
          select: {
            id: true,
            currentRank: true,
            ratingPoints: true,
            member: {
              select: {
                player: {
                  select: {
                    username: true,
                    firstName: true,
                    lastName: true,
                    photo: true,
                  },
                },
              },
            },
          },
          take: 5,
          orderBy: [{ currentRank: 'asc' }],
        },
        announcements: {
          select: {
            id: true,
            title: true,
            message: true,
            announcementType: true,
            isActive: true,
            createdAt: true,
          },
          take: 5,
          orderBy: [{ createdAt: 'desc' }],
        },
        finances: {
          select: {
            id: true,
            month: true,
            year: true,
            membershipRevenue: true,
            courtBookingRevenue: true,
            totalRevenue: true,
            netProfit: true,
          },
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 12,
        },
        ratings: {
          select: {
            id: true,
            rating: true,
            category: true,
            comment: true,
            createdAt: true,
          },
          take: 10,
          orderBy: [{ createdAt: 'desc' }],
        },
      },
    });

    // If not found by id, try to resolve by slug (support both id and slug URLs)
    if (!org) {
      org = await prisma.organization.findUnique({
        where: { slug: orgId },
        include: {
          members: {
            select: {
              id: true,
              playerId: true,
              role: true,
              joinDate: true,
              paymentStatus: true,
              attendanceCount: true,
              player: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  photo: true,
                },
              },
            },
            take: 10,
          },
          courts: {
            select: {
              id: true,
              name: true,
              courtNumber: true,
              surface: true,
              indoorOutdoor: true,
              lights: true,
              status: true,
            },
          },
          events: {
            select: {
              id: true,
              name: true,
              eventType: true,
              startDate: true,
              registrationCap: true,
              entryFee: true,
            },
            take: 5,
            orderBy: [{ startDate: 'asc' }],
          },
          rankings: {
            select: {
              id: true,
              currentRank: true,
              ratingPoints: true,
              member: {
                select: {
                  player: {
                    select: {
                      username: true,
                      firstName: true,
                      lastName: true,
                      photo: true,
                    },
                  },
                },
              },
            },
            take: 5,
            orderBy: [{ currentRank: 'asc' }],
          },
          announcements: {
            select: {
              id: true,
              title: true,
              message: true,
              announcementType: true,
              isActive: true,
              createdAt: true,
            },
            take: 5,
            orderBy: [{ createdAt: 'desc' }],
          },
          finances: {
            select: {
              id: true,
              month: true,
              year: true,
              membershipRevenue: true,
              courtBookingRevenue: true,
              totalRevenue: true,
              netProfit: true,
            },
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
            take: 12,
          },
          ratings: {
            select: {
              id: true,
              rating: true,
              category: true,
              comment: true,
              createdAt: true,
            },
            take: 10,
            orderBy: [{ createdAt: 'desc' }],
          },
        },
      });
    }

    if (!org) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), { status: 404 });
    }

    // Add counts (use resolved org.id)
    const resolvedId = org.id;
    const [memberCount, courtCount, eventCount] = await Promise.all([
      prisma.clubMember.count({ where: { organizationId: resolvedId } }),
      prisma.court.count({ where: { organizationId: resolvedId } }),
      prisma.clubEvent.count({ where: { organizationId: resolvedId } }),
    ]);

    return new Response(
      JSON.stringify({
        ...org,
        _count: {
          members: memberCount,
          courts: courtCount,
          events: eventCount,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching organization:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
