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
    const radiusKm = url.searchParams.get('radius') || '10';
    const userId = url.searchParams.get('userId');
    const excludeUserId = url.searchParams.get('excludeUserId') || userId;
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
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

    const baseWhere: any = {
      isClub: false,
      user: {
        id: {
          not: excludeUserId || '',
        },
      },
    };

    const searchClauses: any[] = [];

    if (query) {
      const numericQuery = Number(query);
      const queryConditions: any[] = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { username: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
        { nationality: { contains: query, mode: 'insensitive' } },
      ];

      if (!Number.isNaN(numericQuery)) {
        queryConditions.push({ matchesWon: numericQuery });
        queryConditions.push({ matchesPlayed: numericQuery });
      }

      searchClauses.push({
        user: {
          OR: queryConditions,
        },
      });
    }

    if (location) {
      searchClauses.push({
        user: {
          OR: [
            { city: { contains: location, mode: 'insensitive' } },
            { username: { contains: location, mode: 'insensitive' } },
            { firstName: { contains: location, mode: 'insensitive' } },
            { lastName: { contains: location, mode: 'insensitive' } },
            { nationality: { contains: location, mode: 'insensitive' } },
          ],
        },
      });
    }

    if (searchClauses.length > 0) {
      baseWhere.AND = searchClauses;
    }

    const maxRadius = Math.min(Math.max(radius, 1), 1000);
    const distanceRadius = nearest && hasCoords ? 1000 : maxRadius;

    const playerWhere = { ...baseWhere };

    if (hasCoords && !nearest) {
      const latDelta = distanceRadius / 111;
      const lonDelta = distanceRadius / (111 * Math.cos((lat * Math.PI) / 180));
      playerWhere.user.latitude = {
        gte: lat - latDelta,
        lte: lat + latDelta,
      };
      playerWhere.user.longitude = {
        gte: lon - lonDelta,
        lte: lon + lonDelta,
      };
    }

    const potentialPlayers = await prisma.player.findMany({
      where: playerWhere,
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
      take: limit * 3,
    });

    const nearbyPlayers = potentialPlayers
      .map((p) => {
        const distance = hasCoords && p.user.latitude !== null && p.user.longitude !== null
          ? calculateDistance(lat, lon, p.user.latitude, p.user.longitude)
          : 0;

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
      .filter((p) => {
        if (!hasCoords || nearest) return true;
        return p.distance <= maxRadius;
      })
      .sort((a, b) => a.distance - b.distance)
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
