"use server";
import { PrismaClient } from "../../generated/prisma";
const prisma = new PrismaClient();
export async function getAllStaff() {
  return await prisma.staff.findMany({ orderBy: { name: 'asc' } });
}
