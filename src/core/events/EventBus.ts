/**
 * EventBus: Central hub for publishing domain events to Kafka
 * 
 * Responsibilities:
 * 1. Publish events to Kafka for async processing
 * 2. Store event records in EventLog table (audit trail + replay)
 * 3. Coordinate with event handlers via subscriptions
 * 4. Handle publishing failures gracefully
 */

import { publishNotification } from '@/app/api/notification/producer';
import prisma from '@/lib/prisma';
import { DomainEvent, DomainEventType } from './DomainEvent';

interface EventSubscription {
  eventType: DomainEventType | '*';
  handler: (event: DomainEvent) => Promise<void>;
  handlerName: string;
}

class EventBus {
  private subscriptions: EventSubscription[] = [];
  private kafkaEnabled: boolean;

  constructor() {
    this.kafkaEnabled = process.env.KAFKA_ENABLED !== 'false';
  }

  /**
   * Subscribe to domain events
   * '*' subscribes to all event types
   */
  subscribe(
    eventType: DomainEventType | '*',
    handler: (event: DomainEvent) => Promise<void>,
    handlerName: string
  ) {
    this.subscriptions.push({ eventType, handler, handlerName });
    console.log(`[EventBus] Subscribed: ${handlerName} → ${eventType}`);
  }

  /**
   * Publish a domain event
   * 
   * Flow:
   * 1. Store in EventLog (source of truth)
   * 2. Publish to Kafka (async workers)
   * 3. Invoke in-process handlers (if any)
   */
  async publish(event: DomainEvent): Promise<void> {
    try {
      // 1. STORE EVENT (audit trail + replay source)
      const storedEvent = await prisma.eventLog.create({
        data: {
          id: event.id,
          type: event.type,
          aggregateId: event.aggregateId,
          aggregateType: event.aggregateType,
          organizationId: event.organizationId,
          occurredAt: event.occurredAt,
          publishedAt: new Date(),
          status: 'published',
          payload: event.payload,
          metadata: event.metadata || {},
        },
      });

      console.log(
        `[EventBus] Published: ${event.type} (${event.aggregateType}/${event.aggregateId})`
      );

      // 2. PUBLISH TO KAFKA (for distributed workers)
      if (this.kafkaEnabled) {
        await publishNotification({
          id: event.id,
          to: event.organizationId, // Use org as routing key
          channel: 'email', // Kafka channel (not really email)
          template: event.type, // Template = event type
          data: {
            event: {
              id: event.id,
              type: event.type,
              aggregateId: event.aggregateId,
              aggregateType: event.aggregateType,
              organizationId: event.organizationId,
              occurredAt: event.occurredAt.toISOString(),
              payload: event.payload,
              metadata: event.metadata,
            },
          },
          timestamp: Date.now(),
        });
        console.log(`[EventBus] → Kafka: ${event.type}`);
      }

      // 3. INVOKE LOCAL HANDLERS (synchronous, for immediate side-effects)
      const handlers = this.subscriptions.filter(
        (s) => s.eventType === '*' || s.eventType === event.type
      );

      for (const { handler, handlerName } of handlers) {
        try {
          await handler(event);
          console.log(`[EventBus] ✓ Handler completed: ${handlerName}`);
        } catch (err) {
          console.error(
            `[EventBus] ✗ Handler failed: ${handlerName}`,
            err instanceof Error ? err.message : err
          );
          // Don't throw — continue with other handlers
        }
      }
    } catch (err) {
      console.error('[EventBus] Publish error:', err);
      throw err;
    }
  }

  /**
   * Replay events from EventLog for recovery/debugging
   * Only used when a handler needs to catch up
   */
  async replayEvents(
    since: Date,
    aggregateType?: string
  ): Promise<DomainEvent[]> {
    const events = await prisma.eventLog.findMany({
      where: {
        publishedAt: { gte: since },
        ...(aggregateType && { aggregateType }),
      },
      orderBy: { publishedAt: 'asc' },
    });

    return events.map((e: any) => ({
      id: e.id,
      type: e.type as DomainEventType,
      aggregateId: e.aggregateId,
      aggregateType: e.aggregateType,
      organizationId: e.organizationId,
      occurredAt: e.occurredAt,
      publishedAt: e.publishedAt || undefined,
      status: e.status as 'pending' | 'published' | 'processed' | 'failed',
      payload: e.payload,
      metadata: e.metadata as any,
    }));
  }
}

export const eventBus = new EventBus();

/**
 * Helper to publish an event and return the event ID
 */
export async function publishEvent(
  event: DomainEvent
): Promise<string> {
  await eventBus.publish(event);
  return event.id;
}

export default eventBus;
