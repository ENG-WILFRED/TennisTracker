"use server";

import { PrismaClient } from "../../src/generated/prisma";

const prisma = new PrismaClient();

export async function getClubAttendance(days: number = 90) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await prisma.attendance.findMany({
    where: { date: { gte: since } },
    select: { date: true },
  });

  const map = new Map<string, number>();
  rows.forEach((r) => {
    const d = r.date.toISOString().slice(0, 10);
    map.set(d, (map.get(d) || 0) + 1);
  });

  const out = Array.from(map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return out;
}

export async function getPlayerPerformance(playerId: string) {
  const rows = await prisma.performancePoint.findMany({
    where: { playerId },
    orderBy: { date: 'asc' },
  });

  return rows.map((r) => ({ date: r.date.toISOString().slice(0, 10), rating: r.rating, points: r.points }));
}

export async function getRecentPlayersForSelector() {
  return await prisma.player.findMany({
    select: { id: true, firstName: true, lastName: true },
    orderBy: { firstName: 'asc' },
  });
}
