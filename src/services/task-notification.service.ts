/**
 * Task Notification Service
 * Handles sending email notifications to players when tasks are assigned
 * Implements retry logic with exponential backoff
 */

import prisma from "@/lib/prisma";
import { notify } from "@/app/api/notification/producer";
import { Task } from "@/types/task-system";

interface SendNotificationParams {
  task: Task;
  targetEmails: string[];
  toEmail?: string; // Single email if sending to one person
  taskDetails: {
    taskName: string;
    assignedByName: string;
    trainingType?: string;
    sessionDuration?: number;
    dueDate?: Date;
    notes?: string;
    playerCount?: number;
  };
}

interface RetryConfig {
  maxAttempts: number;
  intervalMinutes: number[]; // Intervals for each retry in minutes
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  intervalMinutes: [10, 30, 60], // Retry at 10 mins, 30 mins, 1 hour
};

class TaskNotificationService {
  /**
   * Send notification to player about task assignment
   */
  async sendTaskNotification(params: SendNotificationParams): Promise<void> {
    const { task, targetEmails, toEmail, taskDetails } = params;
    const emailsToNotify = toEmail ? [toEmail] : targetEmails;

    if (emailsToNotify.length === 0) {
      console.warn(`[TaskNotification] No valid emails to notify for task ${task.id}`);
      return;
    }

    for (const email of emailsToNotify) {
      try {
        // Create notification log entry
        await prisma.notificationLog.create({
          data: {
            taskId: task.id,
            recipientEmail: email,
            status: "PENDING",
            attemptCount: 0,
            maxAttempts: DEFAULT_RETRY_CONFIG.maxAttempts,
            nextRetryAt: new Date(), // Attempt immediately
          },
        });

        // Send notification via Kafka producer
        await this.sendEmailNotification(email, task, taskDetails);
      } catch (err) {
        console.error(
          `[TaskNotification] Error creating notification log for ${email}:`,
          err
        );
      }
    }
  }

  /**
   * Send single email notification via Kafka producer
   */
  private async sendEmailNotification(
    recipientEmail: string,
    task: Task,
    taskDetails: any
  ): Promise<void> {
    try {
      const template = task.context?.role === "COACH" 
        ? "coach_training_assignment"
        : "referee_task_assignment";

      const notificationData = {
        // Recipient
        to: recipientEmail,
        channel: "email",
        template,

        // Data for email template
        data: {
          taskId: task.id,
          taskName: taskDetails.taskName,
          assignedBy: taskDetails.assignedByName,
          trainingType: taskDetails.trainingType,
          sessionDuration: taskDetails.sessionDuration,
          playerCount: taskDetails.playerCount,
          dueDate: taskDetails.dueDate?.toISOString(),
          notes: taskDetails.notes,
          actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/tasks/${task.id}`,
        },
      };

      await notify(notificationData);
    } catch (error) {
      console.error(`[TaskNotification] Failed to send email to ${recipientEmail}:`, error);
      throw error;
    }
  }

  /**
   * Process failed notifications with retry logic
   * Call this from a background job that runs periodically (e.g., every 5 minutes)
   */
  async processRetries(): Promise<void> {
    try {
      const now = new Date();

      // Find all pending notifications that are ready for retry
      const failedNotifications = await prisma.notificationLog.findMany({
        where: {
          status: { in: ["PENDING", "FAILED"] },
          nextRetryAt: {
            lte: now,
          },
          attemptCount: {
            lt: DEFAULT_RETRY_CONFIG.maxAttempts,
          },
        },
        include: {
          task: {
            include: {
              template: true,
              assignedBy: true,
            },
          },
        },
      });

      for (const notification of failedNotifications) {
        await this.retryNotification(notification);
      }
    } catch (error) {
      console.error("[TaskNotification] Error processing retries:", error);
    }
  }

  /**
   * Retry sending a single notification with exponential backoff
   */
  private async retryNotification(notification: any): Promise<void> {
    try {
      const { task } = notification;
      const retryIndex = notification.attemptCount;
      const nextRetryIndex = retryIndex + 1;

      // Calculate next retry time
      let nextRetryAt = null;
      if (nextRetryIndex < DEFAULT_RETRY_CONFIG.intervalMinutes.length) {
        const intervalMinutes =
          DEFAULT_RETRY_CONFIG.intervalMinutes[nextRetryIndex];
        nextRetryAt = new Date(Date.now() + intervalMinutes * 60 * 1000);
      } else if (nextRetryIndex >= DEFAULT_RETRY_CONFIG.maxAttempts) {
        // Max retries reached - mark as failed
        nextRetryAt = null;
      }

      try {
        // Attempt to send email
        const taskDetails = {
          taskName: task.template?.name || "New Task",
          assignedByName: task.assignedBy?.firstName + " " + task.assignedBy?.lastName || "Administrator",
          trainingType: task.context?.trainingType,
          sessionDuration: task.context?.sessionDuration,
          dueDate: task.dueDate,
          notes: task.notes,
          playerCount: task.context?.playerCount,
        };

        await this.sendEmailNotification(notification.recipientEmail, task, taskDetails);

        // Update notification log to SENT or DELIVERED
        await prisma.notificationLog.update({
          where: { id: notification.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
            attemptCount: nextRetryIndex,
            nextRetryAt: null, // No more retries needed
            lastError: null,
          },
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);

        if (nextRetryIndex >= DEFAULT_RETRY_CONFIG.maxAttempts) {
          // Mark as failed after max attempts
          await prisma.notificationLog.update({
            where: { id: notification.id },
            data: {
              status: "FAILED",
              attemptCount: nextRetryIndex,
              nextRetryAt: null,
              lastError: errorMsg,
            },
          });
        } else {
          // Update for next retry
          await prisma.notificationLog.update({
            where: { id: notification.id },
            data: {
              status: "FAILED",
              attemptCount: nextRetryIndex,
              nextRetryAt,
              lastError: errorMsg,
            },
          });
        }

        throw err;
      }
    } catch (error) {
      console.error(
        `[TaskNotification] Error retrying notification ${notification.id}:`,
        error
      );
    }
  }

  /**
   * Get notification status for a task
   */
  async getTaskNotificationStatus(taskId: string): Promise<any[]> {
    return prisma.notificationLog.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Mark notification as delivered (after email provider confirmation)
   */
  async markAsDelivered(notificationId: string): Promise<void> {
    await prisma.notificationLog.update({
      where: { id: notificationId },
      data: {
        status: "DELIVERED",
      },
    });
  }

  /**
   * Get failed notifications that need attention
   */
  async getFailedNotifications(limit: number = 50): Promise<any[]> {
    return prisma.notificationLog.findMany({
      where: { status: "FAILED" },
      include: {
        task: {
          select: {
            id: true,
            context: true,
            dueDate: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
  }

  /**
   * Manual retry for a specific failed notification
   */
  async manualRetry(notificationId: string): Promise<void> {
    const notification = await prisma.notificationLog.findUnique({
      where: { id: notificationId },
      include: {
        task: {
          include: {
            template: true,
            assignedBy: true,
          },
        },
      },
    });

    if (!notification) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    // Reset for retry
    await prisma.notificationLog.update({
      where: { id: notificationId },
      data: {
        status: "PENDING",
        nextRetryAt: new Date(),
        lastError: null,
      },
    });

    await this.retryNotification(notification);
  }
}

export const taskNotificationService = new TaskNotificationService();
