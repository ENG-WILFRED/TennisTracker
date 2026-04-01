# Messaging & Registration API Reference

**Created**: March 28, 2026  
**Scope**: Complete inventory of messaging, DM, registration APIs, and real-time infrastructure

---

## 🔍 EXECUTIVE SUMMARY

| System | Status | Files |
|--------|--------|-------|
| **DM/Chat Messaging** | ✅ Full Implementation | 11 API endpoints |
| **Registration Management** | ✅ Full Implementation | 6 API endpoints |
| **WebSocket (Real-time)** | ✅ Dedicated Server | Separate process on port 3001 |
| **Notifications** | ✅ Conversation-based | Via chat DMs |

---

## 1️⃣ DIRECT MESSAGE (DM) & CHAT API ENDPOINTS

### Core Chat Infrastructure

#### **1.1 Create DM Room**
- **Path**: [src/app/api/chat/dm/route.ts](src/app/api/chat/dm/route.ts)
- **Method**: `POST`
- **Auth**: JWT (verifyApiAuth)
- **Request**:
```json
{
  "targetUserId": "user-id-string",           // OR
  "targetUserEmail": "user@example.com"
}
```
- **Response** (201):
```json
{
  "id": "room-uuid",
  "name": "DM: userId1 - userId2",
  "description": "Direct message between users",
  "participantCount": 2,
  "onlineCount": 1,
  "isDM": true,
  "participants": [
    {
      "playerId": "user-id",
      "isOnline": true,
      "player": {
        "user": { "id", "firstName", "lastName", "photo" }
      }
    }
  ]
}
```
- **Features**:
  - Finds/creates room between two users
  - Auto-names based on users
  - Checks if DM already exists (returns existing)
  - Supports lookup by email or userId
  - Prevents self-messaging

---

#### **1.2 Get All Chat Rooms (DMs & Groups)**
- **Path**: [src/app/api/chat/rooms/route.ts](src/app/api/chat/rooms/route.ts)
- **Method**: `GET`
- **Auth**: JWT
- **Query Params**: None
- **Response** (200):
```json
[
  {
    "id": "room-uuid",
    "name": "John Doe",              // For DMs: participant name
    "description": "Direct message...",
    "participantCount": 2,
    "onlineCount": 1,
    "isDM": true,
    "dmParticipant": {
      "userId": "...",
      "firstName": "John",
      "lastName": "Doe",
      "photo": "url"
    },
    "lastMessage": "Last message content",
    "lastMessageTime": "ISO datetime"
  }
]
```
- **Caching**: 5s `Cache-Control: public, max-age=5, s-maxage=5`
- **Features**:
  - Single optimized query (select with _count)
  - Includes online count
  - Shows last message
  - Differentiates DM vs group rooms

---

#### **1.3 Send Message to Room**
- **Path**: [src/app/api/chat/rooms/[roomId]/messages/route.ts](src/app/api/chat/rooms/[roomId]/messages/route.ts)
- **Method**: `POST`
- **Auth**: JWT
- **Request**:
```json
{
  "content": "Message text",
  "replyToId": "parent-message-id"  // Optional: for replies
}
```
- **Response** (201):
```json
{
  "id": "message-uuid",
  "roomId": "room-id",
  "content": "...",
  "playerId": "sender-id",
  "playerName": "John Doe",
  "playerPhoto": "url",
  "createdAt": "ISO datetime",
  "deliveredAt": "ISO datetime",
  "readAt": null,
  "replyToId": null,
  "replyTo": {  // If replying to message
    "id": "...",
    "content": "...",
    "playerId": "...",
    "playerName": "...",
    "playerPhoto": "...",
    "createdAt": "..."
  },
  "reactions": []
}
```
- **Side Effects**:
  - Marks previous messages as read (only recent)
  - Broadcasts via WebSocket `broadcastToRoom()`
  - Updates message timestamps (deliveredAt)

---

#### **1.4 Get Messages from Room**
- **Path**: [src/app/api/chat/rooms/[roomId]/messages/route.ts](src/app/api/chat/rooms/[roomId]/messages/route.ts)
- **Method**: `GET`
- **Auth**: JWT
- **Query Params**:
```
?page=1              // Page number (deprecated)
?limit=50            // Messages per page (default 50, max 100)
?before=ISO_DATE     // Cursor-based pagination timestamp
```
- **Response** (200):
```json
{
  "messages": [
    {
      "id": "...",
      "content": "...",
      "playerId": "...",
      "playerName": "...",
      "playerPhoto": "...",
      "createdAt": "...",
      "deliveredAt": "...",
      "readAt": null,
      "replyToId": null,
      "replyTo": { /* as above */ },
      "reactions": [
        {
          "id": "reaction-id",
          "emoji": "❤️",
          "playerId": "user-id",
          "playerName": "Jane Doe"
        }
      ],
      "isDeleted": false
    }
  ],
  "hasMore": true,
  "nextCursor": "ISO_TIMESTAMP for next page"
}
```
- **Features**:
  - Cursor-based pagination (more scalable than offset)
  - Reverse chronological (most recent first)
  - Includes reaction counts
  - Supports message replies
  - Marks as read on retrieval

---

#### **1.5 React to Message (Emoji Reactions)**
- **Path**: [src/app/api/chat/messages/[messageId]/reactions/route.ts](src/app/api/chat/messages/[messageId]/reactions/route.ts)
- **Method**: `POST`
- **Auth**: JWT
- **Request**:
```json
{
  "emoji": "❤️"  // or any emoji
}
```
- **Response** (200):
```json
{
  "id": "reaction-id",
  "messageId": "...",
  "emoji": "❤️",
  "playerId": "..."
}
```
- **Features**:
  - Toggle reaction (call again to remove)
  - Broadcasts via WebSocket
  - Room membership validated
  - Counts tracked in message response

#### **1.6 Get Reactions for Message**
- **Path**: [src/app/api/chat/messages/[messageId]/reactions/route.ts](src/app/api/chat/messages/[messageId]/reactions/route.ts)
- **Method**: `GET`
- **Response**: Array of reaction objects with player details

---

#### **1.7 Delete Message**
- **Path**: [src/app/api/chat/messages/[messageId]/route.ts](src/app/api/chat/messages/[messageId]/route.ts)
- **Method**: `DELETE`
- **Auth**: JWT (sender only)
- **Response**: Soft-deletes message (sets isDeleted=true)

---

#### **1.8 Edit Message**
- **Path**: [src/app/api/chat/messages/[messageId]/edit/route.ts](src/app/api/chat/messages/[messageId]/edit/route.ts)
- **Method**: `PUT`
- **Auth**: JWT (sender only)
- **Request**:
```json
{
  "content": "Updated message text"
}
```
- **Response**: Updated message object

---

#### **1.9 Get Chat Room Participants**
- **Path**: [src/app/api/chat/rooms/[roomId]/participants/route.ts](src/app/api/chat/rooms/[roomId]/participants/route.ts)
- **Methods**: `GET` (list), `POST` (add)
- **GET Response**:
```json
[
  {
    "playerId": "user-id",
    "isOnline": true,
    "player": {
      "user": { "id", "firstName", "lastName", "photo" }
    }
  }
]
```
- **POST (Add Participant)**:
```json
{
  "playerId": "new-user-id"
}
```

---

#### **1.10 Get Room Status**
- **Path**: [src/app/api/chat/rooms/[roomId]/status/route.ts](src/app/api/chat/rooms/[roomId]/status/route.ts)
- **Method**: `GET`
- **Features**: Tracks online status, marks participant online

---

#### **1.11 Create Group Chat Room**
- **Path**: [src/app/api/chat/rooms/route.ts](src/app/api/chat/rooms/route.ts)
- **Method**: `POST`
- **Auth**: JWT
- **Request**:
```json
{
  "name": "Group Name",
  "description": "Group description",
  "isDM": false,
  "participantIds": ["user-id-1", "user-id-2"]
}
```
- **Response**: Room object with participants

---

#### **1.12 Backwards Compatibility Alias**
- **Path**: [src/app/api/chat/chats/route.ts](src/app/api/chat/chats/route.ts)
- **Methods**: `GET`, `POST`
- **Purpose**: External clients expecting `/api/chat/chats` instead of `/api/chat/rooms`

---

#### **1.13 Get Current User Chat Info**
- **Path**: [src/app/api/chat/me/route.ts](src/app/api/chat/me/route.ts)
- **Method**: `GET`
- **Response**: Current user's chat profile info

---

### Chat WebSocket (Legacy)
- **Path**: [src/app/api/chat/ws/route.ts](src/app/api/chat/ws/route.ts)
- **Purpose**: Chat-specific WebSocket (legacy, room-based broadcasting)
- **Query**: `?roomId=room-uuid`
- **Status**: ⚠️ Legacy (superseded by community WebSocket for announcements)

---

## 2️⃣ REGISTRATION API ENDPOINTS

### Tournament Event Registration

#### **2.1 Approve/Reject Registration**
- **Path**: [src/app/api/tournaments/[id]/registrations/[registrationId]/route.ts](src/app/api/tournaments/[id]/registrations/[registrationId]/route.ts)
- **Method**: `PATCH`
- **Auth**: Organization admin (implicit in context)
- **Request**:
```json
{
  "action": "approve",     // or "reject", "undo"
  "rejectionReason": "Too many entries"  // Optional for rejection
}
```
- **Response** (200):
```json
{
  "id": "registration-id",
  "eventId": "tournament-id",
  "memberId": "member-id",
  "status": "approved",    // or "rejected", "pending"
  "rejectionReason": null,
  "createdAt": "...",
  "updatedAt": "...",
  "event": { /* tournament data */ },
  "member": { /* member data */ }
}
```
- **Status Values**:
  - `pending` - Awaiting organization review
  - `approved` - Organization approved
  - `rejected` - Organization rejected with reason
  - `registered` - Payment confirmed (created via payment endpoint)
  - `waitlisted` - No more spots available

---

#### **2.2 Delete/Withdraw Registration**
- **Path**: [src/app/api/tournaments/[id]/registrations/[registrationId]/route.ts](src/app/api/tournaments/[id]/registrations/[registrationId]/route.ts)
- **Method**: `DELETE`
- **Auth**: JWT (player must be registration owner)
- **Request**:
```json
{
  "reason": "Personal reasons"  // Optional
}
```
- **Response** (200): Soft delete (isDeleted=true)
- **Validations**:
  - User must be the registered player
  - Cannot delete after event start

---

#### **2.3 Get Tournament with Registrations**
- **Path**: [src/app/api/tournaments/[id]/route.ts](src/app/api/tournaments/[id]/route.ts)
- **Method**: `GET`
- **Response Includes**:
```json
{
  "id": "tournament-id",
  "name": "Spring Championship",
  "entryFee": 50,
  "registrationCap": 32,
  "registrations": [
    {
      "id": "...",
      "status": "approved",
      "member": {
        "id": "...",
        "player": {
          "user": { "firstName", "lastName", "email", "photo" }
        }
      }
    }
  ],
  "registrationCount": 28,
  "approvedCount": 25,
  "waitlistCount": 3
}
```

---

#### **2.4 Payment Reminder (Registration-linked)**
- **Path**: [src/app/api/tournaments/payment-reminder/route.ts](src/app/api/tournaments/payment-reminder/route.ts)
- **Method**: `POST`
- **Auth**: JWT (organization admin)
- **Request**:
```json
{
  "eventId": "tournament-id",
  "registrationId": "registration-id",
  "memberId": "member-id",
  "message": "Please complete payment by Friday",
  "reminderType": "payment"  // or "confirmation", "announcement"
}
```
- **Response**: Stores reminder + returns success message
- **Process**:
  1. Validates registration exists
  2. Creates PaymentReminder record in DB
  3. (Component sends DM separately via chat API)

---

#### **2.5 Organization Player Registration**
- **Path**: [src/app/api/organization/[orgId]/register-player/route.ts](src/app/api/organization/[orgId]/register-player/route.ts)
- **Method**: `POST`
- **Auth**: JWT
- **Purpose**: Register/attach a player to an organization (for club membership)
- **Request**:
```json
{
  "playerId": "user-id"
}
```
- **Response** (200):
```json
{
  "userId": "...",
  "organization": { "id": "org-id" }
}
```
- **Side Effects**: Creates ClubMember record

---

#### **2.6 Auth/User Registration**
- **Path**: [src/app/api/auth/register/route.ts](src/app/api/auth/register/route.ts)
- **Method**: `POST`
- **Purpose**: Initial user registration (user account creation)
- **Request**:
```json
{
  "username": "...",
  "email": "...",
  "password": "...",
  "firstName": "...",
  "lastName": "...",
  "gender": "M",
  "dateOfBirth": "1990-01-01",
  "nationality": "Kenya",
  "bio": "...",
  "phone": "+254..."
}
```
- **Response** (200): `{ success: true }`
- **Handler**: Delegates to server action `registerPlayer()`

---

### Registration-Related Data Models

```prisma
model EventRegistration {
  id                    String
  eventId              String       // FK to ClubEvent/Tournament
  memberId             String       // FK to ClubMember
  status               String       // pending|approved|rejected|registered|waitlisted
  registeredAt         DateTime
  approvedAt           DateTime?
  rejectionReason      String?
  isDeleted            Boolean      @default(false)
  
  event                ClubEvent    @relation(fields: [eventId], references: [id])
  member               ClubMember   @relation(fields: [memberId], references: [id])
}

model PaymentReminder {
  id                   String
  eventId              String
  registrationId       String
  memberId             String
  reminderType         String       // payment|confirmation|announcement
  message              String?
  sentAt               DateTime
}
```

---

## 3️⃣ WEBSOCKET & REAL-TIME INFRASTRUCTURE

### Dedicated WebSocket Server

#### **3.1 Standalone WebSocket Server**
- **File**: [src/websocket-server.ts](src/websocket-server.ts)
- **Port**: 3001 (configurable via `WS_PORT`)
- **Process**: Separate from Next.js (critical for production)
- **Start Command**: `npm run websocket:dev`

**Architecture**:
```
Next.js API Routes → HTTP POST → WebSocket Server → Broadcasts to Clients
                   /broadcast/*             via WebSocket
```

**Connections**: userId → Set<WebSocket connections>

**HTTP Broadcast Endpoints**:
```
POST /broadcast/broadcast-all
POST /broadcast/broadcast-user
POST /broadcast/broadcast-except
POST /broadcast/broadcast-match
GET  /health
GET  /stats
```

---

#### **3.2 HTTP Broadcast Client**
- **File**: [src/lib/websocket-broadcast.ts](src/lib/websocket-broadcast.ts)
- **Purpose**: Used by API routes to trigger broadcasts
- **Functions**:

```typescript
// Send to all connected users
broadcastToClients({
  type: 'post-created',
  data: postObject
});

// Send to specific user
broadcastToUser(userId, { type: 'notification', ... });

// Send to everyone except sender
broadcastExcept(senderId, { type: '...', ... });

// Send to match watchers (future)
broadcastToMatch(matchId, { type: '...', ... });
```

**Implementation**: Makes HTTP POST requests (non-blocking)

---

#### **3.3 Client-Side WebSocket Hook**
- **File**: [src/hooks/useCommunityWebSocket.ts](src/hooks/useCommunityWebSocket.ts)
- **Type**: Real-time community updates (posts, comments, reactions)
- **Class**: `WebSocketManager`
- **Auth**: Uses NextAuth session (email-based userId)
- **Reconnection**: Exponential backoff (max 5 attempts)

**Hook Usage**:
```typescript
useCommunityUpdates(
  onPostCreated?: (post) => void,
  onCommentAdded?: (comment) => void,
  onCommentReplyAdded?: (reply) => void,
  onCommentReactionAdded?: (reaction) => void,
  onPostLiked?: (like) => void,
  onUserFollowed?: (follow) => void
)
```

**Message Types** Handled:
- `post-created`
- `comment-added`
- `comment-reply-added`
- `comment-reaction-added`
- `comment-reaction-removed`
- `post-liked`
- `user-followed`
- `feed-update`

---

#### **3.4 Chat Room WebSocket Integration**
- **File**: [src/context/chat/ChatContext.tsx](src/context/chat/ChatContext.tsx)
- **Purpose**: Real-time chat message updates
- **Protocol**: `ws://host/api/chat/ws?roomId=room-uuid`
- **Messages**: Per-room updates (typing, new messages in progress)
- **Note**: Complements REST API polling for chat

---

#### **3.5 Simple In-Memory Chat Socket Registry**
- **File**: [src/lib/chatSockets.ts](src/lib/chatSockets.ts)
- **Functions**: Legacy pattern for chat-specific broadcasting
- **Maps**: `roomId → Set<WebSocket connections>`
- **Status**: ⚠️ Non-scalable (memory), kept for compatibility

```typescript
addSocket(roomId, socket)        // Register connection
removeSocket(roomId, socket)     // Unregister
broadcastToRoom(roomId, data)    // Send to all in room
```

---

### Environment Configuration

**WebSocket Server Environment Variables**:
```bash
WS_PORT=3001                          # Server port (default)
WS_HOST=localhost                     # Bind address (default)
WS_SERVER_URL=http://localhost:3001   # For API POST requests
NEXT_PUBLIC_WS_URL=ws://localhost:3001 # For client connections (auto-detected)
```

**See**: [WEBSOCKET_ENV_CONFIG.md](WEBSOCKET_ENV_CONFIG.md)

---

## 4️⃣ NOTIFICATION SYSTEM

### How Notifications are Sent

**Current Implementation**: DM-based (conversation-focused)

1. **Manual Notifications**: Sent via chat DMs
   - [TournamentRegistrationsSection.tsx](src/app/organization/[id]/tournaments/[tournamentId]/components/TournamentRegistrationsSection.tsx) - Payment reminders
   - Creates DM room → sends ChatMessage

2. **Automated Announcements** (upcoming):
   - Tournament/Organization [announcements API](src/app/api/organization/[orgId]/announcements/route.ts)
   - Broadcast-based (WebSocket via community updates)

3. **Real-time Updates** (WebSocket):
   - Community posts/comments
   - Match updates
   - Follow notifications

---

### Payment Reminder Flow

```
TournamentRegistrationsSection
  ├─ Create DM with player (POST /api/chat/dm)
  ├─ Send message (POST /api/chat/rooms/{roomId}/messages)
  └─ Record reminder (POST /api/tournaments/payment-reminder)
```

**Example**: [src/app/organization/[id]/tournaments/[tournamentId]/components/TournamentRegistrationsSection.tsx](src/app/organization/[id]/tournaments/[tournamentId]/components/TournamentRegistrationsSection.tsx#L99)

---

## 📊 DATA RELATIONSHIPS

```
User
  ├─ Player (1:1)
  │   ├─ ChatParticipant (multiple)
  │   │   └─ ChatRoom
  │   │       └─ ChatMessage
  │   │           ├─ ChatMessageReaction
  │   │           └─ ChatMessage (replyTo)
  │   └─ EventRegistration
  │       ├─ ClubEvent
  │       ├─ PaymentReminder
  │       └─ ClubMember
  └─ Organization
      ├─ ClubEvent (Tournament)
      ├─ ClubMember
      └─ Announcements
```

---

## 🔐 AUTHENTICATION

**All Endpoints Use**: `verifyApiAuth(request)`
- Extracts JWT Bearer token
- Returns `{ playerId, userId, email }`
- Returns `null` if invalid/missing

**Header**: `Authorization: Bearer {jwt_token}`

---

## ✅ COMPREHENSIVE CHECKLIST

- ✅ DM creation (create or get existing)
- ✅ Chat rooms (group and DM)
- ✅ Send/receive messages with pagination
- ✅ Message reactions (emoji)
- ✅ Message replies
- ✅ Message editing/deletion
- ✅ Room participant management
- ✅ Registration approval/rejection
- ✅ Registration status tracking
- ✅ Payment reminders (DB + DM)
- ✅ WebSocket for real-time updates
- ✅ WebSocket for chat rooms (legacy)
- ✅ WebSocket for community posts
- ✅ User registration (account creation)
- ✅ Organization player registration

---

## 📚 RELATED DOCUMENTATION

1. [WEBSOCKET_ARCHITECTURE.md](WEBSOCKET_ARCHITECTURE.md) - Production setup guide
2. [WEBSOCKET_COMPLETE.md](WEBSOCKET_COMPLETE.md) - Implementation details
3. [WEBSOCKET_ENV_CONFIG.md](WEBSOCKET_ENV_CONFIG.md) - Environment variables
4. [API_QUICK_REFERENCE.md](API_QUICK_REFERENCE.md) - All API endpoints
5. [TOURNAMENT_REGISTRATION_PAYMENT_ANALYSIS.md](TOURNAMENT_REGISTRATION_PAYMENT_ANALYSIS.md) - Registration flow
6. [PAYMENT_REMINDER_COMPLETE.md](PAYMENT_REMINDER_COMPLETE.md) - Reminder implementation
7. [COMMENT_IMPLEMENTATION_SUMMARY.md](COMMENT_IMPLEMENTATION_SUMMARY.md) - Comment reactions

---

## 🎯 QUICK REFERENCE TABLE

| Feature | Endpoint | Method | Auth | Status |
|---------|----------|--------|------|--------|
| Create DM | `/api/chat/dm` | POST | JWT | ✅ |
| Get Rooms | `/api/chat/rooms` | GET | JWT | ✅ |
| Send Message | `/api/chat/rooms/[id]/messages` | POST | JWT | ✅ |
| Get Messages | `/api/chat/rooms/[id]/messages` | GET | JWT | ✅ |
| React to Msg | `/api/chat/messages/[id]/reactions` | POST | JWT | ✅ |
| Get Reactions | `/api/chat/messages/[id]/reactions` | GET | JWT | ✅ |
| Delete Message | `/api/chat/messages/[id]` | DELETE | JWT | ✅ |
| Edit Message | `/api/chat/messages/[id]/edit` | PUT | JWT | ✅ |
| Approve Registration | `/api/tournaments/[id]/registrations/[id]` | PATCH | Admin | ✅ |
| Reject Registration | `/api/tournaments/[id]/registrations/[id]` | PATCH | Admin | ✅ |
| Delete Registration | `/api/tournaments/[id]/registrations/[id]` | DELETE | Owner | ✅ |
| Payment Reminder | `/api/tournaments/payment-reminder` | POST | Admin | ✅ |
| Register User | `/api/auth/register` | POST | None | ✅ |
| Register Player to Org | `/api/organization/[id]/register-player` | POST | JWT | ✅ |

---

**Generated**: March 28, 2026
