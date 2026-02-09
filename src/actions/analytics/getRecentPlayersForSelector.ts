"use server";
import { PrismaClient } from "../../generated/prisma";
const prisma = new PrismaClient();
export async function getRecentPlayersForSelector() {
  return await prisma.player.findMany({ select: { id: true, firstName: true, lastName: true }, orderBy: { firstName: 'asc' } });
}
