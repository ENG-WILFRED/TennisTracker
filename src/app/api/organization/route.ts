import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET() {
  try {
    const orgs = await prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        players: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            photo: true,
          },
          take: 10,
        },
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true,
            phone: true,
            photo: true,
          },
          take: 10,
        },
        inventory: {
          select: {
            id: true,
            name: true,
            count: true,
            condition: true,
          },
          take: 10,
        },
      },
    });

    // Enrich with counts
    const enrichedOrgs = await Promise.all(
      orgs.map(async (org) => {
        const [members, courts, events] = await Promise.all([
          prisma.clubMember.count({ where: { organizationId: org.id } }),
          prisma.court.count({ where: { organizationId: org.id } }),
          prisma.clubEvent.count({ where: { organizationId: org.id } }),
        ]);

        return {
          ...org,
          _count: {
            members,
            courts,
            events,
          },
        };
      })
    );

    return new Response(JSON.stringify(enrichedOrgs), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error listing organizations:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { name, description, city, country, phone, email, primaryColor, logo } = body;

    if (!name) {
      return new Response(JSON.stringify({ error: 'Name is required' }), { status: 400 });
    }

    // Create organization
    const org = await prisma.organization.create({
      data: {
        name,
        description,
        city,
        country,
        phone,
        email,
        primaryColor,
        logo,
        createdBy: auth.playerId,
      },
    });

    // Link the creator to the organization as a player member
    await prisma.player.update({
      where: { id: auth.playerId },
      data: { organizationId: org.id },
    });

    return new Response(JSON.stringify(org), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
