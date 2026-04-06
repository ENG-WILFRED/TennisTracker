# My Players Feature - Implementation Guide

## Overview
The "My Players" feature allows organization coaches and managers to:
- View all organization players
- Manage their coaching relationships with players
- Track player progress and performance metrics
- Send direct messages to recruit or communicate with players
- View player statistics (matches, win rate, experience level)

## Files Modified/Created

### 1. **API Endpoint** (`src/app/api/organization/[orgId]/players/route.ts`)
Enhanced with:
- Full player statistics (matches played, won, lost, win rate)
- Coach-player relationship tracking
- Filter by coach ID to get managed players
- Search and sorting capabilities

### 2. **Component** (`src/components/organization/dashboard-sections/OrganizationPlayersSection.tsx`)
New component featuring:
- Two tabs: "My Players" (managed) and "All Players" (available to recruit)
- Player cards showing level, match stats, and win rate
- Search/filter functionality
- Message button to initiate direct communication
- Real-time player statistics display

### 3. **Dashboard** (`src/components/dashboards/OrganizationDashboard.tsx`)
Updated to include:
- "My Players" navigation item (👨‍🏫)
- Conditional rendering for player management section
- Integration with authentication context

## Seed Scripts

### `seed-courts-with-players.js`
Associates players with courts through booking history:
- Randomly assigns 5 players to each court
- Creates realistic booking history (past and future)
- Tracks booking status and pricing

**Usage:**
```bash
node seed-courts-with-players.js
```

### `seed-coach-players.js`
Creates coach-player relationships (Primary for "My Players" feature):
- Links coaches with 5 random players each
- Creates coaching sessions with booking records
- Generates coaching notes and progress tracking
- Includes session feedback and attendance data

**Usage:**
```bash
node seed-coach-players.js
```

## Running the Seeds

### Prerequisites
1. Ensure the main seed has been run: `npm run seed`
2. Ensure courts have been created: `node seed-courts.js`
3. Ensure you have coaches in your organization (created via main seed with "Coach" role)

### Execution Order
```bash
# 1. Run main seed (players, users, organization)
npm run seed

# 2. Seed courts with details
node seed-courts.js

# 3. Associate players with courts (optional)
node seed-courts-with-players.js

# 4. Create coach-player relationships (MAIN - Required for My Players feature)
node seed-coach-players.js
```

## Data Model

### CoachPlayerRelationship
Tracks coaching relationships:
- `coachId`: Staff member (coach)
- `playerId`: Player being coached
- `status`: 'active', 'inactive', 'archived'
- `sessionsCount`: Number of completed sessions
- `lastSessionAt`: When the last session occurred
- `joinedAt`: When the coaching relationship started

### CoachPlayerNote
Stores coaching progress notes:
- Performance review
- Progress updates
- Injury reports
- General observations

### CoachSession
Represents coaching sessions with players:
- Session details and scheduling
- Status tracking (scheduled, completed, cancelled)
- Associated court location
- Session pricing

### SessionBooking
Tracks player attendance in coaching sessions:
- Attendance status
- Feedback rating and comments
- Session completion tracking

## Features Implemented

### 1. Player Discovery
- **All Players Tab**: Browse all players in the organization
- **Filter & Search**: Find players by name or username
- **Player Cards**: Display with photo, stats, and level

### 2. Player Management
- **My Players Tab**: View all managed players
- **Session Tracking**: See number of completed sessions
- **Progress Metrics**: Win rate, matches played, experience level
- **Join Date**: When the coaching relationship started

### 3. Communication
- **Direct Messaging**: Send DM to any player
- **Chat Integration**: Uses existing chat system (`/api/chat/dm`)
- **One-Click Messaging**: Message button on each player card

### 4. Statistics & Insights
**Per Player:**
- Skill Level (Beginner/Intermediate/Advanced)
- Match History (Matches Played, Won, Lost)
- Win Rate Percentage
- Number of Coaching Sessions
- Last Session Date

**Summary Stats:**
- Total Managed Players
- Total Organization Players
- Available to Recruit

## API Endpoints

### Get Organization Players
```
GET /api/organization/{orgId}/players
GET /api/organization/{orgId}/players?type=all

Response:
[
  {
    id: string,
    userId: string,
    firstName: string,
    lastName: string,
    email: string,
    photo?: string,
    matchesPlayed: number,
    matchesWon: number,
    matchesLost: number,
    winRate: string,
    createdAt: string
  }
]
```

### Get Managed Players
```
GET /api/organization/{orgId}/players?type=managed&coachId={coachId}

Response: Same as above, filtered to coach's players
```

### Send Direct Message
```
POST /api/chat/dm
Body: { targetUserEmail: string }

Response: Chat room details
```

## Next Steps / Future Enhancements

1. **Performance Tracking**
   - Add player rating system
   - Performance graphs over time
   - Skill progression tracking

2. **Advanced Messaging**
   - Group messaging to multiple players
   - Automated notifications
   - Message templates

3. **Session Scheduling**
   - Calendar view of player sessions
   - Automated session invitations
   - Session reminders

4. **Reports & Analytics**
   - Player improvement reports
   - Coach productivity metrics
   - Revenue and session analytics

5. **Player Profiles**
   - Detailed profile pages
   - Skill assessment records
   - Achievement tracking

6. **Notifications**
   - New player registration alerts
   - Session reminders
   - Performance milestone notifications

## Troubleshooting

### No players appear
- Run `npm run seed` to create initial players
- Verify players are assigned to organization in database
- Check `organizationId` matches

### Coach-player relationships not showing
- Run `node seed-coach-players.js`
- Ensure coaches exist with "Coach" role
- Check `CoachPlayerRelationship` table in database

### Message button not working
- Verify chat API is running
- Check `/api/chat/dm` endpoint
- Ensure player email is valid

### Missing statistics
- Verify `Player` table has `matchesWon`, `matchesPlayed` fields
- Run migrations if fields are missing
- Check player match history is recorded

## Database Queries

### View All Coach-Player Relationships
```sql
SELECT 
  s.userId as coach_id,
  u_coach.firstName,
  u_coach.lastName,
  p.userId as player_id,
  u_player.firstName,
  u_player.lastName,
  cpr.sessionsCount,
  cpr.status
FROM "CoachPlayerRelationship" cpr
JOIN "Staff" s ON cpr.coachId = s.userId
JOIN "User" u_coach ON s.userId = u_coach.id
JOIN "Player" p ON cpr.playerId = p.userId
JOIN "User" u_player ON p.userId = u_player.id
ORDER BY s.userId, cpr.createdAt DESC;
```

### View Court-Player Associations (via Bookings)
```sql
SELECT 
  c.name as court_name,
  cb.playerName,
  cb.startTime,
  cb.status,
  COUNT(*) as booking_count
FROM "CourtBooking" cb
JOIN "Court" c ON cb.courtId = c.id
GROUP BY c.id, c.name, cb.playerName
ORDER BY c.name;
```

## Testing

1. **Manual Testing**
   - Log in as organization manager
   - Navigate to "My Players" in dashboard
   - Verify player list loads
   - Click message button and verify chat opens

2. **Automated Testing** (to be implemented)
   - API endpoint tests
   - Component rendering tests
   - Message delivery tests

3. **Database Testing**
   - Verify seed data quantity
   - Check relationship integrity
   - Validate data consistency
