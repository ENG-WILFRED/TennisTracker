import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    const url = new URL(request.url);
    const roleFilter = url.searchParams.get('role'); // Optional: 'coach', 'referee', 'admin'

    // Get staff from Staff table
    let staffWhere: any = {
      organizationId: orgId,
      isDeleted: false,
    };
    
    if (roleFilter) {
      staffWhere.role = roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1);
    }

    const staff = await prisma.staff.findMany({
      where: staffWhere,
      select: {
        userId: true,
        role: true,
        expertise: true,
        coachingLevel: true,
        yearsOfExperience: true,
        isActive: true,
        studentCount: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            photo: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get club members with staff roles
    let clubMemberWhere: any = {
      organizationId: orgId,
    };

    if (roleFilter) {
      clubMemberWhere.role = roleFilter.toLowerCase();
    } else {
      clubMemberWhere.role = { in: ['coach', 'referee', 'admin'] };
    }

    const clubMembers = await prisma.clubMember.findMany({
      where: clubMemberWhere,
      select: {
        playerId: true,
        role: true,
        player: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                photo: true,
              }
            }
          }
        }
      },
    });

    // Format and combine results, avoiding duplicates
    const staffIds = new Set(staff.map(s => s.userId));
    const formattedStaff = staff.map(s => ({
      id: s.userId,
      name: `${s.user.firstName} ${s.user.lastName}`,
      email: s.user.email,
      photo: s.user.photo,
      role: s.role.toLowerCase(),
      expertise: s.expertise,
      coachingLevel: s.coachingLevel,
      experience: s.yearsOfExperience || 0,
      status: s.isActive ? 'Active' : 'Inactive',
      sessions: s.studentCount || 0,
      source: 'staff',
    }));

    // Add club members who aren't already in staff list
    const formattedClubMembers = clubMembers
      .filter(cm => !staffIds.has(cm.playerId))
      .map(cm => ({
        id: cm.playerId,
        name: `${cm.player.user.firstName} ${cm.player.user.lastName}`,
        email: cm.player.user.email,
        photo: cm.player.user.photo,
        role: cm.role,
        expertise: null,
        coachingLevel: null,
        experience: 0,
        status: 'Active',
        sessions: 0,
        source: 'member',
      }));

    const allStaff = [...formattedStaff, ...formattedClubMembers];

    return new Response(JSON.stringify(allStaff), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=5, s-maxage=5, stale-while-revalidate=10',
      },
    });
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
    const { userId, role, contact, expertise } = body as any;

    if (!userId || !role) return new Response(JSON.stringify({ error: 'userId and role required' }), { status: 400 });

    const staff = await prisma.staff.create({
      data: {
        userId,
        role,
        contact: contact || null,
        expertise: expertise || null,
        organizationId: orgId,
      },
    });

    return new Response(JSON.stringify(staff), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error creating staff:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
