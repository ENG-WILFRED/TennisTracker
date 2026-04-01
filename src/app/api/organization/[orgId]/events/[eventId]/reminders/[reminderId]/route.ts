import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; eventId: string; reminderId: string }> }
) {
  try {
    const { orgId, eventId, reminderId } = await params;
    const body = await request.json();
    const { isActive } = body;

    // Verify reminder exists and belongs to the organization
    const reminder = await prisma.eventReminder.findFirst({
      where: {
        id: reminderId,
        eventId,
        event: {
          organizationId: orgId,
        },
      },
    });

    if (!reminder) {
      return new Response(JSON.stringify({ error: 'Reminder not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const updated = await prisma.eventReminder.update({
      where: { id: reminderId },
      data: {
        isActive: typeof isActive === 'boolean' ? isActive : reminder.isActive,
      },
    });

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating reminder:', error);
    return new Response(JSON.stringify({ error: 'Failed to update reminder' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ orgId: string; eventId: string; reminderId: string }> }
) {
  try {
    const { orgId, eventId, reminderId } = await params;

    // Verify reminder exists and belongs to the organization
    const reminder = await prisma.eventReminder.findFirst({
      where: {
        id: reminderId,
        eventId,
        event: {
          organizationId: orgId,
        },
      },
    });

    if (!reminder) {
      return new Response(JSON.stringify({ error: 'Reminder not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await prisma.eventReminder.delete({
      where: { id: reminderId },
    });

    return new Response(JSON.stringify({ message: 'Reminder deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete reminder' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
