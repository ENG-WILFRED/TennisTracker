# TennisTracker API Routes & Data Structures

## Overview
This document provides a complete mapping of all available API endpoints, their data structures, database schema relationships, and existing integration patterns used in dashboards.

---

## 1. CORE API ROUTES

### 1.1 Dashboard Routes

#### `/api/dashboard` - GET
**Purpose**: Retrieve comprehensive player dashboard data
**Query Parameters**: 
- `playerId` (required): UUID of the player

**Response Structure**:
```json
{
  "player": {
    "id": "string",
    "username": "string",
    "email": "string",
    "phone": "string | null",
    "firstName": "string",
    "lastName": "string",
    "photo": "string | null",
    "gender": "string | null",
    "dateOfBirth": "ISO8601 string | null",
    "nationality": "string | null",
    "bio": "string | null",
    "matchesPlayed": "number",
    "matchesWon": "number",
    "matchesLost": "number",
    "isClub": "boolean",
    "createdAt": "ISO8601 string",
    "updatedAt": "ISO8601 string"
  },
  "rank": "number",
  "badges": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "icon": "string | null"
    }
  ],
  "upcomingMatches": [
    {
      "id": "string",
      "opponent": "string",
      "role": "Player A | Player B",
      "round": "number",
      "date": "ISO8601 string"
    }
  ],
  "coaches": [
    {
      "id": "string",
      "name": "string",
      "firstName": "string",
      "lastName": "string",
      "role": "string",
      "contact": "string | null",
      "email": "string"
    }
  ],
  "attendance": [
    {
      "date": "ISO8601 string",
      "present": "boolean"
    }
  ],
  "inventory": [
    {
      "id": "string",
      "name": "string",
      "borrowed": "boolean"
    }
  ]
}
```

**Data fetching pattern** (from actions/matches.ts):
```typescript
// Uses multiple parallel queries:
1. prisma.player.findUnique() - with user and badges
2. prisma.player.findMany() - to calculate rank
3. prisma.match.findMany() - for upcoming matches (both playerA and playerB)
4. prisma.staff.findMany() - for coaches with role containing "Coach"
5. prisma.attendance.findMany() - for attendance records
6. prisma.inventoryItem.findMany() - for club inventory
```

---

### 1.2 Player Routes

#### `/api/players` - GET
**Purpose**: Search and list players
**Query Parameters**:
- `query` or `q` (optional): Search string for firstName/lastName prefix matching
- Returns top 8 players if no query, top 20 if query provided

**Response Structure**:
```json
[
  {
    "id": "string (userId)",
    "nationality": "string | null",
    "name": "string (firstName + lastName)",
    "username": "string",
    "wins": "number (matchesWon)",
    "matchesPlayed": "number",
    "level": "Beginner | Intermediate | Advanced",
    "img": "string (photo URL)"
  }
]
```

**Caching**: `public, max-age=5, s-maxage=5, stale-while-revalidate=10`

**Where clause in query**:
```typescript
{
  isClub: false,
  OR: [
    { user: { firstName: { startsWith: q, mode: 'insensitive' } } },
    { user: { lastName: { startsWith: q, mode: 'insensitive' } } }
  ]
}
```

#### `/api/players/[id]` - GET
**Purpose**: Get individual player details
**Path Parameters**: `id` (userId)

**Response Structure**:
```json
{
  "id": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string"
}
```

**Caching**: `public, max-age=5, s-maxage=5, stale-while-revalidate=10`

---

### 1.3 Coaches Routes

#### `/api/coaches` - GET
**Purpose**: List all coaches
**Response Structure**:
```json
[
  {
    "id": "string (userId)",
    "name": "string (firstName + lastName)",
    "role": "string (staff.role)",
    "expertise": "string | 'General Coaching'",
    "photo": "string (user.photo or default URL)",
    "studentCount": "number"
  }
]
```

**Where clause**: `{ role: { contains: 'Coach' } }`
**Ordering**: `user.firstName ASC`
**Caching**: `public, max-age=5, s-maxage=5, stale-while-revalidate=10`

#### `/api/coaches/available` - GET
**Purpose**: Get coaches not currently employed
**Response Structure**: Same as `/api/coaches`

**Where clause**: `{ role: { contains: 'Coach' }, employedById: null }`

#### `/api/coaches/employ` - (Not fully documented in provided files)
**Purpose**: Likely for hiring/employing coaches

---

### 1.4 Referees Routes

#### `/api/referees` - GET
**Purpose**: List all referees
**Response Structure**:
```json
[
  {
    "id": "string (userId)",
    "firstName": "string",
    "lastName": "string",
    "photo": "string | null",
    "nationality": "string | null",
    "matchesRefereed": "number",
    "ballCrewMatches": "number",
    "experience": "string | null",
    "certifications": "string[]"
  }
]
```

**Limit**: 50 records
**Caching**: `public, max-age=5, s-maxage=5, stale-while-revalidate=10`

#### `/api/referees/[id]` - GET
**Purpose**: Get individual referee details
**Path Parameters**: `id` (userId)

**Response Structure**: Same as list item above

**Caching**: `public, max-age=5, s-maxage=5, stale-while-revalidate=10`

#### `/api/referees/[id]` - PUT
**Purpose**: Update referee profile
**Authentication**: Requires Bearer JWT token
**Authorization**: Only the referee can update their own profile

**Updatable Fields**:
- `bio`
- `photo`
- `nationality`
- `experience`

**Request Body**:
```json
{
  "bio": "string (optional)",
  "photo": "string (optional)",
  "nationality": "string (optional)",
  "experience": "string (optional)"
}
```

---

### 1.5 Matches Routes

#### `/api/matches` - GET
**Purpose**: List recent matches
**Response Structure**:
```json
[
  {
    "id": "string",
    "date": "ISO8601 string (createdAt)",
    "playerA": {
      "id": "string (userId)",
      "name": "string"
    } | null,
    "playerB": {
      "id": "string (userId)",
      "name": "string"
    } | null,
    "status": "COMPLETED | PENDING",
    "winner": {
      "id": "string (user.id)",
      "name": "string"
    } | null
  }
]
```

**Limit**: 50 most recent matches
**Ordering**: `createdAt DESC`

**Include Relations**:
- `playerA` + nested `user`
- `playerB` + nested `user`
- `referee` + nested `user`
- `winner` + nested `user`

#### `/api/matches/[id]` - GET
**Purpose**: Get individual match details
**Path Parameters**: `id` (matchId)

**Response Structure**:
```json
{
  "id": "string",
  "round": "number",
  "createdAt": "ISO8601 string",
  "status": "COMPLETED | PENDING",
  "playerA": {
    "id": "string (userId)",
    "name": "string"
  } | null,
  "playerB": {
    "id": "string (userId)",
    "name": "string"
  } | null,
  "score": "string | null",
  "winner": {
    "id": "string (user.id)",
    "name": "string"
  } | null
}
```

---

## 2. DATABASE SCHEMA

### Core Entity Relationships

```
User (base entity)
  ├── Player (1:1)
  │   ├── playerBadges → Badge[]
  │   ├── matchesA → Match[] (as PlayerA)
  │   ├── matchesB → Match[] (as PlayerB)
  │   ├── matching results → Match[] (as winner)
  │   ├── ballCrewMatches → MatchBallCrew[]
  │   ├── chatMessages → ChatMessage[]
  │   ├── chatRooms → ChatParticipant[]
  │   ├── clubMembers → ClubMember[]
  │   ├── messageReactions → MessageReaction[]
  │   ├── inventoryItems → InventoryItem[]
  │   ├── staffMembers → Staff[]
  │   ├── attendance → Attendance[]
  │   ├── performancePoints → PerformancePoint[]
  │   └── organization → Organization
  │
  ├── Referee (1:1)
  │   ├── refereedMatches → Match[]
  │   └── ballCrewReferees → MatchBallCrew[]
  │
  ├── Staff (1:1) [Coaches]
  │   ├── certifications → Certification[]
  │   ├── specializations → Specialization[]
  │   ├── availability → Availability[]
  │   ├── pricing → CoachPricing
  │   ├── reviews → CoachReview[]
  │   ├── organization → Organization
  │   └── employedBy → Player (employer)
  │
  └── Spectator (1:1)

Match
  ├── playerA → Player
  ├── playerB → Player
  ├── referee → Referee (optional)
  ├── winner → Player (optional)
  └── ballCrew → MatchBallCrew[]

Organization
  ├── players → Player[]
  ├── staff → Staff[]
  ├── inventory → InventoryItem[]
  ├── courts → Court[]
  ├── bookings → CourtBooking[]
  ├── members → ClubMember[]
  ├── rankings → PlayerRanking[]
  ├── events → ClubEvent[]
  ├── announcements → ClubAnnouncement[]
  ├── finances → ClubFinance[]
  ├── roles → OrganizationRole[]
  └── permissions → RolePermission[]
```

### Key Entity Models

#### Player
```
{
  userId: string (PK, FK→User)
  matchesPlayed: number
  matchesWon: number
  matchesLost: number
  isClub: boolean
  organizationId: string (FK→Organization, optional)
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Referee
```
{
  userId: string (PK, FK→User)
  matchesRefereed: number
  ballCrewMatches: number
  experience: string | null
  certifications: string[]
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Staff (Coaches)
```
{
  userId: string (PK, FK→User)
  role: string (Head Coach, Assistant Coach, Fitness Coach, Junior Coach)
  yearsOfExperience: number | null
  expertise: string | null
  coachingLevel: string | null (Beginner, Intermediate, Advanced, Professional)
  formerPlayerBackground: string | null
  playerAgeGroups: string[]
  skillLevelsTrained: string[]
  trainingTypes: string[]
  languagesSpoken: string[]
  bio: string | null
  coachingPhilosophy: string | null
  achievements: string | null
  introVideoUrl: string | null
  studentCount: number
  isVerified: boolean
  isActive: boolean
  isDeleted: boolean
  employedById: string | null (FK→Player)
  organizationId: string | null (FK→Organization)
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Match
```
{
  id: string (PK, UUID)
  round: number
  playerAId: string (FK→Player)
  playerBId: string (FK→Player)
  refereeId: string | null (FK→Referee)
  winnerId: string | null (FK→Player)
  group: string | null
  score: string | null (e.g., "6-4, 6-3")
  createdAt: DateTime
}
```

#### User
```
{
  id: string (PK, UUID)
  username: string (UNIQUE)
  email: string (UNIQUE)
  phone: string | null (UNIQUE)
  passwordHash: string
  firstName: string
  lastName: string
  photo: string | null
  gender: string | null
  dateOfBirth: DateTime | null
  nationality: string | null
  bio: string | null
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Attendance
```
{
  id: string (PK, UUID)
  playerId: string (FK→Player)
  date: DateTime
  present: boolean
  createdAt: DateTime
}
```

#### PerformancePoint
```
{
  id: string (PK, UUID)
  playerId: string (FK→Player)
  date: DateTime
  rating: number (float)
  points: number
  createdAt: DateTime
}
```

#### Badge
```
{
  id: string (PK, UUID)
  name: string
  description: string
  category: string (Wins, Referee, Participation)
  icon: string | null
}
```

#### PlayerBadge
```
{
  id: string (PK, UUID)
  playerId: string (FK→Player)
  badgeId: string (FK→Badge)
  earnedAt: DateTime
}
```

#### InventoryItem
```
{
  id: string (PK, UUID)
  name: string
  count: number
  condition: string | null
  clubId: string | null (FK→Player)
  organizationId: string | null (FK→Organization)
  updatedAt: DateTime
}
```

#### ChatRoom
```
{
  id: string (PK, UUID)
  name: string
  description: string | null
  isPrivate: boolean
  isDM: boolean (direct message)
  createdBy: string (Player ID)
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### ChatMessage
```
{
  id: string (PK, UUID)
  roomId: string (FK→ChatRoom)
  playerId: string (FK→Player)
  content: string
  deliveredAt: DateTime | null
  readAt: DateTime | null
  replyToId: string | null (FK→ChatMessage)
  isDeleted: boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Court
```
{
  id: string (PK, UUID)
  organizationId: string (FK→Organization)
  name: string (Court 1, Court 2, etc.)
  courtNumber: number
  surface: string (Hard, Clay, Grass, etc.)
  indoorOutdoor: string (indoor/outdoor)
  lights: boolean
  status: string (available, booked, maintenance, closed)
  maintenedUntil: DateTime | null
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### CourtBooking
```
{
  id: string (PK, UUID)
  organizationId: string (FK→Organization)
  courtId: string (FK→Court)
  memberId: string | null (FK→ClubMember)
  playerName: string | null (for guests)
  startTime: DateTime
  endTime: DateTime
  bookingType: string (regular, tournament, maintenance, guest)
  guestCount: number
  status: string (confirmed, cancelled, no-show, completed)
  price: number | null
  isPeak: boolean
  cancellationReason: string | null
  cancelledAt: DateTime | null
}
```

#### Organization
```
{
  id: string (PK, UUID)
  name: string (UNIQUE)
  slug: string (UNIQUE, optional)
  description: string | null
  address: string | null
  city: string | null
  country: string | null
  phone: string | null
  email: string | null
  logo: string | null
  primaryColor: string | null
  createdBy: string | null (Player ID)
  rating: number (0-5)
  ratingCount: number
  verifiedBadge: boolean
  activityScore: number (0-100)
  playerDevScore: number (0-100)
  tournamentEngScore: number (0-100)
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

## 3. DASHBOARD PATTERNS & MOCK DATA

### Dashboard Components Structure

All dashboards follow this pattern:
1. **Authentication Check**: Verify user is logged in via `AuthContext`
2. **Role Context**: Use `RoleContext` to get `currentRole`
3. **Protected Navigation**: Redirect to login if not authenticated
4. **Single Fetch**: Fetch data from unified endpoint on component mount

```typescript
// Pattern used in all dashboards
useEffect(() => {
  if (user?.id) {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/dashboard?playerId=${user.id}`);
        const data = await res.json();
        setPlayerData(data);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }
}, [user?.id]);
```

### Available Dashboards

#### 1. **PlayerDashboard** (`/dashboard/player`)
- **URL**: Routes to `/dashboard/player`
- **Data Fetched**: 
  - Player profile (user info, stats)
  - Ranking/position
  - Badges earned
  - Upcoming matches
  - Available coaches
  - Attendance records
  - Club inventory (borrowed items)

- **Mock Data Shown**:
  - Leaderboard (top 5 players by points)
  - Activity feed (posts, comments, events)
  - Upcoming events
  - Performance charts (bar chart, line chart)

#### 2. **CoachDashboard** (`/dashboard/coach`)
- **URL**: Routes to `/dashboard/coach`
- **Tabs Available**: My Team, Training Plans, Match Analysis, Reports

- **Mock Data Shown**:
  - Student list with progress, session count, next session
  - Upcoming session with drills, durations, progress percentages
  - Next match schedule
  - Live match score tracking (with point entry)
  - Monthly earnings, pending payments, per-session rate

#### 3. **RefereeDashboard** (`/dashboard/referee`)
- **URL**: Routes to `/dashboard/referee`
- **Tabs Available**: Matches, Scheduler, Reporting, Rules §

- **Mock Data Shown**:
  - Live match display (players, court, status)
  - Next matches queue
  - Score submissions history
  - Point leaderboard (top scorers/referees)
  - Live scoring interface with point tracking

#### 4. **AdminDashboard** (`/dashboard/admin`)
- **URL**: Routes to `/dashboard/admin`
- **Likely contains**: User management, system analytics, moderation

#### 5. **StaffDashboard** (`/dashboard/staff`)
- **URL**: Routes to `/dashboard/staff`
- **Likely contains**: Financial reports, revenue, payments

#### 6. **OrganizationDashboard** (`/dashboard/org`)
- **URL**: Routes to `/dashboard/org`
- **Likely contains**: Club/organization management, members, events

---

## 4. SEEDED DATA STRUCTURE

### User Seed Pattern (`prisma/seeds/users.ts`)

```typescript
interface UserData {
  username: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  gender?: string
  dateOfBirth?: Date
  nationality?: string
  bio?: string
  photo?: string
  role: 'player' | 'coach' | 'admin' | 'staff' | 'referee' | 'spectator'
  organizationId?: string
  playerStats?: {
    matchesPlayed: number
    matchesWon: number
    matchesLost: number
  }
  staffData?: {
    yearsOfExperience?: number
    expertise?: string
    coachingLevel?: string
    certifications?: Array<{
      name: string
      issuer?: string
      issuedAt?: Date
      expiresAt?: Date
    }>
  }
  refereeData?: {
    matchesRefereed?: number
    experience?: string
    certifications?: string[]
  }
}
```

### Match Seed Pattern (`prisma/seeds/matches.ts`)

```typescript
const matchesData = [
  {
    playerAEmail: 'marcus.johnson@example.com'
    playerBEmail: 'anna.martinez@example.com'
    winnerEmail: 'marcus.johnson@example.com'
    refereeEmail: 'john.referee@example.com'
    score: '6-4, 6-3'
    round: 1
  }
  // ... more matches
]

// Actions on match creation:
1. Create Match record
2. Increment playerA/playerB matchesPlayed
3. Increment winner.matchesWon
4. Increment loser.matchesLost
5. Increment referee.matchesRefereed (if exists)
```

### Example Seeded Users

**Players**:
- marcus.johnson@example.com (45 matches, 32 wins)
- anna.martinez@example.com (Amateur player)
- sophia.chen@example.com
- david.kim@example.com

**Referees**:
- john.referee@example.com

**Staff/Coaches**:
- Various coaches with specializations

---

## 5. EXISTING API INTEGRATION PATTERNS

### Pattern 1: Dashboard Data Fusion (Recommended)
**Used in**: `PlayerDashboard`, `/api/dashboard`

**Advantages**:
- Single fetch call
- Server-side query optimization
- No waterfall requests
- All dashboard data in one response

**Implementation**:
```typescript
// Single endpoint returns everything
GET /api/dashboard?playerId={id}
→ Returns: player, rank, badges, matches, coaches, attendance, inventory
```

### Pattern 2: Parallel List Requests
**Used in**: Individual dashboard components

**Advantages**:
- Targeted data fetching
- Easier caching per resource
- Independent updates

**Implementation**:
```typescript
Promise.all([
  fetch('/api/players'),
  fetch('/api/coaches'),
  fetch('/api/referees'),
  fetch('/api/matches')
])
```

### Pattern 3: Query Search Pattern
**Used in**: `/api/players` with search

**Features**:
- Case-insensitive prefix matching
- Pagination (take: 20 if query, 8 if not)
- Ordered by rank (matchesWon DESC)

**Implementation**:
```typescript
// Query parameter or 'q'
GET /api/players?query=mar
→ Returns: players whose firstName/lastName starts with 'mar'
```

### Pattern 4: ID Parameter Routes
**Used in**: `/api/players/[id]`, `/api/referees/[id]`, `/api/matches/[id]`

**Advantages**:
- RESTful design
- Cacheable (includes Cache-Control headers)
- Dynamic routes with async params

**Implementation**:
```typescript
GET /api/players/[id]
→ params: Promise<{ id: string }>
→ Returns: Individual player details
```

### Pattern 5: Authentication & Authorization
**Used in**: `/api/referees/[id]` PUT endpoint

**Features**:
- Bearer token validation via JWT
- Role-based access control
- Self-profile edit only

**Implementation**:
```typescript
const token = auth.replace('Bearer ', '')
const payload = jwt.verify(token, JWT_SECRET)

// Authorization check
if (payload.role !== 'referee' || payload.id !== requestedId) {
  return { error: 'Forbidden' }
}
```

### Pattern 6: Caching Strategy
**Used in**: Most list endpoints

**Headers**:
```
Cache-Control: public, max-age=5, s-maxage=5, stale-while-revalidate=10
```

**Meaning**:
- Cache for 5 seconds in browser
- Cache for 5 seconds in CDN
- Serve stale data for 10 seconds while revalidating

---

## 6. DATA FLOW DIAGRAMS

### Dashboard Loading Flow
```
DashboardPage (role-based)
    ↓
useAuth() + useRole()
    ↓
AuthContext + RoleContext (redirect if needed)
    ↓
Render appropriate Dashboard component
    ↓
ComponentDidMount: fetch `/api/dashboard?playerId=${user.id}`
    ↓
Server Action: getPlayerDashboard(playerId)
    ↓
Multiple parallel Prisma queries:
  • player.findUnique() + user + badges
  • player.findMany() for ranking
  • match.findMany() (upcoming, playerA & playerB)
  • staff.findMany() (coaches)
  • attendance.findMany()
  • inventoryItem.findMany()
    ↓
Format and return unified object
    ↓
Display in dashboard with mock data overlay
```

### Match Creation Flow
```
Create Match
    ↓
Seed creates match record with:
  • playerA, playerB, winner, referee
  • score, round
    ↓
Update Player statistics:
  • Both players: matchesPlayed++
  • Winner: matchesWon++
  • Loser: matchesLost++
    ↓
Update Referee statistics:
  • matchesRefereed++
    ↓
Data now visible in:
  • /api/matches (recent matches)
  • /api/players (updated stats, rank)
  • /api/dashboard (upcoming matches, rank)
```

---

## 7. SUMMARY TABLE

| Endpoint | Method | Purpose | Cache | Auth |
|----------|--------|---------|-------|------|
| `/api/dashboard` | GET | Player dashboard data bundle | No | Optional |
| `/api/players` | GET | List/search all players | Yes (5s) | No |
| `/api/players/[id]` | GET | Individual player details | Yes (5s) | No |
| `/api/coaches` | GET | List all coaches | Yes (5s) | No |
| `/api/coaches/available` | GET | List available coaches (not employed) | Yes (5s) | No |
| `/api/coaches/employ` | POST | Employ a coach | No | Yes |
| `/api/referees` | GET | List all referees | Yes (5s) | No |
| `/api/referees/[id]` | GET | Individual referee details | Yes (5s) | No |
| `/api/referees/[id]` | PUT | Update referee profile | No | Yes (self) |
| `/api/matches` | GET | List recent matches | No | No |
| `/api/matches/[id]` | GET | Individual match details | No | No |

---

## 8. RECOMMENDATIONS FOR INTEGRATION

1. **For Dashboard Implementations**: Use `/api/dashboard` endpoint pattern - single fetch, everything needed
2. **For Search Features**: Follow `/api/players` pattern with prefix matching and pagination
3. **For List Views**: Use cached endpoints with proper Cache-Control headers
4. **For Updates**: Implement JWT authentication via Bearer tokens
5. **For Real-Time**: Consider WebSocket connections (chat example exists at `/api/chat/ws`)
6. **For Statistics**: Pre-calculate and denormalize on seeding/update (see `studentCount` in Staff)

