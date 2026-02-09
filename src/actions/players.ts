"use server";
import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function getTopPlayers(limit: number = 4) {
  try {
    const players = await prisma.player.findMany({
      where: { isClub: false },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        photo: true,
        matchesWon: true,
        matchesPlayed: true,
      },
      orderBy: { matchesWon: 'desc' },
      take: limit,
    });

    return players.map((p) => ({
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      username: p.username,
      wins: p.matchesWon,
      matchesPlayed: p.matchesPlayed,
      level: p.matchesWon > 20 ? 'Advanced' : p.matchesWon > 10 ? 'Intermediate' : 'Beginner',
      img: p.photo || 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&q=80',
    }));
  } catch (error) {
    console.error('Error fetching top players:', error);
    return [];
  }
}

export async function getTotalPlayersCount() {
  try {
    const count = await prisma.player.count({ where: { isClub: false } });
    return count;
  } catch (error) {
    console.error('Error fetching players count:', error);
    return 0;
  }
}
