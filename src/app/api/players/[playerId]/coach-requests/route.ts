import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const user = await verifyApiAuth(req);
  const { playerId } = await params;

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the user is the player or admin
  if (user.id !== playerId && user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const requests = await prisma.coachRequest.findMany({
      where: { playerId },
      include: {
        coach: {
          select: {
            userId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                photo: true,
                email: true,
                bio: true,
                phone: true,
              },
            },
            role: true,
            expertise: true,
            yearsOfExperience: true,
            certifications: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        history: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });

    const formatted = requests.map((r) => ({
      id: r.id,
      coachId: r.coach.userId,
      coachName: `${r.coach.user.firstName} ${r.coach.user.lastName}`.trim(),
      coachPhoto: r.coach.user.photo,
      coachEmail: r.coach.user.email,
      coachPhone: r.coach.user.phone,
      coachBio: r.coach.user.bio,
      coachRole: r.coach.role,
      coachExpertise: r.coach.expertise,
      yearsOfExperience: r.coach.yearsOfExperience,
      organization: r.coach.organization,
      status: r.status, // 'pending', 'accepted', 'declined'
      initialMessage: r.message,
      requestedAt: r.requestedAt,
      respondedAt: r.respondedAt,
      history: r.history.map((h) => ({
        id: h.id,
        action: h.action,
        actionBy: h.actionBy,
        message: h.message,
        createdAt: h.createdAt,
      })),
    }));

    // Group by status
    const pending = formatted.filter((r) => r.status === 'pending');
    const accepted = formatted.filter((r) => r.status === 'accepted');
    const declined = formatted.filter((r) => r.status === 'declined');

    return NextResponse.json({
      requests: formatted,
      stats: {
        total: formatted.length,
        pending: pending.length,
        accepted: accepted.length,
        declined: declined.length,
      },
      grouped: {
        pending,
        accepted,
        declined,
      },
    });
  } catch (error) {
    console.error('Error fetching coach requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coach requests' },
      { status: 500 }
    );
  }
}
