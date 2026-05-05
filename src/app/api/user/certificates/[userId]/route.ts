import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get certifications for this staff member
    const certifications = await prisma.certification.findMany({
      where: { staffId: userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(certifications);
  } catch (error) {
    console.error('GET /api/user/certificates/[userId] error:', error);
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    const body = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { name, issuer, issuedAt, expiresAt } = body;

    if (!name) {
      return NextResponse.json({ error: 'Certificate name is required' }, { status: 400 });
    }

    // Verify the user is a staff member
    const staff = await prisma.staff.findUnique({
      where: { userId },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Create the certification
    const certification = await prisma.certification.create({
      data: {
        staffId: userId,
        name,
        issuer: issuer || null,
        issuedAt: issuedAt ? new Date(issuedAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json(certification, { status: 201 });
  } catch (error) {
    console.error('POST /api/user/certificates/[userId] error:', error);
    return NextResponse.json({ error: 'Failed to create certificate' }, { status: 500 });
  }
}