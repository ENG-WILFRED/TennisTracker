import prisma from "@/lib/prisma";

/**
 * Seeds all TaskTemplates for referee and coach roles
 */

export async function seedTaskTemplates() {
  console.log("📋 Seeding task templates...");

  try {
    // Get organization
    const org = await prisma.organization.findFirst();
    if (!org) throw new Error("No organization found");

    const existingTemplates = await prisma.taskTemplate.findMany({
      where: { organizationId: org.id },
    });

    if (existingTemplates.length > 0) {
      console.log(`✅ Found ${existingTemplates.length} existing templates`);
      return;
    }

    // REFEREE TEMPLATES
    const refereeTemplates = [
      {
        name: "Tournament Control",
        description: "Manage and oversee tournament matches",
        role: "REFEREE",
        type: "TOURNAMENT_CONTROL",
        isFormBased: false,
        instructions:
          "Monitor all tournament matches, ensure fair play, record results and submit reports",
        estimatedHours: 8,
        successCriteria: {
          all_matches_completed: true,
          all_reports_submitted: true,
        },
        contextFields: ["tournamentId", "eventId", "matchDuration"],
      },
      {
        name: "Match Officiation",
        description: "Officiate individual tennis matches",
        role: "REFEREE",
        type: "MATCH_OFFICIATION",
        isFormBased: false,
        instructions:
          "Officiate the match according to ITF rules, keep score accurately, and enforce rules",
        estimatedHours: 3,
        successCriteria: {
          match_completed: true,
          score_recorded: true,
        },
        contextFields: ["matchId", "courtId", "eventType"],
      },
      {
        name: "Submit Match Report",
        description: "Submit detailed report of match results",
        role: "REFEREE",
        type: "SUBMIT_MATCH_REPORT",
        isFormBased: true,
        instructions:
          "Complete the match report form with final scores, incidents, and any rule violations",
        estimatedHours: 0.5,
        successCriteria: {
          report_submitted: true,
        },
        contextFields: ["matchId", "tournamentId"],
      },
    ];

    // COACH TEMPLATES
    const coachTemplates = [
      {
        name: "Training Plan",
        description: "Create and execute training plan for players",
        role: "COACH",
        type: "TRAINING_PLAN",
        isFormBased: true,
        instructions:
          "Develop a comprehensive training plan for the week including drills, conditioning, and strategy work",
        estimatedHours: 5,
        successCriteria: {
          plan_created: true,
          plan_executed: true,
        },
        contextFields: ["tournamentId", "playerCount", "sessionDuration"],
      },
      {
        name: "Player Evaluation",
        description: "Evaluate individual player performance",
        role: "COACH",
        type: "PLAYER_EVALUATION",
        isFormBased: true,
        instructions:
          "Assess player strengths, weaknesses, and progress. Provide feedback and improvement recommendations",
        estimatedHours: 2,
        successCriteria: {
          evaluation_completed: true,
        },
        contextFields: ["tournamentId"],
      },
      {
        name: "Session Report",
        description: "Document coaching session details and outcomes",
        role: "COACH",
        type: "SESSION_REPORT",
        isFormBased: true,
        instructions:
          "Fill in the training session report with attendance, focus areas, and player progress notes",
        estimatedHours: 1,
        successCriteria: {
          report_submitted: true,
        },
        contextFields: ["tournamentId", "playerCount"],
      },
      {
        name: "Prepare Athletes",
        description: "Prepare athletes for upcoming tournament",
        role: "COACH",
        type: "PREPARE_ATHLETES",
        isFormBased: false,
        instructions:
          "Conduct intensive preparation sessions focusing on skill refinement, mental preparation, and strategy",
        estimatedHours: 10,
        successCriteria: {
          all_sessions_completed: true,
          athletes_ready: true,
        },
        contextFields: ["tournamentId", "playerCount"],
      },
    ];

    const allTemplates = [...refereeTemplates, ...coachTemplates];

    for (const template of allTemplates) {
      const existing = await prisma.taskTemplate.findFirst({
        where: {
          organizationId: org.id,
          type: template.type,
        },
      });

      if (!existing) {
        await prisma.taskTemplate.create({
          data: {
            organizationId: org.id,
            name: template.name,
            description: template.description,
            role: template.role,
            type: template.type,
            isFormBased: template.isFormBased,
            instructions: template.instructions,
            estimatedHours: template.estimatedHours,
            successCriteria: template.successCriteria,
            contextFields: template.contextFields,
            isActive: true,
          },
        });
        console.log(`✅ Created template: ${template.name}`);
      } else {
        console.log(`⏭️ Template already exists: ${template.name}`);
      }
    }

    console.log("✅ Task templates seeded successfully!");
  } catch (err) {
    console.error("❌ Error seeding task templates:", err);
    throw err;
  }
}
