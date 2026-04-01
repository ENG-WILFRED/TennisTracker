# Notification Producer — Kafka Implementation

This module provides functions to queue notifications through Apache Kafka. The producer publishes notification messages to a Kafka topic, where asynchronous consumers handle email/SMS delivery.

## Overview

The notification system follows an asynchronous event-driven architecture:

1. **Producer** (this module) — Queue notifications to Kafka
2. **Kafka** — Message broker (stores notifications)
3. **Consumer** — Subscribes to notifications and sends emails/SMS

**Key Features:**
- **Asynchronous**: Fire-and-forget notification queuing
- **Reliable**: Messages persisted in Kafka; consumers can retry
- **Scalable**: Multiple consumers can handle messages in parallel
- **Multi-channel**: Supports email and SMS
- **Configurable**: Works with local Kafka or cloud providers (Aiven)

## Requirements

- Node.js 18+ (LTS recommended)
- `kafkajs` library (already in `package.json`)
- Kafka broker access (local or cloud like Aiven)

## Installation

Dependencies are already in `package.json`. If needed:

```bash
npm install kafkajs dotenv
```

## Configuration

Set environment variables in your `.env` file (see `.env.example` for template):

```env
# Kafka Connection
KAFKA_ENABLED=true
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=tennis-tracker-producer
KAFKA_TOPIC=notifications

# For cloud providers like Aiven: add SASL credentials
KAFKA_SASL_USERNAME=your-username
KAFKA_SASL_PASSWORD=your-password
KAFKA_SASL_MECHANISM=scram-sha-256
```

### Local Kafka Setup

For local development, use Docker:

```bash
# Start Kafka using Docker Compose
docker-compose up -d
```

### Aiven Kafka Setup

1. Create cluster at [aiven.io](https://aiven.io)
2. Copy credentials from Aiven Console:
   ```env
   KAFKA_BROKERS=your-cluster-name-d2b4.c.aivencloud.com:23362
   KAFKA_SASL_USERNAME=avnadmin
   KAFKA_SASL_PASSWORD=your-password
   KAFKA_SASL_MECHANISM=scram-sha-256
   ```
3. (Optional) Download CA certificate and set path

## Usage

### Basic Import

```typescript
import { notify, sendWelcomeEmail, sendOtpNotification } from '@/app/api/notification';
// or
import { notify } from '@/app/api/notification/producer';
```

### Send Generic Notification

```typescript
import { notify } from '@/app/api/notification';

await notify({
  to: 'user@example.com',
  channel: 'email',
  template: 'welcome_email',
  data: { name: 'Alice', message: 'Welcome!' }
});
```

### Send Welcome Email

```typescript
import { sendWelcomeEmail } from '@/app/api/notification';

await sendWelcomeEmail('user@example.com', 'Alice');
// Queues email using 'welcome_email' template
```

### Send OTP Notification

```typescript
import { sendOtpNotification } from '@/app/api/notification';

await sendOtpNotification(
  'user@example.com',    // to (email or phone)
  'otp_email',           // template
  'email',               // channel (email or sms)
  '123456',              // otp
  'Alice',               // name (optional)
  10                     // expiry minutes (optional, default 10)
);
```

For SMS:

```typescript
await sendOtpNotification(
  '+1234567890',
  'otp_sms',
  'sms',
  '123456',
  'Alice'
);
```

### Send Password Reset Email

```typescript
import { sendPasswordResetEmail } from '@/app/api/notification';

await sendPasswordResetEmail(
  'user@example.com',
  'https://app.example.com/reset?token=abc123',
  'Alice'
);
```

### Send Booking Confirmation

```typescript
import { sendBookingConfirmationEmail } from '@/app/api/notification';

await sendBookingConfirmationEmail('user@example.com', {
  bookingId: 'BC123',
  courtName: 'Court A',
  date: '2025-01-20',
  time: '10:00 AM',
  confirmationCode: 'CONF-ABC123'
});
```

### Send Payment Receipt

```typescript
import { sendPaymentReceiptEmail } from '@/app/api/notification';

await sendPaymentReceiptEmail('user@example.com', {
  transactionId: 'TX123',
  amount: '50.00',
  currency: 'USD',
  date: '2025-01-20',
  paymentMethod: 'Credit Card'
});
```

## API Reference

### `notify(payload)`

Generic function to queue any notification.

**Parameters:**
```typescript
{
  id?: string;                    // Unique message ID (auto-generated if omitted)
  to: string;                     // Email or phone number
  channel: 'email' | 'sms';       // Notification channel
  template: string;               // Template name (must exist in consumer)
  data?: Record<string, unknown>; // Template variables
}
```

**Returns:** `Promise<{ id: string }>`

**Example:**
```typescript
const { id } = await notify({
  to: 'user@example.com',
  channel: 'email',
  template: 'welcome_email',
  data: { name: 'Alice' }
});
console.log('Notification queued:', id);
```

### `sendOtpNotification(to, template, channel, otp, name?, expiryMinutes?)`

Send OTP via email or SMS.

**Parameters:**
- `to` (string) — Email or phone
- `template` (string) — Template name
- `channel` (string) — `'email'` or `'sms'`
- `otp` (string) — One-time password
- `name` (string, optional) — Recipient name
- `expiryMinutes` (number, optional) — OTP validity in minutes (default: 10)

**Returns:** `Promise<string>` — Idempotency key

### Helper Functions

All return `Promise<{ id: string }>`:

- `sendWelcomeEmail(email, name?)`
- `sendPasswordResetEmail(email, resetLink, name?)`
- `sendBookingConfirmationEmail(email, data)`
- `sendPaymentReceiptEmail(email, data)`

### Infrastructure Functions

For advanced usage:

- `createProducer()` — Initialize Kafka producer connection
- `publishNotification(payload)` — Publish a NotificationPayload to Kafka
- `closeProducer()` — Disconnect producer (usually on app shutdown)
- `initProducer` — Alias for `createProducer()`

## Integration Examples

### In an API Route

```typescript
// src/app/api/auth/register/route.ts
import { sendWelcomeEmail } from '@/app/api/notification';

export async function POST(request: Request) {
  const { email, name } = await request.json();
  
  // Create user in database...
  
  // Queue welcome email (fire-and-forget)
  try {
    await sendWelcomeEmail(email, name);
  } catch (error) {
    console.error('Failed to queue welcome email:', error);
    // Continue even if notification fails
  }
  
  return Response.json({ success: true });
}
```

### In a Server Action

```typescript
// src/app/actions/booking.ts
'use server';

import { sendBookingConfirmationEmail } from '@/app/api/notification';

export async function completeBooking(bookingData: any) {
  // Save booking to database...
  
  // Queue confirmation email
  await sendBookingConfirmationEmail(bookingData.email, {
    bookingId: bookingData.id,
    courtName: bookingData.courtName,
    date: bookingData.date,
    time: bookingData.time
  }).catch(err => {
    console.error('Failed to queue booking confirmation:', err);
  });
  
  return { success: true };
}
```

### With Error Handling

```typescript
import { notify } from '@/app/api/notification';

async function notifyWithFallback(payload: any) {
  try {
    const { id } = await notify(payload);
    console.log('✓ Notification queued:', id);
    return { success: true, id };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn('✗ Failed to queue notification:', errorMsg);
    
    // Optionally: send backup email, log to monitoring service, etc.
    return { success: false, error: errorMsg };
  }
}
```

### Batch Notifications

```typescript
import { notify } from '@/app/api/notification';

async function notifyAllAdmins(adminEmails: string[], data: any) {
  const results = await Promise.allSettled(
    adminEmails.map(email =>
      notify({
        to: email,
        channel: 'email',
        template: 'admin_alert',
        data
      })
    )
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  console.log(`Queued ${successful}/${adminEmails.length} notifications`);
  return results;
}
```

## Monitoring & Debugging

### Check Kafka Connection

```typescript
import { createProducer } from '@/app/api/notification';

async function healthCheck() {
  try {
    const producer = await createProducer();
    if (producer) {
      console.log('✓ Kafka producer connected');
      return true;
    } else {
      console.log('✗ Kafka disabled or failed to connect');
      return false;
    }
  } catch (error) {
    console.error('✗ Health check failed:', error);
    return false;
  }
}
```

### View Logs

The producer logs all operations to console:

```
[KAFKA-PRODUCER] Connecting to localhost:9092 without SASL/SSL
[KAFKA-PRODUCER] ✓ Producer connected successfully
[notify] Producing notification id=msg-1234567890 channel=email to=user@example.com
[KAFKA] Message produced: msg-1234567890 → welcome_email (email)
```

### Disable Kafka for Testing

Set `KAFKA_ENABLED=false` to suppress actual Kafka calls:

```env
KAFKA_ENABLED=false
```

Notifications will be logged but not queued to Kafka.

### Graceful Shutdown

On application shutdown, disconnect the producer:

```typescript
import { closeProducer } from '@/app/api/notification';

// In Next.js, add to your shutdown handler
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await closeProducer();
  process.exit(0);
});
```

## Best Practices

1. **Always wrap in try-catch** — Notifications are async and may fail; don't block user operations
2. **Log notification IDs** — Store returned IDs for tracking delivery issues
3. **Use appropriate channels** — Email for password resets, SMS for OTPs
4. **Keep data minimal** — Only pass variables needed for template rendering
5. **Idempotent operations** — Consumer should handle duplicate messages gracefully
6. **Monitor consumer logs** — Check consumer side for delivery success/failure
7. **Test locally first** — Use `KAFKA_ENABLED=false` during development

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Kafka is disabled" | Check `KAFKA_ENABLED` env var; set to `true` (or omit for default) |
| Connection timeout | Verify broker address in `KAFKA_BROKERS` and network access |
| SASL auth error | Ensure `KAFKA_SASL_USERNAME` and `KAFKA_SASL_PASSWORD` are correct |
| "Producer not available" | Kafka connection failed; check logs and broker status |
| Notification not sent | Check consumer logs; verify template exists in consumer |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KAFKA_ENABLED` | `true` | Enable/disable Kafka notifications |
| `KAFKA_BROKERS` | `localhost:9092` | Kafka broker address(es) |
| `KAFKA_CLIENT_ID` | `tennis-tracker-producer` | Producer client identifier |
| `KAFKA_TOPIC` | `notifications` | Kafka topic name |
| `KAFKA_SASL_USERNAME` | (optional) | SASL username for auth |
| `KAFKA_SASL_PASSWORD` | (optional) | SASL password for auth |
| `KAFKA_SASL_MECHANISM` | `scram-sha-256` | SASL mechanism |

## TypeScript Interfaces

```typescript
interface NotificationPayload {
  id: string;                     // Unique message ID
  to: string;                     // Recipient email or phone
  channel: 'email' | 'sms';       // Notification channel
  template: string;               // Template name
  data: Record<string, unknown>;  // Template variables
  timestamp: number;              // Unix timestamp
}
```

## See Also

- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [Aiven Kafka](https://aiven.io/kafka)
- [KafkaJS](https://kafka.js.org/)
- Consumer implementation (in external service)

