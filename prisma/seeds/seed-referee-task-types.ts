import prisma from "@/lib/prisma";

/**
 * Seeds referee task types for the assign task section
 * Creates various task type templates referees can be assigned
 */

export async function seedRefereeTaskTypes() {
  console.log("📋 Seeding referee task types...");

  try {
    // Target Elite Sports Academy organization
    const org = await prisma.organization.findFirst({
      where: { name: { contains: "Elite" } },
    });
    if (!org) throw new Error("Elite Sports Academy organization not found");
    
    console.log(`🏢 Seeding for organization: ${org.name} (${org.id})`);

    const refereeTaskTypes = [
      {
        name: "Match Officiation",
        description: "Officiate a tennis match according to ITF rules",
        role: "REFEREE",
        type: "MATCH_OFFICIATION",
        isFormBased: false,
        instructions: "Officiate the match, keep accurate score, enforce rules, and record any incidents",
        estimatedHours: 2,
        successCriteria: {
          match_completed: true,
          score_recorded: true,
          report_submitted: true,
        },
        contextFields: ["matchId", "courtId", "eventType"],
      },
      {
        name: "Tournament Control",
        description: "Manage and oversee multiple matches in a tournament",
        role: "REFEREE",
        type: "TOURNAMENT_CONTROL",
        isFormBased: false,
        instructions: "Monitor all tournament matches, ensure fair play, coordinate referees, and verify results",
        estimatedHours: 8,
        successCriteria: {
          all_matches_completed: true,
          all_reports_submitted: true,
          integrity_maintained: true,
        },
        contextFields: ["tournamentId", "eventId", "numberOfMatches"],
      },
      {
        name: "Submit Match Report",
        description: "Complete detailed report of match results and incidents",
        role: "REFEREE",
        type: "SUBMIT_MATCH_REPORT",
        isFormBased: true,
        instructions: "Fill in the match report form with final scores, player conduct, rule violations, and any special incidents",
        estimatedHours: 0.5,
        successCriteria: {
          report_submitted: true,
          all_fields_complete: true,
        },
        contextFields: ["matchId", "tournamentId"],
      },
      {
        name: "Court Assignment Verification",
        description: "Verify court setup and equipment before matches",
        role: "REFEREE",
        type: "COURT_VERIFICATION",
        isFormBased: true,
        instructions: "Check court condition, line markings, net height, ball quality, and sign-off on readiness",
        estimatedHours: 1,
        successCriteria: {
          court_verified: true,
          equipment_checked: true,
          sign_off_complete: true,
        },
        contextFields: ["courtId", "eventId"],
      },
      {
        name: "Lines Person Training",
        description: "Conduct lines person training session",
        role: "REFEREE",
        type: "LINES_PERSON_TRAINING",
        isFormBased: true,
        instructions: "Train ball crew and lines persons on call procedures, positioning, and communication protocols",
        estimatedHours: 2,
        successCriteria: {
          training_conducted: true,
          participants_trained: true,
        },
        contextFields: ["trainingDate", "numberOfParticipants"],
      },
      {
        name: "Ball Crew Assignment",
        description: "Assign and coordinate ball crew for matches",
        role: "REFEREE",
        type: "BALL_CREW_ASSIGNMENT",
        isFormBased: false,
        instructions: "Assign qualified ball crew members to matches and ensure they understand their responsibilities",
        estimatedHours: 1.5,
        successCriteria: {
          crew_assigned: true,
          briefing_complete: true,
        },
        contextFields: ["eventId", "numberOfMatches"],
      },
      {
        name: "Player Conduct Investigation",
        description: "Investigate and document player conduct violations",
        role: "REFEREE",
        type: "CONDUCT_INVESTIGATION",
        isFormBased: true,
        instructions: "Document alleged violations, gather evidence, interview witnesses, and prepare investigation report",
        estimatedHours: 3,
        successCriteria: {
          investigation_complete: true,
          report_filed: true,
        },
        contextFields: ["matchId", "playerId", "conductType"],
      },
      {
        name: "Equipment Inspection",
        description: "Regular inspection and maintenance of tournament equipment",
        role: "REFEREE",
        type: "EQUIPMENT_INSPECTION",
        isFormBased: true,
        instructions: "Inspect rackets, balls, nets, and other equipment for compliance with ITF standards",
        estimatedHours: 2,
        successCriteria: {
          all_items_inspected: true,
          report_submitted: true,
        },
        contextFields: ["eventId", "inspectionDate"],
      },
      {
        name: "Dispute Resolution",
        description: "Resolve scoring disputes and rule interpretation conflicts",
        role: "REFEREE",
        type: "DISPUTE_RESOLUTION",
        isFormBased: true,
        instructions: "Review match footage if available, research applicable rules, make binding decision, and document resolution",
        estimatedHours: 1,
        successCriteria: {
          dispute_resolved: true,
          decision_documented: true,
        },
        contextFields: ["matchId", "disputeType"],
      },
    ];

    for (const templateData of refereeTaskTypes) {
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

    console.log("✓ Referee task types seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding referee task types:", error);
    throw error;
  }
}

// Run if executed directly
seedRefereeTaskTypes()
  .then(() => {
    console.log("✅ Done seeding referee task types");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error seeding referee task types:", err);
    process.exit(1);
  });
