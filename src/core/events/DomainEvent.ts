/**
 * DomainEvent: First-class system primitive for all domain state changes
 * 
 * Core principle: Everything important that happens in the system is an event.
 * Events are immutable, timestamped, and carry the complete context needed
 * for any listener to react (no N+1 queries, no tight coupling).
 */

export type DomainEventType =
  // Session Events
  | 'SESSION_CREATED'
  | 'SESSION_CONFIRMED'
  | 'SESSION_STARTED'
  | 'SESSION_COMPLETED'
  | 'SESSION_NO_SHOW'
  | 'SESSION_CANCELLED'
  
  // Player Progress Events
  | 'PROGRESS_UPDATE_SUBMITTED'
  | 'METRICS_UPDATED'
  | 'PLAYER_MILESTONE_REACHED'
  
  // Payment Events
  | 'SESSION_BILLED'
  | 'INVOICE_CREATED'
  | 'INVOICE_PAID'
  | 'PAYMENT_FAILED'
  | 'REFUND_ISSUED'
  
  // Coach Earnings Events
  | 'COACH_EARNING_RECORDED'
  | 'PAYOUT_SCHEDULED'
  | 'PAYOUT_PROCESSED'
  
  // Recommendation Events
  | 'RECOMMENDATION_GENERATED'
  | 'RECOMMENDATION_ACCEPTED'
  | 'RECOMMENDATION_DISMISSED'
  
  // Notification Events
  | 'NOTIFICATION_TRIGGERED'
  | 'NOTIFICATION_SENT'
  | 'NOTIFICATION_FAILED';

export interface DomainEventPayload {
  [key: string]: any;
}

export interface DomainEvent {
  // Identity
  id: string;
  type: DomainEventType;
  
  // Aggregate root reference (what changed)
  aggregateId: string;      // Primary entity ID (sessionId, playerId, etc.)
  aggregateType: string;    // Entity type (Session, Player, Organization, etc.)
  organizationId: string;   // For multi-tenant isolation
  
  // Event context
  occurredAt: Date;         // When it actually happened
  publishedAt?: Date;       // When it was published to event stream
  processedAt?: Date;       // When it was processed by handlers
  
  // Event payload (complete context for all handlers)
  payload: DomainEventPayload;
  
  // Processing metadata
  status: 'pending' | 'published' | 'processed' | 'failed';
  metadata?: {
    userId?: string;        // Who triggered it
    source?: string;        // API, Job, System, etc.
    correlationId?: string; // For tracing related events
    causationId?: string;   // Parent event that caused this
  };
}

/**
 * Factory for creating domain events
 */
export function createDomainEvent(
  type: DomainEventType,
  aggregateId: string,
  aggregateType: string,
  organizationId: string,
  payload: DomainEventPayload,
  metadata?: DomainEvent['metadata']
): DomainEvent {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    aggregateId,
    aggregateType,
    organizationId,
    occurredAt: new Date(),
    status: 'pending',
    payload,
    metadata,
  };
}

/**
 * For tracking which events have been processed by which handlers
 * (prevents duplicate processing on retry/recovery)
 */
export interface EventProcessingRecord {
  eventId: string;
  handlerName: string;
  processedAt: Date;
  status: 'success' | 'failure';
  error?: string;
  retryCount?: number;
}
