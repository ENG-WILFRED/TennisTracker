"use server";
import { PrismaClient } from "../../generated/prisma";
const prisma = new PrismaClient();
export async function updateStaff(actorId: string | null, id: string, data: { name?: string; role?: string; expertise?: string; contact?: string; photo?: string }) {
  if (!actorId) throw new Error('Unauthorized');
  const actor = await prisma.player.findUnique({ where: { id: actorId } });
  if (!actor || !actor.isClub) throw new Error('Only club accounts can update staff');
  return await prisma.staff.update({
    where: { id }, data: {
      name: data.name,
      role: data.role,
      expertise: data.expertise === undefined ? undefined : data.expertise,
      contact: data.contact === undefined ? undefined : data.contact,
      photo: data.photo === undefined ? undefined : data.photo,
    }
  });
}
