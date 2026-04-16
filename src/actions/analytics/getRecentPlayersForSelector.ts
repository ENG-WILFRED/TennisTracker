"use server";
import prisma from '@/lib/prisma';
export async function getRecentPlayersForSelector() {
  const players = await prisma.player.findMany({
    select: { userId: true, user: { select: { firstName: true, lastName: true } } },
    orderBy: { user: { firstName: 'asc' } },
  });
  // transform to expected shape
  return players.map((p: any) => ({ id: p.userId, firstName: p.user.firstName, lastName: p.user.lastName }));
}
