import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const referees = await prisma.referee.findMany({
      include: { user: true },
      take: 50,
    });

    const data = referees.map(r => ({
      id: r.userId,
      firstName: r.user.firstName,
      lastName: r.user.lastName,
      photo: r.user.photo,
      nationality: r.user.nationality,
      matchesRefereed: r.matchesRefereed,
      ballCrewMatches: r.ballCrewMatches,
      experience: r.experience,
      certifications: r.certifications,
    }));

    return Response.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=5, s-maxage=5, stale-while-revalidate=10',
      },
    });
  } catch (error) {
    console.error('Error fetching referees:', error);
    return Response.json(
      { error: 'Failed to fetch referees' },
      { status: 500 }
    );
  }
}
