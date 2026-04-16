import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, title, message, fromId } = body as any;

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
