import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    // Build where clause based on status filter
    const whereClause = status ? { status: status as any } : {};

    // Use a single query with aggregations for better performance
    const orgs = await prisma.organization.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        players: {
          include: { user: true },
          take: 10,
        },
        staff: {
          include: { user: true },
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
        _count: {
          select: {
            players: true,
            staff: true,
            inventory: true,
            events: true,
          },
        },
      },
    });

    // Transform the data to match the expected format
    const enrichedOrgs = orgs.map((org) => ({
      ...org,
      _count: {
        members: (org._count.players || 0) + (org._count.staff || 0),
        courts: org._count.inventory || 0, // Assuming inventory represents courts
        events: org._count.events || 0,
      },
    }));

    return new Response(JSON.stringify(enrichedOrgs), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=5, s-maxage=5, stale-while-revalidate=10',
      },
    });
  } catch (error) {
    console.error('Error listing organizations:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { name, description, city, country, phone, email, primaryColor, logo } = body as any;

    // handle logo data URI upload
    let logoUrl: string | null = null;
    if (logo && typeof logo === 'string' && logo.startsWith('data:')) {
      try {
        const { uploadToR2 } = await import('@/lib/media');
        const extMatch = logo.match(/^data:image\/(\w+);base64,/);
        const ext = extMatch ? extMatch[1] : 'png';
        const key = `logos/${Date.now()}.${ext}`;
        const base64 = logo.split(',')[1];
        const buffer = Buffer.from(base64, 'base64');
        logoUrl = await uploadToR2(key, buffer, `image/${ext}`);
      } catch (e) {
        console.error('logo upload failed', e);
        logoUrl = null;
      }
    } else {
      logoUrl = logo || null;
    }

    if (!name) {
      return new Response(JSON.stringify({ error: 'Name is required' }), { status: 400 });
    }

    // Create organization with pending status
    const org = await prisma.organization.create({
      data: {
        name,
        description,
        city,
        country,
        phone,
        email,
        primaryColor,
        logo: logoUrl,
        createdBy: auth.userId,
        status: 'pending', // Organization starts in pending status for developer approval
      },
    });

    // Link the creator to the organization as a player member
    await prisma.player.updateMany({
      where: { userId: auth.userId },
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
