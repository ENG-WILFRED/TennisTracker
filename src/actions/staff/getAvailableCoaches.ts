"use server";
import { PrismaClient } from "../../generated/prisma";
const prisma = new PrismaClient();
export async function getAvailableCoaches() {
  const list = await prisma.staff.findMany({
    where: { role: { contains: 'Coach' }, employedById: null },
    orderBy: { role: 'asc' },
    include: { user: true },
  });

  // map to simpler shape used by UI
  return list.map((s) => ({
    id: s.userId,
    name: `${s.user.firstName} ${s.user.lastName}`,
    role: s.role,
    expertise: s.expertise,
    employedById: s.employedById,
    contact: s.contact,
  }));
}
