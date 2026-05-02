# Nearby Discovery Feature Implementation

## Overview

The Nearby Discovery feature allows users to find tennis players and courts near their current location. This feature is integrated across all user dashboards (except developer) and enables direct messaging and challenge requests to nearby players.

## Key Features

- **Geolocation-based search**: Uses browser geolocation API to get user's current position
- **Nearby players discovery**: Find tennis players within a configurable radius (default 5km)
- **Nearby courts discovery**: Find available tennis courts within a configurable radius (default 10km)
- **Direct messaging**: Send messages to nearby players from dashboards
- **Challenge requests**: Send tennis challenge requests to nearby players
- **Organization invitations**: Invite users to join organizations
- **Kenyan seed data**: Pre-populated with 50 Kenyan players and courts from various regions

## API Endpoints

### Players Nearby
- **Endpoint**: `GET /api/players/nearby`
- **Parameters**:
  - `latitude`: User's latitude (required)
  - `longitude`: User's longitude (required)
  - `radius`: Search radius in km (default: 5)
  - `userId`: Current user ID (for excluding self)
  - `limit`: Max results (default: 20, max: 100)
- **Response**: Array of nearby players with distance, level, wins, etc.

### Courts Nearby
- **Endpoint**: `GET /api/courts/nearby`
- **Parameters**:
  - `latitude`: User's latitude (required)
  - `longitude`: User's longitude (required)
  - `radius`: Search radius in km (default: 10)
  - `limit`: Max results (default: 15, max: 50)
- **Response**: Array of nearby courts with distance, facilities, organization info

### Organization Invitations
- **Endpoint**: `POST /api/organization/invitations`
- **Body**:
  - `orgId`: Organization ID
  - `emails`: Array of email addresses
  - `role`: Role to assign
  - `invitedBy`: Inviter user ID
- **Endpoint**: `GET /api/organization/invitations`
- **Parameters**:
  - `orgId`: Filter by organization
  - `email`: Filter by email

### Challenges
- **Endpoint**: `POST /api/challenges`
- **Body**:
  - `challengerId`: Challenger user ID
  - `challengedId`: Challenged user ID
  - `message`: Optional challenge message

## Components

### FindNearbyPeople
- **Location**: `src/components/FindNearbyPeople.tsx`
- **Props**:
  - `onMessageClick`: Callback for messaging a player
  - `onChallengeClick`: Callback for challenging a player
- **Features**:
  - Geolocation permission handling
  - Loading states
  - Player cards with photos, stats, distance
  - Message and challenge buttons

### FindNearbyCourts
- **Location**: `src/components/FindNearbyCourts.tsx`
- **Props**: None (stateless display component)
- **Features**:
  - Court cards with images, facilities, organization
  - Distance display
  - Surface type and lighting info

## Dashboard Integration

The nearby discovery feature is integrated into the following dashboards:

### Player Dashboard
- **Location**: `src/components/dashboards/PlayerDashboard.tsx`
- **Integration**: Added to main dashboard grid
- **Features**: Full messaging and challenge capabilities

### Coach Dashboard
- **Location**: `src/components/dashboards/CoachDashboard.tsx`
- **Integration**: Added to dashboard overview section
- **Features**: Messaging and challenge with status feedback

### Spectator Dashboard
- **Location**: `src/components/dashboards/spectator/SpectatorDashboard.tsx`
- **Integration**: Added to home section via `sections.tsx`
- **Features**: Full spectator messaging and challenge capabilities

### Organization Dashboard
- **Location**: `src/components/dashboards/OrganizationDashboard.tsx`
- **Integration**: Added to overview section
- **Features**: Organization member discovery and messaging

### Referee Dashboard
- **Location**: `src/components/dashboards/referee/RefereeDashboard.tsx`
- **Integration**: Added to main content area
- **Features**: Referee networking and messaging

### Admin Dashboard
- **Location**: `src/components/dashboards/AdminDashboard.tsx`
- **Integration**: Added to home section
- **Features**: Administrative oversight of player locations

### Finance Dashboard
- **Location**: `src/components/dashboards/FinanceDashboard.tsx`
- **Integration**: Added to main content
- **Features**: Financial analysis of local player activity

## Database Schema Changes

### User Model Extensions
```prisma
model User {
  // ... existing fields
  latitude   Float?
  longitude  Float?
  city       String?
  nationality String?
}
```

### MembershipInvitation Model
```prisma
model MembershipInvitation {
  id          String   @id @default(cuid())
  orgId       String
  email       String
  role        String
  status      String   @default("pending")
  invitedBy   String?
  invitedAt   DateTime @default(now())
  expiresAt   DateTime
  organization Organization @relation(fields: [orgId], references: [id])
}
```

## Chat and Challenge Integration

### Chat Deep-linking
- **Location**: `src/app/chat/page.tsx`
- **Features**: Supports `targetId` and `targetName` query parameters
- **Usage**: Direct navigation to chat with specific user

### Challenge Requests
- **Location**: `src/lib/nearby.ts`
- **Functions**:
  - `chatUrlForUser(userId, userName)`: Generates chat URL
  - `sendChallengeRequest(challengerId, challengedId)`: Sends challenge

### Helper Functions
```typescript
export function chatUrlForUser(userId: string, userName: string): string {
  return `/chat?targetId=${encodeURIComponent(userId)}&targetName=${encodeURIComponent(userName)}`;
}

export async function sendChallengeRequest(challengerId: string, challengedId: string): Promise<void> {
  // Implementation for sending challenge
}
```

## Seed Data

### Kenyan Players and Courts
- **Script**: `seed-players-courts-kenya.ts`
- **Data**: 50 players from various Kenyan cities (Nairobi, Nakuru, Kisumu, Eldoret, etc.)
- **Courts**: 7 courts in Nairobi area with different facilities
- **Execution**: `npx tsx seed-players-courts-kenya.ts`

### Sample Data Structure
```typescript
const kenyanPlayers = [
  {
    firstName: "Andrew",
    lastName: "Kiplagat",
    city: "Nakuru",
    latitude: -0.3031,
    longitude: 36.0800,
    nationality: "Kenyan"
  },
  // ... 49 more players
];
```

## Build and Deployment

### Build Configuration
- **Connection Limit**: Set to 10 in `src/lib/prisma.ts` for production builds
- **Dynamic Rendering**: Coaches page uses `export const dynamic = 'force-dynamic'` to prevent prerendering issues
- **Shared Prisma Client**: All database operations use shared client from `src/lib/prisma.ts`

### Performance Optimizations
- **Caching**: API responses cached for 5-60 seconds
- **Bounding Box Filtering**: Initial database queries use bounding boxes before distance calculations
- **Connection Pooling**: Prisma client configured with connection limits

## Testing

### API Testing
- Test geolocation permissions
- Verify distance calculations
- Check caching headers
- Validate error handling

### Component Testing
- Test loading states
- Verify geolocation fallbacks
- Check responsive design
- Validate button interactions

### Integration Testing
- Test chat deep-linking
- Verify challenge creation
- Check dashboard rendering
- Validate organization invitations

## Future Enhancements

- Real-time location updates
- Advanced filtering options (skill level, availability)
- Court booking integration
- Push notifications for nearby activity
- Social features (follow nearby players)
- Analytics dashboard for location data