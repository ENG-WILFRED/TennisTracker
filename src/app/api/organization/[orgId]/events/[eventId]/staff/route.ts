import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';
import { broadcastToClients } from '@/lib/websocket-broadcast';

// GET - Get event staff/clients
export async function GET(request: Request, { params }: { params: Promise<{ orgId: string; eventId: string }> }) {
  try {
    const { orgId, eventId } = await params;

    const event = await prisma.clubEvent.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        organizationId: true,
        services: {
          include: {
            provider: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    if (!event || event.organizationId !== orgId) {
      return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(event), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Error fetching event staff:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500 });
  }
}

// POST - Assign staff/client to event
export async function POST(request: Request, { params }: { params: Promise<{ orgId: string; eventId: string }> }) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { orgId, eventId } = await params;
    const body = await request.json();
    const { staffId, role, responsibility } = body;

    // Verify event exists
    const event = await prisma.clubEvent.findUnique({
      where: { id: eventId },
      select: { organizationId: true }
    });

    if (!event || event.organizationId !== orgId) {
      return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 });
    }

    // Verify authorization
    const isOwner = await prisma.organization.findFirst({
      where: { id: orgId, createdBy: auth.playerId }
    });

    const isAdmin = await prisma.clubMember.findFirst({
      where: { organizationId: orgId, playerId: auth.playerId, role: 'admin' }
    });

    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: 'You do not have permission to assign staff' }), { status: 403 });
    }

    // Find or create Staff record for this user (required for EventTask foreign key)
    let staff = await prisma.staff.findFirst({
      where: {
        userId: staffId,
        organizationId: orgId,
      }
    });

    if (!staff) {
      // Create Staff record if it doesn't exist
      const user = await prisma.user.findUnique({
        where: { id: staffId },
        select: { firstName: true, lastName: true }
      });

      if (!user) {
        return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
      }

      staff = await prisma.staff.create({
        data: {
          userId: staffId,
          organizationId: orgId,
          role: role || 'Staff',
          contact: '',
          expertise: responsibility || null,
          yearsOfExperience: 0,
          isActive: true,
        }
      });
    }

    // Find or create ProviderProfile for the staff member
    let provider = await prisma.providerProfile.findUnique({
      where: { userId: staffId }
    });

    if (!provider) {
      // Get user info to populate provider profile
      const user = await prisma.user.findUnique({
        where: { id: staffId },
        select: { firstName: true, lastName: true, email: true, phone: true }
      });

      if (!user) {
        return new Response(JSON.stringify({ error: 'Staff member not found' }), { status: 404 });
      }

      // Create ProviderProfile for this staff member
      provider = await prisma.providerProfile.create({
        data: {
          userId: staffId,
          businessName: `${user.firstName} ${user.lastName}`,
          phone: user.phone || '',
          description: '',
          organizationId: orgId
        }
      });
    }

    // Create service assignment (using Service model for staff assignments)
    const service = await prisma.service.create({
      data: {
        tournamentId: eventId,
        providerId: provider.id,
        name: role || 'Event Staff',
        category: role || 'staff',
        description: responsibility || '',
        sourceType: 'internal',
        organizationId: orgId
      },
      include: {
        provider: {
          include: {
            user: true
          }
        }
      }
    });

    // 🔔 Broadcast staff assignment to all connected users in real-time
    if (service.provider) {
      broadcastToClients({
        type: 'staff-assigned',
        data: {
          eventId,
          organizationId: orgId,
          staffId,
          staffName: service.provider.businessName,
          role: role || 'Event Staff',
          responsibility: responsibility || '',
          timestamp: new Date().toISOString(),
        }
      });
    }

    return new Response(JSON.stringify(service), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Error assigning staff:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500 });
  }
}

// DELETE - Remove staff/client assignment
export async function DELETE(request: Request, { params }: { params: Promise<{ orgId: string; eventId: string }> }) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { orgId, eventId } = await params;
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');

    if (!serviceId) {
      return new Response(JSON.stringify({ error: 'Service ID is required' }), { status: 400 });
    }

    // Verify authorization
    const isOwner = await prisma.organization.findFirst({
      where: { id: orgId, createdBy: auth.playerId }
    });

    const isAdmin = await prisma.clubMember.findFirst({
      where: { organizationId: orgId, playerId: auth.playerId, role: 'admin' }
    });

    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: 'You do not have permission to remove staff' }), { status: 403 });
    }

    await prisma.service.delete({ where: { id: serviceId } });

    return new Response(JSON.stringify({ success: true, message: 'Staff assignment removed' }), { status: 200 });
  } catch (error: any) {
    console.error('Error removing staff:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500 });
  }
}
