# Activity Tracking Implementation - Complete Guide

## Overview
Implemented comprehensive activity tracking system for the TennisTracker organization dashboard. Organizations can now monitor all player actions in real-time: court bookings, tournament registrations, payments, and member joinings.

## System Architecture

### Database Schema
**OrganizationActivity Model** (`/prisma/schema.prisma`)
```prisma
model OrganizationActivity {
  id              String       @id @default(uuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  playerId        String
  player          Player       @relation(fields: [playerId], references: [userId], onDelete: Cascade)
  action          String       // court_booking, tournament_registration, payment_made, etc.
  details         Json         // Event-specific details
  metadata        Json         // Additional context
  createdAt       DateTime     @default(now())

  @@index([organizationId])
  @@index([playerId])
  @@index([createdAt])
}
```

### Activity Tracking Class
**File**: `/src/lib/organizationActivity.ts`

**Key Methods**:
- `trackActivity(data)` - Creates activity record and updates organization score
- `updateActivityScore(organizationId)` - Calculates activity score based on 30-day activity
- `getRecentActivities(organizationId, limit)` - Retrieves formatted activity feed

**Predefined Activity Types**:
```typescript
ACTIONS = {
  COURT_BOOKING: 'court_booking',
  TOURNAMENT_REGISTRATION: 'tournament_registration', 
  RANKING_CHALLENGE: 'ranking_challenge',
  PAYMENT_MADE: 'payment_made',
  MEMBER_JOINED: 'member_joined',
  EVENT_ATTENDED: 'event_attended',
}
```

## Integration Points

### 1. Court Booking Activity
**File**: `/src/actions/bookings.ts`

When a player books a court:
```typescript
await OrganizationActivityTracker.trackActivity({
  organizationId,
  playerId,
  action: "court_booking",
  details: {
    courtName: booking.court.name,
    courtNumber: booking.court.courtNumber,
    startTime: booking.startTime.toISOString(),
    endTime: booking.endTime.toISOString(),
    isPeak: isPeak,
    price: booking.price,
    bookingId: booking.id,
  },
});
```

**Action Type**: `court_booking`
**Triggered**: When `createCourtBooking()` completes successfully

### 2. Tournament Registration Activity
**File**: `/src/actions/tournaments.ts`

When a player registers for a tournament:
```typescript
await OrganizationActivityTracker.trackActivity({
  organizationId: tournament.organizationId,
  playerId: player.userId,
  action: 'tournament_registration',
  details: {
    tournamentName: tournament.name,
    tournamentType: tournament.eventType,
    registrationDate: new Date().toISOString(),
    registrationId: registration.id,
    signupOrder: signupOrder,
  },
});
```

**Action Type**: `tournament_registration`
**Triggered**: When `applyForTournament()` completes successfully

### 3. Tournament Waitlist Activity
**File**: `/src/actions/tournaments.ts`

When a tournament is at capacity, player is added to waitlist:
```typescript
await OrganizationActivityTracker.trackActivity({
  organizationId: tournament.organizationId,
  playerId: player.userId,
  action: 'tournament_waitlisted',
  details: {
    tournamentName: tournament.name,
    waitlistPosition: waitlistEntry.position,
    waitlistDate: new Date().toISOString(),
  },
});
```

**Action Type**: `tournament_waitlisted`
**Triggered**: When tournament registration results in waitlist

### 4. Member Joined Activity
**File**: `/src/actions/tournaments.ts`

When player joins organization via tournament registration:
```typescript
await OrganizationActivityTracker.trackActivity({
  organizationId: tournament.organizationId,
  playerId: player.userId,
  action: 'member_joined',
  details: {
    joinMethod: 'tournament_registration',
    tournamentName: tournament.name,
    memberId: clubMember.id,
    joinDate: new Date().toISOString(),
  },
});
```

**Action Type**: `member_joined`
**Triggered**: When new player creates club membership during tournament registration

### 5. Payment Activity - M-Pesa
**File**: `/src/app/api/webhooks/mpesa/route.ts`

When M-Pesa payment is confirmed:
```typescript
await OrganizationActivityTracker.trackActivity({
  organizationId: event.organizationId,
  playerId: payment.userId,
  action: 'payment_made',
  details: {
    amount: mpesaAmount || payment.amount,
    currency: payment.currency,
    bookingType: payment.bookingType,
    eventName: event.name,
    paymentId: payment.id,
    mpesaReceiptNumber: mpesaReceiptNumber,
  },
});
```

**Action Type**: `payment_made`
**Triggered**: When M-Pesa webhook confirms successful payment

### 6. Payment Activity - PayPal
**File**: `/src/app/api/webhooks/paypal/route.ts`

When PayPal payment is approved:
```typescript
await OrganizationActivityTracker.trackActivity({
  organizationId: event.organizationId,
  playerId: payment.userId,
  action: 'payment_made',
  details: {
    amount: payment.amount,
    currency: payment.currency,
    bookingType: payment.bookingType,
    eventName: event.name,
    paymentId: payment.id,
    paypalToken: token,
  },
});
```

**Action Type**: `payment_made`
**Triggered**: When PayPal success callback is processed

### 7. Payment Activity - Stripe
**File**: `/src/app/api/webhooks/stripe/route.ts`

When Stripe payment is completed:
```typescript
await OrganizationActivityTracker.trackActivity({
  organizationId: event.organizationId,
  playerId: payment.userId,
  action: 'payment_made',
  details: {
    amount: payment.amount,
    currency: payment.currency,
    bookingType: payment.bookingType,
    eventName: event.name,
    paymentId: payment.id,
    stripePaymentIntentId: paymentIntentId,
  },
});
```

**Action Type**: `payment_made`
**Triggered**: When Stripe webhook confirms successful payment

## Dashboard Integration

**File**: `/src/app/organization/[id]/page.tsx`

### DashboardTab Component
Displays recent organization activities:
- Shows last 20 activities
- Includes player name, avatar, and action description
- Time-formatted activity logging
- Real-time activity feed with loading states

### Activity Formatting
```typescript
const formatActivityMessage = (activity: any) => {
  switch (activity.action) {
    case 'court_booking':
      return `${playerName} booked court ${activity.details.courtNumber}...`;
    case 'tournament_registration':
      return `${playerName} registered for ${activity.details.tournamentName}`;
    case 'payment_made':
      return `${playerName} made a payment of $${activity.details.amount}`;
    case 'member_joined':
      return `${playerName} joined the club`;
    // ... more cases
  }
};
```

## API Endpoints

### Activities Endpoint
**URL**: `/api/organization/[orgId]/activities`
**Method**: GET
**Response**:
```json
{
  "activities": [
    {
      "id": "uuid",
      "action": "court_booking",
      "details": { /* activity-specific details */ },
      "player": {
        "name": "John Doe",
        "photo": "url"
      },
      "createdAt": "2026-03-23T10:30:00Z"
    }
  ]
}
```

## Activity Score Calculation

Organization activity score is calculated based on:
- **Metric**: Count of unique activities in the last 30 days
- **Formula**: `Math.min(activityCount, 100)` (capped at 100)
- **Update**: Automatic update whenever new activity is tracked
- **Display**: Shown in DashboardTab as organization reputation metric

## Features Implemented

✅ **Real-time Activity Tracking**
- Automatic logging on player actions
- Organization context for all activities
- Player identification with names/avatars
- Timestamp tracking with proper ISO formatting

✅ **Activity Types Covered**
- Court bookings (with court details, time, pricing)
- Tournament registrations (with tournament name, signup order)
- Tournament waitlisting (with position tracking)
- Member joining (with join method tracking)
- Payments (with amount, currency, payment method)

✅ **Payment Gateway Support**
- M-Pesa (with receipt number tracking)
- PayPal (with token tracking)
- Stripe (with payment intent ID tracking)

✅ **Dashboard Display**
- Recent activity feed (last 20 activities)
- Activity icons and descriptions
- Player avatars and names
- Activity timestamps
- Organization activity score
- Real-time updates without page refresh

✅ **Error Handling**
- Try-catch blocks for activity tracking
- Graceful degradation if tracking fails
- Detailed error logging

## Files Modified

1. **`/prisma/schema.prisma`** - Added OrganizationActivity model
2. **`/src/lib/organizationActivity.ts`** - New activity tracking system
3. **`/src/actions/bookings.ts`** - Court booking activity tracking
4. **`/src/actions/tournaments.ts`** - Tournament activity tracking
5. **`/src/app/api/webhooks/mpesa/route.ts`** - M-Pesa payment tracking
6. **`/src/app/api/webhooks/paypal/route.ts`** - PayPal payment tracking
7. **`/src/app/api/webhooks/stripe/route.ts`** - Stripe payment tracking
8. **`/src/app/organization/[id]/page.tsx`** - Activity feed display
9. **`/src/app/api/organization/[orgId]/activities/route.ts`** - Activity API endpoint

## Database Migration

Run migration to apply the OrganizationActivity model:
```bash
npx prisma migrate dev --name add_organization_activity
```

## Testing Checklist

- [ ] Create court booking → Activity appears in dashboard
- [ ] Register for tournament → Activity appears in dashboard
- [ ] Join tournament waitlist → Activity appears in dashboard
- [ ] Create club member → Activity appears in dashboard
- [ ] Complete payment (M-Pesa) → Activity appears in dashboard
- [ ] Complete payment (PayPal) → Activity appears in dashboard
- [ ] Complete payment (Stripe) → Activity appears in dashboard
- [ ] Activity feed shows 20 most recent activities
- [ ] Activity timestamps are correctly formatted
- [ ] Player names and avatars display correctly
- [ ] Organization activity score increases with activity
- [ ] Activity API endpoint returns correct data structure

## Future Enhancements

1. **Activity Filtering** - Filter by action type, date range, or player
2. **Activity Analytics** - Trends, insights, peak activity times
3. **Notifications** - Real-time alerts for organization staff
4. **Activity Webhooks** - Send activity events to external systems
5. **Audit Logging** - Additional audit trail for compliance
6. **Activity Recommendations** - Suggest actions based on patterns
7. **Match Results** - Track match outcomes and ranking changes
8. **Performance Metrics** - Track player engagement and retention

## System Requirements

- **Database**: PostgreSQL with Prisma ORM
- **Runtime**: Node.js 18+
- **Framework**: Next.js 15+
- **Payment Gateways**: M-Pesa, PayPal, Stripe (optional)

## Deployment Notes

1. Ensure PostgreSQL database is accessible
2. Run migrations before deploying: `npx prisma migrate deploy`
3. Set environment variables for payment webhooks
4. Test payment webhook callbacks in staging environment
5. Monitor activity tracking performance with high activity volume

## Support & Troubleshooting

**Activities not appearing**:
- Check if activity tracking catch block is being hit
- Verify organization exists in database
- Check player profile exists and has correct userId

**Payment activities not tracked**:
- Verify webhook endpoints are receiving events
- Check payment record exists in database
- Verify eventId is present in payment record

**Performance issues**:
- Add database indexes on organizationId and createdAt
- Consider pagination for activity feed with high volume
- Archive old activities after 90 days if needed
