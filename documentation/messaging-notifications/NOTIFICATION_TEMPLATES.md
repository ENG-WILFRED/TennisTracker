# Kafka Notification Templates

This document defines the Kafka notification templates required by TennisTracker.
The templates themselves are implemented in the Kafka consumer, so the producer and API routes must send the exact template name and the required data payload for each template.

## Notification payload contract
The consumer expects notification messages in the following shape:

- `id` — unique message identifier
- `to` — recipient email address or phone number
- `channel` — `email` or `sms`
- `template` — exact template name used by the consumer
- `data` — object with template-specific variables
- `timestamp` — epoch milliseconds when payload was created

The current producer implementation is defined in `src/app/api/notification/producer.ts`.
That module builds payloads using the `NotificationPayload` interface and sends them to Kafka.

Example Kafka message body:

```json
{
  "id": "msg-1234",
  "to": "user@example.com",
  "channel": "email",
  "template": "welcome_email",
  "data": {
    "name": "Wilfred"
  },
  "timestamp": 1710000000000
}
```

## How payloads are passed to templates

1. The producer creates a `NotificationPayload` object.
2. `notify()` builds the Kafka message and includes the raw `data` object.
3. The consumer reads `payload.data` and renders template variables from that object.
4. The exact template name string must match the consumer implementation.

The raw `data` object is intentionally passed through without transformation, so the consumer template can access the fields directly.

## Template definitions and required payloads

Each template below must exist in the Kafka consumer. The producer and API code must send the corresponding template name and payload shape.

### `org_onboarding`
- Purpose: Organization onboarding email
- Channel: `email`
- Required `data` fields:
  - `organizationName`
  - `organizationId`
  - `installationFee`
  - `monthlySubscription`
  - `contactEmail`
- Source: `src/app/api/developer/organizations/[orgId]/email/route.ts`
- Example:

```json
{
  "template": "org_onboarding",
  "data": {
    "organizationName": "Ace Tennis Club",
    "organizationId": "org-123",
    "installationFee": 500.0,
    "monthlySubscription": 99.99,
    "contactEmail": "owner@example.com"
  }
}
```

### `login`
- Purpose: Login notification email
- Channel: `email`
- Required `data` fields:
  - `name`
  - `dashboard_link`
- Source: `src/actions/loginNotification.ts`
- Example:

```json
{
  "template": "login",
  "data": {
    "name": "Wilfred",
    "dashboard_link": "http://localhost:3000/dashboard/player/123"
  }
}
```

### `session_completed_player`
- Purpose: Notify player after a session completes
- Channel: `email`
- Required `data` fields:
  - `playerName`
  - `coachName`
  - `sessionTitle`
- Source: `src/core/events/handlers/SessionHandlers.ts`
- Example:

```json
{
  "template": "session_completed_player",
  "data": {
    "playerName": "Jane Doe",
    "coachName": "Coach Kimani",
    "sessionTitle": "Advanced Serve Practice"
  }
}
```

### `session_completed_coach`
- Purpose: Notify coach after a session completes
- Channel: `email`
- Required `data` fields:
  - `coachName`
  - `playerName`
  - `earning`
- Source: `src/core/events/handlers/SessionHandlers.ts`
- Example:

```json
{
  "template": "session_completed_coach",
  "data": {
    "coachName": "Coach Kimani",
    "playerName": "Jane Doe",
    "earning": 45.0
  }
}
```

### `welcome_email`
- Purpose: Welcome email for new users
- Channel: `email`
- Required `data` fields:
  - `name`
- Source: `src/app/api/notification/producer.ts`
- Example:

```json
{
  "template": "welcome_email",
  "data": {
    "name": "Wilfred"
  }
}
```

### `password_reset_email`
- Purpose: Password reset email
- Channel: `email`
- Required `data` fields:
  - `name`
  - `reset_link`
- Source: `src/app/api/notification/producer.ts`
- Example:

```json
{
  "template": "password_reset_email",
  "data": {
    "name": "Wilfred",
    "reset_link": "https://vicotennis.com/reset?token=abc"
  }
}
```

### `developer_login_otp`
- Purpose: Developer login one-time passcode email
- Channel: `email`
- Required `data` fields:
  - `name`
  - `otp`
  - `expiryMinutes`
- Source: `src/app/api/auth/login/route.ts`, `src/app/api/auth/google/callback/route.ts`
- Example:

```json
{
  "template": "developer_login_otp",
  "data": {
    "name": "Wilfred",
    "otp": "ABC123",
    "expiryMinutes": 10
  }
}
```

### `developer_login_alert`
- Purpose: Notify the other developer when one of the two authorized developer accounts logs in.
- Note: This template is only used for developer-to-developer alerts. It must never be sent for normal user sign-ins.
- Channel: `email`
- Required `data` fields:
  - `loginUserName`
  - `loginUserEmail`
  - `loginMethod`
  - `loginTime`
  - `ipAddress`
  - `userAgent`
- Source: `src/app/api/auth/login/route.ts`, `src/app/api/auth/google/callback/route.ts`
- Example:

```json
{
  "template": "developer_login_alert",
  "data": {
    "loginUserName": "Wilfred Developer",
    "loginUserEmail": "vicotennis0@gmail.com",
    "loginMethod": "password",
    "loginTime": "2026-05-21T12:34:56.000Z",
    "ipAddress": "203.0.113.12",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
  }
}
```

### `booking_confirmation`
- Purpose: Booking confirmation email
- Channel: `email`
- Required `data` fields:
  - booking-specific values defined by the caller
- Source: `src/app/api/notification/producer.ts`
- Notes: Consumer should render all booking fields needed for the confirmation email.
- Example shape:

```json
{
  "template": "booking_confirmation",
  "data": {
    "bookingId": "bk-123",
    "courtName": "Court 5",
    "startTime": "2026-05-09T15:00:00Z",
    "endTime": "2026-05-09T16:00:00Z",
    "amount": 25.0
  }
}
```

### `payment_receipt`
- Purpose: Payment receipt email
- Channel: `email`
- Required `data` fields:
  - payment-specific values defined by the caller
- Source: `src/app/api/notification/producer.ts`
- Notes: Consumer should render receipt details from the provided `data` object.
- Example shape:

```json
{
  "template": "payment_receipt",
  "data": {
    "paymentId": "pay-456",
    "amount": 99.99,
    "currency": "USD",
    "date": "2026-05-09",
    "method": "Credit Card"
  }
}
```

### `bug_report_admin`
- Purpose: Admin bug report notification
- Channel: `email`
- Required `data` fields:
  - `bugId`
  - `title`
  - `description`
  - `severity`
  - `pageUrl`
  - `userAgent`
  - `username`
  - `email`
  - `timestamp`
  - `userName`
- Source: `src/app/api/bugs/route.ts`
- Example:

```json
{
  "template": "bug_report_admin",
  "data": {
    "bugId": "bug-789",
    "title": "App crash on booking page",
    "description": "The app crashes when I select a time slot.",
    "severity": "high",
    "pageUrl": "https://vicotennis.com/bookings",
    "userAgent": "Mozilla/5.0",
    "username": "jane.doe",
    "email": "jane.doe@example.com",
    "timestamp": "2026-05-09T16:00:00Z",
    "userName": "Jane Doe"
  }
}
```

### `bug_report_confirmation`
- Purpose: Confirmation email to bug reporter
- Channel: `email`
- Required `data` fields:
  - `title`
  - `severity`
  - `userName`
- Source: `src/app/api/bugs/route.ts`
- Example:

```json
{
  "template": "bug_report_confirmation",
  "data": {
    "title": "App crash on booking page",
    "severity": "high",
    "userName": "Jane"
  }
}
```

### `bug_report_response`
- Purpose: Notify user when a developer responds to their bug report
- Channel: `email`
- Required `data` fields:
  - `response`
  - `bugId`
  - `userName`
- Source: `src/app/api/developer/bugs/respond/route.ts`
- Example:

```json
{
  "template": "bug_report_response",
  "data": {
    "response": "We have fixed the issue and deployed a patch.",
    "bugId": "bug-789",
    "userName": "Jane"
  }
}
```

### `developer_org_message`
- Purpose: Custom developer message to organization
- Channel: `email`
- Required `data` fields:
  - `organizationName`
  - `subject`
  - `message`
- Source: `src/app/api/developer/organizations/[orgId]/route.ts`
- Example:

```json
{
  "template": "developer_org_message",
  "data": {
    "organizationName": "Ace Tennis Club",
    "subject": "Payment reminder",
    "message": "Please submit your payment by the end of the week."
  }
}
```

### `orgRegistered`
- Purpose: Notify admin/dev team of a new organization registration
- Channel: `email`
- Required `data` fields:
  - `organizationId`
  - `organizationName`
  - `creatorId`
  - `creatorEmail`
  - `createdAt`
  - `status`
- Source: `src/app/api/organization/route.ts`
- Example:

```json
{
  "template": "orgRegistered",
  "data": {
    "organizationId": "org-123",
    "organizationName": "Ace Tennis Club",
    "creatorId": "user-456",
    "creatorEmail": "owner@example.com",
    "createdAt": "2026-05-09T14:00:00Z",
    "status": "pending"
  }
}
```

### `recruit`
- Purpose: Staff recruitment notification email
- Channel: `email`
- Required `data` fields:
  - `name`
  - `organizationName`
  - `role`
  - `expertise` (optional)
  - `coachingLevel` (optional)
- Source: `src/app/api/organization/[orgId]/recruit/route.ts`
- Example:

```json
{
  "template": "recruit",
  "data": {
    "name": "John",
    "organizationName": "Ace Tennis Club",
    "role": "Coach",
    "expertise": "Tennis Coaching",
    "coachingLevel": "Advanced"
  }
}
```

## Consumer template design expectations

- The consumer must implement every template name exactly as listed.
- The consumer must render the `data` object fields as named template variables.
- If a required field is missing, the consumer should fallback gracefully and log the issue.
- Email templates should support both HTML and plain-text rendering where possible.
- For templates with free-form content (`message`, `description`, `response`), the consumer should escape unsafe content and preserve formatting.

## Adding or changing templates

1. Add the new template name to this document.
2. Update the producer/API callers to use the same template name.
3. Ensure the payload includes all fields expected by the consumer.
4. Update the consumer implementation and regression tests if present.

## Implementation notes

- The producer sends `payload.data` unchanged to the consumer.
- Any consumer-side template engine must map `payload.data` fields directly to the template.
- This document is the source of truth for template names and payload contracts used by TennisTracker.
