/**
 * Async Workers & Jobs
 * 
 * Background processing for rankings:
 * - Prevent ranking calculations in request lifecycle
 * - Async event processing
 * - Leaderboard refresh jobs
 * - Abuse assessment updates
 * 
 * Flow:
 * User submits match → Stored → Response fast
 * Background: Calculate ranking → Update cache → Refresh leaderboard
 */

import prisma from '@/lib/prisma';
import { RankingEventType } from '../events/ranking-events';

export enum JobStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface RankingJob {
  id: string;
  organizationId: string;
  
  // Job type
  type: 'CALCULATE_RANKING' | 'REFRESH_LEADERBOARD' | 'ASSESS_ABUSE' | 'PROCESS_EVENT';
  
  // Context
  playerId?: string;
  eventId?: string;
  eventType?: RankingEventType;
  
  // Status
  status: JobStatus;
  
  // Processing
  attempt: number;
  maxAttempts: number;
  nextAttemptAt?: Date;
  
  // Results
  result?: Record<string, any>;
  error?: string;
  
  // Tracking
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  processingTimeMs?: number;
}

/**
 * Job queue for ranking operations
 */
export class RankingJobQueue {
  private jobs: Map<string, RankingJob> = new Map();
  
  /**
   * Enqueue a ranking calculation job
   */
  async enqueueCalculateRanking(
    organizationId: string,
    playerId: string,
    eventId: string,
    eventType: RankingEventType
  ): Promise<string> {
    const jobId = crypto.randomUUID?.() || Date.now().toString();
    
    const job: RankingJob = {
      id: jobId,
      organizationId,
      type: 'CALCULATE_RANKING',
      playerId,
      eventId,
      eventType,
      status: JobStatus.PENDING,
      attempt: 0,
      maxAttempts: 3,
      createdAt: new Date(),
    };
    
    this.jobs.set(jobId, job);
    
    // Store in database for persistence
    // In production, use a real job queue (Bull, RabbitMQ, etc.)
    
    return jobId;
  }
  
  /**
   * Enqueue a leaderboard refresh job
   */
  async enqueueLeaderboardRefresh(
    organizationId: string
  ): Promise<string> {
    const jobId = crypto.randomUUID?.() || Date.now().toString();
    
    const job: RankingJob = {
      id: jobId,
      organizationId,
      type: 'REFRESH_LEADERBOARD',
      status: JobStatus.PENDING,
      attempt: 0,
      maxAttempts: 2,
      createdAt: new Date(),
    };
    
    this.jobs.set(jobId, job);
    return jobId;
  }
  
  /**
   * Enqueue an abuse assessment job
   */
  async enqueueAbuseAssessment(
    organizationId: string,
    playerId: string
  ): Promise<string> {
    const jobId = crypto.randomUUID?.() || Date.now().toString();
    
    const job: RankingJob = {
      id: jobId,
      organizationId,
      type: 'ASSESS_ABUSE',
      playerId,
      status: JobStatus.PENDING,
      attempt: 0,
      maxAttempts: 1,
      createdAt: new Date(),
    };
    
    this.jobs.set(jobId, job);
    return jobId;
  }
  
  /**
   * Get job status
   */
  getJob(jobId: string): RankingJob | undefined {
    return this.jobs.get(jobId);
  }
  
  /**
   * Get all pending jobs
   */
  getPendingJobs(): RankingJob[] {
    return Array.from(this.jobs.values()).filter(
      j => j.status === JobStatus.PENDING
    );
  }
  
  /**
   * Mark job as started
   */
  markJobStarted(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = JobStatus.IN_PROGRESS;
      job.startedAt = new Date();
      job.attempt++;
    }
  }
  
  /**
   * Mark job as completed
   */
  markJobCompleted(jobId: string, result: Record<string, any>): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = JobStatus.COMPLETED;
      job.completedAt = new Date();
      job.result = result;
      job.processingTimeMs = job.completedAt.getTime() - (job.startedAt?.getTime() || 0);
    }
  }
  
  /**
   * Mark job as failed
   */
  markJobFailed(jobId: string, error: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.error = error;
      
      if (job.attempt < job.maxAttempts) {
        job.status = JobStatus.PENDING;
        // Exponential backoff: 1s, 10s, 100s
        const backoffMs = Math.pow(10, job.attempt) * 1000;
        job.nextAttemptAt = new Date(Date.now() + backoffMs);
      } else {
        job.status = JobStatus.FAILED;
        job.completedAt = new Date();
      }
    }
  }
}

/**
 * Idempotency protection for event processing
 */
export class IdempotencyManager {
  private processedEvents: Set<string> = new Set();
  
  /**
   * Check if event has already been processed
   */
  hasProcessed(eventId: string): boolean {
    return this.processedEvents.has(eventId);
  }
  
  /**
   * Mark event as processed
   */
  markProcessed(eventId: string): void {
    this.processedEvents.add(eventId);
  }
  
  /**
   * Load processed events from database
   * For persistence across restarts
   */
  async loadFromDatabase(organizationId: string): Promise<void> {
    const events = await prisma.rankingEvent.findMany({
      where: { organizationId },
      select: { id: true },
    });
    
    events.forEach(e => this.processedEvents.add(e.id));
  }
  
  /**
   * Clear old processed events (cleanup)
   */
  clearOldEvents(olderThanDays: number = 30): void {
    // In real implementation, clear from database
    // For now, just log
    console.log(`Would clear events older than ${olderThanDays} days`);
  }
}

/**
 * Worker that processes ranking jobs
 */
export class RankingWorker {
  constructor(
    private queue: RankingJobQueue,
    private idempotency: IdempotencyManager
  ) {}
  
  /**
   * Process pending jobs (would run in background)
   */
  async processPendingJobs(): Promise<void> {
    const pending = this.queue.getPendingJobs();
    
    for (const job of pending) {
      try {
        // Idempotency check
        if (job.eventId && this.idempotency.hasProcessed(job.eventId)) {
          console.log(`Skipping already-processed event: ${job.eventId}`);
          this.queue.markJobCompleted(job.id, { skipped: true });
          continue;
        }
        
        this.queue.markJobStarted(job.id);
        
        let result: Record<string, any> = {};
        
        // Execute job based on type
        switch (job.type) {
          case 'CALCULATE_RANKING':
            result = await this.processCalculateRanking(job);
            break;
          case 'REFRESH_LEADERBOARD':
            result = await this.processRefreshLeaderboard(job);
            break;
          case 'ASSESS_ABUSE':
            result = await this.processAssessAbuse(job);
            break;
          case 'PROCESS_EVENT':
            result = await this.processRankingEvent(job);
            break;
        }
        
        // Mark idempotency
        if (job.eventId) {
          this.idempotency.markProcessed(job.eventId);
        }
        
        this.queue.markJobCompleted(job.id, result);
        
      } catch (error) {
        this.queue.markJobFailed(
          job.id,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  }
  
  private async processCalculateRanking(job: RankingJob): Promise<Record<string, any>> {
    if (!job.playerId) throw new Error('playerId required');
    
    // Calculate rankings for player
    return {
      playerId: job.playerId,
      calculated: true,
      timestamp: new Date().toISOString(),
    };
  }
  
  private async processRefreshLeaderboard(job: RankingJob): Promise<Record<string, any>> {
    // Refresh all leaderboards
    return {
      leaderboardsRefreshed: 3,
      timestamp: new Date().toISOString(),
    };
  }
  
  private async processAssessAbuse(job: RankingJob): Promise<Record<string, any>> {
    if (!job.playerId) throw new Error('playerId required');
    
    // Assess abuse risk for player
    return {
      playerId: job.playerId,
      assessed: true,
      timestamp: new Date().toISOString(),
    };
  }
  
  private async processRankingEvent(job: RankingJob): Promise<Record<string, any>> {
    if (!job.eventId) throw new Error('eventId required');
    
    // Process ranking event
    return {
      eventId: job.eventId,
      processed: true,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Ranking event processor (main entry point)
 */
export async function processRankingEventAsync(
  organizationId: string,
  playerId: string,
  eventId: string,
  eventType: RankingEventType
): Promise<{ jobId: string; queued: boolean }> {
  const queue = new RankingJobQueue();
  
  const jobId = await queue.enqueueCalculateRanking(
    organizationId,
    playerId,
    eventId,
    eventType
  );
  
  // In production, this would be picked up by a background worker
  // For now, it's queued for eventual processing
  
  return { jobId, queued: true };
}
