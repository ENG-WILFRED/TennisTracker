import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    const staff = await prisma.staff.findMany({ where: { organizationId: orgId } });
    return new Response(JSON.stringify(staff), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error listing staff:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { orgId } = await params;
    const body = await request.json();
    const { name, email, phone, role, photo } = body;

    if (!name || !role) return new Response(JSON.stringify({ error: 'name and role required' }), { status: 400 });

    const staff = await prisma.staff.create({
      data: {
        name,
        email,
        phone,
        role,
        photo,
        organizationId: orgId,
      },
    });

    return new Response(JSON.stringify(staff), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error creating staff:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
