import prisma from "@/lib/prisma";

/**
 * Seeds coach task types for the assign task section
 * Creates various task type templates coaches can be assigned
 */

export async function seedCoachTaskTypes() {
  console.log("📋 Seeding coach task types...");

  try {
    // Target Elite Sports Academy organization
    const org = await prisma.organization.findFirst({
      where: { name: { contains: "Elite" } },
    });
    if (!org) throw new Error("Elite Sports Academy organization not found");
    
    console.log(`🏢 Seeding for organization: ${org.name} (${org.id})`);

    const coachTaskTypes = [
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
        contextFields: ["playerCount", "sessionDuration"],
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
        contextFields: ["playerCount"],
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
        contextFields: ["playerCount", "sessionDuration"],
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
        contextFields: ["playerCount", "sessionDuration"],
      },
      {
        name: "Fitness Assessment",
        description: "Conduct comprehensive fitness assessment of players",
        role: "COACH",
        type: "FITNESS_ASSESSMENT",
        isFormBased: true,
        instructions:
          "Test player fitness levels including endurance, agility, strength, and flexibility. Record baseline metrics.",
        estimatedHours: 3,
        successCriteria: {
          assessment_completed: true,
          metrics_recorded: true,
        },
        contextFields: ["playerCount"],
      },
      {
        name: "Match Analysis",
        description: "Analyze match performance and create improvement plan",
        role: "COACH",
        type: "MATCH_ANALYSIS",
        isFormBased: true,
        instructions:
          "Review match video/data, identify strengths and weaknesses, and create targeted improvement plan",
        estimatedHours: 2,
        successCriteria: {
          analysis_complete: true,
          improvement_plan_created: true,
        },
        contextFields: ["playerCount"],
      },
      {
        name: "Mental Coaching",
        description: "Provide mental coaching and psychological preparation",
        role: "COACH",
        type: "MENTAL_COACHING",
        isFormBased: true,
        instructions:
          "Conduct mental training session focusing on confidence, focus, pressure management, and resilience",
        estimatedHours: 1.5,
        successCriteria: {
          session_conducted: true,
          techniques_taught: true,
        },
        contextFields: ["playerCount"],
      },
      {
        name: "Tactical Workshop",
        description: "Conduct tactical training workshop",
        role: "COACH",
        type: "TACTICAL_WORKSHOP",
        isFormBased: false,
        instructions:
          "Teach advanced tactical concepts including court positioning, shot selection, and match strategy",
        estimatedHours: 2,
        successCriteria: {
          workshop_conducted: true,
          tactics_understood: true,
        },
        contextFields: ["playerCount", "sessionDuration"],
      },
      {
        name: "Equipment Setup",
        description: "Set up and configure player equipment for training",
        role: "COACH",
        type: "EQUIPMENT_SETUP",
        isFormBased: true,
        instructions:
          "Setup rackets, balls, training equipment and ensure all tools are ready for the training session",
        estimatedHours: 1,
        successCriteria: {
          equipment_ready: true,
          player_assignments_done: true,
        },
        contextFields: ["playerCount"],
      },
    ];

    for (const templateData of coachTaskTypes) {
      const existing = await prisma.taskTemplate.findFirst({
        where: {
          organizationId: org.id,
          type: templateData.type,
        },
      });

      if (!existing) {
        const created = await prisma.taskTemplate.create({
          data: {
            organizationId: org.id,
            name: templateData.name,
            description: templateData.description,
            role: templateData.role,
            type: templateData.type,
            isFormBased: templateData.isFormBased,
            instructions: templateData.instructions,
            estimatedHours: templateData.estimatedHours,
            successCriteria: templateData.successCriteria,
            contextFields: templateData.contextFields,
            isActive: true,
          },
        });
        console.log(`✅ Created: ${created.name} (${created.type})`);
      } else {
        console.log(`⏭️  Already exists: ${existing.name}`);
      }
    }

    console.log("✓ Coach task types seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding coach task types:", error);
    throw error;
  }
}

// Run if executed directly
seedCoachTaskTypes()
  .then(() => {
    console.log("✅ Done seeding coach task types");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error seeding coach task types:", err);
    process.exit(1);
  });
