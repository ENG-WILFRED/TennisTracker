import { NextResponse } from 'next/server';
import { registerPlayer } from '@/actions/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // simply forward to server action
    await registerPlayer(body);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}
