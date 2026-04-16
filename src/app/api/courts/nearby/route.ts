import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Haversine formula to calculate distance between two coordinates in kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
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
    const radiusKm = url.searchParams.get('radius') || '10'; // Default 10km for courts
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '15'), 50); // Max 50

    // Validate coordinates
    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'latitude and longitude are required' }, { status: 400 });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radius = parseFloat(radiusKm);

    if (isNaN(lat) || isNaN(lon) || isNaN(radius)) {
      return NextResponse.json({ error: 'Invalid coordinate values' }, { status: 400 });
    }

    // Bounding box for initial filtering (optimization)
    const latDelta = radius / 111;
    const lonDelta = radius / (111 * Math.cos((lat * Math.PI) / 180));

    // Get all courts with location data within bounding box
    const potentialCourts = await prisma.court.findMany({
      where: {
        latitude: {
          gte: lat - latDelta,
          lte: lat + latDelta,
        },
        longitude: {
          gte: lon - lonDelta,
          lte: lon + lonDelta,
        },
        status: 'available',
      },
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
      take: limit * 2,
    });

    // Calculate actual distances and filter
    const nearbyCourts = potentialCourts
      .filter((c: typeof potentialCourts[number]) => {
        if (!c.latitude || !c.longitude) return false;
        const distance = calculateDistance(
          lat,
          lon,
          c.latitude,
          c.longitude
        );
        return distance <= radius;
      })
      .map((c: typeof potentialCourts[number]) => {
        const distance = calculateDistance(
          lat,
          lon,
          c.latitude!,
          c.longitude!
        );
        return {
          id: c.id,
          name: c.name,
          address: c.address,
          city: c.city,
          surface: c.surface,
          lights: c.lights,
          indoorOutdoor: c.indoorOutdoor,
          image: c.imageUrl || 'https://images.unsplash.com/photo-1554224311-beee415c15f7?w=400&q=80',
          organization: c.organization.name,
          organizationLogo: c.organization.logo,
          distance: parseFloat(distance.toFixed(2)),
        };
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
