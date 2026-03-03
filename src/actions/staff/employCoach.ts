"use server";
import { PrismaClient } from "../../generated/prisma";
const prisma = new PrismaClient();
export async function employCoach(actorId: string | null, coachId: string) {
  if (!actorId) throw new Error('Unauthorized');
  const actor = await prisma.player.findUnique({ where: { userId: actorId } });
  if (!actor || !actor.isClub) throw new Error('Only club accounts can employ coaches');
  return await prisma.staff.update({ where: { userId: coachId }, data: { employedBy: { connect: { userId: actorId } } } });
}
