import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function PATCH(request: NextRequest, context: any) {
  const registrationId = context?.params?.registrationId || null;

  if (!registrationId) {
    return NextResponse.json(
      { error: 'Registration ID missing from route' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const updatedRegistration = await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: { status: newStatus },
      include: {
        event: true,
        member: true,
      },
    });

    return NextResponse.json(updatedRegistration);
  } catch (error) {
    console.error('Error updating registration:', error);
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update registration' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
