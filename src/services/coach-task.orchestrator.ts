/**
 * Coach Task Orchestrator
 * Handles coach-specific task workflow
 * 
 * Flow:
 * ASSIGNED → ACCEPTED → IN_PROGRESS → SUBMIT → REVIEW → COMPLETED
 */

import prisma from "@/lib/prisma";
import { Task, SubmitTaskPayload, TaskStatus } from "@/types/task-system";
import { taskLifecycleService } from "./task-lifecycle.service";
import { taskSubmissionService } from "./task-submission.service";

class CoachTaskOrchestrator {
  /**
   * Get coach's current work
   */
  async getCoachDashboard(coachId: string) {
    const [
      assignedTasks,
      acceptedTasks,
      inProgressTasks,
      completedTasks,
      submittedForReview,
    ] = await Promise.all([
      prisma.task.findMany({
        where: { assignedToId: coachId, status: TaskStatus.ASSIGNED },
        include: { template: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.task.findMany({
        where: { assignedToId: coachId, status: TaskStatus.ACCEPTED },
        include: { template: true },
        orderBy: { startedAt: "asc" },
      }),
      prisma.task.findMany({
        where: { assignedToId: coachId, status: TaskStatus.IN_PROGRESS },
        include: { template: true },
        orderBy: { startedAt: "asc" },
      }),
      prisma.task.findMany({
        where: { assignedToId: coachId, status: TaskStatus.COMPLETED },
        include: { template: true },
        orderBy: { completedAt: "desc" },
        take: 10,
      }),
      prisma.taskSubmission.findMany({
        where: {
          task: { assignedToId: coachId },
          reviewStatus: "PENDING_REVIEW",
        },
        include: { task: { include: { template: true } } },
        orderBy: { submittedAt: "asc" },
      }),
    ]);

    return {
      assignedCount: assignedTasks.length,
      assigned: assignedTasks,
      acceptedCount: acceptedTasks.length,
      accepted: acceptedTasks,
      inProgressCount: inProgressTasks.length,
      inProgress: inProgressTasks,
      completedCount: completedTasks.length,
      completed: completedTasks,
      submittedForReviewCount: submittedForReview.length,
      submittedForReview,
    };
  }

  /**
   * Accept a training plan / task
   */
  async acceptTask(taskId: string, coachId: string): Promise<Task> {
    const task = await taskLifecycleService.acceptTask(taskId, coachId);

    // Send notification to coach
    // TODO: Implement notification system

    return task;
  }

  /**
   * Start working on a task
   */
  async startWork(taskId: string, coachId: string): Promise<Task> {
    const task = await taskLifecycleService.startTask(taskId, coachId);

    // TODO: Log activity tracking

    return task;
  }

  /**
   * Submit a completed training plan / evaluation form
   */
  async submitWork(
    taskId: string,
    coachId: string,
    payload: SubmitTaskPayload
  ) {
    // Validate task belongs to coach and is in progress
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { template: true },
    });

    if (!task) throw new Error("Task not found");
    if (task.assignedToId !== coachId) throw new Error("Not authorized");
    if (!task.template?.isFormBased) {
      throw new Error("This task does not accept form submissions");
    }

    // Submit the task
    const submission = await taskSubmissionService.submitTask(
      taskId,
      coachId,
      payload
    );

    // Generate PDF
    try {
      await taskSubmissionService.generatePDF(submission.id, task.template.name);
    } catch (error) {
      console.error("PDF generation failed:", error);
      // Don't fail the submission if PDF generation fails
    }

    return submission;
  }

  /**
   * Check submission status
   */
  async getSubmissionStatus(taskId: string) {
    const submissions = await prisma.taskSubmission.findMany({
      where: { taskId },
      orderBy: { submittedAt: "desc" },
      take: 1,
    });

    if (submissions.length === 0) {
      return { status: "NOT_SUBMITTED", message: "No submission found" };
    }

    const submission = submissions[0];
    return {
      status: submission.reviewStatus,
      submittedAt: submission.submittedAt,
      reviewedAt: submission.reviewedAt,
      reviewNotes: submission.reviewNotes,
      pdfUrl: submission.pdfUrl,
    };
  }

  /**
   * Get available tasks for coach
   */
  async getAvailableTasks(coachId: string) {
    return prisma.task.findMany({
      where: {
        assignedToId: coachId,
        status: { in: [TaskStatus.ASSIGNED, TaskStatus.ACCEPTED] },
      },
      include: {
        template: {
          include: {
            sections: {
              include: { fields: true },
              orderBy: { position: "asc" },
            },
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });
  }

  /**
   * Get task details with form schema
   */
  async getTaskDetails(taskId: string, coachId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        template: {
          include: {
            sections: {
              include: { fields: true },
              orderBy: { position: "asc" },
            },
          },
        },
        submissions: {
          orderBy: { submittedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!task) throw new Error("Task not found");
    if (task.assignedToId !== coachId) throw new Error("Not authorized");

    return task;
  }
}

export const coachTaskOrchestrator = new CoachTaskOrchestrator();
