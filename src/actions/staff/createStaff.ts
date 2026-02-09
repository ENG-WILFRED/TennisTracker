"use server";
import { PrismaClient } from "../../generated/prisma";
const prisma = new PrismaClient();
export async function createStaff(actorId: string | null, data: { name: string; role: string; expertise?: string; contact?: string; photo?: string }) {
  if (!actorId) throw new Error('Unauthorized');
  const actor = await prisma.player.findUnique({ where: { id: actorId } });
  if (!actor || !actor.isClub) throw new Error('Only club accounts can create staff');
  return await prisma.staff.create({ data: { name: data.name, role: data.role, expertise: data.expertise || null, contact: data.contact || null, photo: data.photo || null, employedBy: { connect: { id: actorId } } } });
}
