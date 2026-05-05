import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; certId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, certId } = await params;

    if (!userId || !certId) {
      return NextResponse.json({ error: 'User ID and Certificate ID are required' }, { status: 400 });
    }

    // Verify the certificate belongs to this user
    const certification = await prisma.certification.findFirst({
      where: {
        id: certId,
        staffId: userId,
      },
    });

    if (!certification) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    // Delete the certification
    await prisma.certification.delete({
      where: { id: certId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/user/certificates/[userId]/[certId] error:', error);
    return NextResponse.json({ error: 'Failed to delete certificate' }, { status: 500 });
  }
}