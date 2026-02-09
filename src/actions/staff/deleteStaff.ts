"use server";
import { PrismaClient } from "../../generated/prisma";
const prisma = new PrismaClient();
export async function deleteStaff(actorId: string | null, id: string) {
  if (!actorId) throw new Error('Unauthorized');
  const actor = await prisma.player.findUnique({ where: { id: actorId } });
  if (!actor || !actor.isClub) throw new Error('Only club accounts can delete staff');
  return await prisma.staff.delete({ where: { id } });
}
