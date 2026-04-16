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
    const radiusKm = url.searchParams.get('radius') || '5'; // Default 5km
    const userId = url.searchParams.get('userId');
    const excludeUserId = url.searchParams.get('excludeUserId') || userId;
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100); // Max 100

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

    // Bounding box for initial filtering (optimization to reduce DB queries)
    // Approximate: 1 degree of latitude ≈ 111km, 1 degree of longitude varies by latitude
    const latDelta = radius / 111;
    const lonDelta = radius / (111 * Math.cos((lat * Math.PI) / 180));

    // Get all players with location data within bounding box
    const potentialPlayers = await prisma.player.findMany({
      where: {
        isClub: false,
        user: {
          latitude: {
            gte: lat - latDelta,
            lte: lat + latDelta,
          },
          longitude: {
            gte: lon - lonDelta,
            lte: lon + lonDelta,
          },
          id: {
            not: excludeUserId || '',
          },
        },
      },
      select: {
        userId: true,
        matchesWon: true,
        matchesPlayed: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            photo: true,
            city: true,
            latitude: true,
            longitude: true,
            nationality: true,
          },
        },
      },
      take: limit * 2, // Get more to account for filtering
    });

    // Calculate actual distances and filter
    const nearbyPlayers = potentialPlayers
      .filter((p: typeof potentialPlayers[number]) => {
        if (!p.user.latitude || !p.user.longitude) return false;
        const distance = calculateDistance(
          lat,
          lon,
          p.user.latitude,
          p.user.longitude
        );
        return distance <= radius;
      })
      .map((p: typeof potentialPlayers[number]) => {
        const distance = calculateDistance(
          lat,
          lon,
          p.user.latitude!,
          p.user.longitude!
        );
        return {
          id: p.userId,
          name: `${p.user.firstName} ${p.user.lastName}`,
          username: p.user.username,
          city: p.user.city,
          nationality: p.user.nationality,
          photo: p.user.photo || 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&q=80',
          wins: p.matchesWon,
          matchesPlayed: p.matchesPlayed,
          level: p.matchesWon > 20 ? 'Advanced' : p.matchesWon > 10 ? 'Intermediate' : 'Beginner',
          distance: parseFloat(distance.toFixed(2)),
        };
      })
      .sort((a: { distance: number }, b: { distance: number }) => a.distance - b.distance)
      .slice(0, limit);

    return NextResponse.json(nearbyPlayers, {
      headers: {
        'Cache-Control': 'public, max-age=10, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (err) {
    console.error('API /api/players/nearby error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch nearby players' },
      { status: 500 }
    );
  }
}
