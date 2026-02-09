"use server";
import { PrismaClient } from "../../generated/prisma";
const prisma = new PrismaClient();
export async function borrowItem(playerId: string | null, itemId: string, qty: number = 1) {
  if (!playerId) throw new Error('Login required to request items.');
  const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error('Item not found');
  if (item.count < qty) throw new Error('Not enough items available');
  await prisma.inventoryItem.update({ where: { id: itemId }, data: { count: { decrement: qty } } });
  return { success: true };
}
