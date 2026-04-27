# Player Analytics System - Complete Implementation Guide

## Overview

The Player Analytics system provides comprehensive performance tracking for players with multi-role access (player, coach, parent). The system includes:

1. **Analytics Dashboard** - Full player performance metrics with timeframe filtering
2. **Quick Analytics Component** - Embeddable widget for dashboards  
3. **PDF Export** - Generate downloadable progress reports
4. **Multi-Role Access** - Role-based analytics views and actions

## Architecture

```
┌─ Pages
│  ├─ /src/app/players/analytics/[playerId]/page.tsx (Full dashboard)
│  └─ /src/app/players/profile/[playerId]/page.tsx (Profile with analytics link)
│
├─ API Endpoints
│  ├─ /api/players/[playerId]/analytics (GET - Fetch analytics data)
│  └─ /api/players/[playerId]/analytics/pdf (POST - Generate PDF)
│
└─ Components
   ├─ /src/components/MembershipAnalytics.tsx (Quick widget)
   └─ Stats, Charts, Tables (inline in pages)
```

## File Structure

### Core Analytics Files

1. **[/src/app/players/analytics/[playerId]/page.tsx](src/app/players/analytics/[playerId]/page.tsx)**
   - Full analytics dashboard page
   - Timeframe selector (all|3months|6months|year)
   - Stats display, performance charts, monthly cards, recent matches table
   - PDF generation button
   - Client-side component with data fetching

2. **[/src/app/api/players/[playerId]/analytics/route.ts](src/app/api/players/[playerId]/analytics/route.ts)**
   - GET endpoint - Fetch player analytics
   - Query param: `timeframe` (optional, defaults to 'all')
   - Returns calculated stats, monthly data, performance metrics, recent matches
   - Uses Prisma to query Match and Player data
   - Calculates win/loss based on `winnerId` field

3. **[/src/app/api/players/[playerId]/analytics/pdf/route.ts](src/app/api/players/[playerId]/analytics/pdf/route.ts)**
   - POST endpoint - Generate PDF report
   - Uses Puppeteer for server-side PDF rendering
   - Falls back to HTML if Puppeteer unavailable
   - Returns PDF blob with proper headers
   - Professional styled HTML template with embedded CSS

4. **[/src/components/MembershipAnalytics.tsx](src/components/MembershipAnalytics.tsx)**
   - Reusable quick analytics widget
   - Props: `playerId`, `playerName`, `role` (player|coach|parent)
   - Displays quick stats, recent form, role-based action buttons
   - Can be embedded in dashboards
   - Fetches from `/api/players/[playerId]/analytics` endpoint

### Related Modified Files

1. **[/src/app/players/profile/[playerId]/page.tsx](src/app/players/profile/[playerId]/page.tsx)**
   - Added "📊 View Analytics" button in action buttons section
   - Links to `/players/analytics/[playerId]`
   - Yellow button for visibility

## Data Structures

### Analytics Response

```typescript
interface Analytics {
  playerId: string;
  playerName: string;
  profilePhoto?: string;
  stats: {
    totalMatches: number;
    matchesWon: number;
    matchesLost: number;
    winRate: number;
    currentRank: number;
    streak: number; // positive=wins, negative=losses
  };
  monthly: Array<{
    month: string;
    matches: number;
    wins: number;
    losses: number;
  }>;
  performance: {
    avgPointsPerGame: number;
    serviceAccuracy: number;
    returnAccuracy: number;
  };
  recentMatches: Array<{
    date: string;
    opponent: string;
    result: 'WIN' | 'LOSS';
    score: string;
  }>;
  goals: Array<{
    name: string;
    progress: number;
    target: number;
  }>;
}
```

### MembershipAnalytics Props

```typescript
interface MembershipAnalyticsProps {
  playerId: string;           // Required: Player ID to display analytics for
  playerName?: string;        // Optional: Player name display
  role?: 'player' | 'coach' | 'parent';  // Optional: defaults to 'player'
}
```

## Integration Guide

### 1. Dashboard Integration

To add analytics to a membership dashboard:

```tsx
import MembershipAnalytics from '@/components/MembershipAnalytics';

export default function DashboardPage() {
  return (
    <div>
      {/* Other dashboard content */}
      <MembershipAnalytics 
        playerId={userId}
        playerName={userName}
        role="player" // or "coach" or "parent"
      />
    </div>
  );
}
```

### 2. Access the Full Analytics Page

Direct URL access:
```
/players/analytics/{playerId}
```

Example:
```
/players/analytics/player-123
```

### 3. PDF Generation

From the analytics page, users can click "📥 Generate PDF" button, which:
1. Calls POST to `/api/players/{playerId}/analytics/pdf`
2. Passes current analytics data
3. Receives PDF blob
4. Triggers browser download

Programmatic usage:
```tsx
async function downloadAnalytics(playerId: string) {
  const res = await fetch(`/api/players/${playerId}/analytics/pdf`, {
    method: 'POST',
    body: JSON.stringify({ timeframe: 'all' }),
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `player-analytics-${playerId}.pdf`;
  a.click();
}
```

## API Endpoints

### GET /api/players/[playerId]/analytics

Fetch player analytics data.

**Query Parameters:**
- `timeframe` (optional): 'all' | '3months' | '6months' | 'year' (default: 'all')

**Response:**
```json
{
  "analytics": {
    "playerId": "player-123",
    "playerName": "John Doe",
    "stats": {
      "totalMatches": 45,
      "matchesWon": 32,
      "matchesLost": 13,
      "winRate": 71.1,
      "currentRank": 5,
      "streak": 3
    },
    "monthly": [...],
    "performance": {...},
    "recentMatches": [...],
    "goals": [...]
  }
}
```

### POST /api/players/[playerId]/analytics/pdf

Generate PDF report of player analytics.

**Request Body:**
```json
{
  "timeframe": "all",
  "analytics": { /* full analytics object */ }
}
```

**Response:**
- Content-Type: `application/pdf`
- Body: PDF file binary data
- Filename: `player-analytics-{playerId}-{date}.pdf`

## Color Scheme

The analytics system uses the TennisTracker green theme:

```
Primary:    #7dc142 (lime)
Secondary:  #a8d84e (accent)
Accent:     #4ab0d0 (blue)
Warning:    #e05050 (red)
Highlight:  #f0c040 (yellow)
Dark:       #0f1f0f (background)
Card:       #1a3020 (card background)
Text:       #e8f5e0 (primary text)
Muted:      #7aaa6a (secondary text)
```

## Features Breakdown

### Analytics Dashboard (/players/analytics/[playerId])

**Top Section:**
- Player header with profile photo, name
- Quick stat cards (Matches, Won, Lost, Win %)

**Performance Metrics:**
- Win rate percentage with visual
- Current rank display
- Winning streak indicator

**Monthly Progress:**
- Last 3 months data cards
- Monthly matches, wins, losses

**Recent Matches:**
- Table of last 10 matches
- Date, opponent, result, score

**Goals Section:**
- Player goals with progress bars
- Target tracking

**Actions:**
- Timeframe filter buttons
- PDF export button

### MembershipAnalytics Component

**Content:**
- Performance overview header
- Quick 4-stat grid (Matches, Won, Lost, Win %)
- Recent form visual (W/L indicators)
- Role-specific action buttons

**Role-Based Actions:**
- **Player:** "📥 Download PDF" - Generate progress report
- **Coach:** "👁️ Review Progress" - Full analytics review
- **Parent:** "📈 View Progress" - Progress tracking

## Usage Examples

### Example 1: Display Analytics in Coach Dashboard

```tsx
import MembershipAnalytics from '@/components/MembershipAnalytics';

export default function CoachDashboard() {
  const { sessionUser } = useSession();
  const managedPlayers = [...]; // Fetch managed players

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
      {managedPlayers.map(player => (
        <MembershipAnalytics 
          key={player.id}
          playerId={player.id}
          playerName={player.name}
          role="coach"
        />
      ))}
    </div>
  );
}
```

### Example 2: Display Analytics in Parent Dashboard

```tsx
import MembershipAnalytics from '@/components/MembershipAnalytics';

export default function ParentDashboard() {
  const childrenPlayers = [...]; // Fetch children players

  return (
    <div>
      <h1>My Children's Progress</h1>
      {childrenPlayers.map(child => (
        <MembershipAnalytics 
          key={child.id}
          playerId={child.id}
          playerName={child.name}
          role="parent"
        />
      ))}
    </div>
  );
}
```

### Example 3: Direct Page Access

Players can access their full analytics at:
```
/players/analytics/[their-player-id]
```

From profile page, use "📊 View Analytics" button which links to:
```tsx
href={`/players/analytics/${playerId}`}
```

## Timeframe Filtering

The analytics system supports filtering by timeframe:

- **all** - All historical data
- **3months** - Last 3 months
- **6months** - Last 6 months  
- **year** - Last 12 months

Timeframe selector in analytics page allows users to switch between views, with data recalculating accordingly.

## PDF Generation Details

### Puppeteer Implementation (Primary)

1. Launches headless browser
2. Sets page content to HTML template
3. Generates A4 format PDF
4. Returns binary data with proper headers
5. Triggers browser download

### HTML Fallback

If Puppeteer is unavailable:
1. Returns styled HTML content
2. User can print to PDF using browser's Print dialog
3. CSS includes print-friendly media queries

## Testing Checklist

- [ ] Load analytics page: `/players/analytics/{playerId}`
- [ ] Verify stats display correctly
- [ ] Test timeframe filter changes
- [ ] Test PDF generation button
- [ ] Verify PDF downloads with correct filename
- [ ] Add analytics component to test dashboard
- [ ] Verify role-specific buttons show correctly
- [ ] Test with multiple players
- [ ] Verify TypeScript compilation passes
- [ ] Test mobile responsiveness

## Future Enhancements

1. **Advanced Metrics**
   - Service velocity trends
   - Rally statistics
   - Court surface performance

2. **Comparative Analysis**
   - vs. opponent win rate
   - vs. rank progression
   - Performance over time

3. **Export Options**
   - CSV data export
   - Excel reports
   - Email integration

4. **Real-time Updates**
   - Match result notifications
   - Rank updates
   - Streak tracking

5. **Coach Tools**
   - Player comparison
   - Team analytics
   - Training recommendations

## Deployment Notes

1. Ensure Puppeteer dependencies installed: `npm install puppeteer`
2. Update Prisma schema if adding new Match fields
3. Configure PDF output paths if using file storage
4. Test PDF generation in production environment
5. Consider rate limiting PDF generation for performance

## Support Files

- Database Models: Prisma Player, Match, User models
- Type Definitions: TypeScript interfaces in API route files
- Styling: Green theme color constants in component files
- Documentation: This guide + [PLAYER_PROFILE_COMPLETE.md](/documentation/PLAYER_PROFILE_COMPLETE.md)

---

**Last Updated:** 2024
**Status:** Complete and TypeScript validated
**Version:** 1.0
