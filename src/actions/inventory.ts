"use server";

import { PrismaClient } from "../../src/generated/prisma";

const prisma = new PrismaClient();

export async function getInventory() {
  return await prisma.inventoryItem.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function createOrUpdateItem(actorId: string | null, data: { id?: string; name: string; count: number; condition?: string }) {
  if (!actorId) throw new Error('Unauthorized');
  const actor = await prisma.player.findUnique({ where: { id: actorId } });
  if (!actor || !actor.isClub) throw new Error('Only club accounts can modify inventory');

  if (data.id) {
    return await prisma.inventoryItem.update({ where: { id: data.id }, data: { name: data.name, count: data.count, condition: data.condition } });
  }
  return await prisma.inventoryItem.create({ data: { name: data.name, count: data.count, condition: data.condition || null, club: { connect: { id: actorId } } } });
}

export async function borrowItem(playerId: string | null, itemId: string, qty: number = 1) {
  if (!playerId) throw new Error('Login required to request items.');
  const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error('Item not found');
  if (item.count < qty) throw new Error('Not enough items available');

  await prisma.inventoryItem.update({ where: { id: itemId }, data: { count: { decrement: qty } } });
  // Optionally record a request log table; omitted for brevity
  return { success: true };
}
