import { PrismaClient } from '@/generated/prisma';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const referee = await prisma.referee.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        photo: true,
        nationality: true,
        bio: true,
        matchesRefereed: true,
        ballCrewMatches: true,
        experience: true,
        certifications: true,
      },
    });

    if (!referee) {
      return new Response(JSON.stringify({ error: 'Referee not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(referee), { status: 200 });
  } catch (error) {
    console.error('Error fetching referee by id:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch referee' }), { status: 500 });
  }
}
