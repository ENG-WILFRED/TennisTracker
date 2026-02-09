"use server";
import { PrismaClient } from "../../generated/prisma";
const prisma = new PrismaClient();
export async function getInventory() {
  return await prisma.inventoryItem.findMany({ orderBy: { name: 'asc' } });
}
