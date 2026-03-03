"use server";
import { PrismaClient } from "../../generated/prisma";

const prisma = new PrismaClient();

export async function getCoachDashboard(coachId: string) {
  // Get coach staff record
  const coach = await prisma.staff.findUnique({
    where: { userId: coachId },
    include: { user: true },
  });

  if (!coach) {
    throw new Error("Coach not found");
  }

  // Get the club that employed this coach (if any)
  let club = null;
  if (coach.employedById) {
    club = await prisma.player.findUnique({
      where: { userId: coach.employedById },
      include: {
        user: true,
      },
    });
  }

  // Get all students/players coached by this coach
  // Since we don't have a direct relation, we'll get players employed by the club
  const students = club
    ? await prisma.player.findMany({
        where: {
          staffMembers: {
            some: {
              userId: coachId,
            },
          },
        },
        include: {
          user: true,
        },
      })
    : [];

  // Calculate stats for coached students
  const studentsStats = {
    totalStudents: students.length,
    totalStudentWins: students.reduce((sum, s) => sum + s.matchesWon, 0),
    totalStudentMatches: students.reduce((sum, s) => sum + s.matchesPlayed, 0),
    averageWinRate: students.length > 0
      ? students.reduce((sum, s) => sum + (s.matchesWon / (s.matchesPlayed || 1)), 0) / students.length
      : 0,
  };

  // Get matches for stats (coached players' matches)
  const coachMatches = club
    ? await prisma.match.findMany({
        where: {
          OR: [
            { playerA: { staffMembers: { some: { userId: coachId } } } },
            { playerB: { staffMembers: { some: { userId: coachId } } } },
          ],
        },
        include: {
          playerA: true,
          playerB: true,
        },
      })
    : [];

  // Get performance data for coached students
  const performanceData = await prisma.performancePoint.findMany({
    where: {
      player: {
        staffMembers: {
          some: {
            userId: coachId,
          },
        },
      },
    },
    include: {
      player: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { date: "desc" },
    take: 20,
  });

  // Calculate overall rating from performance data
  const overallRating =
    performanceData.length > 0
      ? performanceData.reduce((sum, p) => sum + p.rating, 0) / performanceData.length
      : 0;

  return {
    coach,
    club,
    students,
    studentsStats,
    coachMatches,
    performanceData,
    overallRating: Math.round(overallRating * 10) / 10, // Round to 1 decimal
  };
}
