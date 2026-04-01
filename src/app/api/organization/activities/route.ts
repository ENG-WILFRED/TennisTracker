import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

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

    // Get user's organization
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

    // Get organization activities if organization exists
    let activities: any[] = [];
    if (user.player?.organizationId) {
      const orgActivities = await prisma.organizationActivity.findMany({
        where: {
          organizationId: user.player.organizationId,
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

      activities = orgActivities.map((activity) => ({
        id: activity.id,
        type: activity.action,
        description: (activity.details as any)?.description || activity.action?.replace(/_/g, ' ') || 'Activity',
        createdAt: activity.createdAt,
        metadata: activity.metadata,
      }));
    }

    return NextResponse.json({ activities });
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

    // Get user's organization and player
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        player: true,
      },
    });

    if (!user || !user.player || !user.player.organizationId) {
      return NextResponse.json({ error: 'User or organization not found' }, { status: 404 });
    }

    // Create activity record
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

    return NextResponse.json(activity);
  } catch (error) {
    console.error('POST /api/organization/activities error:', error);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}
