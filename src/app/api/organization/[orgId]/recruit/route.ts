import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';
import { notify } from '@/app/api/notification/producer';

export async function POST(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { orgId } = await params;
    const body = await request.json();
    const { userId, role, expertise, coachingLevel, yearsOfExperience, contact } = body;

    if (!userId || !role) {
      return new Response(JSON.stringify({ error: 'User ID and role are required' }), { status: 400 });
    }

    // Verify the user is a spectator and not already staff
    const spectator = await prisma.spectator.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            staff: true,
          },
        },
      },
    });

    if (!spectator) {
      return new Response(JSON.stringify({ error: 'User is not a registered spectator' }), { status: 404 });
    }

    if (spectator.user.staff) {
      return new Response(JSON.stringify({ error: 'User is already staff' }), { status: 400 });
    }

    // Get organization details for email
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, email: true },
    });

    if (!organization) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), { status: 404 });
    }

    // Create staff record
    const newStaff = await prisma.staff.create({
      data: {
        userId,
        role: role.charAt(0).toUpperCase() + role.slice(1), // Capitalize first letter
        expertise: expertise || null,
        coachingLevel: coachingLevel || null,
        yearsOfExperience: yearsOfExperience || 0,
        contact: contact || null,
        organizationId: orgId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Send recruitment notification via Kafka
    try {
      await notify({
        to: spectator.user.email,
        channel: 'email',
        template: 'recruit',
        data: {
          name: spectator.user.firstName,
          organizationName: organization.name,
          role: role.charAt(0).toUpperCase() + role.slice(1),
          expertise: expertise || null,
          coachingLevel: coachingLevel || null,
        },
      });
    } catch (notificationError) {
      console.error('Failed to send recruitment notification:', notificationError);
      // Don't fail the recruitment if notification fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        staff: {
          id: newStaff.userId,
          name: `${newStaff.user.firstName} ${newStaff.user.lastName}`,
          email: newStaff.user.email,
          role: newStaff.role.toLowerCase(),
          expertise: newStaff.expertise,
          coachingLevel: newStaff.coachingLevel,
          experience: newStaff.yearsOfExperience,
          status: 'Active',
        },
        message: 'Staff member recruited successfully',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error recruiting staff:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}