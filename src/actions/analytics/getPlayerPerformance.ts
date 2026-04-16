"use server";
import prisma from '@/lib/prisma';
export async function getPlayerPerformance(playerId: string) {
  const rows = await prisma.performancePoint.findMany({ where: { playerId }, orderBy: { date: 'asc' } });
  return rows.map((r: any) => ({ date: r.date.toISOString().slice(0, 10), rating: r.rating, points: r.points }));
}
