# TennisTracker Workspace Exploration Summary

## 1. Players Page Structure

### Location: `src/app/players/`

**Files:**
- `page.tsx` - Main players listing page
- `[id]/page.tsx` - Individual player profile page
- `PlayerActionButtons.tsx` - Action buttons for player interactions
- `PlayerInventory.tsx` - Player inventory management component
- `ChallengeButton.tsx` - Challenge button for matches

### Players Page Features (`page.tsx`):
- **Stats Overview Cards:**
  - Total Players count
  - Active Members count
  - Available to Play count
- **Search and Filter Bar:** Search by name or email
- **Players Grid:** Cards displaying:
  - Player avatar with first letter
  - Player name and email
  - Player stats: Matches Played, Wins, Win Rate (%)
  - Action buttons: "View Profile" and "Contact"
- **Data source:** `getAllPlayers()` from `/actions/matches`

### Player Profile Page (`[id]/page.tsx`):
- **Profile Header:**
  - Large avatar with gradient background
  - Player name and online status indicator
  - Player rank (by matchesWon)
  - Email, phone, and contact information
- **Action Buttons:** ProfileActionButtons component
- **Achievements/Badges:** Display earned badges
- **Player Stats:**
  - Matches played, won, lost
  - Win rate percentage
  - Rank/rating points
- **Additional Sections:**
  - Upcoming matches
  - Attendance records
  - Available coaches
  - Player inventory

---

## 2. Tournaments & Events Structure

### Location: `src/app/matches/` (currently manages pool matches)

**Future Tournaments Support:**
The database schema includes comprehensive tournament models that are not yet fully implemented in the UI:

### Tournament-Related Database Models:

#### **ClubEvent Model** (Main Tournament Container)
```
- id: uuid
- organization: Organization relation
- name: string
- description: string
- eventType: "tournament" | "clinic" | "social" | "match" | "training"
- startDate, endDate: DateTime
- registrationCap: int (default 64)
- registrationDeadline: DateTime
- location: string
- prizePool: float
- entryFee: float
- Relations:
  - registrations: EventRegistration[]
  - waitlist: EventWaitlist[]
  - bracket: TournamentBracket (one-to-one)
  - matches: TournamentMatch[]
  - reminders: EventReminder[]
```

#### **TournamentBracket Model**
```
- id: uuid
- organization: Organization relation
- event: ClubEvent relation
- bracketType: "single_elimination" | "double_elimination" | "round_robin"
- totalRounds: int
- matches: TournamentMatch[]
```

#### **TournamentMatch Model**
```
- id: uuid
- organization: Organization relation
- event: ClubEvent relation
- bracket: TournamentBracket relation
- round: int
- matchPosition: int
- playerA, playerB: ClubMember (optional - can be null for byes)
- scoreSetA, scoreSetB, scoreSetC: string (e.g., "6-4")
- winnerId: string (ClubMember ID)
- scheduledTime: DateTime
- court: Court relation
- status: "pending" | "scheduled" | "in_progress" | "completed" | "walked_over"
- resultSubmittedAt, resultSubmittedBy
```

#### **EventRegistration Model**
```
- id: uuid
- event: ClubEvent relation
- member: ClubMember relation
- registeredAt: DateTime
- status: "registered" | "waitlisted" | "cancelled" | "withdrawn"
- signupOrder: int (for bracket seeding)
```

#### **EventWaitlist Model**
```
- id: uuid
- event: ClubEvent relation
- member: ClubMember relation
- position: int
- addedAt: DateTime
```

#### **EventReminder Model**
```
- id: uuid
- event: ClubEvent relation
- reminderText: string
- scheduleTime: DateTime
- sentAt: DateTime (nullable)
```

### Current Matches Page (`src/app/matches/page.tsx`):
Implements pool-style tournament with groups/rounds:
- **Pools/Groups:** Shuffle players into pools
- **Round Robin Matching:** Generate matches between players in groups
- **Score Recording:** Track match scores and winners
- **Progression:** Advance to semi-finals and finals
- Uses simpler `Match` model (not TournamentMatch)

---

## 3. Database Schema - Core Models

### Location: `prisma/schema.prisma`

#### **User Model** (Base for all user types)
```
- id: uuid
- username: unique string
- email: unique string
- phone: unique string (optional)
- passwordHash: string
- firstName, lastName: string
- photo: string (profile picture URL)
- gender, nationality: string (optional)
dateOfBirth: DateTime (optional)
- bio: string (optional)
- createdAt, updatedAt: DateTime
- Relations: player, referee, staff, spectator (one-to-one)
```

#### **Player Model**
```
- userId: string (FK to User, one-to-one)
- matchesPlayed: int (default 0)
- matchesWon: int (default 0)
- matchesLost: int (default 0)
- isClub: boolean (default false) - flag for club players
- organizationId: string (FK to Organization, optional)
- createdAt, updatedAt: DateTime
- Relations:
  - user: User (one-to-one)
  - playerBadges: PlayerBadge[]
  - matchesA: Match[] (as Player A)
  - matchesB: Match[] (as Player B)
  - clubMembers: ClubMember[]
  - communityPosts: CommunityPost[]
  - followers: UserFollower[] (relationship)
  - following: UserFollower[] (relationship)
  - attendance: Attendance[]
  - performancePoints: PerformancePoint[]
  - inventoryItems: InventoryItem[]
  - staff: Staff[]
```

#### **Match Model** (Simple pool/group matches)
```
- id: uuid
- round: int
- playerA: Player (FK, required)
- playerB: Player (FK, required)
- referee: Referee (FK, optional)
- winner: Player (FK, optional - null = match pending)
- group: string (optional - "Pool 1", "Pool 2", etc.)
- score: string (e.g., "6-4, 6-3")
- ballCrew: MatchBallCrew[]
- createdAt: DateTime
```

#### **Referee Model**
```
- userId: string (FK to User, one-to-one)
- matchesRefereed: int (default 0)
- ballCrewMatches: int (default 0)
- experience: string (optional - "10 years")
- certifications: string[] (array of cert names)
- user: User (one-to-one)
- refereedMatches: Match[]
- ballCrewReferees: MatchBallCrew[]
- createdAt, updatedAt: DateTime
```

#### **Staff Model** (Coaches, fitness coaches, etc.)
```
- userId: string (FK to User, one-to-one)
- contact: string (contact info for display)
- role: string ("Head Coach" | "Assistant Coach" | "Fitness Coach" | "Junior Coach")
- yearsOfExperience: int (optional)
- expertise: string (optional)
- coachingLevel: string ("Beginner" | "Intermediate" | "Advanced" | "Professional")
- playerAgeGroups: string[] (["Kids", "Teens", "Adults"])
- skillLevelsTrained: string[] (["Beginner", "Intermediate", "Advanced"])
- trainingTypes: string[] (["Private sessions", "Group sessions", "Clinics"])
- maxStudentsPerSession: int
- isVerified, isActive, isDeleted: boolean
- employedBy: Player (FK, optional - coach hired by a player)
- organizationId: string (FK to Organization, optional)
- Relations:
  - user: User
  - certifications: Certification[]
  - specializations: Specialization[]
  - availability: Availability[]
  - pricing: CoachPricing
  - reviews: CoachReview[]
  - auditLogs: AuditLog[]
```

#### **Organization Model** (Clubs/Teams)
```
- id: uuid
- name: unique string
- slug: unique string (optional)
- description, address, city, country: string (optional)
- phone, email: string (optional)
- logo: string (URL, optional)
- primaryColor: string (hex, optional)
- createdBy: string (Player ID who created)
- rating: float (0-5 stars)
- ratingCount: int
- verifiedBadge: boolean
- activityScore: int (0-100)
- playerDevScore: int (0-100)
- tournamentEngScore: int (0-100)
- Relations:
  - players: Player[]
  - staff: Staff[]
  - courts: Court[]
  - bookings: CourtBooking[]
  - members: ClubMember[]
  - rankings: PlayerRanking[]
  - events: ClubEvent[]
  - tournamentBrackets: TournamentBracket[]
  - matches: TournamentMatch[]
```

#### **ClubMember Model**
```
- id: uuid
- organization: Organization (FK, required)
- player: Player (FK, required)
- membershipTier: MembershipTier
- joinDate: DateTime
- expiryDate: DateTime (optional)
- autoRenew: boolean (default true)
- paymentStatus: "active" | "suspended" | "expired" | "overdue"
- outstandingBalance: float
- attendanceCount: int
- lastAttendance: DateTime (optional)
- role: "member" | "coach" | "admin" | "finance_officer" | "guest"
- suspensionReason, suspendedUntil: (optional)
- Relations:
  - bookings: CourtBooking[]
  - eventRegistrations: EventRegistration[]
  - waitlistItems: EventWaitlist[]
  - rankings: PlayerRanking[]
  - challengesAsChallenger: RankingChallenge[]
  - challengesAsOpponent: RankingChallenge[]
  - tournamentMatchesA, tournamentMatchesB: TournamentMatch[]
- Unique constraint: [organizationId, playerId]
```

---

## 4. Stats & Ranking Models

#### **PlayerRanking Model** (Weekly/Monthly Rankings)
```
- id: uuid
- organization: Organization (FK)
- member: ClubMember (FK)
- weekNumber: int (ISO week)
- year: int
- currentRank: int (1, 2, 3, ...)
- previousRank: int (optional)
- ratingPoints: int (tennis rating points)
- matchesWon, matchesLost: int
- winRate: float
- createdAt, updatedAt: DateTime
- Unique constraint: [organizationId, memberId, weekNumber, year]
```

#### **RankingChallenge Model** (Head-to-head challenges)
```
- id: uuid
- organization: Organization (FK, optional)
- challenger: ClubMember (FK)
- opponent: ClubMember (FK)
- challengeDate: DateTime
- matchDate: DateTime (optional)
- status: "pending" | "accepted" | "rejected" | "completed"
- winnerId: string (ClubMember ID, optional)
- createdAt, updatedAt: DateTime
```

#### **Attendance Model** (Track attendance)
```
- id: uuid
- player: Player (FK)
- date: DateTime
- present: boolean (default true)
- createdAt: DateTime
```

#### **PerformancePoint Model** (Track performance ratings)
```
- id: uuid
- player: Player (FK)
- date: DateTime
- rating: float
- points: int
- createdAt: DateTime
```

#### **PlayerBadge Model** (Achievements/Badges)
```
- id: uuid
- player: Player (FK)
- badge: Badge (FK)
- earnedAt: DateTime
```

#### **Badge Model** (Badge definitions)
```
- id: uuid
- name: string
- description: string
- category: string ("Wins" | "Referee" | "Participation")
- icon: string (URL, optional)
- playerBadges: PlayerBadge[]
```

---

## 5. Seed Data Structure

### Location: `prisma/seed.ts` & `prisma/seeds/`

**Seeding Process (7 Steps):**

1. **Organizations** (`seeds/organizations.ts`)
   - Creates club/organization records
   - Sample: "Central Tennis Club", "Nairobi Tennis Club"

2. **Users & Roles** (`seeds/users.ts`)
   - Creates test users with different roles:
     - Independent players: Marcus Johnson, Anna Martinez, James Wilson, etc.
     - Coaches: Robert Coach
     - Admin: admin@centraltennis.com
     - Finance Officer: finance@centraltennis.com
     - Referee: john.referee@example.com
     - Spectator: alice.spectator@example.com
   - Password: `tennis123` (for all test accounts)
   - Each player initialized with:
     - matchesPlayed, matchesWon, matchesLost

3. **Courts** (`seeds/courts.ts`)
   - Creates court records per organization
   - Properties: name, courtNumber, surface, indoorOutdoor, lights status

4. **Memberships** (`seeds/memberships.ts`)
   - Creates membership tiers (Gold, Silver, Junior, etc.)
   - Adds players to organizations as club members

5. **Court Bookings** (`seeds/bookings.ts`)
   - Creates sample court bookings
   - Properties: startTime, endTime, bookingType, status, price

6. **Matches** (`seeds/matches.ts`)
   - Creates sample matches between players
   - Updates player statistics (matchesPlayed, matchesWon, matchesLost)
   - Updates referee statistics
   - Sample matches with predefined winners and scores

7. **Community** (`seeds/community.ts`)
   - Creates community posts
   - Creates comments and reactions
   - Creates user follows

### Test Account Credentials:
```
Password for all: tennis123

🎾 Player (Independent)     marcus.johnson@example.com
🎾 Player (Organization)    sophia.chen@example.com
👨‍🏫 Coach                    robert.coach@example.com
⚙️  Admin                     admin@centraltennis.com
💰 Finance Officer           finance@centraltennis.com
🏆 Referee                    john.referee@example.com
👁️  Spectator                 alice.spectator@example.com
```

---

## 6. Existing Stats-Related Code

### Stats in Player Model:
- `matchesPlayed`: Total matches participated in
- `matchesWon`: Total matches won
- `matchesLost`: Total matches lost

### Stats Calculation in UI (`src/app/players/page.tsx`):
```typescript
Win Rate = (matchesWon / matchesPlayed) * 100
```

### Player Ranking System (`PlayerRanking` model):
- Tracks weekly/yearly rankings
- ratingPoints: Tennis rating system points
- matchesWon, matchesLost, winRate
- previousRank for tracking changes

### Performance Tracking:
- **Attendance**: Track which training sessions/matches player attended
- **PerformancePoint**: Track individual performance ratings/points
- **PlayerBadge**: Track achievements/badges earned

### Ranking Challenges:
- Head-to-head challenge system between players
- Status tracking (pending, accepted, rejected, completed)
- Winner determination

### API Endpoints for Stats:
- `/api/matches` - Get all matches with player data
- Actions: `getPlayerDashboard()`, `getLeaderboard()`, `getMatchDetails()`

---

## 7. File Structure Summary

### Key Directories:

```
src/
├── app/
│   ├── players/
│   │   ├── page.tsx                    # Players listing
│   │   ├── [id]/page.tsx              # Player profile
│   │   ├── PlayerActionButtons.tsx
│   │   ├── PlayerInventory.tsx
│   │   └── ChallengeButton.tsx
│   ├── matches/
│   │   ├── page.tsx                    # Pool matches management
│   │   └── [id]/page.tsx              # Match details
│   ├── leaderboard/
│   ├── community/
│   ├── organization/
│   └── dashboard/
├── actions/
│   ├── matches.ts                      # Match operations & stats
│   ├── players.ts                      # Player operations
│   ├── community.ts                    # Community features
│   └── dashboards.ts                   # Dashboard data
├── components/
│   ├── dashboards/
│   │   ├── PlayerDashboard.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── OrganizationDashboard.tsx
│   │   └── FinanceDashboard.tsx
│   └── community/
│       └── CommunityView.tsx
└── types/
    └── match.ts

prisma/
├── schema.prisma                       # Database schema
├── seed.ts                             # Main seed orchestrator
└── seeds/
    ├── organizations.ts
    ├── users.ts
    ├── courts.ts
    ├── matches.ts
    ├── memberships.ts
    ├── bookings.ts
    └── community.ts
```

---

## 8. Key Action Files

### `src/actions/matches.ts`: Main statistics & tournament operations
- `getPlayerDashboard(playerId)` - Get player stats, rank, badges, matches
- `getAllPlayers()` - Get all players with stats
- `getLeaderboard()` - Get leaderboard sorted by wins
- `getMatchDetails(matchId)` - Get detailed match info with head-to-head stats
- `getCurrentPoolsAndMatches()` - Get active pool matches
- `savePoolWinner(matchId, winnerId)` - Record winner and update stats
- `createGroupStage(players)` - Create pool/group stage matches
- `getGroupStandings()` - Get standings for a group
- `createSemifinalsFromGroups()` - Auto-create semis
- `createFinalsFromSemis()` - Auto-create finals

### `src/actions/players.ts`: Player-specific operations
- `getTopPlayers(limit)` - Get top X players by wins
- `getTotalPlayersCount()` - Get player count

---

## 9. Current Implementation Status

### ✅ IMPLEMENTED:
- Basic Player model with match statistics
- Simple Match model for group/pool matches
- Player dashboard with stats
- Players listing page with stats display
- Leaderboard functionality
- Community features (posts, comments, reactions)
- Chat system
- Coach/Staff profiles
- Organization/Club management structure
- Seed data generation

### 🚧 PARTIALLY IMPLEMENTED:
- Tournament system (models exist, UI not fully built)
- Ranking system (models exist, basic functionality)
- Event management (models exist, UI placeholder)

### ❌ NOT YET IMPLEMENTED:
- Tournament bracket UI generation
- Tournament match scheduling/court assignment
- Automated tournament bracket generation
- Tournament results reporting
- Event waitlist management UI
- Tournament-specific features (seeding, bye handling)
- Advanced ranking algorithms

---

## 10. Key Relationships & Data Flow

### Player Stats Update Flow:
```
1. Match is created between PlayerA and PlayerB
2. Winner is recorded → savePoolWinner()
3. Player model updated:
   - Winner: matchesPlayed++, matchesWon++
   - Loser: matchesPlayed++, matchesLost++
4. Rank calculated on-the-fly: sorting by matchesWon
5. UI displays updated stats
```

### Tournament Flow (Future):
```
1. Club creates ClubEvent (tournament)
2. Players register as ClubMember → EventRegistration
3. TournamentBracket generated (single/double elim, round robin, etc.)
4. TournamentMatches auto-created by bracket type
5. Matches scheduled to Courts
6. Results submitted to TournamentMatch
7. Next round generated from winners
8. Tournament reports/rankings updated
```

---

## 11. Database Relationships Diagram

```
User (1)
  ├─→ Player (1)
  │   ├─→ ClubMember[] (many orgs)
  │   ├─→ Match[] (as PlayerA/PlayerB)
  │   ├─→ Attendance[]
  │   ├─→ PerformancePoint[]
  │   └─→ CommunityPost[]
  │
  ├─→ Referee (1)
  │   ├─→ Match[] (referred)
  │   └─→ MatchBallCrew[]
  │
  ├─→ Staff (1)
  │   ├─→ Certification[]
  │   ├─→ Specialization[]
  │   ├─→ CoachPricing (1)
  │   └─→ CoachReview[]
  │
  └─→ Spectator (1)

Organization (1)
  ├─→ ClubMember[]
  ├─→ Court[]
  ├─→ CourtBooking[]
  ├─→ ClubEvent[]
  │   ├─→ EventRegistration[]
  │   ├─→ EventWaitlist[]
  │   ├─→ TournamentBracket (1)
  │   │   └─→ TournamentMatch[]
  │   └─→ TournamentMatch[]
  ├─→ PlayerRanking[]
  ├─→ RankingChallenge[]
  ├─→ ClubFinance[]
  │   └─→ FinanceTransaction[]
  ├─→ OrganizationRole[]
  │   └─→ RolePermission[]
  └─→ OrganizationBadge[]

ClubMember
  ├─→ Player (1)
  ├─→ Organization (1)
  ├─→ PlayerRanking[]
  ├─→ EventRegistration[]
  ├─→ TournamentMatch[] (as PlayerA/PlayerB)
  └─→ RankingChallenge[] (as challenger/opponent)
```

