# Coach Request Management System - Implementation Summary

## Overview
A comprehensive system for players to view, manage, and track coaching requests from coaches, with complete history tracking and communication capabilities.

## Database Schema Changes

### New Models Added

#### 1. **CoachRequest**
Represents a coaching request from a coach to a player.

```prisma
model CoachRequest {
  id            String   @id @default(uuid())
  coachId       String
  playerId      String
  status        String   @default("pending") // "pending", "accepted", "declined"
  requestedAt   DateTime @default(now())
  respondedAt   DateTime?
  message       String?  // Initial message from coach
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  coach   Staff                    @relation("CoachRequests", fields: [coachId], references: [userId], onDelete: Cascade)
  player  Player                   @relation("CoachRequests", fields: [playerId], references: [userId], onDelete: Cascade)
  history CoachRequestHistory[]

  @@unique([coachId, playerId])
  @@index([coachId])
  @@index([playerId])
  @@index([status])
  @@index([requestedAt])
}
```

#### 2. **CoachRequestHistory**
Tracks all interactions and status changes for each coaching request.

```prisma
model CoachRequestHistory {
  id                 String   @id @default(uuid())
  coachRequestId     String
  action             String   // "request_sent", "request_accepted", "request_declined", "message_sent", "outreach"
  actionBy           String   // "coach" or "player"
  message            String?
  metadata           Json?    // Additional data for the action
  createdAt          DateTime @default(now())

  coachRequest CoachRequest @relation(fields: [coachRequestId], references: [id], onDelete: Cascade)

  @@index([coachRequestId])
  @@index([createdAt])
  @@index([action])
}
```

### Updated Relations

- **Staff Model**: Added `coachRequests` relation to track requests sent by the coach
- **Player Model**: Added `coachRequests` relation to track requests received by the player

## API Endpoints

### 1. Get All Coach Requests
```
GET /api/players/[playerId]/coach-requests-v2
```

**Response:**
```json
{
  "requests": [
    {
      "id": "req-123",
      "coachId": "coach-456",
      "coachName": "John Smith",
      "coachPhoto": "...",
      "coachEmail": "john@example.com",
      "coachPhone": "+1234567890",
      "coachBio": "Professional tennis coach...",
      "coachRole": "Head Coach",
      "coachExpertise": "Tennis coaching - singles and doubles",
      "yearsOfExperience": 15,
      "organization": { "id": "org-1", "name": "Tennis Academy" },
      "status": "pending",
      "initialMessage": "I can help you improve your game...",
      "requestedAt": "2026-05-29T10:00:00Z",
      "respondedAt": null,
      "history": [
        {
          "id": "hist-1",
          "action": "request_sent",
          "actionBy": "coach",
          "message": "I can help you improve your game...",
          "createdAt": "2026-05-29T10:00:00Z"
        }
      ]
    }
  ],
  "stats": {
    "total": 5,
    "pending": 2,
    "accepted": 2,
    "declined": 1
  },
  "grouped": {
    "pending": [...],
    "accepted": [...],
    "declined": [...]
  }
}
```

### 2. Accept or Decline Coach Request
```
PUT /api/players/[playerId]/coach-requests-v2/[requestId]
```

**Request Body:**
```json
{
  "action": "accept" | "decline"
}
```

**Response:**
- On accept: Creates/updates a `CoachPlayerRelationship` with status "active"
- Sends email notification to coach
- Records history entry

### 3. Reach Out to Coach
```
POST /api/players/[playerId]/coach-requests-v2/[requestId]/reach-out
```

**Request Body:**
```json
{
  "message": "I'm interested in working with you...",
  "subject": "Coaching Inquiry" // optional
}
```

**Response:**
- Records message in history
- Sends email to coach with player's contact info

### 4. Get Coach Request History
```
GET /api/players/[playerId]/coach-requests-v2/[requestId]/history
```

**Response:**
```json
{
  "requestId": "req-123",
  "coachId": "coach-456",
  "status": "pending",
  "requestedAt": "2026-05-29T10:00:00Z",
  "respondedAt": null,
  "initialMessage": "...",
  "history": [
    {
      "id": "hist-1",
      "action": "request_sent",
      "actionBy": "coach",
      "message": "Initial request message",
      "createdAt": "2026-05-29T10:00:00Z"
    },
    {
      "id": "hist-2",
      "action": "message_sent",
      "actionBy": "player",
      "message": "I'm very interested!",
      "metadata": { "subject": "Coaching Inquiry" },
      "createdAt": "2026-05-29T11:30:00Z"
    }
  ]
}
```

## Frontend Components

### CoachRequestsComponent
Location: `src/components/player/CoachRequestsComponent.tsx`

Features:
- **View all coach requests** with coach details (photo, expertise, experience)
- **Status indicators**: Pending (yellow), Accepted (green), Declined (red)
- **Accept/Decline buttons** for pending requests
- **Reach out functionality** with message composition
- **Activity timeline** showing all interactions with each coach
- **Statistics dashboard** showing total, pending, accepted, and declined requests

### Player Profile Integration
Added new "Coach Requests" tab to player profile page at:
`src/app/players/profile/[playerId]/page.tsx`

Tab includes:
- 👨‍🏫 Coach Requests tab button
- Full integration with CoachRequestsComponent
- Accessible from player's own profile or coach views

## Key Features

1. **Request Management**
   - Players can view all coaching requests
   - Accept or decline individual requests
   - Clear status indicators

2. **Communication**
   - Players can reach out to coaches who have requested
   - Message tracking in history
   - Email notifications to coaches

3. **History Tracking**
   - Complete audit trail of all interactions
   - Timestamps for all actions
   - Metadata storage for additional context

4. **Statistics**
   - Count of total requests
   - Breakdown by status (pending, accepted, declined)
   - Visual indicators for quick overview

5. **Integration with Existing System**
   - When player accepts a request, automatically creates `CoachPlayerRelationship`
   - Maintains backward compatibility with existing recruitment system
   - Uses existing notification system for emails

## User Workflow

### As a Player:
1. Navigate to "Coach Requests" tab on profile
2. See all coaches who have requested to coach you
3. For each request:
   - View coach's details (bio, expertise, experience)
   - See initial request message
   - View activity timeline showing all interactions
   - Accept or decline the request
   - Reach out to coach with a message

### Coach Request Status Flow:
- **Pending**: Coach has requested, player hasn't responded
  - Player can: Accept, Decline, or Reach Out
- **Accepted**: Player has accepted the request
  - Player can: Send messages to coach
  - `CoachPlayerRelationship` is created/activated
- **Declined**: Player has declined the request
  - No further action possible

## Database Migrations

Migration created: `add-coach-request-system`

Adds:
- `CoachRequest` table
- `CoachRequestHistory` table
- Relations to `Staff` and `Player` models
- Necessary indexes for performance

## Future Enhancements

1. **Coach-side endpoints**: Accept/view requests sent
2. **Advanced filtering**: Filter requests by date, coach expertise, etc.
3. **Bulk actions**: Accept/decline multiple requests
4. **Request notes**: Add private notes on requests
5. **Expiration**: Auto-expire requests after certain period
6. **Recommendations**: Suggest coaches to players
7. **Session booking**: Quick booking after acceptance
