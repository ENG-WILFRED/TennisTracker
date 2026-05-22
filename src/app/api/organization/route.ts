import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';
import { Prisma } from '@prisma/client';

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

    // Notify developers that a new organization registration was submitted
    let notificationSent = true;
    try {
      const { notify } = await import('@/app/api/notification/producer');
      const notifyResult = await notify({
        to: process.env.ADMIN_EMAIL || 'admin@tennistracker.com',
        channel: 'email',
        template: 'orgRegistered',
        data: {
          organizationId: org.id,
          organizationName: org.name,
          creatorId: auth.userId,
          creatorEmail: email,
          createdAt: org.createdAt?.toISOString?.() || new Date().toISOString(),
          status: org.status,
        },
      });
      notificationSent = notifyResult.success;
      if (!notificationSent) {
        console.warn('Notification delivery failed for orgRegistered:', org.id);
      }
    } catch (notifyError) {
      notificationSent = false;
      console.warn('Failed to publish orgRegistered notification:', notifyError);
    }

    return new Response(JSON.stringify({ org, notificationSent }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const isPrismaKnownRequestError =
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as any).name === 'PrismaClientKnownRequestError';

    if (isPrismaKnownRequestError && (error as any).code === 'P2002') {
      const errorObj = error as Prisma.PrismaClientKnownRequestError;
      const target = Array.isArray(errorObj.meta?.target)
        ? errorObj.meta.target.join(', ')
        : errorObj.meta?.target;
      const message = target?.includes('name')
        ? 'Organization name already exists. Please choose a different name.'
        : target?.includes('slug')
        ? 'Organization slug already exists. Please choose a different identifier.'
        : target?.includes('email')
        ? 'Organization email already exists. Please choose a different email.'
        : 'Duplicate value error. Please check the input and try again.';
      return new Response(JSON.stringify({ error: message }), { status: 409 });
    }

    console.error('Error creating organization:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
