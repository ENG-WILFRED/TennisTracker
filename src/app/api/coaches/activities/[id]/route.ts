import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch a single activity by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      );
    }

    const activity = await prisma.activity.findUnique({
      where: { id },
    });

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}

// PUT/PATCH: Update an activity
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      );
    }

    // Check if activity exists
    const existingActivity = await prisma.activity.findUnique({
      where: { id },
    });

    if (!existingActivity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    // Verify coach owns this activity
    if (body.coachId && body.coachId !== existingActivity.coachId) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not own this activity' },
        { status: 403 }
      );
    }

    // Update activity
    const updatedActivity = await prisma.activity.update({
      where: { id },
      data: {
        title: body.title ?? existingActivity.title,
        description: body.description ?? existingActivity.description,
        type: body.type ?? existingActivity.type,
        date: body.date ?? existingActivity.date,
        startTime: body.startTime ?? existingActivity.startTime,
        endTime: body.endTime ?? existingActivity.endTime,
        completed: body.completed ?? existingActivity.completed,
        metadata: body.metadata ?? existingActivity.metadata,
      },
    });

    console.log('Activity updated:', updatedActivity);

    return NextResponse.json({
      success: true,
      activity: updatedActivity,
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json(
      { error: 'Failed to update activity' },
      { status: 500 }
    );
  }
}

// DELETE: Remove an activity
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = req.nextUrl.searchParams;
    const coachId = searchParams.get('coachId');

    if (!id) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      );
    }

    // Check if activity exists
    const existingActivity = await prisma.activity.findUnique({
      where: { id },
    });

    if (!existingActivity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    // Verify coach owns this activity
    if (coachId && coachId !== existingActivity.coachId) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not own this activity' },
        { status: 403 }
      );
    }

    // Delete activity
    const deletedActivity = await prisma.activity.delete({
      where: { id },
    });

    console.log('Activity deleted:', id);

    return NextResponse.json({
      success: true,
      message: 'Activity deleted successfully',
      activity: deletedActivity,
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    );
  }
}
