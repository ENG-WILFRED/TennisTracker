import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';


export async function GET(request: NextRequest) {
  const auth = await verifyApiAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const provider = await prisma.providerProfile.findUnique({
      where: { userId: auth.playerId },
      include: {
        user: { include: { user: true } },
        organization: true,
        services: true,
      },
    });

    return NextResponse.json({ provider });
  } catch (error) {
    console.error('Error fetching provider profile:', error);
    return NextResponse.json({ error: 'Failed to fetch provider profile' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyApiAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { businessName, categories, phone, description, organizationId } = body;

    if (!businessName || !phone || !description) {
      return NextResponse.json({ error: 'businessName, phone, and description are required' }, { status: 400 });
    }

    const existing = await prisma.providerProfile.findUnique({ where: { userId: auth.playerId } });
    if (existing) {
      return NextResponse.json({ error: 'Provider profile already exists' }, { status: 409 });
    }

    const profile = await prisma.providerProfile.create({
      data: {
        userId: auth.playerId,
        businessName,
        categories: Array.isArray(categories) ? categories : [],
        phone,
        description,
        organizationId: organizationId || null,
      },
    });

    return NextResponse.json({ provider: profile }, { status: 201 });
  } catch (error) {
    console.error('Error creating provider profile:', error);
    return NextResponse.json({ error: 'Failed to create provider profile' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await verifyApiAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const profile = await prisma.providerProfile.findUnique({ where: { userId: auth.playerId } });
    if (!profile) {
      return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 });
    }

    const updates: any = {};
    ['businessName', 'categories', 'phone', 'description', 'isActive', 'organizationId'].forEach((key) => {
      if (body[key] !== undefined) updates[key] = body[key];
    });

    const updated = await prisma.providerProfile.update({
      where: { id: profile.id },
      data: updates,
    });

    return NextResponse.json({ provider: updated });
  } catch (error) {
    console.error('Error updating provider profile:', error);
    return NextResponse.json({ error: 'Failed to update provider profile' }, { status: 500 });
  }
}