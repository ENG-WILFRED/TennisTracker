"use server";
import prisma from '@/lib/prisma';

export async function getCoachDashboard(coachId: string) {
  try {
    // OPTIMIZED: Fetch minimal data first to unblock the UI
    // Get coach staff record with basic info only
    const coach = await prisma.staff.findUnique({
      where: { userId: coachId },
      select: {
        userId: true,
        role: true,
        specializationArea: true,
        certifications: true,
        bio: true,
        hourlyRate: true,
        employedById: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            photo: true,
            gender: true,
            dateOfBirth: true,
            nationality: true,
            bio: true,
          },
        },
      },
    });

    if (!coach) {
      throw new Error("Coach not found");
    }

    // Get club info if employed by someone
    let club = null;
    if (coach.employedById) {
      club = await prisma.player.findUnique({
        where: { userId: coach.employedById },
        select: {
          userId: true,
          matchesPlayed: true,
          matchesWon: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              photo: true,
            },
          },
        },
      });
    }

    // SIMPLIFIED: Get just student count without complex joins
    const studentCount = await prisma.player.count({
      where: {
        staffMembers: {
          some: {
            userId: coachId,
          },
        },
      },
    });

    // Return minimal dashboard data - enough to render the UI
    // Additional data can be loaded in separate requests if needed
    return {
      coach: {
        id: coach.userId,
        name: `${coach.user.firstName} ${coach.user.lastName}`,
        firstName: coach.user.firstName,
        lastName: coach.user.lastName,
        email: coach.user.email,
        phone: coach.user.phone,
        photo: coach.user.photo,
        gender: coach.user.gender,
        dateOfBirth: coach.user.dateOfBirth,
        nationality: coach.user.nationality,
        role: 'coach',
        bio: coach.user.bio,
        specializations: coach.specializationArea ? [coach.specializationArea] : [],
        certifications: coach.certifications || [],
      },
      club: club ? {
        id: club.userId,
        name: `${club.user.firstName} ${club.user.lastName}`,
        photo: club.user.photo,
      } : null,
      students: [],
      studentsStats: {
        totalStudents: studentCount,
        totalStudentWins: 0,
        totalStudentMatches: 0,
        averageWinRate: 0,
      },
      coachMatches: [],
      performanceData: [],
      stats: {
        studentCount,
        rating: 4.5, // Default rating
        totalSessions: 0,
        completedSessions: 0,
        cancellationRate: 0,
      },
      earnings: {
        thisMonth: 0,
        pending: 0,
        perSession: coach.hourlyRate || 0,
        balance: 0,
        students: studentCount,
      },
      activities: [],
      nextSession: null,
      overallRating: 4.5,
    };
  } catch (error) {
    console.error('[getCoachDashboard] Error:', error);
    throw error;
  }
}
