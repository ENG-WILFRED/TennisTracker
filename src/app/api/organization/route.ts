import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET() {
  try {
    const orgs = await prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return new Response(JSON.stringify(orgs), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error listing organizations:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { name, description, city, country, phone, email, primaryColor, logo } = body;

    if (!name) {
      return new Response(JSON.stringify({ error: 'Name is required' }), { status: 400 });
    }

    const org = await prisma.organization.create({
      data: {
        name,
        description,
        city,
        country,
        phone,
        email,
        primaryColor,
        logo,
        createdBy: auth.playerId,
      },
    });

    return new Response(JSON.stringify(org), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
