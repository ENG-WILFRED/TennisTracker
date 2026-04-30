/**
 * Kafka Consumer Worker: Process events from Kafka in background
 * 
 * This runs in a separate Node.js process/container:
 * - Listens to Kafka topics for domain events
 * - Calls event handlers asynchronously
 * - Handles retries and dead-letter queues
 * - Tracks processing state
 * 
 * Start with: npm run worker:events
 */

import { Kafka, logLevel, Consumer } from 'kafkajs';
import dotenv from 'dotenv';
import { prisma } from '@/lib/prisma';
import {
  handleSessionCompleted,
  handleSessionCompletedPayment,
  handleSessionCompletedEarnings,
  handleSessionCompletedNotifications,
  handleSessionCompletedRecommendations,
} from './handlers/SessionHandlers';
import { DomainEvent, DomainEventType } from './DomainEvent';

dotenv.config();

const KAFKA_ENABLED = process.env.KAFKA_ENABLED !== 'false';
const KAFKA_TOPIC = process.env.KAFKA_TOPIC || 'notifications';
const CONSUMER_GROUP = process.env.KAFKA_CONSUMER_GROUP || 'event-processors';

interface EventHandler {
  event: DomainEventType | '*';
  handler: (event: DomainEvent) => Promise<void>;
  name: string;
}

class EventWorker {
  private kafka: Kafka;
  private consumer: Consumer | null = null;
  private handlers: EventHandler[] = [];
  private isRunning = false;

  constructor() {
    const brokerString = process.env.KAFKA_BROKERS || 'localhost:9092';
    const brokers = Array.isArray(brokerString)
      ? brokerString
      : String(brokerString).split(',').map((b) => b.trim());

    const kafkaOptions: any = {
      clientId: `event-worker-${process.env.WORKER_ID || 'default'}`,
      brokers,
      logLevel: logLevel.WARN,
      connectionTimeout: 15000,
      requestTimeout: 30000,
      retry: {
        initialRetryTime: 300,
        retries: 8,
        maxRetryTime: 30000,
      },
    };

    if (process.env.KAFKA_SASL_USERNAME && process.env.KAFKA_SASL_PASSWORD) {
      kafkaOptions.ssl = { rejectUnauthorized: false };
      kafkaOptions.sasl = {
        mechanism: (process.env.KAFKA_SASL_MECHANISM || 'scram-sha-256') as any,
        username: process.env.KAFKA_SASL_USERNAME,
        password: process.env.KAFKA_SASL_PASSWORD,
      };
      console.log(`[Worker] Kafka: ${brokers.join(',')} with SASL/SSL`);
    }

    this.kafka = new Kafka(kafkaOptions);
  }

  registerHandler(
    eventType: DomainEventType | '*',
    handler: (event: DomainEvent) => Promise<void>,
    name: string
  ) {
    this.handlers.push({ event: eventType, handler, name });
  }

  async start() {
    if (!KAFKA_ENABLED) {
      console.log('[Worker] Kafka disabled, exiting');
      return;
    }

    try {
      this.consumer = this.kafka.consumer({ groupId: CONSUMER_GROUP });
      await this.consumer.connect();
      console.log('[Worker] ✓ Connected to Kafka');

      await this.consumer.subscribe({ topic: KAFKA_TOPIC, fromBeginning: false });
      console.log(`[Worker] ✓ Subscribed to topic: ${KAFKA_TOPIC}`);

      this.isRunning = true;

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            if (!message.value) return;

            const messageStr = message.value.toString();
            const parsed = JSON.parse(messageStr);

            // Extract event from notification wrapper
            const event: DomainEvent = parsed.data?.event || parsed;

            console.log(
              `[Worker] Processing event: ${event.type} (${event.aggregateType}/${event.aggregateId})`
            );

            // Find matching handlers
            const matchingHandlers = this.handlers.filter(
              (h) => h.event === '*' || h.event === event.type
            );

            if (matchingHandlers.length === 0) {
              console.warn(`[Worker] ⚠ No handlers for event type: ${event.type}`);
              return;
            }

            // Run handlers in parallel (independent, no coupling)
            const results = await Promise.allSettled(
              matchingHandlers.map((h) =>
                this.executeHandler(h, event)
              )
            );

            // Track results
            const successes = results.filter((r) => r.status === 'fulfilled').length;
            const failures = results.filter((r) => r.status === 'rejected').length;

            console.log(
              `[Worker] ✓ Event processed: ${successes} success, ${failures} failures`
            );

            // Update EventLog status
            await prisma.eventLog.update({
              where: { id: event.id },
              data: {
                status: failures === 0 ? 'processed' : 'failed',
                processedAt: new Date(),
              },
            });
          } catch (err) {
            console.error('[Worker] Message processing error:', err);
          }
        },
      });

      console.log('[Worker] ✓ Event worker started, listening for events...');
    } catch (err) {
      console.error('[Worker] Failed to start:', err);
      process.exit(1);
    }
  }

  private async executeHandler(
    handler: EventHandler,
    event: DomainEvent
  ): Promise<void> {
    const startTime = Date.now();
    try {
      await handler.handler(event);
      const duration = Date.now() - startTime;
      console.log(`[Worker] ✓ Handler succeeded: ${handler.name} (${duration}ms)`);
    } catch (err) {
      const duration = Date.now() - startTime;
      console.error(
        `[Worker] ✗ Handler failed: ${handler.name} (${duration}ms)`,
        err instanceof Error ? err.message : err
      );
      throw err; // Re-throw for allSettled tracking
    }
  }

  async stop() {
    if (this.consumer) {
      await this.consumer.disconnect();
      this.isRunning = false;
      console.log('[Worker] Disconnected');
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// MAIN: Start the worker
// ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧵 EVENT PROCESSING WORKER');
  console.log('═══════════════════════════════════════════════════════');

  const worker = new EventWorker();

  // Register all handlers
  worker.registerHandler(
    'SESSION_COMPLETED',
    handleSessionCompleted,
    'SessionMetricsHandler'
  );
  worker.registerHandler(
    'SESSION_COMPLETED',
    handleSessionCompletedPayment,
    'SessionPaymentHandler'
  );
  worker.registerHandler(
    'SESSION_COMPLETED',
    handleSessionCompletedEarnings,
    'SessionEarningsHandler'
  );
  worker.registerHandler(
    'SESSION_COMPLETED',
    handleSessionCompletedNotifications,
    'SessionNotificationHandler'
  );
  worker.registerHandler(
    'SESSION_COMPLETED',
    handleSessionCompletedRecommendations,
    'SessionRecommendationHandler'
  );

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n[Worker] Shutting down gracefully...');
    await worker.stop();
    process.exit(0);
  });

  // Start
  await worker.start();
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { EventWorker };
export default main;
