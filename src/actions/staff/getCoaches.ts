"use server";
import { PrismaClient } from "../../generated/prisma";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function getCoaches() {
  return await prisma.staff.findMany({ where: { role: { contains: 'Coach' } }, orderBy: { name: 'asc' } });
}
