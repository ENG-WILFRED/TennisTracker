# Vico Multi-Dimensional Ranking System - Complete Implementation Guide

## Executive Summary

This document describes the complete implementation of a multi-dimensional ranking system for Vico Tennis Tracker. The system tracks player rankings across 5 independent dimensions, each with calculators, event handlers, and full traceability back to source events.

## Architecture Overview

```
EVENTS (matches, sessions, bookings, ratings)
    ↓
RANKING ENGINE (calculators, handlers)
    ↓
COMPUTED RANKINGS (snapshots for each dimension)
    ↓
LEADERBOARDS & HISTORY (queries and projections)
    ↓
PLAYER PROFILE UI (display with traceability)
```

## Five Ranking Dimensions

### 1. Competitive Rank (40% weight)
**Purpose**: Measures player's actual competitive strength
- **Algorithm**: ELO-based rating (starts at 1500)
- **Sources**: 
  - Match completions (wins/losses)
  - Tournament registrations
  - Opponent strength (avg ELO of opponents faced)
- **Key Metrics**:
  - Current rating (1000-3000+)
  - Win/loss ratio
  - Tournament wins
  - Average opponent strength
- **Time Decay**: 2% per week of inactivity (max 20% decay)
- **Storage**: `CompetitiveRankSnapshot` table

### 2. Development Score (30% weight)
**Purpose**: Tracks player growth through training consistency
- **Algorithm**: Accumulates coaching session points + improvement trends
- **Sources**:
  - Coaching session completions
  - Coach assessment ratings (0-5 stars)
  - Consistency streaks
  - Practice participation
- **Key Metrics**:
  - Current score (0-100)
  - Sessions attended
  - Consistency streak (consecutive days)
  - Improvement trend (% over period)
  - Coach assessment score (0-100)
- **Storage**: `DevelopmentScoreSnapshot` table

### 3. Activity Score (20% weight)
**Purpose**: Measures engagement and participation frequency
- **Algorithm**: Points per activity with time decay
- **Sources**:
  - Court bookings (5 points each)
  - Match participations (10 points each)
  - Booking confirmations
  - Session attendances (3 points each)
- **Key Metrics**:
  - Current score (0-100)
  - Bookings this month
  - Court appearances
  - Matches played
  - Consecutive days active
  - Recent participation frequency (0-100)
- **Storage**: `ActivityScoreSnapshot` table

### 4. Coach Reputation Score (Coach only - not applied to players)
**Purpose**: Evaluates coach quality (only for coaches)
- **Algorithm**: Average of standardized ratings (0-5 scale)
- **Sources**:
  - Player feedback on coaching sessions
  - Structured coach ratings
  - Player improvement rates
- **Key Metrics** (each 0-5):
  - Punctuality rating
  - Discipline rating
  - Effort rating
  - Tactical understanding rating
  - Consistency rating
  - Player improvement rate (% of students improving)
- **Storage**: `CoachReputationScoreSnapshot` table

### 5. Overall Index (Combined - 10% Coach weight not applied to players)
**Purpose**: Single score for public leaderboards
- **Formula**: 
  ```
  OverallIndex = (0.40 × Competitive) + (0.30 × Development) + (0.20 × Activity)
  ```
- **Range**: 0-10000 (normalized)
- **Trend**: up | down | stable
- **Movement**: Change from previous calculation
- **Storage**: `OverallIndexSnapshot` table

## Event-Driven System

### Event Types

| Event Type | Source | Affected Dimensions | Action |
|---|---|---|---|
| `MATCH_COMPLETED` | Match result | Competitive, Activity | ELO calculation, appearance count |
| `TOURNAMENT_WON` | Tournament bracket | Competitive | +50 bonus points |
| `COACHING_SESSION_ATTENDED` | Session completion | Development, Activity | +10 session points, +5 activity |
| `COACH_FEEDBACK_SUBMITTED` | Coach rating | Development, Coach Reputation | Add rating, calculate avg |
| `BOOKING_COMPLETED` | Court booking | Activity | +5 points |
| `PLAYER_INACTIVITY_FLAGGED` | Inactivity threshold | Competitive, Activity | Apply time decay |

### Event Flow

1. **Event Emission**
   - Source system emits event (Match/Session/Booking service)
   - Event published to EventBus

2. **Event Handling**
   - EventBus publishes to Kafka topic
   - Local in-process handlers triggered
   - Background workers pick up from Kafka

3. **Calculator Execution**
   - Appropriate calculator runs (e.g., CompetitiveRankCalculator)
   - Fetches current snapshot and source data
   - Computes new score

4. **Snapshot Update**
   - Updates relevant snapshot table
   - Records previous score for trend
   - Stores calculation timestamp

5. **History Recording**
   - Creates RankingHistory entry (immutable)
   - Stores full snapshot at this point in time
   - Enables historical analysis

6. **Event Linking**
   - Creates RankingEvent entry
   - Links ranking change to source event
   - Stores source data for traceability

7. **Leaderboard Projection**
   - Updates LeaderboardProjection table
   - Re-ranks players
   - Stores new rank and trend

## Database Schema

### Core Snapshot Tables
Each stores the current state of one ranking dimension per player:
- **CompetitiveRankSnapshot** - Current ELO rating and stats
- **DevelopmentScoreSnapshot** - Current development metrics
- **ActivityScoreSnapshot** - Current engagement metrics
- **CoachReputationScoreSnapshot** - Current coach reputation (coaches only)
- **OverallIndexSnapshot** - Combined weighted score

### History & Traceability Tables
- **RankingHistory** - Immutable time-series of all ranking changes
- **RankingEvent** - Links each ranking change to its source event
- **LeaderboardProjection** - Pre-computed leaderboard views

### Key Relationships
```
Player
├── CompetitiveRankSnapshot (1:1)
├── DevelopmentScoreSnapshot (1:1)
├── ActivityScoreSnapshot (1:1)
├── OverallIndexSnapshot (1:1)
├── RankingHistory[] (1:many)
├── RankingEvent[] (1:many)
└── LeaderboardProjection[] (1:many)

Staff (Coach)
├── CoachReputationScoreSnapshot (1:1)
└── CoachPlayerRating[] (coaches rate their players)

Organization
├── CompetitiveRankSnapshot[] (1:many)
├── DevelopmentScoreSnapshot[] (1:many)
├── ... (all ranking tables)
└── LeaderboardProjection[] (1:many)
```

## Code Structure

```
src/
├── modules/ranking/
│   ├── index.ts                           # Module exports
│   ├── types.ts                           # TypeScript interfaces
│   ├── calculators/
│   │   ├── index.ts
│   │   └── competitive-rank.calculator.ts # ELO calculation
│   │   # TODO: development-score, activity-score, coach-reputation, overall-index
│   ├── handlers/
│   │   └── index.ts                       # Event handlers
│   └── projections/
│       └── index.ts                       # Leaderboard queries
├── app/api/rankings/
│   └── route.ts                           # API endpoints
└── components/rankings/
    └── PlayerRankingDisplay.tsx           # React component

prisma/
├── schema.prisma                          # Database models
└── seeds/
    └── ranking-system.ts                  # Seed data with traceability
```

## Key Files

### /src/modules/ranking/types.ts
Defines all TypeScript interfaces:
- `RankingDimension` - Union type of 5 dimensions
- `RankingEventType` - Union type of event types
- `CompetitiveRankSnapshot` - Interface matching DB model
- `RankingCalculatorInput/Output` - Standard calculator interface

### /src/modules/ranking/calculators/competitive-rank.calculator.ts
Implements competitive ranking algorithm:
- `calculateOpponentStrength()` - Average ELO of opponents
- `calculateWinRate()` - Win/loss percentage
- `calculateELOChange()` - ELO rating adjustment per match
- `calculateTimeDecay()` - Inactivity penalty
- `calculateCompetitiveRank()` - Main calculator
- `updateCompetitiveRankSnapshot()` - Snapshot storage

### /src/modules/ranking/handlers/index.ts
Event handler functions:
- `handleMatchCompleted()` - Updates competitive rank
- `handleSessionCompleted()` - Updates development score
- `handleBookingCompleted()` - Updates activity score
- `handleCoachFeedbackSubmitted()` - Updates development + coach reputation
- `handlePlayerInactivity()` - Applies decay penalties
- `registerRankingHandlers()` - Wires up handlers to EventBus

### /src/modules/ranking/projections/index.ts
Leaderboard query functions:
- `computeGlobalLeaderboard()` - Competitive rankings
- `computeDevelopmentLeaderboard()` - Development scores
- `computeActivityLeaderboard()` - Activity scores
- `computeOverallIndexLeaderboard()` - Overall index
- `getPlayerRanks()` - Get player's rank across all dimensions
- `getPlayerRankingSummary()` - Complete ranking profile
- `refreshLeaderboardProjections()` - Refresh all leaderboards

### /src/app/api/rankings/route.ts
REST API endpoints (handlers):
- `getPlayerRankings(playerId)` - GET /api/rankings/player/:id
- `getLeaderboard(type)` - GET /api/rankings/leaderboard/:type
- `getRankingHistory(playerId)` - GET /api/rankings/history/:id
- `traceRankingEvent(eventId)` - GET /api/rankings/events/:id/trace

### /src/components/rankings/PlayerRankingDisplay.tsx
React component for display:
- `RankingCard` - Individual dimension card with score/rank/trend
- `RankingEventCard` - Shows recent ranking event with trace link
- `PlayerRankingDisplay` - Main component combining all

### /prisma/seeds/ranking-system.ts
Seed data generator:
- `seedCompetitiveRankings()` - Generate from match history
- `seedDevelopmentScores()` - Generate from session ratings
- `seedActivityScores()` - Generate from bookings
- `seedCoachReputationScores()` - Generate from coach ratings
- `seedLeaderboardProjections()` - Create leaderboard views

## Traceability Feature

Every ranking change can be traced back to its source:

```
Player Profile → RankingCard (shows +25 points) 
    ↓
Click "View Details" 
    ↓
RankingEvent (event ID, source event ID, reason)
    ↓
Source Details (Match/Session/Rating/Booking)
    ↓
Full context (opponent, coach, date, score, etc)
```

### Example Trace Path
1. User sees: "Competitive Rank +25"
2. Clicks event → reveals "Match: vs John Doe, 6-4, 6-3"
3. Clicks match → loads full match details
4. Sees calculation: "ELO adjustment: +25 (opponent rating: 1600, player rating: 1500)"

### Data Stored for Traceability
- `RankingEvent.eventId` - Points to match/session/rating/booking
- `RankingEvent.sourceData` - Contains original event payload
- `RankingEvent.reason` - Human-readable explanation
- `RankingHistory.snapshot` - Full snapshot JSON at time of change

## API Endpoints

### Get Player Rankings
```
GET /api/rankings/player/:playerId
Headers: x-organization-id: <org-id>

Response:
{
  playerId: string,
  competitiveRank: { score, previousScore, rank, matchesWon, matchesLost, winRate },
  developmentScore: { score, previousScore, rank, sessionsAttended, improvementTrend },
  activityScore: { score, previousScore, rank, bookingsThisMonth, consecutiveDaysActive },
  coachReputation: { score, punctuality, discipline, effort, tactical, consistency },
  overallIndex: { score, previousScore, rank, trend, movement },
  recentEvents: [{ id, eventType, impactedDimensions, scoreChange, reason, timestamp }]
}
```

### Get Leaderboard
```
GET /api/rankings/leaderboard/:type?limit=100
Params: type = GLOBAL | DEVELOPMENT | ACTIVITY | OVERALL
Headers: x-organization-id: <org-id>

Response:
{
  type: string,
  leaderboard: [{ rank, playerId, displayName, score, trend, changeFromLastWeek, wins, losses, winRate }],
  count: number,
  generatedAt: DateTime
}
```

### Get Ranking History
```
GET /api/rankings/history/:playerId?limit=50&type=COMPETITIVE
Headers: x-organization-id: <org-id>

Response:
{
  playerId: string,
  type: string,
  history: [{ 
    id, rankingType, score, previousScore, movement, reason, recordedAt,
    linkedEvent: { eventType, eventId, reason, sourceData }
  }],
  count: number
}
```

### Trace Ranking Event to Source
```
GET /api/rankings/events/:eventId/trace
Headers: x-organization-id: <org-id>

Response:
{
  rankingEvent: { id, eventType, eventId, playerId, impactedDimensions, scoreChange, reason, createdAt },
  source: {
    type: string,
    details: { /* full match/session/rating/booking details */ },
    metadata: { /* original source data */ }
  }
}
```

## Implementation Checklist

### ✅ Completed
- [x] Database schema with 8 ranking models
- [x] Prisma model definitions
- [x] Type definitions (types.ts)
- [x] Competitive rank calculator
- [x] Event handlers (match, session, booking, feedback, inactivity)
- [x] Leaderboard projection queries
- [x] Seed data with traceability
- [x] API routes for ranking queries
- [x] React component for display

### ⏳ Pending
- [ ] Remaining calculators (development-score, activity-score, coach-reputation, overall-index)
- [ ] Event type definitions (add MATCH_COMPLETED, TOURNAMENT_WON, RANKING_RECALCULATED, PLAYER_INACTIVITY_FLAGGED to DomainEvent.ts)
- [ ] Event handler registration in EventBus initialization
- [ ] Database migration execution (blocked by cloud DB permissions)
- [ ] Additional UI pages:
  - [ ] Ranking history visualization
  - [ ] Leaderboard browser
  - [ ] Event trace viewer
  - [ ] Admin dashboard for rank management

### 🔧 Known Issues
- **Database Migration**: Blocked by PostgreSQL superuser permission error
  - Error: "permission denied to terminate process"
  - Workaround: Manual SQL execution or request elevated DB access

## Performance Considerations

### Query Optimization
- **Snapshots**: O(1) for current rankings (single row lookup)
- **Leaderboard**: Pre-computed in `LeaderboardProjection` (indexed on rank)
- **History**: Ordered by timestamp (indexed on playerId, createdAt)
- **Indexes**: 
  - organizationId, playerId, score, rank for fast queries
  - createdAt for sorting
  - eventId for traceability joins

### Background Processing
- Event handlers run asynchronously via Kafka workers
- Calculations do not block API responses
- Snapshots updated after calculation completes
- Leaderboard projections refreshed on schedule (e.g., hourly)

### Data Storage
- Snapshots: ~250 bytes per record per player
- History: ~500 bytes per record (includes JSON snapshot)
- Events: ~300 bytes per record
- Projections: ~200 bytes per record per leaderboard

## Configuration & Weights

### Ranking Dimension Weights
```typescript
// OverallIndex calculation
const weights = {
  competitive: 0.40,      // 40%
  development: 0.30,      // 30%
  activity: 0.20,         // 20%
  coachReputation: 0.10,  // 10% (not used for players)
};
```

### Time Decay Factors
```typescript
// Applied to scores for inactivity
const decay = {
  last30Days: 1.0,        // Full weight
  last30to90Days: 0.5,    // 50% weight
  older90Days: 0.1,       // 10% weight
};

// Competitive rank decay
const inactivityDecay = 0.02;  // 2% per week, max 20%
```

### ELO Constants
```typescript
const BASE_RATING = 1500;        // Starting rating
const K_FACTOR = 32;             // Rating adjustment factor
```

## Future Enhancements

### Phase 2: Advanced Analytics
- Trend prediction (machine learning)
- Player skill assessment
- Match outcome prediction
- Ranking volatility analysis

### Phase 3: Social Features
- Rank-based achievements/badges
- Public leaderboard sharing
- Ranking milestones notifications
- Head-to-head rankings

### Phase 4: Admin Tools
- Manual ranking adjustments
- Weight tuning interface
- Ranking audit logs
- Player ranking appeals

### Phase 5: Integration
- Mobile app leaderboard
- Third-party ranking feed
- Webhook notifications on rank changes
- CSV export for analytics

## Support & Troubleshooting

### Common Issues

**Q: Ranking not updating after match**
A: Check that MATCH_COMPLETED event is being published. Verify event handler is registered in EventBus initialization.

**Q: Leaderboard appears stale**
A: Run `refreshLeaderboardProjections(organizationId)` manually or check background job status.

**Q: Missing traceability link**
A: Verify RankingEvent record exists. Check that source event type is supported.

**Q: High database query latency**
A: Check if LeaderboardProjection indexes are present. Run query analysis on slow queries.

## Contact & Questions

For questions about the ranking system implementation, refer to:
- Implementation details: /memories/repo/ranking-system-implementation.md
- Code structure: src/modules/ranking/
- API documentation: /src/app/api/rankings/route.ts
