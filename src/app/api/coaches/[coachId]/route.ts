import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ coachId: string }> }
) {
  try {
    const { coachId } = await params;

    const coach = await prisma.staff.findUnique({
      where: { userId: coachId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            photo: true,
          },
        },
        specializations: true,
        certifications: true,
        availability: true,
        stats: true,
      },
    });

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: coach.userId,
      firstName: coach.user.firstName,
      lastName: coach.user.lastName,
      email: coach.user.email,
      photo: coach.user.photo,
      role: coach.role || 'Coach',
      expertise: coach.expertise || 'General Coaching',
      bio: coach.bio || '',
      specializations: coach.specializations.map((s: typeof coach.specializations[number]) => s.name),
      certifications: coach.certifications.map((c: typeof coach.certifications[number]) => ({ name: c.name, issuer: c.issuer || '' })),
      availability: coach.availability.map((a: typeof coach.availability[number]) => ({ day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][a.dayOfWeek], time: `${a.startTime} - ${a.endTime}` })),
      rating: coach.stats?.avgRating || 4.8,
      totalSessions: coach.stats?.totalSessions || 0,
      completedSessions: coach.stats?.completedSessions || 0,
      studentCount: coach.studentCount || 0,
    });
  } catch (error) {
    console.error('Error fetching coach:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
