import { Kafka, type Producer, logLevel } from 'kafkajs';
import * as dotenv from 'dotenv';

dotenv.config();

export interface NotificationPayload {
  id: string;
  to: string;
  channel: 'email' | 'sms';
  template: string;
  data: Record<string, unknown>;
  timestamp: number;
}

const TOPIC = process.env.KAFKA_TOPIC || 'notifications';
const BROKERS = process.env.KAFKA_BROKER
  ? process.env.KAFKA_BROKER.split(',').map((item) => item.trim())
  : ['vicotennis-vicotennis.b.aivencloud.com:17771'];
const CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'notification-producer';
const SASL_MECHANISM = (process.env.KAFKA_SASL_MECHANISM || 'scram-sha-256').toUpperCase();
const SASL_USERNAME = process.env.KAFKA_SASL_USERNAME;
const SASL_PASSWORD = process.env.KAFKA_SASL_PASSWORD;

const kafkaConfig: any = {
  clientId: CLIENT_ID,
  brokers: BROKERS,
  logLevel: logLevel.NOTHING,
};

if (SASL_USERNAME && SASL_PASSWORD) {
  kafkaConfig.ssl = { rejectUnauthorized: false };
  kafkaConfig.sasl = {
    mechanism: SASL_MECHANISM,
    username: SASL_USERNAME,
    password: SASL_PASSWORD,
  };
}

const kafka = new Kafka(kafkaConfig);
let producer: Producer | null = null;
let producerConnected = false;
let isConnecting = false;
let connectingPromise: Promise<Producer | null> | null = null;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function initProducer(): Promise<Producer | null> {
  if (producer && producerConnected) {
    return producer;
  }

  if (isConnecting && connectingPromise) {
    return connectingPromise;
  }

  isConnecting = true;
  connectingPromise = (async (): Promise<Producer | null> => {
    try {
      producer = kafka.producer();

      producer.on(producer.events.CONNECT, () => {
        console.log('[KAFKA-PRODUCER] ✓ Producer connected successfully');
        producerConnected = true;
      });

      producer.on(producer.events.DISCONNECT, () => {
        console.warn('[KAFKA-PRODUCER] Producer disconnected');
        producerConnected = false;
      });

      await producer.connect();
      producerConnected = true;
      return producer;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[KAFKA-PRODUCER] Failed to initialize producer:', errMsg);
      producer = null;
      producerConnected = false;
      return null;
    } finally {
      isConnecting = false;
    }
  })();

  return connectingPromise;
}

export async function publishNotification(payload: NotificationPayload): Promise<boolean> {
  const maxAttempts = 5;
  const baseDelay = 500;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const p = await initProducer();
      if (!p) {
        throw new Error('Producer not available');
      }

      await p.send({
        topic: TOPIC,
        messages: [
          {
            key: payload.id,
            value: JSON.stringify(payload),
            timestamp: payload.timestamp.toString(),
          },
        ],
      });

      console.log(`[KAFKA] Message produced: ${payload.id} → ${payload.template} (${payload.channel}) to ${payload.to}`);
      return true;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[KAFKA] Produce attempt ${attempt} failed for ${payload.id}:`, errMsg);

      if (attempt === maxAttempts) {
        console.error('[KAFKA] Producer not available after retries, notification discarded:', payload.id);
        return false;
      }

      producerConnected = false;
      producer = null;
      await delay(baseDelay * attempt);
    }
  }

  return false;
}

export async function closeProducer(): Promise<void> {
  if (!producer) return;

  try {
    await producer.disconnect();
    producer = null;
    producerConnected = false;
    console.log('[KAFKA-PRODUCER] Disconnected');
  } catch (err) {
    console.error('[KAFKA-PRODUCER] Disconnect error:', err);
    producer = null;
    producerConnected = false;
  }
}

export async function notify(payload: Record<string, any>) {
  const id = payload.id || `msg-${Date.now()}`;
  const channel = (payload.channel || 'email') as string;
  const to = payload.to;

  if (channel === 'email' && (!to || String(to).trim() === '')) {
    console.warn(`[notify] Skipping email notification ${id}: missing email address`);
    return { id, success: false };
  }

  if (channel === 'sms' && (!to || String(to).trim() === '')) {
    console.warn(`[notify] Skipping SMS notification ${id}: missing phone number`);
    return { id, success: false };
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
  const success = await publishNotification(kafkaPayload);
  return { id, success };
}

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

export async function sendWelcomeEmail(email: string, name?: string) {
  return notify({
    to: email,
    channel: 'email',
    template: 'welcome_email',
    data: { name },
  });
}

export async function sendPasswordResetEmail(
  email: string,
  resetLink: string,
  name?: string
) {
  return notify({
    to: email,
    channel: 'email',
    template: 'password_reset_email',
    data: { name, reset_link: resetLink },
  });
}

export async function sendBookingConfirmationEmail(
  email: string,
  data: Record<string, any>
) {
  return notify({
    to: email,
    channel: 'email',
    template: 'booking_confirmation',
    data,
  });
}

export async function sendPaymentReceiptEmail(
  email: string,
  data: Record<string, any>
) {
  return notify({
    to: email,
    channel: 'email',
    template: 'payment_receipt',
    data,
  });
}

export async function createProducer() {
  return initProducer();
}
