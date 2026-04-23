import prisma from '@/lib/prisma';
import type { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org');

    if (!orgId) {
      return new Response(
        JSON.stringify({ error: 'Organization ID required' }),
        { status: 400 }
      );
    }

    // Get membership details
    const membership = await prisma.membership.findFirst({
      where: {
        userId: memberId,
        orgId: orgId,
        status: 'accepted'
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        organization: {
          select: {
            name: true,
            email: true
          }
        }
      }
    }) as any;

    if (!membership) {
      return new Response(
        JSON.stringify({
          valid: false,
          message: 'Membership not found or inactive'
        }),
        { status: 404 }
      );
    }

    // Check if membership has expired (1 year from approval)
    const expiryDate = new Date(membership.approvedAt!);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const isExpired = new Date() > expiryDate;

    return new Response(
      JSON.stringify({
        valid: !isExpired,
        member: {
          name: `${membership.user.firstName} ${membership.user.lastName}`,
          email: membership.user.email,
          memberId: membership.userId,
          role: membership.role,
          status: membership.status,
          organization: membership.organization.name,
          accessLevel: 'Standard',
          joinedDate: membership.joinedAt.toISOString().split('T')[0],
          approvedDate: membership.approvedAt?.toISOString().split('T')[0],
          expiryDate: expiryDate.toISOString().split('T')[0],
          isExpired
        },
        verifiedAt: new Date().toISOString()
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({ error: 'Verification failed' }),
      { status: 500 }
    );
  }
}