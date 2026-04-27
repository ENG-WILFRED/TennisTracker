# Quick Integration Reference - Player Analytics

## Add to Your Dashboard

Copy this snippet into any dashboard component to display player analytics:

```tsx
import MembershipAnalytics from '@/components/MembershipAnalytics';

// Inside your component JSX:
<MembershipAnalytics 
  playerId={playerIdVariable}
  playerName={playerNameVariable}
  role="player" // or "coach" or "parent"
/>
```

## Example: Membership Dashboard

```tsx
'use client';

import MembershipAnalytics from '@/components/MembershipAnalytics';
import { useSession } from 'next-auth/react';

export default function MembershipDashboard() {
  const { data: session } = useSession();
  
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div>
        <h2>Your Profile</h2>
        {/* Other profile content */}
      </div>
      
      <div>
        <h2>Performance</h2>
        <MembershipAnalytics 
          playerId={session?.user?.id}
          playerName={session?.user?.name}
          role="player"
        />
      </div>
    </div>
  );
}
```

## Example: Coach Dashboard

```tsx
'use client';

import MembershipAnalytics from '@/components/MembershipAnalytics';
import { useEffect, useState } from 'react';

export default function CoachDashboard() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    // Fetch players managed by this coach
    fetchManagedPlayers();
  }, []);

  return (
    <div>
      <h1>Players I Coach</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
        {players.map(player => (
          <MembershipAnalytics
            key={player.id}
            playerId={player.id}
            playerName={`${player.firstName} ${player.lastName}`}
            role="coach"
          />
        ))}
      </div>
    </div>
  );
}
```

## Example: Parent Dashboard

```tsx
'use client';

import MembershipAnalytics from '@/components/MembershipAnalytics';
import { useEffect, useState } from 'react';

export default function ParentDashboard() {
  const [children, setChildren] = useState([]);

  useEffect(() => {
    // Fetch children linked to parent account
    fetchLinkedChildren();
  }, []);

  return (
    <div>
      <h1>My Children's Progress</h1>
      {children.map(child => (
        <MembershipAnalytics
          key={child.id}
          playerId={child.playerId}
          playerName={child.name}
          role="parent"
        />
      ))}
    </div>
  );
}
```

## API Endpoints Reference

### Fetch Analytics Data
```
GET /api/players/{playerId}/analytics?timeframe=all
```

Query params:
- `timeframe`: "all" | "3months" | "6months" | "year"

Response:
```json
{
  "analytics": {
    "playerId": "...",
    "playerName": "...",
    "stats": {
      "totalMatches": 45,
      "matchesWon": 32,
      "matchesLost": 13,
      "winRate": 71.1,
      "currentRank": 5,
      "streak": 3
    },
    "monthly": [...],
    "recentMatches": [...]
  }
}
```

### Generate PDF
```
POST /api/players/{playerId}/analytics/pdf
```

Request body:
```json
{
  "timeframe": "all",
  "analytics": { /* full analytics object */ }
}
```

Response: PDF file (binary)

## Component Props

```typescript
interface MembershipAnalyticsProps {
  playerId: string;              // Required: e.g., "player-123"
  playerName?: string;           // Optional: defaults to API response
  role?: 'player' | 'coach' | 'parent';  // Optional: defaults to "player"
}
```

## What Each Role Sees

### Player Role
- Quick stats display
- Recent form visual
- **Action Button:** "📥 Download PDF" → Generate progress report

### Coach Role
- Quick stats display
- Recent form visual
- **Action Button:** "👁️ Review Progress" → Link to full analytics

### Parent Role
- Quick stats display
- Recent form visual
- **Action Button:** "📈 View Progress" → Link to full analytics

## Direct Page Access

Users can also access the full analytics page directly:

```
/players/analytics/{playerId}
```

Features:
- Full stat breakdown
- Performance metrics
- Monthly progress cards
- Recent matches table
- Goals tracking
- Timeframe filter (all, 3months, 6months, year)
- PDF export button

## Style Integration

Component uses TennisTracker green theme automatically. No additional styling required.

Color constants used:
```
Primary:    #7dc142 (lime)
Secondary:  #a8d84e (accent)
Highlight:  #f0c040 (yellow)
Info:       #4ab0d0 (blue)
Warning:    #e05050 (red)
Dark:       #0f1f0f (background)
Card:       #1a3020 (card background)
Text:       #e8f5e0 (primary text)
Muted:      #7aaa6a (secondary text)
```

## Error Handling

Component handles errors gracefully:
- If API fails to load: No error shown (silently skipped)
- If player not found: Loading state dismissed
- Component will not crash dashboard

## Performance Notes

- Component fetches data on mount via `useEffect`
- No polling or real-time updates (static snapshot)
- Full analytics page can be bookmarked for later reference
- PDF generation happens server-side

## Testing

```tsx
// Test with hardcoded player ID:
<MembershipAnalytics 
  playerId="player-test-id"
  playerName="Test Player"
  role="player"
/>

// Verify:
// 1. Stats load and display correctly
// 2. Action button visible and correct for role
// 3. Click "View Full" links to /players/analytics/[playerId]
// 4. Download PDF button works (player role only)
```

---

**Quick Start:** Copy snippet at top, fill in variables, add to dashboard! 🚀
