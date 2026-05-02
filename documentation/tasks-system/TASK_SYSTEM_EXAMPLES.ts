/**
 * Typed Task System - Examples & Quick Reference
 * 
 * This file shows real usage examples for the task system
 */

// ─────────────────────────────────────────────────────────────────────────
// EXAMPLE 1: Coach Training Plan Workflow
// ─────────────────────────────────────────────────────────────────────────

/**
 * Step 1: Admin creates a "Training Plan" template
 */
async function createTrainingPlanTemplate() {
  const response = await fetch("/api/admin/task-templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organizationId: "tennis-club-123",
      template: {
        name: "Monthly Training Plan",
        description: "Create a detailed training plan for assigned players",
        role: "COACH",
        type: "TRAINING_PLAN",
        isFormBased: true,
        contextFields: ["playerIds", "month", "focusArea"],
        instructions:
          "Develop a comprehensive training plan including:" +
          "\n- Training schedule (days/times)" +
          "\n- Focus areas and goals" +
          "\n- Technique drills" +
          "\n- Conditioning work" +
          "\n- Expected outcomes",
        estimatedHours: 3,
        sections: [
          {
            title: "Players & Timeline",
            description: "Who are you training and when?",
            position: 0,
            fields: [
              {
                name: "playerIds",
                label: "Select Players",
                type: "select",
                required: true,
                helpText: "You can select multiple players",
              },
              {
                name: "month",
                label: "Training Month",
                type: "text",
                required: true,
                placeholder: "April 2026",
              },
            ],
          },
          {
            title: "Training Focus",
            description: "What's the main focus?",
            position: 1,
            fields: [
              {
                name: "focusArea",
                label: "Focus Area",
                type: "select",
                required: true,
                options: [
                  { label: "Conditioning", value: "conditioning" },
                  { label: "Technique", value: "technique" },
                  { label: "Tactics", value: "tactics" },
                  { label: "Mixed", value: "mixed" },
                ],
              },
            ],
          },
          {
            title: "Training Plan Details",
            description: "Provide the full plan",
            position: 2,
            fields: [
              {
                name: "schedule",
                label: "Training Schedule",
                type: "textarea",
                required: true,
                placeholder:
                  "Monday 10am - Conditioning\nWednesday 2pm - Technique\nFriday 3pm - Match Play",
                helpText:
                  "Include specific times and activities for each session",
              },
              {
                name: "goals",
                label: "Training Goals",
                type: "textarea",
                required: true,
                placeholder:
                  "e.g., Improve serve accuracy, increase endurance",
              },
              {
                name: "notes",
                label: "Additional Notes",
                type: "textarea",
                required: false,
              },
            ],
          },
        ],
      },
    }),
  });

  return response.json();
}

/**
 * Step 2: Admin assigns the template to a coach
 */
async function assignTrainingPlanToCoach(
  templateId: string,
  coachUserId: string
) {
  const response = await fetch("/api/admin/tasks/assign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organizationId: "tennis-club-123",
      assignmentPayload: {
        templateId,
        assignedToId: coachUserId,
        context: {
          playerIds: ["player-1", "player-2"],
          month: "April 2026",
          focusArea: "conditioning",
        },
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
        notes: "Priority for Q2 planning",
      },
    }),
  });

  return response.json();
}

/**
 * Step 3: Coach views dashboard and sees the task
 */
async function coachViewsDashboard() {
  const response = await fetch("/api/coach/dashboard");
  const data = await response.json();

  console.log("Coach Dashboard:");
  console.log(`- Assigned tasks: ${data.data.assignedCount}`);
  console.log(`- In progress: ${data.data.inProgressCount}`);
  console.log(`- Pending review: ${data.data.submittedForReviewCount}`);

  return data.data;
}

/**
 * Step 4: Coach accepts the task
 */
async function coachAcceptsTask(taskId: string) {
  const response = await fetch(`/api/coach/tasks/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "accept" }),
  });

  return response.json();
}

/**
 * Step 5: Coach starts working
 */
async function coachStartsWork(taskId: string) {
  const response = await fetch(`/api/coach/tasks/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "start" }),
  });

  return response.json();
}

/**
 * Step 6: Coach fills out the form and submits
 */
async function coachSubmitsTrainingPlan(taskId: string) {
  const response = await fetch(`/api/coach/tasks/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "submit",
      payload: {
        formData: {
          playerIds: ["player-1", "player-2"],
          month: "April 2026",
          focusArea: "conditioning",
          schedule:
            "Monday 10am - Fitness Circuit\n" +
            "Wednesday 2pm - Court Conditioning\n" +
            "Friday 3pm - Match Play",
          goals:
            "Improve second serve consistency\n" +
            "Increase rally endurance\n" +
            "Reduce double faults",
          notes: "Players show good progress. Expect improvements by end of month.",
        },
      },
    }),
  });

  return response.json();
}

/**
 * Step 7: Admin reviews the submission
 */
async function adminReviewsSubmission(submissionId: string) {
  const response = await fetch(`/api/submissions/${submissionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reviewStatus: "APPROVED",
      reviewNotes: "Excellent detailed plan. Good focus on conditioning.",
    }),
  });

  return response.json();
  // Task now has status: COMPLETED ✅
}

// ─────────────────────────────────────────────────────────────────────────
// EXAMPLE 2: Referee Tournament Management Workflow
// ─────────────────────────────────────────────────────────────────────────

/**
 * Admin creates "Manage Tournament" template (one-time)
 */
async function createTournamentTemplate() {
  const response = await fetch("/api/admin/task-templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organizationId: "tennis-club-123",
      template: {
        name: "Manage Tournament",
        description: "Manage all aspects of a tennis tournament",
        role: "REFEREE",
        type: "TOURNAMENT_CONTROL",
        isFormBased: false, // Event-driven!
        contextFields: ["tournamentId"],
        instructions:
          "You are responsible for:\n" +
          "1. Creating match fixtures\n" +
          "2. Managing live match tracking\n" +
          "3. Recording all match events\n" +
          "4. Generating match reports",
        estimatedHours: 8,
      },
    }),
  });

  return response.json();
}

/**
 * Admin assigns tournament to referee
 */
async function assignTournamentToReferee(
  templateId: string,
  refereeUserId: string,
  tournamentId: string
) {
  const response = await fetch("/api/admin/tasks/assign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organizationId: "tennis-club-123",
      assignmentPayload: {
        templateId,
        assignedToId: refereeUserId,
        context: { tournamentId },
      },
    }),
  });

  return response.json();
}

/**
 * Referee views dashboard
 */
async function refereeViewsDashboard() {
  const response = await fetch("/api/referee/dashboard");
  const data = await response.json();

  console.log("Referee Dashboard:");
  console.log(`- Active tournaments: ${data.data.activeTournamentsCount}`);
  console.log(`- Pending reports: ${data.data.pendingReportsCount}`);

  return data.data;
}

/**
 * Referee accepts tournament
 */
async function refereeAcceptsTournament(taskId: string) {
  const response = await fetch(`/api/referee/tasks/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "accept" }),
  });

  return response.json();
}

/**
 * Referee starts tournament
 */
async function refereeStartsTournament(taskId: string) {
  const response = await fetch(`/api/referee/tasks/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "start" }),
  });

  return response.json();
}

/**
 * Referee checks tournament status (during tournament)
 */
async function refereeChecksTournamentStatus(taskId: string) {
  const response = await fetch(`/api/referee/tasks/${taskId}`);
  const data = await response.json();

  console.log("Tournament Progress:");
  console.log(`- Total matches: ${data.data.progress.totalMatches}`);
  console.log(`- Completed: ${data.data.progress.completedMatches}`);
  console.log(`- Progress: ${data.data.progress.progress}%`);
  console.log(`- Pending reports: ${data.data.progress.pendingReports}`);

  return data.data;
}

/**
 * Referee completes tournament (when all matches + reports done)
 */
async function refereeCompletesTournament(taskId: string) {
  try {
    const response = await fetch(`/api/referee/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete" }),
    });

    const data = await response.json();
    console.log("Tournament completed successfully! ✅");
    return data;
  } catch (error) {
    console.error("Cannot complete yet:", error);
    // Not all matches/reports ready
  }
}

// ─────────────────────────────────────────────────────────────────────────
// QUICK API REFERENCE
// ─────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/task-templates
 *   - Get all templates for organization
 *   - ?role=COACH, ?type=TRAINING_PLAN
 *
 * POST /api/admin/task-templates
 *   - Create new template
 *
 * POST /api/admin/tasks/assign
 *   - Assign task to user
 *
 * GET /api/coach/dashboard
 *   - Coach's task dashboard
 *
 * GET /api/coach/tasks/[taskId]
 *   - Get task details with form schema
 *
 * PUT /api/coach/tasks/[taskId]
 *   - action: "accept" | "start" | "submit" | "complete"
 *
 * GET /api/referee/dashboard
 *   - Referee's tournament dashboard
 *
 * GET /api/referee/tasks/[taskId]
 *   - Get tournament status + progress
 *
 * PUT /api/referee/tasks/[taskId]
 *   - action: "accept" | "start" | "complete" | "reject"
 *
 * GET /api/submissions/pending?organizationId=org-123
 *   - Get pending submissions for review
 *
 * PUT /api/submissions/[submissionId]
 *   - reviewStatus: "APPROVED" | "REJECTED" | "NEEDS_REVISION"
 */

export {
  createTrainingPlanTemplate,
  assignTrainingPlanToCoach,
  coachViewsDashboard,
  coachAcceptsTask,
  coachStartsWork,
  coachSubmitsTrainingPlan,
  adminReviewsSubmission,
  createTournamentTemplate,
  assignTournamentToReferee,
  refereeViewsDashboard,
  refereeAcceptsTournament,
  refereeStartsTournament,
  refereeChecksTournamentStatus,
  refereeCompletesTournament,
};
