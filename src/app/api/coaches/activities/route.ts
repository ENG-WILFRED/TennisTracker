import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      coachId,
      type,
      date,
      startTime,
      endTime,
      title,
      description,
      sessionType,
      court,
      courtId,
      playerName,
      maxParticipants,
      price,
      tournamentName,
      location,
      locationId,
      level,
      itemName,
      quantity,
      supplier,
      cost,
      playerEmail,
      reachoutReason,
      emailSubject,
      priority,
    } = body;

    if (!coachId || !type || !title || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create activity in database
    const activity = await prisma.activity.create({
      data: {
        coachId,
        type,
        date,
        startTime,
        endTime,
        title,
        description,
        metadata: {
          sessionType,
          court,
          courtId,
          playerName,
          maxParticipants,
          price,
          tournamentName,
          location,
          locationId,
          level,
          itemName,
          quantity,
          supplier,
          cost,
          playerEmail,
          reachoutReason,
          emailSubject,
          priority,
        },
      },
    });

    console.log('Activity saved:', activity);

    return NextResponse.json({
      success: true,
      activity,
    });
  } catch (error) {
    console.error('Error saving activity:', error);
    return NextResponse.json(
      { error: 'Failed to save activity' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const coachId = searchParams.get('coachId');
    const date = searchParams.get('date');

    if (!coachId) {
      return NextResponse.json(
        { error: 'coachId is required' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = { coachId };
    if (date) {
      where.date = date;
    }

    // Fetch activities
    const activities = await prisma.activity.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
