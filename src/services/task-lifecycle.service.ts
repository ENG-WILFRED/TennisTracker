/**
 * Task Lifecycle Service
 * Manages task state transitions and core operations
 */

import prisma from "@/lib/prisma";
import { taskNotificationService } from "./task-notification.service";
import {
  Task,
  TaskStatus,
  TaskAction,
  UpdateTaskStatusPayload,
  AssignTaskPayload,
  StatusHistoryEntry,
} from "@/types/task-system";

class TaskLifecycleService {
  /**
   * Assign a task to a user
   */
  async assignTask(
    organizationId: string,
    adminId: string,
    payload: AssignTaskPayload
  ): Promise<Task> {
    const statusHistory: StatusHistoryEntry[] = [
      {
        status: TaskStatus.ASSIGNED,
        timestamp: new Date(),
        changedBy: adminId,
        notes: "Task assigned",
      },
    ];

    const task = await prisma.task.create({
      data: {
        templateId: payload.templateId,
        organizationId,
        assignedToId: payload.assignedToId,
        assignedById: adminId,
        context: payload.context,
        dueDate: payload.dueDate,
        notes: payload.notes,
        status: TaskStatus.ASSIGNED,
        statusHistory: JSON.stringify(statusHistory),
      },
      include: {
        template: true,
        submissions: true,
        assignedTo: {
          include: {
            user: true,
          },
        },
        assignedBy: true,
      },
    });

    // Send notification to assigned user (coach/referee) and players
    try {
      const assignedToEmail = task.assignedTo?.user?.email;
      const assignedToName = task.assignedTo?.user 
        ? `${task.assignedTo.user.firstName} ${task.assignedTo.user.lastName}`
        : "Team Member";

      if (assignedToEmail) {
        const assignedByName = task.assignedBy
          ? `${task.assignedBy.firstName} ${task.assignedBy.lastName}`
          : "Administrator";

        // Send notification to assigned coach/referee
        await taskNotificationService.sendTaskNotification({
          task: this.formatTask(task),
          targetEmails: [assignedToEmail],
          taskDetails: {
            taskName: task.template?.name || "Training Task",
            assignedByName,
            trainingType: (task.context as any)?.trainingType,
            sessionDuration: (task.context as any)?.sessionDuration,
            dueDate: task.dueDate || undefined,
            notes: task.notes || undefined,
            playerCount: (task.context as any)?.playerCount,
          },
        });
      }

      // Also send to selected players if this is a coach task
      if (
        task.context &&
        typeof task.context === "object" && 
        "role" in task.context &&
        task.context.role === "COACH"
      ) {
        const selectedPlayerIds = (task.context as any).selectedPlayerIds || [];
        
        if (selectedPlayerIds.length > 0) {
          // Fetch player emails
          const players = await prisma.player.findMany({
            where: {
              userId: {
                in: selectedPlayerIds,
              },
            },
            include: {
              user: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          });

          const playerEmails = players
            .map((p) => p.user?.email)
            .filter((email): email is string => !!email);

          if (playerEmails.length > 0) {
            const assignedByName = task.assignedBy
              ? `${task.assignedBy.firstName} ${task.assignedBy.lastName}`
              : "Administrator";

            await taskNotificationService.sendTaskNotification({
              task: this.formatTask(task),
              targetEmails: playerEmails,
              taskDetails: {
                taskName: task.template?.name || "Training Task",
                assignedByName,
                trainingType: (task.context as any).trainingType,
                sessionDuration: (task.context as any).sessionDuration,
                dueDate: task.dueDate || undefined,
                notes: task.notes || undefined,
                playerCount: (task.context as any).playerCount || selectedPlayerIds.length,
              },
            });
          }
        }
      }
    } catch (error) {
      // Log error but don't fail the task assignment
      console.error("[TaskLifecycleService] Error sending task notifications:", error);
    }

    return this.formatTask(task);
  }

  /**
   * Accept a task
   * ASSIGNED -> ACCEPTED
   */
  async acceptTask(taskId: string, userId: string): Promise<Task> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { template: true },
    });

    if (!task) throw new Error("Task not found");
    if (task.assignedToId !== userId) throw new Error("Not authorized");
    if (task.status !== TaskStatus.ASSIGNED) {
      throw new Error(`Cannot accept task with status: ${task.status}`);
    }

    const statusHistory = this.addStatusEntry(
      task.statusHistory as any,
      TaskStatus.ACCEPTED,
      TaskAction.ACCEPTED,
      userId
    );

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.ACCEPTED,
        statusHistory: JSON.stringify(statusHistory),
      },
      include: {
        template: true,
        submissions: true,
      },
    });

    await this.addTaskHistory(
      taskId,
      TaskStatus.ACCEPTED,
      TaskAction.ACCEPTED,
      userId,
      "Task accepted by assignee"
    );

    return this.formatTask(updated);
  }

  /**
   * Start a task
   * ACCEPTED -> IN_PROGRESS
   */
  async startTask(taskId: string, userId: string): Promise<Task> {
    const task = await prisma.task.findUnique({ where: { id: taskId } });

    if (!task) throw new Error("Task not found");
    if (task.assignedToId !== userId) throw new Error("Not authorized");
    if (task.status !== TaskStatus.ACCEPTED) {
      throw new Error(`Cannot start task with status: ${task.status}`);
    }

    const statusHistory = this.addStatusEntry(
      task.statusHistory as any,
      TaskStatus.IN_PROGRESS,
      TaskAction.STARTED,
      userId
    );

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.IN_PROGRESS,
        startedAt: new Date(),
        statusHistory: JSON.stringify(statusHistory),
      },
      include: {
        template: true,
        submissions: true,
      },
    });

    await this.addTaskHistory(
      taskId,
      TaskStatus.IN_PROGRESS,
      TaskAction.STARTED,
      userId,
      "Task started"
    );

    return this.formatTask(updated);
  }

  /**
   * Complete a task
   * IN_PROGRESS -> COMPLETED
   */
  async completeTask(
    taskId: string,
    userId: string,
    notes?: string
  ): Promise<Task> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { template: true },
    });

    if (!task) throw new Error("Task not found");
    if (task.assignedToId !== userId) throw new Error("Not authorized");
    if (task.status !== TaskStatus.IN_PROGRESS) {
      throw new Error(`Cannot complete task with status: ${task.status}`);
    }

    const statusHistory = this.addStatusEntry(
      task.statusHistory as any,
      TaskStatus.COMPLETED,
      TaskAction.COMPLETED,
      userId,
      notes
    );

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
        statusHistory: JSON.stringify(statusHistory),
      },
      include: {
        template: true,
        submissions: true,
      },
    });

    await this.addTaskHistory(
      taskId,
      TaskStatus.COMPLETED,
      TaskAction.COMPLETED,
      userId,
      notes || "Task completed"
    );

    return this.formatTask(updated);
  }

  /**
   * Reject a task
   * IN_PROGRESS | ACCEPTED -> FAILED
   */
  async rejectTask(
    taskId: string,
    userId: string,
    reason: string
  ): Promise<Task> {
    const task = await prisma.task.findUnique({ where: { id: taskId } });

    if (!task) throw new Error("Task not found");
    if (
      task.status !== TaskStatus.IN_PROGRESS &&
      task.status !== TaskStatus.ACCEPTED
    ) {
      throw new Error(
        `Cannot reject task with status: ${task.status}. Must be IN_PROGRESS or ACCEPTED`
      );
    }

    const statusHistory = this.addStatusEntry(
      task.statusHistory as any,
      TaskStatus.FAILED,
      TaskAction.REJECTED,
      userId,
      reason
    );

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.FAILED,
        rejectionReason: reason,
        statusHistory: JSON.stringify(statusHistory),
      },
      include: {
        template: true,
        submissions: true,
      },
    });

    await this.addTaskHistory(
      taskId,
      TaskStatus.FAILED,
      TaskAction.REJECTED,
      userId,
      `Task rejected: ${reason}`
    );

    return this.formatTask(updated);
  }

  /**
   * Cancel a task
   */
  async cancelTask(
    taskId: string,
    userId: string,
    reason?: string
  ): Promise<Task> {
    const task = await prisma.task.findUnique({ where: { id: taskId } });

    if (!task) throw new Error("Task not found");
    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
      throw new Error(`Cannot cancel task with status: ${task.status}`);
    }

    const statusHistory = this.addStatusEntry(
      task.statusHistory as any,
      TaskStatus.CANCELLED,
      TaskAction.CANCELLED,
      userId,
      reason
    );

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.CANCELLED,
        statusHistory: JSON.stringify(statusHistory),
      },
      include: {
        template: true,
        submissions: true,
      },
    });

    await this.addTaskHistory(
      taskId,
      TaskStatus.CANCELLED,
      TaskAction.CANCELLED,
      userId,
      reason || "Task cancelled"
    );

    return this.formatTask(updated);
  }

  /**
   * Get task by ID
   */
  async getTask(taskId: string): Promise<Task | null> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        template: {
          include: { sections: { include: { fields: true } } },
        },
        submissions: true,
        history: true,
      },
    });

    return task ? this.formatTask(task) : null;
  }

  /**
   * Get tasks by organization
   */
  async getTasksByOrganization(organizationId: string): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: { organizationId },
      include: {
        template: true,
        submissions: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return tasks.map((t) => this.formatTask(t));
  }

  /**
   * Get tasks assigned to a user
   */
  async getTasksAssignedTo(userId: string): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: { assignedToId: userId },
      include: {
        template: true,
        submissions: true,
      },
      orderBy: { dueDate: "asc" },
    });

    return tasks.map((t) => this.formatTask(t));
  }

  /**
   * Get tasks by status
   */
  async getTasksByStatus(organizationId: string, status: TaskStatus): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: { organizationId, status },
      include: {
        template: true,
        submissions: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return tasks.map((t) => this.formatTask(t));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helper Methods
  // ─────────────────────────────────────────────────────────────────────────

  private addStatusEntry(
    history: any[],
    status: TaskStatus,
    action: TaskAction,
    userId: string,
    notes?: string
  ): StatusHistoryEntry[] {
    const entries = Array.isArray(history) ? history : [];
    entries.push({
      status,
      timestamp: new Date(),
      changedBy: userId,
      notes,
    });
    return entries;
  }

  private async addTaskHistory(
    taskId: string,
    status: TaskStatus,
    action: TaskAction,
    userId: string,
    notes?: string,
    metadata?: Record<string, any>
  ) {
    await prisma.taskHistory.create({
      data: {
        taskId,
        status,
        action,
        changedByUserId: userId,
        notes,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    });
  }

  private formatTask(task: any): Task {
    return {
      id: task.id,
      templateId: task.templateId,
      organizationId: task.organizationId,
      assignedToId: task.assignedToId,
      assignedById: task.assignedById,
      status: task.status as TaskStatus,
      statusHistory: Array.isArray(task.statusHistory)
        ? task.statusHistory
        : JSON.parse(task.statusHistory || "[]"),
      context: task.context,
      dueDate: task.dueDate,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
      rejectionReason: task.rejectionReason,
      notes: task.notes,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      template: task.template,
      submissions: task.submissions,
    };
  }
}

export const taskLifecycleService = new TaskLifecycleService();
