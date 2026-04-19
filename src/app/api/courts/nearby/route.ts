import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const latitude = url.searchParams.get('latitude');
    const longitude = url.searchParams.get('longitude');
    const radiusKm = url.searchParams.get('radius') || '10';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    const query = url.searchParams.get('query')?.trim();
    const location = url.searchParams.get('location')?.trim();
    const nearest = url.searchParams.get('nearest') === 'true';

    const lat = latitude ? parseFloat(latitude) : NaN;
    const lon = longitude ? parseFloat(longitude) : NaN;
    const radius = parseFloat(radiusKm);
    const hasCoords = !isNaN(lat) && !isNaN(lon);

    if (!hasCoords && !location && !query) {
      return NextResponse.json({ error: 'Please provide coordinates, location or query' }, { status: 400 });
    }

    const where: any = {
      status: 'available',
    };

    const searchClauses: any[] = [];

    if (query) {
      searchClauses.push({
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
          { surface: { contains: query, mode: 'insensitive' } },
          { indoorOutdoor: { contains: query, mode: 'insensitive' } },
          { organization: { is: { name: { contains: query, mode: 'insensitive' } } } },
        ],
      });
    }

    if (location) {
      searchClauses.push({
        OR: [
          { city: { contains: location, mode: 'insensitive' } },
          { address: { contains: location, mode: 'insensitive' } },
          { name: { contains: location, mode: 'insensitive' } },
          { organization: { is: { name: { contains: location, mode: 'insensitive' } } } },
        ],
      });
    }

    if (searchClauses.length > 0) {
      where.AND = searchClauses;
    }

    const searchRadius = Math.min(Math.max(radius, 1), 1000);
    if (hasCoords && !nearest) {
      const latDelta = searchRadius / 111;
      const lonDelta = searchRadius / (111 * Math.cos((lat * Math.PI) / 180));
      where.latitude = {
        gte: lat - latDelta,
        lte: lat + latDelta,
      };
      where.longitude = {
        gte: lon - lonDelta,
        lte: lon + lonDelta,
      };
    }

    const potentialCourts = await prisma.court.findMany({
      where,
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        latitude: true,
        longitude: true,
        surface: true,
        lights: true,
        indoorOutdoor: true,
        imageUrl: true,
        organization: {
          select: {
            name: true,
            logo: true,
          },
        },
      },
      take: limit * 3,
    });

    const nearbyCourts = potentialCourts
      .map((court) => {
        const distance = hasCoords && court.latitude !== null && court.longitude !== null
          ? calculateDistance(lat, lon, court.latitude, court.longitude)
          : 0;

        return {
          id: court.id,
          name: court.name,
          address: court.address,
          city: court.city,
          surface: court.surface,
          lights: court.lights,
          indoorOutdoor: court.indoorOutdoor,
          image: court.imageUrl || 'https://images.unsplash.com/photo-1554224311-beee415c15f7?w=400&q=80',
          organization: court.organization.name,
          organizationLogo: court.organization.logo,
          distance: parseFloat(distance.toFixed(2)),
        };
      })
      .filter((court) => {
        if (!hasCoords || nearest) return true;
        return court.distance <= searchRadius;
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return NextResponse.json(nearbyCourts, {
      headers: {
        'Cache-Control': 'public, max-age=15, s-maxage=15, stale-while-revalidate=60',
      },
    });
  } catch (err) {
    console.error('API /api/courts/nearby error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch nearby courts' },
      { status: 500 }
    );
  }
}
