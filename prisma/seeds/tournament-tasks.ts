import prisma from "@/lib/prisma";
import { TaskStatus } from "@/types/task-system";

/**
 * Seeds tournaments with referee task assignments
 * Creates real-world scenarios: ongoing, completed, and half-done tournaments
 */

export async function seedTournamentTasks() {
  console.log("🏆 Seeding tournament tasks for referees...");

  try {
    // Get organization
    const org = await prisma.organization.findFirst();
    if (!org) throw new Error("No organization found");

    // Get staff members (who have referee role capability)
    const staff = await prisma.staff.findMany({
      where: { organizationId: org.id },
      take: 3,
      include: { user: true },
    });

    // If no staff, try to get referees directly
    let assigneeIds: string[] = [];
    if (staff.length > 0) {
      assigneeIds = staff.map(s => s.userId);
    } else {
      // Fallback: get any staff or users with referee role
      const users = await prisma.user.findMany({
        where: {
          referee: { isNot: null },
        },
        take: 3,
      });
      assigneeIds = users.map(u => u.id);
    }

    if (assigneeIds.length === 0) {
      console.log("⚠️ No staff members or referees found, skipping task seeding");
      return;
    }

    // Get players for matches
    const players = await prisma.player.findMany({
      take: 10,
      include: { user: true },
    });

    if (players.length < 2) throw new Error("Not enough players");

    // Get actual referees for matches
    const referees = await prisma.referee.findMany({
      take: 2,
    });

    const refereeId = referees.length > 0 ? referees[0].userId : null;

    // Create task template for referees if not exists
    let refereeTemplate = await prisma.taskTemplate.findFirst({
      where: {
        organizationId: org.id,
        role: "REFEREE",
      },
    });

    if (!refereeTemplate) {
      refereeTemplate = await prisma.taskTemplate.create({
        data: {
          organizationId: org.id,
          name: "Manage Tournament",
          description: "Oversee and manage tournament matches",
          role: "REFEREE",
          type: "TOURNAMENT_MANAGEMENT",
          isFormBased: false,
          instructions:
            "Monitor all matches, ensure fair play, record results and submitting match reports",
          successCriteria: {
            all_matches_completed: true,
            all_reports_submitted: true,
          },
        },
      });
    }

    // Create 3 tournaments with different states
    const tournaments = [
      {
        name: "Spring Championship 2026 - In Progress",
        status: "in_progress",
        refereeStatus: TaskStatus.IN_PROGRESS,
        matchesCount: 8,
        completedMatches: 4,
      },
      {
        name: "Easter Open 2026 - Upcoming",
        status: "upcoming",
        refereeStatus: TaskStatus.ASSIGNED,
        matchesCount: 6,
        completedMatches: 0,
      },
      {
        name: "Winter Cup 2025 - Completed",
        status: "completed",
        refereeStatus: TaskStatus.COMPLETED,
        matchesCount: 12,
        completedMatches: 12,
      },
    ];

    const createdTournaments = [];

    for (const tournament of tournaments) {
      // Check if tournament already exists
      const existing = await prisma.clubEvent.findFirst({
        where: { name: tournament.name },
      });

      if (existing) {
        createdTournaments.push(existing);
        continue;
      }

      // Create tournament event
      const event = await prisma.clubEvent.create({
        data: {
          organizationId: org.id,
          name: tournament.name,
          description: `${tournament.name} - Tournament management task`,
          eventType: "tournament",
          startDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + Math.random() * 45 * 24 * 60 * 60 * 1000),
          registrationCap: 32,
          registrationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: "Main Courts",
          prizePool: 10000,
        },
      });

      createdTournaments.push(event);

      // Assign task to a staff member
      const assigneeId = assigneeIds[createdTournaments.length % assigneeIds.length];

      const task = await prisma.task.create({
        data: {
          templateId: refereeTemplate.id,
          organizationId: org.id,
          assignedToId: assigneeId,
          assignedById: assigneeId, // Use assignee as filler for demo
          status: tournament.refereeStatus,
          context: {
            tournamentId: event.id,
            tournamentName: event.name,
          },
          dueDate: event.endDate,
          startedAt:
            tournament.refereeStatus !== TaskStatus.ASSIGNED
              ? new Date(Date.now() - 24 * 60 * 60 * 1000)
              : null,
          notes: `Manage ${tournament.name} tournament matches`,
        },
      });

      // Create matches for tournament
      for (let i = 0; i < tournament.matchesCount; i++) {
        const playerA = players[i % players.length];
        const playerB = players[(i + 1) % players.length];

        const match = await prisma.match.create({
          data: {
            round: Math.floor(i / 2) + 1,
            playerAId: playerA.userId,
            playerBId: playerB.userId,
            refereeId: refereeId || undefined,
            score:
              i < tournament.completedMatches
                ? `6-4 7-${Math.floor(Math.random() * 6)}`
                : null,
            winnerId:
              i < tournament.completedMatches
                ? Math.random() > 0.5
                  ? playerA.userId
                  : playerB.userId
                : null,
            createdAt: new Date(
              Date.now() - (tournament.matchesCount - i) * 60 * 60 * 1000
            ),
          },
        });

        // Create match report for completed matches (only if we have a referee)
        if (i < tournament.completedMatches && refereeId) {
          await prisma.matchReport.create({
            data: {
              matchId: match.id,
              refereeId: refereeId,
              pdfContent: `Match Report - Round ${match.round}`,
              fileName: `report-match-${match.id}.pdf`,
              generatedAt: new Date(),
            },
          });
        }
      }

      // Add task history entries
      if (tournament.refereeStatus !== TaskStatus.ASSIGNED) {
        await prisma.taskHistory.create({
          data: {
            taskId: task.id,
            status: TaskStatus.ASSIGNED,
            action: "ACCEPTED",
            changedByUserId: assigneeId,
            metadata: {
              accepted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            },
          },
        });

        await prisma.taskHistory.create({
          data: {
            taskId: task.id,
            status: TaskStatus.ACCEPTED,
            action: "STARTED",
            changedByUserId: assigneeId,
            metadata: {
              started_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            },
          },
        });
      }

      if (tournament.refereeStatus === TaskStatus.COMPLETED) {
        await prisma.taskHistory.create({
          data: {
            taskId: task.id,
            status: TaskStatus.IN_PROGRESS,
            action: "COMPLETED",
            changedByUserId: assigneeId,
            metadata: {
              completed_at: new Date().toISOString(),
              allMatchesReported: true,
              matchCount: tournament.matchesCount,
            },
          },
        });
      }

      console.log(
        `✅ Created tournament: ${tournament.name} with ${tournament.matchesCount} matches`
      );
    }

    // Create coach task template
    let coachTemplate = await prisma.taskTemplate.findFirst({
      where: {
        organizationId: org.id,
        role: "COACH",
      },
    });

    if (!coachTemplate) {
      coachTemplate = await prisma.taskTemplate.create({
        data: {
          organizationId: org.id,
          name: "Submit Training Report",
          description: "Coach submits weekly training report for players",
          role: "COACH",
          type: "TRAINING_PLAN",
          isFormBased: true,
          instructions:
            "Fill in the training report form with details about the week's training",
        },
      });
    }

    // Create form sections for coach task
    if (!coachTemplate.formSchema) {
      await prisma.formSection.create({
        data: {
          templateId: coachTemplate.id,
          title: "Training Overview",
          description: "General training information for the week",
          position: 0,
          fields: {
            create: [
              {
                name: "trainingDays",
                label: "Number of Training Days",
                type: "number",
                required: true,
                position: 0,
              },
              {
                name: "focusArea",
                label: "Main Focus Area",
                type: "select",
                required: true,
                options: [
                  { label: "Technique", value: "technique" },
                  { label: "Fitness", value: "fitness" },
                  { label: "Mental", value: "mental" },
                  { label: "Mixed", value: "mixed" },
                ],
                position: 1,
              },
            ],
          },
        },
      });

      await prisma.formSection.create({
        data: {
          templateId: coachTemplate.id,
          title: "Player Progress",
          description: "Track individual player progress",
          position: 1,
          fields: {
            create: [
              {
                name: "playerProgress",
                label: "Player Progress Notes",
                type: "textarea",
                required: true,
                placeholder: "Describe what each player achieved this week...",
                position: 0,
              },
              {
                name: "nextWeekFocus",
                label: "Next Week Focus",
                type: "textarea",
                required: false,
                placeholder: "What will you focus on next week?",
                position: 1,
              },
            ],
          },
        },
      });
    }

    // Get coaches
    const coaches = await prisma.staff.findMany({
      where: { role: "coach" },
      take: 2,
    });

    // Create coach tasks with submissions (half-done and completed)
    if (coaches.length > 0) {
      // Completed task with submission
      const completedCoachTask = await prisma.task.create({
        data: {
          templateId: coachTemplate.id,
          organizationId: org.id,
          assignedToId: coaches[0].userId,
          assignedById: coaches[0].userId,
          status: TaskStatus.COMPLETED,
          context: {
            weekNumber: 14,
            year: 2026,
          },
          dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          notes: "Week 14 training report",
        },
      });

      // Create completed submission
      await prisma.taskSubmission.create({
        data: {
          taskId: completedCoachTask.id,
          submittedByUserId: coaches[0].userId,
          formData: {
            trainingDays: 4,
            focusArea: "technique",
            playerProgress:
              "All 3 players showed good progress. Player A improved serve accuracy by 15%.",
            nextWeekFocus: "Focus on ground strokes and court positioning",
          },
          reviewStatus: "APPROVED",
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      });

      // In-progress task (half-done - submitted, pending review)
      const inProgressTask = await prisma.task.create({
        data: {
          templateId: coachTemplate.id,
          organizationId: org.id,
          assignedToId: coaches[coaches.length > 1 ? 1 : 0].userId,
          assignedById: coaches[0].userId,
          status: TaskStatus.IN_PROGRESS,
          context: {
            weekNumber: 15,
            year: 2026,
          },
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          notes: "Week 15 training report (in progress)",
        },
      });

      // Create pending submission
      await prisma.taskSubmission.create({
        data: {
          taskId: inProgressTask.id,
          submittedByUserId:
            coaches[coaches.length > 1 ? 1 : 0].userId,
          formData: {
            trainingDays: 3,
            focusArea: "fitness",
            playerProgress:
              "This week we focused on fitness and conditioning. All players completed the program.",
            nextWeekFocus: "Maintaining fitness levels and skill development",
          },
          reviewStatus: "PENDING_REVIEW",
          submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      });

      console.log("✅ Created coach tasks with submissions");
    }

    console.log("✨ Tournament task seeding complete!");
  } catch (error) {
    console.error("❌ Error seeding tournament tasks:", error);
    throw error;
  }
}
