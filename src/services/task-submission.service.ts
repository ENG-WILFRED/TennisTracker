/**
 * Task Submission Service
 * Manages form submissions and PDF generation
 */

import prisma from "@/lib/prisma";
import {
  TaskSubmission,
  TaskSubmissionStatus,
  TaskAction,
  SubmitTaskPayload,
  ReviewSubmissionPayload,
} from "@/types/task-system";

class TaskSubmissionService {
  /**
   * Submit a task (form-driven tasks only)
   */
  async submitTask(
    taskId: string,
    userId: string,
    payload: SubmitTaskPayload
  ): Promise<TaskSubmission> {
    // Verify task exists and belongs to the user
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { template: true },
    });

    if (!task) throw new Error("Task not found");
    if (task.assignedToId !== userId) throw new Error("Not authorized");
    if (!task.template?.isFormBased) {
      throw new Error("This task is not form-based");
    }

    // Create submission
    const submission = await prisma.taskSubmission.create({
      data: {
        taskId,
        submittedByUserId: userId,
        formData: JSON.stringify(payload.formData),
        reviewStatus: TaskSubmissionStatus.PENDING_REVIEW,
      },
    });

    // Update task status
    await prisma.task.update({
      where: { id: taskId },
      data: { status: "IN_PROGRESS" },
    });

    // Add history entry
    await prisma.taskHistory.create({
      data: {
        taskId,
        status: "IN_PROGRESS",
        action: TaskAction.SUBMITTED,
        changedByUserId: userId,
        notes: "Form submitted for review",
      },
    });

    return this.formatSubmission(submission);
  }

  /**
   * Generate PDF from submission (placeholder - implement with actual PDF library)
   */
  async generatePDF(
    submissionId: string,
    templateName: string
  ): Promise<string> {
    // TODO: Implement actual PDF generation
    // This is a placeholder - use libraries like:
    // - puppeteer: for HTML -> PDF
    // - pdfkit: for programmatic PDF generation
    // - weasyprint (Python): for HTML -> PDF

    const submission = await prisma.taskSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) throw new Error("Submission not found");

    // Placeholder: create PDF file name and storage location
    const pdfFileName = `${templateName}-${submissionId}-${Date.now()}.pdf`;
    const pdfUrl = `/storage/submissions/${pdfFileName}`;

    // Update submission with PDF info
    const updated = await prisma.taskSubmission.update({
      where: { id: submissionId },
      data: {
        pdfFileName,
        pdfUrl,
        pdfGeneratedAt: new Date(),
      },
    });

    return pdfUrl;
  }

  /**
   * Review a submission
   */
  async reviewSubmission(
    submissionId: string,
    reviewerId: string,
    payload: ReviewSubmissionPayload
  ): Promise<TaskSubmission> {
    const submission = await prisma.taskSubmission.findUnique({
      where: { id: submissionId },
      include: { task: true },
    });

    if (!submission) throw new Error("Submission not found");

    const updated = await prisma.taskSubmission.update({
      where: { id: submissionId },
      data: {
        reviewStatus: payload.reviewStatus,
        reviewedByUserId: reviewerId,
        reviewedAt: new Date(),
        reviewNotes: payload.reviewNotes,
      },
    });

    // Update task status based on review
    const newTaskStatus =
      payload.reviewStatus === TaskSubmissionStatus.APPROVED
        ? "COMPLETED"
        : payload.reviewStatus === TaskSubmissionStatus.REJECTED
          ? "FAILED"
          : "IN_PROGRESS";

    await prisma.task.update({
      where: { id: submission.taskId },
      data: { status: newTaskStatus, completedAt: new Date() },
    });

    // Add history entry
    await prisma.taskHistory.create({
      data: {
        taskId: submission.taskId,
        status: newTaskStatus as any,
        action: TaskAction.REVIEWED,
        changedByUserId: reviewerId,
        notes: `Submission reviewed: ${payload.reviewStatus}`,
      },
    });

    return this.formatSubmission(updated);
  }

  /**
   * Request revision of submission
   */
  async requestRevision(
    submissionId: string,
    reviewerId: string,
    notes: string
  ): Promise<TaskSubmission> {
    return this.reviewSubmission(submissionId, reviewerId, {
      reviewStatus: TaskSubmissionStatus.NEEDS_REVISION,
      reviewNotes: notes,
    });
  }

  /**
   * Approve a submission
   */
  async approveSubmission(
    submissionId: string,
    reviewerId: string
  ): Promise<TaskSubmission> {
    return this.reviewSubmission(submissionId, reviewerId, {
      reviewStatus: TaskSubmissionStatus.APPROVED,
    });
  }

  /**
   * Reject a submission
   */
  async rejectSubmission(
    submissionId: string,
    reviewerId: string,
    notes: string
  ): Promise<TaskSubmission> {
    return this.reviewSubmission(submissionId, reviewerId, {
      reviewStatus: TaskSubmissionStatus.REJECTED,
      reviewNotes: notes,
    });
  }

  /**
   * Get submission by ID
   */
  async getSubmission(submissionId: string): Promise<TaskSubmission | null> {
    const submission = await prisma.taskSubmission.findUnique({
      where: { id: submissionId },
    });

    return submission ? this.formatSubmission(submission) : null;
  }

  /**
   * Get submissions for a task
   */
  async getTaskSubmissions(taskId: string): Promise<TaskSubmission[]> {
    const submissions = await prisma.taskSubmission.findMany({
      where: { taskId },
      orderBy: { submittedAt: "desc" },
    });

    return submissions.map((s) => this.formatSubmission(s));
  }

  /**
   * Get pending submissions for review
   */
  async getPendingSubmissions(organizationId: string): Promise<TaskSubmission[]> {
    const submissions = await prisma.taskSubmission.findMany({
      where: {
        task: { organizationId },
        reviewStatus: TaskSubmissionStatus.PENDING_REVIEW,
      },
      include: { task: true },
      orderBy: { submittedAt: "asc" },
    });

    return submissions.map((s) => this.formatSubmission(s));
  }

  /**
   * Get submissions by reviewer
   */
  async getSubmissionsByReviewer(
    reviewerId: string
  ): Promise<TaskSubmission[]> {
    const submissions = await prisma.taskSubmission.findMany({
      where: { reviewedByUserId: reviewerId },
      orderBy: { reviewedAt: "desc" },
    });

    return submissions.map((s) => this.formatSubmission(s));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helper Methods
  // ─────────────────────────────────────────────────────────────────────────

  private formatSubmission(submission: any): TaskSubmission {
    return {
      id: submission.id,
      taskId: submission.taskId,
      submittedByUserId: submission.submittedByUserId,
      formData: typeof submission.formData === "string"
        ? JSON.parse(submission.formData)
        : submission.formData,
      pdfUrl: submission.pdfUrl,
      pdfFileName: submission.pdfFileName,
      pdfGeneratedAt: submission.pdfGeneratedAt,
      reviewStatus: submission.reviewStatus as TaskSubmissionStatus,
      reviewedByUserId: submission.reviewedByUserId,
      reviewedAt: submission.reviewedAt,
      reviewNotes: submission.reviewNotes,
      submittedAt: submission.submittedAt,
      updatedAt: submission.updatedAt,
    };
  }
}

export const taskSubmissionService = new TaskSubmissionService();
