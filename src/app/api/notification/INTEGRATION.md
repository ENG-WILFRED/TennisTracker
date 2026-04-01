# Notification Producer — Integration Guide

Complete guide to integrating the Kafka-based notification producer into your API routes, server actions, and application workflows.

## Quick Start

### 1. Environment Setup

Add these to your `.env` file:

```env
KAFKA_ENABLED=true
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=tennis-tracker-producer
KAFKA_TOPIC=notifications
KAFKA_SASL_USERNAME=your-username
KAFKA_SASL_PASSWORD=your-password
KAFKA_SASL_MECHANISM=scram-sha-256
```

### 2. Install Dependencies

```bash
npm install kafkajs dotenv
```

### 3. Start Using

```typescript
import { notify, sendWelcomeEmail } from '@/app/api/notification';

// In your route or server action
await sendWelcomeEmail('user@example.com', 'Alice');
```

---

## Integration Patterns

### Pattern 1: User Registration

Queue welcome email after user signup:

```typescript
// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/app/api/notification';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    // 1. Validate input
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Missing email or name' },
        { status: 400 }
      );
    }

    // 2. Create user in database (not shown)
    // const user = await db.user.create({ email, name });

    // 3. Queue welcome email (fire-and-forget, don't await in critical path)
    sendWelcomeEmail(email, name).catch(error => {
      console.error('Failed to queue welcome email:', error);
      // Optionally: save to retry queue, alert admin, etc.
    });

    // 4. Return success immediately
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
```

### Pattern 2: Password Reset Request

```typescript
// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendPasswordResetEmail } from '@/app/api/notification';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  // Save token to database with expiry (1 hour)
  // await db.passwordReset.create({ email, token: resetToken, expiresAt: ... });

  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

  // Queue password reset email
  try {
    await sendPasswordResetEmail(email, resetLink);
    return NextResponse.json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    // Still return success to user (don't reveal email existence)
    return NextResponse.json({
      success: true,
      message: 'Password reset email sent'
    });
  }
}
```

### Pattern 3: Court Booking Confirmation

```typescript
// src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendBookingConfirmationEmail } from '@/app/api/notification';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const { userId, courtId, date, timeSlot } = await request.json();

  // Create booking
  const booking = await db.booking.create({
    data: {
      userId,
      courtId,
      date: new Date(date),
      timeSlot,
      status: 'confirmed',
      confirmationCode: generateCode()
    },
    include: {
      user: true,
      court: true
    }
  });

  // Queue confirmation email (non-blocking)
  sendBookingConfirmationEmail(booking.user.email, {
    bookingId: booking.id,
    courtName: booking.court.name,
    date: booking.date.toLocaleDateString(),
    time: booking.timeSlot,
    confirmationCode: booking.confirmationCode
  }).catch(error => {
    console.error('Failed to queue booking confirmation:', error);
    // Log to monitoring service, attempt retry, etc.
  });

  return NextResponse.json(booking, { status: 201 });
}

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
```

### Pattern 4: Payment Receipt

```typescript
// src/app/api/payments/complete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendPaymentReceiptEmail } from '@/app/api/notification';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const { transactionId, bookingId, amount, email } = await request.json();

  // Record payment in database
  const payment = await db.payment.create({
    data: {
      transactionId,
      bookingId,
      amount,
      status: 'completed',
      completedAt: new Date()
    }
  });

  // Queue receipt email
  const { id: request_id } = await notify({
    to: email,
    channel: 'email',
    template: 'payment_receipt',
    data: {
      transactionId,
      amount: amount.toFixed(2),
      currency: 'USD',
      date: new Date().toLocaleDateString(),
      invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${payment.id}`
    }
  }).catch(error => {
    console.error('[payments] Failed to queue receipt:', error);
    return { id: null };
  });

  return NextResponse.json({
    success: true,
    payment,
    notificationId: request_id
  });
}
```

### Pattern 5: OTP Verification (SMS)

```typescript
// src/app/api/auth/send-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendOtpNotification } from '@/app/api/notification';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const { phone } = await request.json();

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store OTP in database
  await db.otpVerification.create({
    data: {
      phone,
      otp,
      expiresAt,
      attempts: 0
    }
  });

  // Send SMS OTP
  try {
    const { id } = await sendOtpNotification(
      phone,
      'otp_sms',
      'sms',
      otp,
      undefined,
      10 // Expires in 10 minutes
    );

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your phone',
      reference: id
    });
  } catch (error) {
    console.error('Failed to send OTP:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
```

---

## Server Actions Integration

### Send Notification from Server Action

```typescript
// src/app/actions/notifications.ts
'use server';

import { sendBookingConfirmationEmail, notify } from '@/app/api/notification';

export async function confirmBooking(bookingData: {
  email: string;
  courtName: string;
  date: string;
  time: string;
  confirmationCode: string;
}) {
  try {
    // This runs on the server and can queue notifications
    const { id } = await sendBookingConfirmationEmail(
      bookingData.email,
      bookingData
    );

    return {
      success: true,
      notificationId: id,
      message: 'Booking confirmed and notification sent'
    };
  } catch (error) {
    console.error('Failed to confirm booking:', error);
    return {
      success: false,
      error: 'Failed to send confirmation'
    };
  }
}

export async function notifyTeam(message: string, recipients: string[]) {
  const results = await Promise.allSettled(
    recipients.map(email =>
      notify({
        to: email,
        channel: 'email',
        template: 'team_notification',
        data: { message }
      })
    )
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  return {
    total: recipients.length,
    successful,
    failed: recipients.length - successful
  };
}
```

---

## Error Handling Patterns

### With Try-Catch

```typescript
import { sendWelcomeEmail } from '@/app/api/notification';

export async function registerUser(email: string, name: string) {
  try {
    // Create user first...
    
    // Then send email
    try {
      await sendWelcomeEmail(email, name);
    } catch (error) {
      console.error('Email notification failed:', error);
      // Don't fail registration just because email failed
      // Optionally: queue for retry, alert admin, log to monitoring
    }

    return { success: true };
  } catch (error) {
    console.error('Registration failed:', error);
    throw error; // Fail registration on db errors
  }
}
```

### With Graceful Degradation

```typescript
import { notify } from '@/app/api/notification';

export async function completePayment(paymentData: any) {
  const paymentResult = await processPayment(paymentData);

  // Try to send receipt, but don't fail payment if it fails
  notify({
    to: paymentData.email,
    channel: 'email',
    template: 'payment_receipt',
    data: {
      transactionId: paymentResult.id,
      amount: paymentData.amount
    }
  })
    .then(({ id }) => {
      console.log(`Receipt notification queued: ${id}`);
    })
    .catch(error => {
      console.error('Failed to queue receipt:', error);
      // Optional: Log to Sentry/monitoring, add to retry queue, etc.
    });

  return paymentResult;
}
```

### With Retry Logic

```typescript
import { notify } from '@/app/api/notification';

async function sendNotificationWithRetry(
  payload: any,
  maxAttempts = 3,
  delayMs = 1000
): Promise<string | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { id } = await notify(payload);
      console.log(`[attempt ${attempt}] Notification queued: ${id}`);
      return id;
    } catch (error) {
      if (attempt < maxAttempts) {
        const waitTime = delayMs * Math.pow(2, attempt - 1);
        console.warn(
          `[attempt ${attempt}] Failed, retrying in ${waitTime}ms...`,
          error
        );
        await new Promise(r => setTimeout(r, waitTime));
      } else {
        console.error(
          `[attempt ${attempt}] Final failure after ${maxAttempts} attempts`,
          error
        );
        return null;
      }
    }
  }
  return null;
}

// Usage
await sendNotificationWithRetry({
  to: 'user@example.com',
  channel: 'email',
  template: 'welcome_email',
  data: { name: 'Alice' }
});
```

---

## Monitoring & Observability

### Log Notification IDs for Tracking

```typescript
import { notify } from '@/app/api/notification';

export async function sendCriticalNotification(
  channel: string,
  to: string,
  template: string,
  data: any
) {
  const { id } = await notify({
    to,
    channel,
    template,
    data
  });

  // Log the notification ID for audit trail
  await db.notificationLog.create({
    data: {
      notificationId: id,
      recipients: [to],
      channel,
      template,
      queuedAt: new Date(),
      dataSnapshot: JSON.stringify(data)
    }
  });

  return id;
}
```

### Track Notification Events

```typescript
import { notify } from '@/app/api/notification';

async function trackNotification(
  event: 'registration' | 'password_reset' | 'booking' | 'payment',
  to: string,
  data: any
) {
  const templates: Record<string, string> = {
    registration: 'welcome_email',
    password_reset: 'password_reset_email',
    booking: 'booking_confirmation',
    payment: 'payment_receipt'
  };

  const { id } = await notify({
    to,
    channel: 'email',
    template: templates[event],
    data
  });

  // Track in analytics
  await analytics.track('notification_sent', {
    event,
    channel: 'email',
    notificationId: id,
    recipient: to
  });

  return id;
}
```

---

## Testing

### Mock Notifications for Testing

Set `KAFKA_ENABLED=false` in test environment:

```env
# .env.test
KAFKA_ENABLED=false
```

This prevents actual Kafka calls during tests.

### Unit Test Example

```typescript
// src/__tests__/notifications.test.ts
import { describe, it, expect, vi } from 'vitest';
import { sendWelcomeEmail } from '@/app/api/notification';

describe('sendWelcomeEmail', () => {
  it('queues welcome email correctly', async () => {
    const result = await sendWelcomeEmail('test@example.com', 'Test User');
    expect(result).toHaveProperty('id');
  });

  it('handles missing email gracefully', async () => {
    const result = await notify({
      to: '',
      channel: 'email',
      template: 'welcome_email',
      data: {}
    });
    // Should log warning but not throw
    expect(result).toHaveProperty('id');
  });
});
```

---

## Advanced Usage

### Batch Notifications

```typescript
import { notify } from '@/app/api/notification';

export async function notifyMultipleUsers(
  userEmails: string[],
  template: string,
  data: any
) {
  const results = await Promise.allSettled(
    userEmails.map(email =>
      notify({
        to: email,
        channel: 'email',
        template,
        data: { ...data, email } // Can customize per user
      })
    )
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results
    .map((r, i) =>
      r.status === 'rejected'
        ? { email: userEmails[i], error: (r.reason as Error).message }
        : null
    )
    .filter(Boolean);

  return {
    total: userEmails.length,
    successful,
    failed
  };
}
```

### Conditional Notifications

```typescript
import { notify, sendOtpNotification } from '@/app/api/notification';

export async function sendContactVerification(
  contact: string,
  type: 'email' | 'phone'
) {
  if (type === 'email') {
    return notify({
      to: contact,
      channel: 'email',
      template: 'email_verification',
      data: { verificationCode: generateCode() }
    });
  } else {
    return sendOtpNotification(contact, 'otp_sms', 'sms', generateCode());
  }
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
```

### Dynamic Template Data

```typescript
import { notify } from '@/app/api/notification';

interface NotificationTemplate {
  name: string;
  channel: 'email' | 'sms';
  fields: string[];
}

const templates: Record<string, NotificationTemplate> = {
  welcome: {
    name: 'welcome_email',
    channel: 'email',
    fields: ['name', 'company']
  },
  booking: {
    name: 'booking_confirmation',
    channel: 'email',
    fields: ['courtName', 'date', 'time', 'confirmationCode']
  }
};

export async function sendWithTemplate(
  templateKey: string,
  to: string,
  data: Record<string, any>
) {
  const template = templates[templateKey];
  if (!template) throw new Error(`Unknown template: ${templateKey}`);

  // Validate all required fields are present
  const missing = template.fields.filter(field => !(field in data));
  if (missing.length > 0) {
    throw new Error(`Missing template fields: ${missing.join(', ')}`);
  }

  return notify({
    to,
    channel: template.channel,
    template: template.name,
    data
  });
}
```

---

## Debugging

### Check Producer Health

```typescript
import { createProducer } from '@/app/api/notification';

export async function healthCheck() {
  try {
    const producer = await createProducer();
    if (producer) {
      console.log('✓ Kafka producer connected');
      return { status: 'ok' };
    }
    return { status: 'disabled', reason: 'KAFKA_ENABLED=false' };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
```

### Enable Detailed Logging

```typescript
// In producer.ts, change logLevel during development
// logLevel: logLevel.DEBUG  // for detailed logs
```

---

## Environment Variables Checklist

- [ ] `KAFKA_ENABLED=true`
- [ ] `KAFKA_BROKERS` set to your broker(s)
- [ ] `KAFKA_CLIENT_ID` set
- [ ] `KAFKA_TOPIC` set
- [ ] (Optional) `KAFKA_SASL_USERNAME` for auth
- [ ] (Optional) `KAFKA_SASL_PASSWORD` for auth
- [ ] (Optional) `KAFKA_SASL_MECHANISM` for auth

## Troubleshooting Checklist

- [ ] Check Kafka broker is running/accessible
- [ ] Verify SASL credentials if using auth
- [ ] Confirm `KAFKA_TOPIC` matches consumer subscription
- [ ] Check logs for connection/publish errors
- [ ] Set `KAFKA_ENABLED=false` to test without Kafka
- [ ] Verify consumer process is subscribed and running

---

## See Also

- [Notification Producer README](./README.md)
- [KafkaJS Documentation](https://kafka.js.org/)
- [Aiven Kafka Setup](https://help.aiven.io/en/articles/489572-getting-started-with-aiven-for-apache-kafka)
