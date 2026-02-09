"use server";
import { PrismaClient } from "../../generated/prisma";
const prisma = new PrismaClient();
export async function createOrUpdateItem(actorId: string | null, data: { id?: string; name: string; count: number; condition?: string }) {
  if (!actorId) throw new Error('Unauthorized');
  const actor = await prisma.player.findUnique({ where: { id: actorId } });
  if (!actor || !actor.isClub) throw new Error('Only club accounts can modify inventory');
  if (data.id) {
    return await prisma.inventoryItem.update({ where: { id: data.id }, data: { name: data.name, count: data.count, condition: data.condition } });
  }
  return await prisma.inventoryItem.create({ data: { name: data.name, count: data.count, condition: data.condition || null, club: { connect: { id: actorId } } } });
}
