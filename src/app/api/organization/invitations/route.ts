import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orgId, emails, role, invitedBy } = body;

    if (!orgId || !emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'orgId and emails array are required' },
        { status: 400 }
      );
    }

    if (!role) {
      return NextResponse.json(
        { error: 'role is required' },
        { status: 400 }
      );
    }

    // Verify org exists
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Create invitations for each email
    const invitations = await Promise.all(
      emails.map((email) =>
        prisma.membershipInvitation.upsert({
          where: {
            orgId_email_role: {
              orgId,
              email,
              role,
            },
          },
          update: {
            status: 'pending',
            invitedAt: new Date(),
            invitedBy: invitedBy || null,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
          create: {
            orgId,
            email,
            role,
            invitedBy: invitedBy || null,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        })
      )
    );

    return NextResponse.json(
      {
        success: true,
        invitations: invitations.map((inv: { id: any; email: any; role: any; status: any; expiresAt: any; }) => ({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          status: inv.status,
          expiresAt: inv.expiresAt,
        })),
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (err) {
    console.error('API /api/organization/invitations error:', err);
    return NextResponse.json(
      { error: 'Failed to create membership invitations' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const orgId = url.searchParams.get('orgId');
    const email = url.searchParams.get('email');

    if (!orgId && !email) {
      return NextResponse.json(
        { error: 'orgId or email is required' },
        { status: 400 }
      );
    }

    const emailValue = email ?? '';
    const whereClause = orgId
      ? { orgId, status: 'pending', expiresAt: { gt: new Date() } }
      : { email: emailValue, status: 'pending', expiresAt: { gt: new Date() } };

    const invitations = await prisma.membershipInvitation.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        orgId: true,
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        invitedAt: true,
        expiresAt: true,
      },
      orderBy: { invitedAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(invitations, {
      headers: {
        'Cache-Control': 'public, max-age=5, s-maxage=5, stale-while-revalidate=15',
      },
    });
  } catch (err) {
    console.error('API /api/organization/invitations GET error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}
