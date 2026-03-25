import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;

    console.log(`API GET /api/organization/${orgId}/members called`);

    const members = await prisma.clubMember.findMany({
      where: { organizationId: orgId },
      include: {
        player: {
          include: { user: true },
        },
        membershipTier: true,
      },
      orderBy: { joinDate: 'desc' },
    });

    console.log(`Organization members queried for orgId=${orgId}: ${members.length} members`);
    console.log('Member IDs:', members.map((m) => m.id));

    return new Response(JSON.stringify(members), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching organization members:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}