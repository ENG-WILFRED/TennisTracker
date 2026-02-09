import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, title, message, fromId } = body;

    // For now, persist a contact message record if you have a table, otherwise log
    console.log('Contact message:', { to, title, fromId });

    // Optionally store in DB: create a simple ContactMessage model later
    // Return success
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /api/contact error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
