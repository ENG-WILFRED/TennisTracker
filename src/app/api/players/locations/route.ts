import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get unique cities and nationalities for player search dropdowns
    const cities = await prisma.player.findMany({
      select: {
        user: {
          select: {
            city: true,
          },
        },
      },
      where: {
        user: {
          AND: [
            { city: { not: null } },
            { city: { not: '' } },
          ],
        },
      },
    });

    const nationalities = await prisma.user.findMany({
      select: {
        nationality: true,
      },
      where: {
        AND: [
          { nationality: { not: null } },
          { nationality: { not: '' } },
        ],
        player: {
          isNot: null,
        },
      },
      distinct: ['nationality'],
    });

    const uniqueCities = cities
      .map(c => c.user?.city)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
      .sort();

    const uniqueNationalities = nationalities
      .map(n => n.nationality)
      .filter(Boolean)
      .sort();

    return NextResponse.json({
      cities: uniqueCities,
      nationalities: uniqueNationalities,
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('Error fetching player locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}