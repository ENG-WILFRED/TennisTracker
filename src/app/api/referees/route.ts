import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const referees = await prisma.referee.findMany({
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
      take: 50,
    });

    return Response.json(referees);
  } catch (error) {
    console.error('Error fetching referees:', error);
    return Response.json(
      { error: 'Failed to fetch referees' },
      { status: 500 }
    );
  }
}
