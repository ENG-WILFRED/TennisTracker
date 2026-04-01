import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; courtId: string; complaintId: string }> }
) {
  try {
    if (!verifyApiAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId, courtId, complaintId } = await params;
    const body = await request.json();
    const { status, resolvedNotes } = body;

    const complaint = await prisma.courtComplaint.updateMany({
      where: {
        id: complaintId,
        courtId: courtId,
      },
      data: {
        status,
        resolvedNotes: status !== 'pending' ? resolvedNotes : undefined,
        resolvedAt: status !== 'pending' ? new Date() : undefined,
      },
    });

    if (complaint.count === 0) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    const updated = await prisma.courtComplaint.findUnique({ where: { id: complaintId } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH complaint error:', error);
    return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 });
  }
}
