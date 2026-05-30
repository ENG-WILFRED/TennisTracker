import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ playerId: string; requestId: string }> }
) {
  const user = await verifyApiAuth(req);
  const { playerId, requestId } = await params;

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the user is the player or admin
  if (user.id !== playerId && user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const request = await prisma.coachRequest.findUnique({
      where: { id: requestId },
      include: {
        history: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!request || request.playerId !== playerId) {
      return NextResponse.json(
        { error: 'Coach request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      requestId: request.id,
      coachId: request.coachId,
      status: request.status,
      requestedAt: request.requestedAt,
      respondedAt: request.respondedAt,
      initialMessage: request.message,
      history: request.history.map((h) => ({
        id: h.id,
        action: h.action,
        actionBy: h.actionBy,
        message: h.message,
        metadata: h.metadata,
        createdAt: h.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching coach request history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
