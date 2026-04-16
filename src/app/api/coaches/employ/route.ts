import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function POST(request: Request) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const body = await request.json() as { coachId: string };
    const { coachId } = body;
    if (!coachId) return new Response(JSON.stringify({ error: 'coachId required' }), { status: 400 });

    // actor must be a club
    const actor = await prisma.player.findUnique({ where: { userId: auth.playerId } });
    if (!actor || !actor.isClub) {
      return new Response(JSON.stringify({ error: 'Only club accounts can employ coaches' }), { status: 403 });
    }

    const updated = await prisma.staff.update({
      where: { userId: coachId },
      data: { employedBy: { connect: { userId: auth.playerId } } },
    });

    return NextResponse.json({ success: true, staff: updated });
  } catch (err) {
    console.error('API /api/coaches/employ error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}