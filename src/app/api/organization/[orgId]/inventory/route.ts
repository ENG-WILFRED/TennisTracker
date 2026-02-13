import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    const items = await prisma.inventoryItem.findMany({ where: { organizationId: orgId } });
    return new Response(JSON.stringify(items), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error listing inventory:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { orgId } = await params;
    const body = await request.json();
    const { name, count, condition } = body;

    if (!name) return new Response(JSON.stringify({ error: 'name required' }), { status: 400 });

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        count: count || 0,
        condition,
        organizationId: orgId,
      },
    });

    return new Response(JSON.stringify(item), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
