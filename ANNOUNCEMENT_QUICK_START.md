# 🎾 Tournament Announcement System - Quick Start

## What's New

Implemented a complete tournament announcement system where:
- **Organizers** can create and publish announcements for tournaments
- **Players** who register for tournaments automatically see those announcements
- Announcements appear in the player dashboard and a dedicated announcements page

## Key Implementation

### 1. **Database** ✅
- Added `TournamentAnnouncement` model to Prisma schema
- Tracks title, message, type, publication status, and read receipts
- Relations to both `ClubEvent` (tournament) and `Organization`
- Migration applied: `20260325214850_add_tournament_announcements`

### 2. **API Endpoints** ✅

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/tournaments/[id]/announcements` | Fetch tournament announcements |
| POST | `/api/tournaments/[id]/announcements` | Create new announcement |
| PATCH | `/api/tournaments/[id]/announcements/[announcementId]` | Update announcement |
| DELETE | `/api/tournaments/[id]/announcements/[announcementId]` | Delete announcement |
| GET | `/api/players/announcements` | Get announcements for player's tournaments |

### 3. **Frontend Components** ✅

#### Organization View (Create/Manage)
- **File**: `src/app/organization/[id]/tournaments/[tournamentId]/components/TournamentAnnouncementsSection.tsx`
- Features: Create announcements, view all, delete, real-time updates

#### Player View (One-liner)
- **File**: `src/components/player/AnnouncementsWidget.tsx`
- Features: Show 3 most recent announcements with quick view

#### Player Full Page
- **File**: `src/app/players/announcements/page.tsx`
- Features: All announcements from registered tournaments, filtering

### 4. **Integration Points** ✅

**Player Dashboard Home**
- Added `AnnouncementsWidget` to `src/components/dashboards/DashboardHome/index.tsx`
- Shows recent announcements in the hero area

## How to Use

### For Tournament Organizers

```
1. Go to Organization Dashboard
2. Select a Tournament
3. Scroll to "Announcements" section
4. Click "Create Announcement"
5. Fill title and message
6. Click "Publish Announcement"
✓ All registered players will see it!
```

### For Players

```
Dashboard:
1. View recent announcements in the widget
2. Click "View All" to see full list

Full Announcements Page:
1. Go to `/players/announcements`
2. See all announcements from YOUR tournaments
3. Click tournament name to view tournament
```

## Data Structure

### Create Announcement

```json
POST /api/tournaments/{id}/announcements

{
  "title": "Important: Schedule Change",
  "message": "Semi-finals moved to Saturday 10 AM",
  "announcementType": "schedule",
  "isPublished": true
}
```

### Response

```json
{
  "id": "uuid",
  "eventId": "tournament-uuid",
  "organizationId": "org-uuid",
  "title": "Important: Schedule Change",
  "message": "Semi-finals moved to Saturday 10 AM",
  "announcementType": "schedule",
  "isPublished": true,
  "isActive": true,
  "createdBy": "user-id",
  "createdAt": "2026-03-26T...",
  "updatedAt": "2026-03-26T...",
  "event": {
    "name": "Spring Championship",
    "organizationId": "org-uuid"
  }
}
```

## Announcement Types

- **general** - Default, routine information
- **schedule** - Match schedule changes, rescheduling
- **results** - Match results, standings updates
- **important** - Critical information, warnings

## Files Changed/Created

### New Files
- `/src/app/api/tournaments/[id]/announcements/route.ts`
- `/src/app/api/tournaments/[id]/announcements/[announcementId]/route.ts`
- `/src/app/api/players/announcements/route.ts`
- `/src/app/players/announcements/page.tsx`
- `/src/components/player/AnnouncementsWidget.tsx`
- `/src/lib/testAnnouncements.ts`
- `/ANNOUNCEMENT_SYSTEM.md` (full documentation)

### Updated Files
- `/prisma/schema.prisma` (added TournamentAnnouncement model)
- `/src/app/organization/[id]/tournaments/[tournamentId]/components/TournamentAnnouncementsSection.tsx` (converted to real API)
- `/src/components/dashboards/DashboardHome/index.tsx` (added widget)

### Database
- **Migration**: `20260325214850_add_tournament_announcements`
- **New Tables**: `tournament_announcements`

## Features Included

✅ Create announcements  
✅ Publish/draft status  
✅ Multiple announcement types  
✅ Auto-filter for registered players  
✅ Real-time creation & deletion  
✅ Direct links to tournaments  
✅ Timestamp formatting  
✅ Error handling with validation  
✅ API authentication  
✅ Database relationships  

## Future Enhancements

- Read receipts / tracking
- Scheduled announcements
- Rich text editor (TipTap)
- Push notifications
- SMS alerts for important announcements
- Announcement templates
- Analytics dashboard
- Edit existing announcements
- Expiration/archiving

## Testing

### Manual Test Scenario

1. **Create Tournament** (as org)
   - Create a test tournament

2. **Register Player**
   - Register a player account for the tournament

3. **Create Announcement** (as org)
   - Go to tournament → Announcements
   - Create: "Welcome to Spring Championship!"
   - Publish

4. **View as Player**
   - Switch to player account
   - Dashboard shows announcement in widget
   - `/players/announcements` shows full announcement

5. **Verify Data**
   - Check database: `SELECT * FROM tournament_announcements`
   - Check relationship: announcement links to tournament

### API Test

```bash
# Create
curl -X POST http://localhost:3000/api/tournaments/{tournamentId}/announcements \
  -H "Authorization: Bearer {token}" \
  -d '{"title":"Test","message":"Message","announcementType":"general"}'

# List
curl http://localhost:3000/api/tournaments/{tournamentId}/announcements

# Player view (shows only their tournament announcements)
curl http://localhost:3000/api/players/announcements \
  -H "Authorization: Bearer {playerToken}"
```

## Architecture Summary

```
┌─ Tournament Admin
│  └─ Creates Announcement
│     └─ API: POST /api/tournaments/{id}/announcements
│        └─ Saves to TournamentAnnouncement table
│
├─ Player Dashboard
│  └─ Fetches Active Announcements
│     └─ API: GET /api/players/announcements
│        └─ Queries: tournaments where player registered
│           └─ Returns active + published announcements
│
├─ Dashboard Home
│  └─ Shows 3 Recent (AnnouncementsWidget)
│
└─ Full Announcements Page
   └─ Shows All (PlayerAnnouncementsSection)
```

## Key Design Decisions

1. **Separate Model**: `TournamentAnnouncement` instead of extending `ClubAnnouncement`
   - Allows tournament-specific features
   - Clear relationship to tournaments
   - Future scalability

2. **Auto-filtering**: Players only see tournaments they registered for
   - Uses `EventRegistration` relationship
   - Computed on server (secure)
   - No client-side filtering needed

3. **Multiple Components**: Widget + Full Page
   - Widget for quick overview
   - Full page for detailed view
   - Follows dashboard patterns

4. **Type System**: Announcement types for categorization
   - Helps players quickly identify announcement importance
   - UI can show different icons/colors

## Troubleshooting

### Announcements not showing

**Check**:
1. Player is registered for tournament: `SELECT * FROM event_registrations WHERE memberId = ? AND eventId = ?`
2. Announcement is published: `SELECT is_published FROM tournament_announcements WHERE id = ?`
3. Announcement is active: `SELECT is_active FROM tournament_announcements WHERE id = ?`
4. Event exists: `SELECT * FROM club_events WHERE id = ?`

### API returns 404

- Check tournament ID is correct
- Check announcement ID is correct
- Verify tournament exists

### API returns 401

- Check authentication token is valid
- Check user has permission to create announcements

## Questions?

Refer to `/ANNOUNCEMENT_SYSTEM.md` for detailed documentation.
