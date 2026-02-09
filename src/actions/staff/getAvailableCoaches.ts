"use server";
import { PrismaClient } from "../../generated/prisma";
const prisma = new PrismaClient();
export async function getAvailableCoaches() {
  return await prisma.staff.findMany({ where: { role: { contains: 'Coach' }, employedById: null }, orderBy: { name: 'asc' } });
}
