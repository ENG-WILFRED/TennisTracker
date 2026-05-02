# Vico API & Event Architecture

**Date**: April 29, 2026  
**Status**: Comprehensive API Design

---

## Overview

The Vico API is organized around **event-driven workflows**. Everything flows from sessions through a series of triggered events that update metrics, finances, and recommendations.

**Core principle**: When something happens in the system (session completed, match recorded, etc.), it triggers a chain of dependent actions through the API layer.

---

## 1. Domain-Driven API Organization

### 1.1 Core Domains & Their APIs

```
┌─────────────────────────────────────────────────────────────┐
│ IDENTITY & MEMBERSHIP                                       │
├─────────────────────────────────────────────────────────────┤
│ POST   /api/users                     (Create user)         │
│ GET    /api/users/{id}                (Get user profile)    │
│ POST   /api/memberships               (Enroll in org)       │
│ GET    /api/organizations/{id}/members (List members)      │
│ PUT    /api/memberships/{id}          (Update membership)   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SESSIONS (Backbone)                                         │
├─────────────────────────────────────────────────────────────┤
│ POST   /api/sessions                  (Schedule session)    │
│ GET    /api/sessions                  (List sessions)       │
│ GET    /api/sessions/{id}             (Get session)         │
│ PUT    /api/sessions/{id}             (Update session)      │
│ PUT    /api/sessions/{id}/confirm     (Confirm session)     │
│ PUT    /api/sessions/{id}/start       (Start session)       │
│ PUT    /api/sessions/{id}/complete    ⭐ EVENT TRIGGER      │
│ PUT    /api/sessions/{id}/cancel      (Cancel session)      │
│                                                              │
│ POST   /api/sessions/{id}/bookings    (Book session)        │
│ PUT    /api/bookings/{id}             (Update booking)      │
│ GET    /api/coach/{id}/availability   (List availability)   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PROGRESS & METRICS                                          │
├─────────────────────────────────────────────────────────────┤
│ GET    /api/players/{id}/metrics      (Get player metrics)  │
│ GET    /api/players/{id}/history      (Metric history)      │
│ POST   /api/progress-updates          (Submit progress)     │
│ GET    /api/sessions/{id}/report      (Session report)      │
│ GET    /api/players/{id}/reports      (Player reports)      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PAYMENTS (Org-Centric)                                      │
├─────────────────────────────────────────────────────────────┤
│ GET    /api/revenues                  (List revenues)       │
│ GET    /api/invoices                  (List invoices)       │
│ POST   /api/invoices                  (Generate invoice)    │
│ GET    /api/wallet/{coachId}          (Coach wallet)        │
│ GET    /api/payouts                   (Payout history)      │
│ POST   /api/payouts                   (Request payout)      │
│ POST   /api/subscriptions             (Create subscription) │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ RECOMMENDATIONS                                             │
├─────────────────────────────────────────────────────────────┤
│ GET    /api/recommendations           (List recommendations)│
│ PUT    /api/recommendations/{id}      (Update status)       │
│ POST   /api/recommendations/{id}/ack  (Acknowledge)         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ REPORTING & ANALYTICS                                       │
├─────────────────────────────────────────────────────────────┤
│ GET    /api/reports/player/{id}       (Player report)       │
│ GET    /api/reports/parent/{id}       (Parent report)       │
│ GET    /api/reports/coach/{id}        (Coach report)        │
│ GET    /api/analytics                 (Org analytics)       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ADMIN & OPERATIONS                                          │
├─────────────────────────────────────────────────────────────┤
│ GET    /api/admin/dashboard           (Admin overview)      │
│ PUT    /api/admin/pricing             (Set pricing)         │
│ POST   /api/admin/payouts/process     (Process payouts)     │
│ POST   /api/admin/reports/generate    (Trigger reports)     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. The Critical Event: Session Completion

### 2.1 Trigger Point

```
PUT /api/sessions/{sessionId}/complete
{
  "status": "completed",
  "actualDuration": 60,  // minutes
  "notes": "Great session, focused on serve"
}
```

### 2.2 Event Handler Flow (Synchronous + Asynchronous)

```
Session Complete Endpoint Called
        ↓
1. VALIDATE (Synchronous)
   - Session exists & belongs to org
   - Coach is authorized
   - Session status is "in-progress" or "scheduled"
   
2. UPDATE SESSION (Synchronous)
   - Set status = "completed"
   - Set completedAt = now()
   - Mark all SessionBookings as "completed"
   
3. TRIGGER ASYNC EVENTS (Queue these)
   ├─ Event: SessionCompleted
   │  └─ Payload: { sessionId, coachId, playerId, price, ... }
   │
   └─ Process:
      ├─ Progress Update Event → progressUpdatedEvents queue
      ├─ Metrics Update Event  → metricsUpdatedEvents queue
      ├─ Revenue Event         → revenueRecordedEvents queue
      ├─ Earning Event         → coachEarningEvents queue
      ├─ Recommendation Event  → recommendationTriggeredEvents queue
      └─ Notification Event    → notificationQueues (SMS, push, email)

4. RETURN TO CLIENT
   HTTP 200 { sessionId, status: "completed" }
```

### 2.3 Asynchronous Event Processing (Queue-Based)

```
EventQueue: SessionCompleted
  Message: { sessionId: "xyz", coachId: "abc", playerId: "def", orgId: "org1" }
  
  Consumer 1: ProgressUpdateHandler
    ├─ Check if ProgressUpdate exists for session
    ├─ If not, wait for coach submission (via separate endpoint)
    └─ When available, update PlayerMetric
    
  Consumer 2: MetricsUpdateHandler
    ├─ Get ProgressUpdate for this session
    ├─ Calculate metric changes
    ├─ Update PlayerMetric
    ├─ Create MetricHistory record
    ├─ Calculate trend
    └─ Queue: MetricsUpdatedEvent
    
  Consumer 3: RevenueRecorder
    ├─ Get session price
    ├─ Create OrgRevenue record
    ├─ status = "pending" (awaiting payment)
    └─ Queue: RevenueRecordedEvent
    
  Consumer 4: CoachEarningCalculator
    ├─ Calculate earnings = price × (1 - commission%)
    ├─ Create CoachEarning record
    ├─ Update CoachWallet
    │  ├─ pendingBalance += earnings
    │  └─ totalEarned += earnings
    ├─ Create WalletTransaction
    └─ Queue: CoachEarningRecordedEvent
    
  Consumer 5: RecommendationEngine
    ├─ Analyze PlayerMetric trends
    ├─ Check for stagnation (no improvement 5+ sessions)
    ├─ Check for breakthrough (+10 in metric)
    ├─ Generate recommendations if triggered
    ├─ Create Recommendation records
    └─ Queue: RecommendationsGeneratedEvent
    
  Consumer 6: NotificationDispatcher
    ├─ For Parent:
    │  └─ Send: "Session completed! Progress update available"
    ├─ For Coach:
    │  └─ Send: "Session done. Earnings pending: $40"
    └─ For Admin:
       └─ Log: "Revenue recorded: $50 from player X"
```

---

## 3. API Endpoint Details

### 3.1 Session Management

#### Complete Session (⭐ Critical)

```typescript
PUT /api/sessions/{sessionId}/complete

Request:
{
  "status": "completed",
  "actualDuration": 60,        // minutes
  "notes": "Great progress",
  "playerAttendance": {
    "playerId1": "attended",
    "playerId2": "absent"
  }
}

Response 200:
{
  "id": "session-123",
  "status": "completed",
  "completedAt": "2026-04-29T14:30:00Z",
  "eventQueued": true,
  "message": "Session completed. Events queued for processing."
}

Error Cases:
- 400: Session not in progress
- 403: Not authorized (not coach)
- 404: Session not found
```

#### Confirm Session (Before Start)

```typescript
PUT /api/sessions/{sessionId}/confirm

Request:
{
  "confirmedAt": "2026-04-29T14:00:00Z"
}

Response 200:
{
  "id": "session-123",
  "status": "confirmed",
  "notifications": "Sent to player & coach"
}
```

### 3.2 Progress Updates

#### Submit Progress (Coach)

```typescript
POST /api/progress-updates

Request:
{
  "sessionId": "session-123",
  "playerId": "player-456",
  
  "ratingChanges": {
    "serve": +5,
    "forehand": 0,
    "backhand": -2,
    "movement": +3,
    "stamina": 0,
    "strategy": +2,
    "mentalToughness": +1,
    "courtAwareness": 0
  },
  
  "focusAreas": ["backhand", "stamina"],
  "notes": "Player showing good improvement in serve. Needs work on consistency."
}

Response 201:
{
  "id": "progress-123",
  "sessionId": "session-123",
  "playerId": "player-456",
  "ratingChanges": { ... },
  "focusAreas": [ ... ],
  "overallProgress": 75,  // calculated by system
  "createdAt": "2026-04-29T14:35:00Z"
}

Post-submission:
  1. MetricsUpdateHandler processes this
  2. PlayerMetric updated
  3. MetricHistory created
  4. RecommendationEngine checks for triggers
```

#### Get Player Metrics

```typescript
GET /api/players/{playerId}/metrics?organizationId=org-1

Response 200:
{
  "id": "metric-789",
  "playerId": "player-456",
  "organizationId": "org-1",
  
  "metrics": {
    "serve": 65,
    "forehand": 58,
    "backhand": 48,
    "movement": 62,
    "stamina": 55,
    "strategy": 70,
    "mentalToughness": 60,
    "courtAwareness": 52
  },
  
  "lastUpdated": "2026-04-29T14:35:00Z",
  "trend": "up",  // aggregate trend
  "sessionsCount": 12
}
```

#### Get Metric History (Time-Series)

```typescript
GET /api/players/{playerId}/history?organizationId=org-1&limit=10

Response 200:
[
  {
    "id": "history-1",
    "sessionId": "session-123",
    "timestamp": "2026-04-29T14:35:00Z",
    "metrics": { serve: 65, forehand: 58, ... },
    "changes": { serve: +5, forehand: 0, ... },
    "trend": "up"
  },
  // ... more history entries
]
```

### 3.3 Financial APIs

#### Get Coach Wallet

```typescript
GET /api/wallet/{coachId}?organizationId=org-1

Response 200:
{
  "id": "wallet-456",
  "coachId": "coach-123",
  "balance": 150.00,           // Available balance
  "currency": "KES",
  "totalEarned": 5200.00,      // Lifetime earnings
  "totalWithdrawn": 5050.00,   // Lifetime payouts
  "pendingBalance": 280.00,    // Pending from not-yet-finalized sessions
  "lastUpdated": "2026-04-29T14:35:00Z"
}
```

#### Request Payout

```typescript
POST /api/payouts

Request:
{
  "coachId": "coach-123",
  "amount": 150.00,
  "paymentMethod": "mpesa",
  "mpesaPhoneNumber": "254712345678",
  "notes": "Monthly earnings withdrawal"
}

Response 201:
{
  "id": "payout-789",
  "coachId": "coach-123",
  "amount": 150.00,
  "status": "pending",
  "paymentMethod": "mpesa",
  "requestedAt": "2026-04-29T14:40:00Z"
}

Post-request:
  1. Admin reviews pending payouts
  2. Admin triggers: POST /api/admin/payouts/process
  3. Payouts sent to M-Pesa / bank
  4. Confirmation updates status to "completed"
```

#### List Revenues

```typescript
GET /api/revenues?organizationId=org-1&status=pending&limit=50

Response 200:
[
  {
    "id": "revenue-123",
    "organizationId": "org-1",
    "paymentType": "per_session",
    "fromPlayerId": "player-456",
    "fromParentId": "parent-789",  // If applicable
    "amount": 50.00,
    "currency": "KES",
    "status": "pending",
    "sessionIds": ["session-123"],
    "paymentMethod": "mpesa",
    "mpesaTransactionId": "LK1234567890",
    "createdAt": "2026-04-29T14:00:00Z",
    "recordedAt": null  // Set when reconciled
  }
]
```

### 3.4 Recommendations API

#### Get Recommendations

```typescript
GET /api/recommendations?organizationId=org-1&targetId=player-456&status=active

Response 200:
[
  {
    "id": "rec-123",
    "organizationId": "org-1",
    "targetId": "player-456",
    "targetType": "player",
    
    "title": "Increase backhand drills",
    "description": "Your backhand has been stagnant for 5 sessions. Focus on corner-to-corner drills.",
    "priority": "high",
    "category": "training",
    
    "triggeredBy": "session_analysis",
    "triggerData": {
      "sessionCount": 5,
      "metricChange": 0,
      "metric": "backhand"
    },
    
    "actionItems": [
      "Complete 20-minute backhand routine daily",
      "Record progress and share with coach"
    ],
    
    "linkedSessionId": "session-123",
    
    "status": "active",
    "acknowledged": false,
    "validUntil": "2026-05-29T00:00:00Z",
    
    "createdAt": "2026-04-29T14:35:00Z"
  }
]
```

#### Acknowledge Recommendation

```typescript
POST /api/recommendations/{recId}/ack

Request:
{
  "acknowledgedAt": "2026-04-29T15:00:00Z"
}

Response 200:
{
  "id": "rec-123",
  "acknowledged": true,
  "acknowledgedAt": "2026-04-29T15:00:00Z"
}
```

### 3.5 Reporting APIs

#### Get Player Report

```typescript
GET /api/reports/player/{playerId}?organizationId=org-1&period=week

Response 200:
{
  "id": "report-123",
  "playerId": "player-456",
  "period": "week",
  "reportDate": "2026-04-29T00:00:00Z",
  "periodStart": "2026-04-22T00:00:00Z",
  "periodEnd": "2026-04-29T23:59:59Z",
  
  "metricsSnapshot": {
    "serve": 65,
    "forehand": 58,
    "backhand": 48,
    "movement": 62,
    "stamina": 55,
    "strategy": 70,
    "mentalToughness": 60,
    "courtAwareness": 52
  },
  
  "improvementScore": 75,  // 0-100
  
  "strengths": ["Strategy", "Serve", "Movement"],
  "weaknesses": ["Backhand", "Court Awareness", "Stamina"],
  
  "coachNotes": "Player showing excellent progress overall. Strategy is strong.",
  
  "focusAreas": ["Backhand consistency", "Stamina endurance"],
  "recommendedNextSteps": [
    "Increase backhand drills to 30 min/session",
    "Add 2 extra conditioning sessions/week"
  ],
  
  "generatedAt": "2026-04-29T08:00:00Z"
}
```

#### Get Analytics

```typescript
GET /api/analytics?organizationId=org-1

Response 200:
{
  "id": "analytics-org-1",
  "organizationId": "org-1",
  "date": "2026-04-29T00:00:00Z",
  
  "revenue": {
    "totalRevenue": 2500.00,
    "byType": {
      "per_session": 1800.00,
      "subscription": 500.00,
      "tournament": 200.00
    }
  },
  
  "players": {
    "activeCount": 45,
    "newCount": 3,
    "retentionRate": 92.5,
    "churnedCount": 1
  },
  
  "coaches": {
    "activeCount": 8,
    "totalEarnings": 2100.00,
    "avgRating": 4.6
  },
  
  "sessions": {
    "completionRate": 95.2,
    "avgRating": 4.5,
    "byType": {
      "1-on-1": 25,
      "group": 8,
      "match_play": 3
    }
  },
  
  "courts": {
    "utilization": 78.5,
    "totalBookings": 36,
    "peakHours": ["14:00-16:00", "16:00-18:00"]
  }
}
```

---

## 4. Event Processing Architecture

### 4.1 Message Queue System

```
Use: Redis Streams, RabbitMQ, or AWS SQS

Topic: SessionCompleted
  Consumers:
    - ProgressUpdateHandler
    - MetricsUpdateHandler
    - RevenueRecorder
    - CoachEarningCalculator
    - RecommendationEngine
    - NotificationDispatcher

Topic: MetricsUpdated
  Consumers:
    - RecommendationEngine (second pass)
    - ReportGenerator (scheduled)

Topic: CoachEarningRecorded
  Consumers:
    - NotificationDispatcher

Topic: RecommendationsGenerated
  Consumers:
    - NotificationDispatcher
    - ReportGenerator
```

### 4.2 Retry & Error Handling

```
For each event:
  MaxRetries: 3
  RetryDelay: 5 minutes
  
Failed events logged to:
  - DeadLetterQueue (for manual review)
  - AuditLog table
  - Admin dashboard alert
```

---

## 5. Notification Trigger System

### 5.1 Configuration (NotificationTrigger Model)

```typescript
// Example: Session Completed → Notify Parent

{
  id: "trigger-123",
  organizationId: "org-1",
  eventType: "session.completed",
  
  notifyTo: ["parent"],
  channels: ["sms", "push"],
  
  messageTemplate: "Session with {coachName} completed! {playerName} improved in {focusAreas}.",
  titleTemplate: "Session Completed - Progress Update Available",
  
  isActive: true,
  retryCount: 3,
  retryDelayMinutes: 5
}
```

### 5.2 Notification Dispatch Flow

```
RecommendationsGeneratedEvent
  ├─ Query NotificationTrigger for "recommendations.generated"
  ├─ For each trigger:
  │  ├─ Determine recipients (player, parent, coach, admin)
  │  ├─ Fetch user contact info (phone for SMS, device token for push)
  │  ├─ Render message using template
  │  ├─ Send via channels (SMS, push, email)
  │  └─ Log to Notification table with sentAt timestamp
  │
  └─ Retry failed sends after delayMinutes
```

---

## 6. Background Jobs / Scheduled Tasks

### 6.1 Weekly Analysis Job (Mondays 2 AM UTC)

```typescript
// Runs every Monday at 2:00 AM UTC

for each organization {
  for each player {
    1. Get all sessions in past 7 days
    2. Calculate metrics change
    3. Detect patterns:
       - Stagnation (no change 5+ sessions)
       - Breakthrough (+10 points)
       - Decline (-5+ points)
    
    4. Generate recommendations
    5. Create/update PlayerReport
    6. Queue: RecommendationsGeneratedEvent
  }
  
  for each coach {
    1. Aggregate player metrics
    2. Create CoachReport
  }
  
  for each org {
    1. Aggregate revenue, sessions, players
    2. Update OrgAnalytics
  }
}
```

### 6.2 Payout Processing (Weekly Friday 5 PM UTC)

```typescript
// Admin can manually trigger or set to run weekly

1. Get all pending CoachPayouts
2. Verify funds available in OrgRevenue
3. For each payout:
   - Initiate M-Pesa / bank transfer
   - Update status to "processing"
   - Create audit log
   
4. Wait for confirmation webhooks from payment provider
5. Update status to "completed"
6. Send notification to coach: "Payout confirmed: KES 5,000"
```

### 6.3 Report Generation (Daily 8 AM UTC)

```typescript
// Auto-generate reports for previous day

for each player {
  Create PlayerReport (daily snapshot)
}

for each parent {
  Create ParentReport (aggregated, weekly)
}

for each coach {
  Create CoachReport (aggregated, weekly)
}

for each organization {
  Update OrgAnalytics
}
```

---

## 7. Admin API

### 7.1 Admin Dashboard

```typescript
GET /api/admin/dashboard?organizationId=org-1

Response 200:
{
  "overview": {
    "totalRevenue": "$12,500",
    "pendingPayouts": "$2,100",
    "activeCoaches": 8,
    "activePlayers": 45
  },
  
  "alerts": [
    {
      "type": "payout_pending",
      "message": "8 payouts pending (KES 50,000 total)",
      "action": "Review & Process"
    },
    {
      "type": "revenue_unreconciled",
      "message": "15 revenues pending reconciliation",
      "action": "Reconcile"
    }
  ],
  
  "recentActivity": [
    {
      "timestamp": "2026-04-29T14:35:00Z",
      "event": "Session completed: Player X with Coach Y",
      "revenue": "+$50"
    }
  ]
}
```

### 7.2 Process Payouts

```typescript
POST /api/admin/payouts/process

Request:
{
  "organizationId": "org-1",
  "payoutIds": ["payout-1", "payout-2", "payout-3"],
  "notes": "Weekly payout cycle"
}

Response 200:
{
  "processed": 3,
  "totalAmount": 2100.00,
  "status": "processing",
  "estimatedCompletion": "2026-04-29T18:00:00Z"
}

Post-process:
  1. Each payout status → "processing"
  2. Payment provider API called
  3. Webhooks received for confirmation
  4. Status → "completed"
  5. Notifications sent to coaches
```

---

## 8. Error Handling & Resilience

### 8.1 Common Error Cases

```
Session Completion:
- 400: Session already completed
- 403: Not authorized (not coach)
- 404: Session not found

Progress Update:
- 400: Invalid rating changes (out of range)
- 404: Session not found
- 409: Progress already submitted

Payment:
- 400: Insufficient funds
- 402: Payment processing failed
- 503: Payment provider unavailable

Recommendation:
- 404: Target not found (player/coach doesn't exist)
```

### 8.2 Retry Logic

```
For API calls:
  Immediate: 1 retry
  Scheduled: Exponential backoff (5min, 15min, 1hr)

For queue events:
  MaxRetries: 3
  Delay: 5, 15, 60 minutes
  Deadletter after final failure
```

---

## 9. Data Consistency

### 9.1 Saga Pattern for Complex Flows

```
SessionCompletion Saga:
  1. Update CoachSession status ✅
  2. Update SessionBookings ✅
  3. Create OrgRevenue ✅
  4. Create CoachEarning ✅
  5. Update CoachWallet ✅
  6. Create WalletTransaction ✅
  
If any step fails:
  - All completed steps logged
  - Rollback initiated
  - Admin alert sent
  - Manual intervention may be needed
```

### 9.2 Idempotency

All API endpoints use idempotency keys:

```
POST /api/sessions/{id}/complete
Headers: {
  Idempotency-Key: "session-123-complete-2026-04-29-14:30"
}
```

This ensures duplicate requests don't create duplicate events.

---

## 10. API Rate Limiting & Security

### 10.1 Rate Limits

```
Per-user rates:
  - Read endpoints: 100 req/min
  - Write endpoints: 50 req/min
  - Admin endpoints: 20 req/min

Per-organization:
  - 10,000 req/hour
```

### 10.2 Authorization

```
Endpoints require:
  - Valid JWT token
  - User belongs to organization
  - User has required role/permission

Example:
  POST /api/sessions/{id}/complete
  Requires: coach role in session's organization
```

---

## 11. Implementation Roadmap

### Phase 1 (Weeks 1-2)
- ✅ Core session endpoints
- ✅ Progress update endpoint
- ✅ Async event queue setup

### Phase 2 (Weeks 3-4)
- Payment flow integration
- Notification dispatch
- Background job scheduler

### Phase 3 (Weeks 5-6)
- Reporting endpoints
- Admin dashboard
- Analytics aggregation

### Phase 4 (Weeks 7+)
- Advanced query optimization
- Caching layer
- Webhook integration (payment providers)

---

## 12. Monitoring & Observability

### 12.1 Logging

```
All API calls logged with:
  - Timestamp
  - Method, path, status
  - User ID, organization ID
  - Request/response payload (sanitized)
  - Processing time
```

### 12.2 Alerting

```
Alert on:
- API response time > 1 second
- Queue consumer lag > 5 minutes
- Failed events in dead letter queue
- Payout processing failures
- Revenue reconciliation discrepancies
```

---

**This API architecture enables data-driven decision-making with event-driven reliability and system scalability.**
