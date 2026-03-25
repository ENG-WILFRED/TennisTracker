"use server";
import { PrismaClient } from "../../generated/prisma";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function getCoaches() {
  const coaches = await prisma.staff.findMany({
    where: { role: { contains: 'Coach' } },
    include: { user: true },
    orderBy: { user: { firstName: 'asc' } },
  });

  return coaches.map((c) => ({
    id: c.userId,
    name: `${c.user.firstName} ${c.user.lastName}`,
    firstName: c.user.firstName,
    lastName: c.user.lastName,
    role: c.role,
    expertise: c.expertise || 'General Coaching',
    photo: c.user.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    studentCount: c.studentCount || 0,
    contact: c.contact,
    email: c.user.email,
  }));
}
