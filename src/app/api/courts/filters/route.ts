import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get unique cities and surfaces for court search dropdowns
    const cities = await prisma.court.findMany({
      select: {
        city: true,
      },
      where: {
        AND: [
          { city: { not: null } },
          { city: { not: '' } },
        ],
      },
      distinct: ['city'],
    });

    const surfaces = await prisma.court.findMany({
      select: {
        surface: true,
      },
      where: {
        AND: [
          { surface: { not: null } },
          { surface: { not: '' } },
        ],
      },
      distinct: ['surface'],
    });

    const uniqueCities = cities
      .map(c => c.city)
      .filter(Boolean)
      .sort();

    const uniqueSurfaces = surfaces
      .map(s => s.surface)
      .filter(Boolean)
      .sort();

    return NextResponse.json({
      cities: uniqueCities,
      surfaces: uniqueSurfaces,
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('Error fetching court filters:', error);
    return NextResponse.json({ error: 'Failed to fetch filters' }, { status: 500 });
  }
}