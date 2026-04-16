"use server";
import prisma from '@/lib/prisma';
export async function getInventory() {
  return await prisma.inventoryItem.findMany({ orderBy: { name: 'asc' } });
}
