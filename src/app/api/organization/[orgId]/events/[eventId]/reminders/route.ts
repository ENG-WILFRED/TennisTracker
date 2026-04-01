import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string; eventId: string }> }
) {
  try {
    const { orgId, eventId } = await params;

    const reminders = await prisma.eventReminder.findMany({
      where: {
        eventId,
        event: {
          organizationId: orgId,
        },
      },
      orderBy: {
        remindTime: 'asc'
      }
    });

    return new Response(JSON.stringify(reminders), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch reminders' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string; eventId: string }> }
) {
  try {
    const { orgId, eventId } = await params;
    const { title, description, remindTime, reminderType } = await request.json();

    if (!title || !remindTime) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify event exists and belongs to the organization
    const event = await prisma.clubEvent.findFirst({
      where: {
        id: eventId,
        organizationId: orgId,
      }
    });

    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse the datetime-local string properly
    // Format from HTML datetime-local input: "2026-03-29T10:30"
    let parsedDate: Date;
    try {
      if (!remindTime || typeof remindTime !== 'string' || remindTime.trim() === '') {
        return new Response(JSON.stringify({ error: 'Invalid or missing remind time' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Parse datetime-local format (YYYY-MM-DDTHH:mm)
      // Convert to ISO format by treating as UTC
      parsedDate = new Date(remindTime + ':00Z');
      
      if (isNaN(parsedDate.getTime())) {
        // Try alternative parsing
        parsedDate = new Date(remindTime);
        if (isNaN(parsedDate.getTime())) {
          throw new Error('Cannot parse date');
        }
      }
    } catch (err) {
      console.error('Date parsing error:', err, 'remindTime:', remindTime);
      return new Response(JSON.stringify({ error: 'Invalid remind time format. Please use the date/time picker.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const reminder = await prisma.eventReminder.create({
      data: {
        eventId,
        title,
        description: description || null,
        remindTime: parsedDate,
        reminderType: reminderType || 'email',
        isActive: true,
      },
    });

    return new Response(JSON.stringify(reminder), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating reminder:', error);
    return new Response(JSON.stringify({ error: 'Failed to create reminder' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
