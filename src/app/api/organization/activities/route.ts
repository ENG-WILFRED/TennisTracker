import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';
import { cacheResponse, clearCachePrefix } from '@/lib/apiCache';

export async function GET(request: NextRequest) {
  try {
    if (!verifyApiAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        player: {
          select: { organizationId: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const organizationId = user.player?.organizationId;
    if (!organizationId) {
      return NextResponse.json({ activities: [] });
    }

    const cacheKey = `organization:activities:${organizationId}`;
    const response = await cacheResponse(cacheKey, async () => {
      const orgActivities = await prisma.organizationActivity.findMany({
        where: {
          organizationId,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          player: {
            select: {
              user: {
                select: { firstName: true, lastName: true, id: true },
              },
            },
          },
        },
      });

      return {
        activities: orgActivities.map((activity: typeof orgActivities[number]) => ({
          id: activity.id,
          type: activity.action,
          description:
            (activity.details as any)?.description || activity.action?.replace(/_/g, ' ') || 'Activity',
          createdAt: activity.createdAt,
          metadata: activity.metadata,
        })),
      };
    }, 30_000);

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/organization/activities error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyApiAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, type, description, metadata } = await request.json();

    if (!userId || !type) {
      return NextResponse.json({ error: 'User ID and type are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        player: true,
      },
    });

    if (!user || !user.player || !user.player.organizationId) {
      return NextResponse.json({ error: 'User or organization not found' }, { status: 404 });
    }

    const activity = await prisma.organizationActivity.create({
      data: {
        organizationId: user.player.organizationId,
        playerId: user.id,
        action: type,
        details: {
          description: description || type.replace(/_/g, ' '),
        },
        metadata: metadata || {},
      },
    });

    await clearCachePrefix(`organization:activities:${user.player.organizationId}`);

    return NextResponse.json(activity);
  } catch (error) {
    console.error('POST /api/organization/activities error:', error);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}
