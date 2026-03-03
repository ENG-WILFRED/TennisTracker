"use server";
import { PrismaClient } from "../../generated/prisma";
const prisma = new PrismaClient();
export async function getAllStaff() {
  // staff has no name field; order by role or by user first name if necessary
  return await prisma.staff.findMany({ orderBy: { role: 'asc' } });
}
