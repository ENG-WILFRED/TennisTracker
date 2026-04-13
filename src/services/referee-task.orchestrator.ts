/**
 * Referee Task Orchestrator
 * Handles referee-specific task workflow
 * 
 * Flow:
 * ASSIGNED → ACCEPTED → IN_PROGRESS → COMPLETED
 * 
 * Referee tasks are EVENT-DRIVEN (matches/events drive completion)
 * vs FORM-DRIVEN (coaches submit forms)
 */

import prisma from "@/lib/prisma";
import { Task, TaskStatus } from "@/types/task-system";
import { taskLifecycleService } from "./task-lifecycle.service";

class RefereeTaskOrchestrator {
  /**
   * Get referee's work items dashboard
   */
  async getRefereeDashboard(refereeId: string) {
    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: refereeId,
        template: { role: "REFEREE" },
      },
      include: { 
        template: true,
        submissions: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Get referee assignment count
    const assignmentCount = tasks.filter(t => t.status === TaskStatus.ASSIGNED).length;
    const activeCount = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const completedCount = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;

    // Get pending match reports
    const pendingMatches = await prisma.match.findMany({
      where: {
        refereeId,
        report: null,
      },
      include: {
        playerA: { include: { user: { select: { firstName: true, lastName: true } } } },
        playerB: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      stats: {
        assigned: assignmentCount,
        active: activeCount,
        completed: completedCount,
      },
      tasks: {
        assigned: tasks.filter(t => t.status === TaskStatus.ASSIGNED),
        active: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS),
        completed: tasks.filter(t => t.status === TaskStatus.COMPLETED),
      },
      pendingReports: {
        count: pendingMatches.length,
        matches: pendingMatches,
      },
    };
  }

  /**
   * Accept task assignment
   */
  async acceptTournament(taskId: string, refereeId: string): Promise<Task> {
    return taskLifecycleService.acceptTask(taskId, refereeId);
  }

  /**
   * Start working on task
   */
  async startTournament(taskId: string, refereeId: string): Promise<Task> {
    return taskLifecycleService.startTask(taskId, refereeId);
  }

  /**
   * Get task status and details
   */
  async getTournamentStatus(taskId: string, refereeId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { template: true },
    });

    if (!task) throw new Error("Task not found");
    if (task.assignedToId !== refereeId) throw new Error("Not authorized");

    // Get matches assigned to this referee
    const matches = await prisma.match.findMany({
      where: { refereeId },
      include: {
        playerA: { include: { user: { select: { firstName: true, lastName: true } } } },
        playerB: { include: { user: { select: { firstName: true, lastName: true } } } },
        report: true,
      },
      orderBy: { round: "asc" },
    });

    const reportsSubmitted = matches.filter(m => m.report).length;
    const reportsPending = matches.length - reportsSubmitted;

    return {
      task,
      summary: {
        totalMatches: matches.length,
        reportsSubmitted,
        reportsPending,
        isComplete: reportsPending === 0,
      },
      matches,
    };
  }

  /**
   * Complete task
   */
  async completeTournament(
    taskId: string,
    refereeId: string
  ): Promise<Task> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) throw new Error("Task not found");
    if (task.assignedToId !== refereeId) throw new Error("Not authorized");

    return taskLifecycleService.completeTask(
      taskId,
      refereeId,
      "Task completed by referee"
    );
  }

  /**
   * Get pending match reports
   */
  async getPendingMatchReports(refereeId: string) {
    const matches = await prisma.match.findMany({
      where: {
        refereeId,
        report: null,
      },
      include: {
        playerA: { include: { user: { select: { firstName: true, lastName: true } } } },
        playerB: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: "asc" },
    });

    return matches;
  }

  /**
   * Get task details for referee
   */
  async getTaskDetails(taskId: string, refereeId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { 
        template: true,
        submissions: {
          where: { submittedByUserId: refereeId },
        },
        history: true,
      },
    });

    if (!task) throw new Error("Task not found");
    if (task.assignedToId !== refereeId) throw new Error("Not authorized");

    return task;
  }

  /**
   * Reject task
   */
  async rejectTournament(
    taskId: string,
    refereeId: string,
    reason: string
  ): Promise<Task> {
    return taskLifecycleService.rejectTask(taskId, refereeId, reason);
  }
}

export const refereeTaskOrchestrator = new RefereeTaskOrchestrator();
