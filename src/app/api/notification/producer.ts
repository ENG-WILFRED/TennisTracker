import { Kafka, logLevel } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

export interface NotificationPayload {
  id: string;
  to: string;
  channel: 'email' | 'sms';
  template: string;
  data: Record<string, unknown>;
  timestamp: number;
}

let kafkaClient: Kafka | null = null;
let producer: any | null = null;
let producerInitializing = false;

const KAFKA_ENABLED = process.env.KAFKA_ENABLED !== 'false'; // Default to enabled

/**
 * Get or create a Kafka client with SASL/SSL configuration
 * For Aiven Kafka service, use environment variables:
 * - KAFKA_BROKERS: comma-separated broker list
 * - KAFKA_SASL_USERNAME: username for SASL
 * - KAFKA_SASL_PASSWORD: password for SASL
 * - KAFKA_SASL_MECHANISM: SASL mechanism (default: scram-sha-256)
 */
function getKafkaClient(): Kafka {
  if (kafkaClient) return kafkaClient;

  const brokerString = process.env.KAFKA_BROKERS || process.env.KAFKA_BROKER || 'localhost:9092';
  const brokers = Array.isArray(brokerString) 
    ? brokerString 
    : String(brokerString).split(',').map((b) => b.trim());

  const kafkaOptions: any = {
    clientId: process.env.KAFKA_CLIENT_ID || 'tennis-tracker-producer',
    brokers,
    logLevel: logLevel.WARN,
    connectionTimeout: 15000,
    requestTimeout: 30000,
    retry: {
      initialRetryTime: 300,
      retries: 8,
      maxRetryTime: 30000,
      randomizationFactor: 0.2,
      multiplier: 2
    }
  };

  // Add SASL/SSL if credentials are present
  if (process.env.KAFKA_SASL_USERNAME && process.env.KAFKA_SASL_PASSWORD) {
    kafkaOptions.ssl = {
      rejectUnauthorized: false
    };
    kafkaOptions.sasl = {
      mechanism: (process.env.KAFKA_SASL_MECHANISM || 'scram-sha-256') as any,
      username: process.env.KAFKA_SASL_USERNAME,
      password: process.env.KAFKA_SASL_PASSWORD
    };
    console.log(`[KAFKA-PRODUCER] Connecting to ${brokers.join(',')} with SASL/SSL`);
  } else {
    console.log(`[KAFKA-PRODUCER] Connecting to ${brokers.join(',')} without SASL/SSL`);
  }

  kafkaClient = new Kafka(kafkaOptions);
  return kafkaClient;
}

export async function createProducer(): Promise<any | null> {
  if (!KAFKA_ENABLED) {
    console.log('[KAFKA-PRODUCER] Kafka is disabled (KAFKA_ENABLED=false)');
    return null;
  }

  // If already cached, return it
  if (producer) return producer;

  // If currently initializing, wait for it
  if (producerInitializing) {
    let retries = 0;
    while (producerInitializing && retries < 50) {
      await new Promise((r) => setTimeout(r, 100));
      retries++;
    }
    return producer || null;
  }

  producerInitializing = true;

  try {
    const kafka = getKafkaClient();
    producer = kafka.producer({
      maxInFlightRequests: 5,
      idempotent: true,
      transactionTimeout: 30000,
    });

    await producer.connect();
    console.log('[KAFKA-PRODUCER] ✓ Producer connected successfully');
    producerInitializing = false;
    return producer;
  } catch (err) {
    producerInitializing = false;
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[KAFKA-PRODUCER] Failed to create producer:', errMsg);
    producer = null;
    return null;
  }
}

export const initProducer = createProducer;

export async function publishNotification(payload: NotificationPayload): Promise<void> {
  if (!KAFKA_ENABLED) {
    console.log('[KAFKA] Notifications disabled, skipping');
    return;
  }

  try {
    const p = await createProducer();
    if (!p) {
      console.warn('[KAFKA] Producer not available, notification discarded:', payload.id);
      return;
    }

    const topic = process.env.KAFKA_TOPIC || 'notifications';
    await p.send({
      topic,
      messages: [
        {
          key: payload.id,
          value: JSON.stringify(payload),
          timestamp: String(Date.now()),
        }
      ],
    });
    console.log(`[KAFKA] Message produced: ${payload.id} → ${payload.template} (${payload.channel})`);
  } catch (err) {
    console.error('[KAFKA] Produce error:', err instanceof Error ? err.message : err);
    // Don't throw — gracefully degrade so notifications don't crash the app
  }
}

export async function closeProducer(): Promise<void> {
  if (!producer) return;
  try {
    await producer.disconnect();
    producer = null;
    console.log('[KAFKA-PRODUCER] Disconnected');
  } catch (err) {
    console.error('[KAFKA-PRODUCER] Disconnect error:', err);
    producer = null;
  }
}

/**
 * Generic notification function for queuing notifications via Kafka
 * 
 * @param payload - Notification payload with to, channel, template, and data
 * @returns Promise resolving to { id } of the queued notification
 * 
 * @example
 * ```typescript
 * await notify({
 *   to: 'user@example.com',
 *   channel: 'email',
 *   template: 'welcome_email',
 *   data: { name: 'Alice' }
 * });
 * ```
 */
export async function notify(payload: Record<string, any>) {
  const id = payload.id || `msg-${Date.now()}`;
  const channel = (payload.channel || 'email') as string;
  const to = payload.to;

  // Validate destination for channel
  if (channel === 'email' && (!to || String(to).trim() === '')) {
    console.warn(`[notify] Skipping email notification ${id}: missing email address`);
    return { id };
  }

  if (channel === 'sms' && (!to || String(to).trim() === '')) {
    console.warn(`[notify] Skipping SMS notification ${id}: missing phone number`);
    return { id };
  }

  const kafkaPayload: NotificationPayload = {
    id,
    to,
    channel: channel as 'email' | 'sms',
    template: payload.template,
    data: payload.data || {},
    timestamp: Date.now(),
  };

  console.log(`[notify] Producing notification id=${id} channel=${channel} to=${to}`);

  await publishNotification(kafkaPayload);
  return { id };
}

/**
 * Send OTP notification via email or SMS
 * 
 * @param to - Recipient email or phone number
 * @param template - Template name (e.g., 'otp_email', 'otp_sms')
 * @param channel - Notification channel ('email' or 'sms')
 * @param otp - One-time password
 * @param name - Optional recipient name
 * @param expiryMinutes - OTP expiry time in minutes (default: 10)
 * @returns Promise resolving to idempotency key
 * 
 * @example
 * ```typescript
 * await sendOtpNotification(
 *   'user@example.com',
 *   'otp_email',
 *   'email',
 *   '123456',
 *   'Alice',
 *   10
 * );
 * ```
 */
export async function sendOtpNotification(
  to: string,
  template: string,
  channel: string,
  otp: string,
  name?: string,
  expiryMinutes = 10
) {
  const idempotencyKey = `otp-${to}-${Date.now()}`;

  const payload: NotificationPayload = {
    id: idempotencyKey,
    to,
    channel: channel as 'email' | 'sms',
    template,
    data: { name, otp, expiryMinutes },
    timestamp: Date.now(),
  };

  await publishNotification(payload);
  return idempotencyKey;
}

/**
 * Send welcome email notification
 * 
 * @param email - Recipient email address
 * @param name - Recipient name
 * @returns Promise resolving to { id } of the queued notification
 */
export async function sendWelcomeEmail(email: string, name?: string) {
  return notify({
    to: email,
    channel: 'email',
    template: 'welcome_email',
    data: { name }
  });
}

/**
 * Send password reset email notification
 * 
 * @param email - Recipient email address
 * @param resetLink - Password reset link
 * @param name - Recipient name
 * @returns Promise resolving to { id } of the queued notification
 */
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string,
  name?: string
) {
  return notify({
    to: email,
    channel: 'email',
    template: 'password_reset_email',
    data: { name, reset_link: resetLink }
  });
}

/**
 * Send booking confirmation email
 * 
 * @param email - Recipient email address
 * @param data - Booking details (courtName, date, time, confirmationCode, etc.)
 * @returns Promise resolving to { id } of the queued notification
 */
export async function sendBookingConfirmationEmail(
  email: string,
  data: Record<string, any>
) {
  return notify({
    to: email,
    channel: 'email',
    template: 'booking_confirmation',
    data
  });
}

/**
 * Send payment receipt email
 * 
 * @param email - Recipient email address
 * @param data - Payment details (amount, transactionId, date, etc.)
 * @returns Promise resolving to { id } of the queued notification
 */
export async function sendPaymentReceiptEmail(
  email: string,
  data: Record<string, any>
) {
  return notify({
    to: email,
    channel: 'email',
    template: 'payment_receipt',
    data
  });
}

export default { 
  createProducer, 
  publishNotification, 
  closeProducer,
  notify,
  sendOtpNotification,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendPaymentReceiptEmail
};
