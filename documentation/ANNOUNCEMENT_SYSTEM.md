# Tournament Announcement System Documentation

## Overview

The tournament announcement system allows organizations to create and manage announcements for tournaments, which are automatically displayed to all players who have registered for that tournament.

## Architecture

### Database Model

**TournamentAnnouncement** - Stores all tournament-specific announcements

```prisma
model TournamentAnnouncement {
  id               String       @id @default(uuid())
  eventId          String       // Tournament ID
  organizationId   String       // Organization that created it
  title            String       // Announcement title
  message          String       // Announcement content
  announcementType String       // "general", "schedule", "results", "important"
  createdBy        String?      // User who created it
  isActive         Boolean      // Soft delete flag
  isPublished      Boolean      // Draft/published status
  expiresAt        DateTime?    // Optional expiration
  readBy           String[]     // Player IDs who read it
  createdAt        DateTime     // Creation timestamp
  updatedAt        DateTime     // Last update timestamp
  
  // Relations
  event            ClubEvent    @relation("announcements")
  organization     Organization @relation("tournamentAnnouncements")
}
```

### API Endpoints

#### Tournament Organizer - Create/Manage Announcements

**GET** `/api/tournaments/[id]/announcements`
- Fetch all announcements for a specific tournament
- Response: Array of TournamentAnnouncement objects

**POST** `/api/tournaments/[id]/announcements`
- Create a new announcement
- Body:
  ```json
  {
    "title": "Schedule Update",
    "message": "Matches have been rearranged",
    "announcementType": "schedule",
    "isPublished": true
  }
  ```

**PATCH** `/api/tournaments/[id]/announcements/[announcementId]`
- Update an existing announcement
- Body: Any fields to update (title, message, announcementType, isActive, isPublished)

**DELETE** `/api/tournaments/[id]/announcements/[announcementId]`
- Delete an announcement

#### Player - View Announcements

**GET** `/api/players/announcements`
- Get all announcements for tournaments the player is registered for
- Returns: Array of announcements with event details
- Only shows active and published announcements

### UI Components

#### 1. Tournament Announcements Section (Org Dashboard)
**Location**: `/src/app/organization/[id]/tournaments/[tournamentId]/components/TournamentAnnouncementsSection.tsx`

Features:
- View all tournament announcements
- Create new announcements (rich text)
- Delete announcements
- Real-time loading and submission

Usage:
```tsx
import { TournamentAnnouncementsSection } from '@/components/...';

<TournamentAnnouncementsSection tournament={tournament} />
```

#### 2. Announcements Widget (Player Dashboard)
**Location**: `/src/components/player/AnnouncementsWidget.tsx`

Features:
- Show 3 most recent announcements
- Quick view with truncated text
- Links to full announcements page
- Refreshable

Usage:
```tsx
import { AnnouncementsWidget } from '@/components/player/AnnouncementsWidget';

<AnnouncementsWidget />
```

#### 3. Player Announcements Page
**Location**: `/src/app/players/announcements/page.tsx`

Features:
- Full list of all announcements from registered tournaments
- Filter capability
- Announcement type indicators
- Direct links to tournament pages
- Auto-refresh functionality

## Usage Workflow

### For Tournament Organizers

1. **Navigate to Tournament**
   - Go to Organization Dashboard → Tournaments
   - Click on a tournament

2. **Create Announcement**
   - Find "Announcements" section
   - Click "Create Announcement"
   - Fill in title and message
   - Click "Publish Announcement"

3. **Manage Announcements**
   - View all published announcements
   - Edit if needed (future feature)
   - Delete when no longer needed

### For Players

1. **View Announcements in Dashboard**
   - Log in to player dashboard
   - See recent announcements in the widget
   - Click "View All Announcements" for full list

2. **Full Announcements Page**
   - Click on "View All Announcements" from widget
   - Or navigate directly to `/players/announcements`
   - See all announcements from registered tournaments
   - Click on tournament name to view tournament details

3. **Filter Announcements**
   - Filter by All or Unread (future feature)
   - See announcement type (Schedule, Results, Important, General)

## Data Flow

```
Org Creates Announcement
        ↓
POST /api/tournaments/[id]/announcements
        ↓
TournamentAnnouncement created in DB
        ↓
Player Dashboard Requests
        ↓
GET /api/players/announcements
        ↓
System finds all tournaments player registered for
        ↓
Returns active + published announcements
        ↓
Displayed in Player Dashboard & Announcements Page
```

## Features

✅ **Completed**
- Create tournament announcements
- View announcements by tournament
- Filter announcements for registered players
- Display on player dashboard
- Dedicated announcements page
- Announcement types (general, schedule, results, important)
- Publish/draft status
- Active/inactive toggle
- Real-time creation and deletion

🔄 **Future Enhancements**
- Read receipts (track which players read which announcements)
- Edit announcements
- Scheduled announcements (publish at specific time)
- Announcement expiration
- Push notifications
- SMS notifications for important announcements
- Player preferences for notification types
- Announcement search/filtering
- Announcement history

## Testing

### Manual Testing Steps

1. **Create a Tournament**
   - Go to Org Dashboard
   - Create a new tournament (or use existing)

2. **Register a Player**
   - As a player, register for the tournament
   - Confirm registration

3. **Create Announcement**
   - Go to organization tournament page
   - Navigate to Announcements section
   - Create a test announcement

4. **Verify in Player Dashboard**
   - Switch to player account
   - Go to player dashboard
   - See announcement in the widget

5. **View Full Announcements**
   - Click "View All Announcements"
   - Verify all announcements from registered tournaments appear

### API Testing (cURL Examples)

```bash
# Create announcement
curl -X POST http://localhost:3000/api/tournaments/{id}/announcements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "title": "Tournament Delayed",
    "message": "Due to weather, matches have been postponed",
    "announcementType": "schedule"
  }'

# Get announcements
curl http://localhost:3000/api/tournaments/{id}/announcements

# Get player announcements
curl http://localhost:3000/api/players/announcements \
  -H "Authorization: Bearer {token}"
```

## Implementation Details

### Authentication
- All creation/deletion requires `verifyApiAuth()` middleware
- Ensures only authorized staff can create announcements
- Uses player ID from auth context

### Data Includes
- Announcements include event data (name, organizationId)
- Players see announcements with full tournament context
- Timestamps formatted for human readability

### Performance
- Indexed by eventId and organizationId for fast queries
- Announcements sorted by creation date (newest first)
- Limited to 50 most recent for player view

### Error Handling
- Validates required fields (title, message)
- Returns 404 if event not found
- Returns 401 if unauthorized
- Catches database errors gracefully

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── tournaments/[id]/
│   │   │   └── announcements/
│   │   │       ├── route.ts (GET/POST)
│   │   │       └── [announcementId]/route.ts (PATCH/DELETE)
│   │   └── players/
│   │       └── announcements/route.ts (GET)
│   ├── players/
│   │   └── announcements/
│   │       └── page.tsx
│   └── organization/[id]/tournaments/[tournamentId]/
│       └── components/
│           └── TournamentAnnouncementsSection.tsx
├── components/
│   ├── player/
│   │   └── AnnouncementsWidget.tsx
│   └── dashboards/
│       └── DashboardHome/
│           └── index.tsx (includes widget)
└── lib/
    └── testAnnouncements.ts

prisma/
├── schema.prisma (TournamentAnnouncement model)
└── migrations/
    └── {timestamp}_add_tournament_announcements/
        └── migration.sql
```

## Database Relationships

```
Organization (1) ──→ (*) TournamentAnnouncement
ClubEvent (1) ──→ (*) TournamentAnnouncement
          ↓
ClubEvent (1) ──→ (*) EventRegistration
                           ↓
                      ClubMember
                           ↓
                         Player
```

## Next Steps to Enhance

1. **Notifications**
   ```typescript
   // Send email/SMS when announcement is published
   async function notifyPlayers(announcement: TournamentAnnouncement) {
     // Implementation
   }
   ```

2. **Read Tracking**
   ```typescript
   // Track which players read announcements
   async function markAsRead(announcementId: string, playerId: string) {
     // Implementation
   }
   ```

3. **Scheduling**
   ```typescript
   // Schedule announcements for future publication
   isScheduled: boolean
   scheduledAt: DateTime
   ```

4. **Rich Text**
   - Add TipTap or similar for rich text editing
   - Store as JSON for flexibility

5. **Templates**
   - Pre-made announcement templates
   - Quick creation for common announcements

6. **Analytics**
   - Track announcement engagement
   - See which announcements get most reads
   - Player feedback/reactions
