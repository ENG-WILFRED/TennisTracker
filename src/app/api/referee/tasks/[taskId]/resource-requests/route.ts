import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

/**
 * POST /api/referee/tasks/[taskId]/resource-requests
 * Create a new resource request
 * 
 * Body: {
 *   resourceType: string (e.g., "var_machine", "ball_crew", "net_repair", "lights"),
 *   quantity: number,
 *   description?: string
 * }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { taskId } = await params;

    const body = await request.json();
    const { resourceType, quantity, description } = body;

    if (!resourceType) {
      return new Response(
        JSON.stringify({ error: 'Resource type is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get task and verify it's assigned to referee
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        assignedToId: true,
        organization: { select: { id: true, name: true } }
      }
    });

    if (!task) {
      return new Response(
        JSON.stringify({ error: 'Task not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (task.assignedToId !== auth.userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create resource request
    const resourceRequest = await prisma.resourceRequest.create({
      data: {
        taskId: taskId,
        requestedByUserId: auth.userId,
        resourceType,
        quantity: quantity || 1,
        description,
      }
    });

    return new Response(JSON.stringify({
      success: true,
      resourceRequest,
      message: `Resource request for ${resourceType} created successfully`
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating resource request:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create resource request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /api/referee/tasks/[taskId]/resource-requests
 * Get all resource requests for a task
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { taskId } = await params;

    // Get task and verify access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { assignedToId: true }
    });

    if (!task) {
      return new Response(
        JSON.stringify({ error: 'Task not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (task.assignedToId !== auth.userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get resource requests
    const resourceRequests = await prisma.resourceRequest.findMany({
      where: { taskId: taskId },
      include: {
        requestedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        approvedBy: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { requestedAt: 'desc' }
    });

    const stats = {
      total: resourceRequests.length,
      pending: resourceRequests.filter((r: { status: string; }) => r.status === 'PENDING').length,
      approved: resourceRequests.filter((r: { status: string; }) => r.status === 'APPROVED').length,
      rejected: resourceRequests.filter((r: { status: string; }) => r.status === 'REJECTED').length,
      completed: resourceRequests.filter((r: { status: string; }) => r.status === 'COMPLETED').length,
    };

    return new Response(JSON.stringify({
      resourceRequests,
      stats
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching resource requests:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch resource requests' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
