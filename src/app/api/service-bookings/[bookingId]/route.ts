// This directory is deprecated. Use /api/service-requests instead.
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use /api/service-requests instead.' },
    { status: 410 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use /api/service-requests instead.' },
    { status: 410 }
  );
}



