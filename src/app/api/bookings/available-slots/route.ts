import { NextRequest, NextResponse } from 'next/server';
import { getAvailableTimeSlots } from '@/actions/bookings';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courtId = searchParams.get('court');
    const date = searchParams.get('date');
    const orgId = searchParams.get('org');

    if (!courtId || !date || !orgId) {
      return NextResponse.json(
        { error: 'Missing required parameters: court, date, org' },
        { status: 400 }
      );
    }

    const slots = await getAvailableTimeSlots(courtId, date, orgId);
    return NextResponse.json(slots);
  } catch (error: any) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch available slots' },
      { status: 500 }
    );
  }
}
