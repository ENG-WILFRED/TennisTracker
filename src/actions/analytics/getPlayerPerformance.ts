"use server";
import { PrismaClient } from "../../generated/prisma";
const prisma = new PrismaClient();
export async function getPlayerPerformance(playerId: string) {
  const rows = await prisma.performancePoint.findMany({ where: { playerId }, orderBy: { date: 'asc' } });
  return rows.map((r) => ({ date: r.date.toISOString().slice(0, 10), rating: r.rating, points: r.points }));
}
