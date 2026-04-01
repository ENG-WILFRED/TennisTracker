# Notification Producer — Quick Start

Get notifications working in 5 minutes.

## 1. Setup (1 minute)

### Install Dependencies
```bash
npm install kafkajs dotenv
```

### Add to `.env`
```env
KAFKA_ENABLED=true
KAFKA_BROKERS=localhost:9092
KAFKA_TOPIC=notifications
KAFKA_CLIENT_ID=tennis-tracker-producer
```

## 2. Import (10 seconds)

```typescript
import { notify, sendWelcomeEmail } from '@/app/api/notification';
```

## 3. Use in Your Code

### Send Welcome Email
```typescript
await sendWelcomeEmail('user@example.com', 'Alice');
```

### Send Password Reset
```typescript
await sendPasswordResetEmail(
  'user@example.com',
  'https://app.example.com/reset?token=xyz',
  'Alice'
);
```

### Send OTP (SMS or Email)
```typescript
// Email OTP
await sendOtpNotification(
  'user@example.com',
  'otp_email',
  'email',
  '123456'
);

// SMS OTP
await sendOtpNotification(
  '+1234567890',
  'otp_sms',
  'sms',
  '123456'
);
```

### Send Booking Confirmation
```typescript
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
await sendPaymentReceiptEmail('user@example.com', {
  transactionId: 'TX123',
  amount: '50.00',
  currency: 'USD',
  date: '2025-01-20'
});
```

### Send Custom Notification
```typescript
await notify({
  to: 'user@example.com',
  channel: 'email',
  template: 'my_custom_template',
  data: { field1: 'value1', field2: 'value2' }
});
```

## 4. In Your API Routes

```typescript
// src/app/api/auth/register/route.ts
import { sendWelcomeEmail } from '@/app/api/notification';

export async function POST(request: NextRequest) {
  const { email, name } = await request.json();
  
  // Create user...
  
  // Queue welcome email (don't await, fire-and-forget)
  sendWelcomeEmail(email, name).catch(err => {
    console.error('Failed to queue email:', err);
  });
  
  return NextResponse.json({ success: true });
}
```

## 5. In Your Server Actions

```typescript
// src/app/actions/booking.ts
'use server';

import { sendBookingConfirmationEmail } from '@/app/api/notification';

export async function completeBooking(bookingData: any) {
  // Save booking...
  
  // Queue confirmation
  await sendBookingConfirmationEmail(bookingData.email, {
    courtName: bookingData.court,
    date: bookingData.date,
    time: bookingData.time
  });
  
  return { success: true };
}
```

## Common Patterns

### Error Handling
```typescript
try {
  await sendWelcomeEmail(email, name);
} catch (error) {
  console.error('Failed to queue notification:', error);
  // Email queuing failed, but user registration succeeded
}
```

### Fire-and-Forget (Recommended)
```typescript
// Don't await, just queue it
sendWelcomeEmail(email, name).catch(err => {
  console.error('Notification error:', err);
});

// User gets response immediately
return NextResponse.json({ success: true });
```

### Batch Send
```typescript
const emails = ['user1@example.com', 'user2@example.com', 'user3@example.com'];

const results = await Promise.allSettled(
  emails.map(email => sendWelcomeEmail(email, 'User'))
);

console.log(`Sent ${results.filter(r => r.status === 'fulfilled').length} of ${emails.length}`);
```

## API Functions at a Glance

| Function | Parameters | Returns |
|----------|------------|---------|
| `notify()` | `{ to, channel, template, data }` | `{ id }` |
| `sendWelcomeEmail()` | `(email, name?)` | `{ id }` |
| `sendPasswordResetEmail()` | `(email, resetLink, name?)` | `{ id }` |
| `sendOtpNotification()` | `(to, template, channel, otp, name?, expiryMinutes?)` | `string (id)` |
| `sendBookingConfirmationEmail()` | `(email, data)` | `{ id }` |
| `sendPaymentReceiptEmail()` | `(email, data)` | `{ id }` |

## Configuration for Different Environments

### Local Development (no Kafka)
```env
KAFKA_ENABLED=false
```
Notifications are logged but not sent.

### Local with Docker Kafka
```env
KAFKA_ENABLED=true
KAFKA_BROKERS=localhost:9092
KAFKA_TOPIC=notifications
```

### Aiven Production
```env
KAFKA_ENABLED=true
KAFKA_BROKERS=your-cluster-d2b4.c.aivencloud.com:23362
KAFKA_SASL_USERNAME=avnadmin
KAFKA_SASL_PASSWORD=your-password
KAFKA_SASL_MECHANISM=scram-sha-256
KAFKA_CLIENT_ID=tennis-tracker-producer
KAFKA_TOPIC=notifications
```

## Channels

| Channel | Use For | Example |
|---------|---------|---------|
| `email` | Emails | Welcome, password reset, receipts |
| `sms` | SMS messages | OTP codes, alerts |

## Template Names

Templates available (must be created in your consumer):
- `welcome_email`
- `password_reset_email`
- `booking_confirmation`
- `payment_receipt`
- `otp_email`
- `otp_sms`
- `team_notification`
- Custom: any name you define

## Debug

### Check if Kafka is connected
```typescript
import { createProducer } from '@/app/api/notification';

const producer = await createProducer();
console.log(producer ? '✓ Connected' : '✗ Disabled/Failed');
```

### View logs
```
[KAFKA-PRODUCER] ✓ Producer connected successfully
[notify] Producing notification id=msg-123 channel=email to=user@example.com
[KAFKA] Message produced: msg-123 → welcome_email (email)
```

## Next Steps

- Read [README.md](./README.md) for detailed docs
- Read [INTEGRATION.md](./INTEGRATION.md) for advanced patterns
- Check [.env.example](./.env.example) for all config options

## Need Help?

1. Check if Kafka is running: `KAFKA_BROKERS=localhost:9092`
2. Check SASL credentials if using cloud Kafka
3. Check consumer is running and subscribed to topic
4. Set `KAFKA_ENABLED=false` to test without Kafka
5. Check logs for `[KAFKA]` messages
