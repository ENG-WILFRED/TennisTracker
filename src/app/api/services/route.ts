import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// GET /api/services - Get services based on context
export async function GET(request: NextRequest) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contextType = searchParams.get('contextType'); // 'tournament', 'court_booking', 'spectator'
    const contextId = searchParams.get('contextId');
    const category = searchParams.get('category');
    const providerId = searchParams.get('providerId');
    const organizationId = searchParams.get('organizationId');

    if (!contextType) {
      return NextResponse.json({ error: 'contextType is required' }, { status: 400 });
    }

    // Validate user has access to this context
    // For now, just check if user is logged in. Could add more granular checks later.
    const hasAccess = true; // Authenticated users can access services

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to this context' }, { status: 403 });
    }

    // Build where clause for services
    const whereClause: any = {
      isActive: true,
      OR: [
        { contextType: contextType },
        { contextType: 'both' }
      ]
    };

    if (contextType === 'tournament' && contextId) {
      whereClause.OR.push({ contextId: contextId });
    }

    if (providerId) {
      whereClause.providerId = providerId;
    }

    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    if (category) {
      whereClause.category = category;
    }

    const services = await prisma.service.findMany({
      where: whereClause,
      include: {
        provider: true,
        organization: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

// POST /api/services - Create a new service
export async function POST(request: NextRequest) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      name,
      description,
      category,
      price,
      location,
      contextType,
      sourceType,
      externalLink,
      organizationId,
      tournamentId
    } = await request.json();

    if (!name?.trim() || !description?.trim() || !category || !contextType || !sourceType) {
      return NextResponse.json({ error: 'Name, description, category, contextType, and sourceType are required' }, { status: 400 });
    }

    if (sourceType === 'external' && !externalLink?.trim()) {
      return NextResponse.json({ error: 'External link is required for external services' }, { status: 400 });
    }

    // Check if user is a provider or organization admin
    let providerId: string | null = null;
    let orgId: string | null = null;

    if (organizationId) {
      // Check if user is organization admin/staff
      const player = await prisma.player.findUnique({
        where: { userId: auth.playerId },
        select: { organizationId: true }
      });

      if (player?.organizationId === organizationId) {
        orgId = organizationId;
      } else {
        return NextResponse.json({ error: 'Not authorized to create services for this organization' }, { status: 403 });
      }
    } else {
      // Check if user has provider profile
      const provider = await prisma.providerProfile.findUnique({
        where: { userId: auth.playerId },
        select: { id: true, isActive: true }
      });

      if (!provider?.isActive) {
        return NextResponse.json({ error: 'Active provider profile required' }, { status: 403 });
      }

      providerId = provider.id;
    }

    const service = await prisma.service.create({
      data: {
        providerId: providerId,
        organizationId: orgId,
        tournamentId: tournamentId || null,
        name: name.trim(),
        description: description.trim(),
        category,
        price: price ? parseFloat(price) : null,
        location: location?.trim(),
        contextType,
        sourceType,
        externalLink: externalLink?.trim()
      },
      include: {
        provider: true
      }
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}