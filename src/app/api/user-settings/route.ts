import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, settingType, data } = body;

    if (!userId || !settingType || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, settingType, and data' },
        { status: 400 }
      );
    }

    // For now, we'll store settings in the user's bio field as a JSON string
    // In production, you'd want a separate UserSettings table
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse existing settings if they exist
    let settings = {};
    if (user.bio) {
      try {
        const parsed = JSON.parse(user.bio);
        if (typeof parsed === 'object' && parsed !== null) {
          settings = parsed;
        }
      } catch (e) {
        // bio might not be valid JSON, start fresh
      }
    }

    // Update specific setting type
    settings = {
      ...settings,
      [settingType]: data,
      updatedAt: new Date().toISOString(),
    };

    // Store back to user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        bio: JSON.stringify(settings),
      },
    });

    return NextResponse.json(
      {
        success: true,
        settingType,
        data,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('POST /api/user-settings error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const settingType = url.searchParams.get('settingType');

    if (false) { // TODO: Implement auth check
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let settings: Record<string, any> = {};
    if (user.bio) {
      try {
        const parsed = JSON.parse(user.bio);
        if (typeof parsed === 'object' && parsed !== null) {
          settings = parsed;
        }
      } catch (e) {
        // bio might not be valid JSON
      }
    }

    if (settingType) {
      return NextResponse.json(
        {
          settingType,
          data: settings[settingType] || null,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        settings,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('GET /api/user-settings error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
