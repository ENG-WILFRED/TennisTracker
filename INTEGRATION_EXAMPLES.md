# Integration Examples - Player Training Progress System

This file contains concrete code examples for integrating the new player training progress system into your existing dashboards.

## 1. Add to Player Dashboard Home View

Add the new components to the main dashboard home to give players quick access to their training progress.

**File**: `src/components/dashboards/DashboardHome/index.tsx`

```tsx
// Add these imports at the top
import { CompletedSessionsView } from '@/components/players/CompletedSessionsView';
import { PlayerProgress } from '@/components/players/PlayerProgress';

// Inside the DashboardHome component, add these sections after existing content:

export function DashboardHome({ 
  playerData, 
  upcomingMatches, 
  leaderboard, 
  activityFeed 
}: DashboardHomeProps) {
  return (
    <div>
      {/* Existing content */}
      
      {/* Add this NEW section for Training Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-6">
        {/* Left side - Progress overview */}
        <div className="lg:col-span-2">
          <PlayerProgress playerId={playerData?.player?.id} isEmbedded={true} />
        </div>
        
        {/* Right side - Quick stats */}
        <Card>
          <SectionTitle>🎯 Session Stats</SectionTitle>
          <StatPill label="Sessions" value={playerData?.sessionsCompleted || 0} />
          <StatPill label="Avg Rating" value={playerData?.avgCoachRating || '—'} />
          <StatPill label="Improvement" value="+0.3" />
        </Card>
      </div>
      
      {/* Add this NEW section for Recent Sessions */}
      <div className="mt-6">
        <CompletedSessionsView playerId={playerData?.player?.id} isEmbedded={true} />
      </div>
    </div>
  );
}
```

## 2. Add "Training Progress" Tab to Player Dashboard

**File**: `src/components/dashboards/PlayerDashboard.tsx`

```tsx
// Step 1: Add new imports
import { CompletedSessionsView } from '@/components/players/CompletedSessionsView';
import { PlayerProgress } from '@/components/players/PlayerProgress';

export const PlayerDashboard: React.FC = () => {
  // ... existing code ...
  
  // Step 2: Add new query param
  const searchParams = useSearchParams();
  const showTrainingProgress = searchParams.get('training-progress') === 'true';
  
  // Step 3: Add new nav item
  const navItems = [
    // ... existing items ...
    { label: 'Training Progress', icon: '📈', href: '?training-progress=true' },
  ];
  
  // Step 4: Add new conditional render
  return (
    <div>
      {/* ... existing sidebar code ... */}
      
      <main className="flex-1 px-3 py-4 sm:px-5 sm:py-5 overflow-y-auto">
        <div className="space-y-4">
          {/* ... existing conditions ... */}
          {showTrainingProgress ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-3xl border border-[#2d5a35] bg-[#152515] p-6">
                <div>
                  <div className="text-sm uppercase tracking-[0.32em] text-[#7dc142]">Progress Tracking</div>
                  <h1 className="mt-2 text-3xl font-bold text-white">Training Progress</h1>
                  <p className="mt-2 text-sm text-[#c2dbb0]">
                    Track your training sessions and see coach feedback on your performance.
                  </p>
                </div>
              </div>
              <PlayerProgress playerId={user?.id} />
              <CompletedSessionsView playerId={user?.id} />
            </div>
          ) : (
            // ... existing conditional renders ...
          )}
        </div>
      </main>
    </div>
  );
};
```

## 3. Add Coach Rating Section to Coach Dashboard

**File**: `src/components/dashboards/coach/CoachDashboard.tsx`

```tsx
// Add import
import { CoachCompletedSessions } from '@/components/coaches/CoachCompletedSessions';
import { AnalyticsSection } from '@/components/dashboards/coach/AnalyticsSection';

export default function CoachDashboard({ coachId, organizationId }: CoachDashboardProps) {
  return (
    <div className="space-y-4">
      {/* Existing sections */}
      
      {/* Add new section for rating players */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div style={{
            background: '#0f1f0f',
            border: '1px solid #243e24',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <CoachCompletedSessions 
              coachId={coachId} 
              organizationId={organizationId} 
            />
          </div>
        </div>
        
        {/* Side panel with stats */}
        <div style={{
          background: '#0f1f0f',
          border: '1px solid #243e24',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <h3 className="text-lg font-bold text-white mb-4">Rating Stats</h3>
          <div className="space-y-3">
            <div>
              <div style={{ fontSize: '12px', color: '#7aaa6a' }}>Ratings Submitted</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#79bf3e' }}>
                {/* You can fetch this stat from an API */}
                15
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#7aaa6a' }}>This Month</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f0c040' }}>
                8
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 4. Add Training Progress to Player Profile

**File**: `src/app/players/profile/[playerId]/page.tsx`

```tsx
import { PlayerProgress } from '@/components/players/PlayerProgress';
import { CompletedSessionsView } from '@/components/players/CompletedSessionsView';

export default function PlayerProfilePage() {
  const playerId = params.playerId as string;
  
  // ... existing code ...
  
  return (
    <div>
      {/* Existing profile content */}
      
      {/* Add new tabs */}
      <div className="tabs">
        <TabButton label="Overview" />
        <TabButton label="Sessions" />
        <TabButton label="Training Progress" />
        <TabButton label="Comments" />
      </div>
      
      {/* Tab content */}
      {activeTab === 'Training Progress' && (
        <div className="space-y-4">
          <PlayerProgress playerId={playerId} />
          <CompletedSessionsView playerId={playerId} />
        </div>
      )}
    </div>
  );
}
```

## 5. Add Rating Button to Completed Session Cards

If you have existing session cards, add a rating button:

```tsx
// In SessionCard component or similar

import { CoachRatingForm } from '@/components/coaches/CoachRatingForm';

function SessionCard({ session, coachId }: SessionCardProps) {
  const [showRatingForm, setShowRatingForm] = useState(false);
  
  if (session.status === 'completed' && !session.hasRating) {
    return (
      <div className="session-card">
        {/* Existing card content */}
        
        {/* Add rating button */}
        <button
          onClick={() => setShowRatingForm(true)}
          className="mt-4 px-4 py-2 bg-[#79bf3e] text-[#081107] rounded-lg font-semibold"
        >
          ⭐ Rate This Session
        </button>
        
        {/* Rating form modal */}
        {showRatingForm && (
          <CoachRatingForm
            coachId={coachId}
            playerId={session.playerId}
            sessionId={session.id}
            sessionTitle={session.title}
            onClose={() => setShowRatingForm(false)}
            onSuccess={() => {
              // Refresh session data
              setShowRatingForm(false);
            }}
          />
        )}
      </div>
    );
  }
  
  return <div className="session-card">{/* Existing content */}</div>;
}
```

## 6. Add Progress Chart to Analytics Dashboard

For a more advanced visualization:

```tsx
// Create a new component: ProgressChart.tsx

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function ProgressChart({ playerId }: { playerId: string }) {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    fetch(`/api/players/${playerId}/progress`)
      .then(r => r.json())
      .then(d => {
        // Transform data for chart
        const chartData = d.sessions.map(s => ({
          date: new Date(s.date).toLocaleDateString(),
          rating: s.rating || 0
        }));
        setData(chartData);
      });
  }, [playerId]);
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[0, 5]} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="rating" stroke="#79bf3e" />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

## 7. Add Real-time Notification for New Ratings

Add to your notification system:

```tsx
// In useEffect or websocket handler

useEffect(() => {
  // Listen for new ratings
  const eventSource = new EventSource(`/api/notifications/ratings?playerId=${playerId}`);
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'new-rating') {
      toast.success(`New feedback from Coach ${data.coachName}`);
      // Refresh player progress
      refetchProgress();
    }
  };
  
  return () => eventSource.close();
}, [playerId]);
```

## 8. Integration with Existing ProgressView

If you already have a ProgressView component:

```tsx
// In ProgressView component

import { PlayerProgress } from '@/components/players/PlayerProgress';
import { CompletedSessionsView } from '@/components/players/CompletedSessionsView';

export function ProgressView({ isEmbedded, playerId }: ProgressViewProps) {
  return (
    <div className="space-y-4">
      {/* Existing ProgressView content */}
      
      {/* Add new training progress section */}
      <div className="mt-6 border-t border-[#243e24] pt-6">
        <h2 className="text-xl font-bold text-white mb-4">Coach Feedback & Progress</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <PlayerProgress playerId={playerId} isEmbedded={true} />
          </div>
          <div>
            <CompletedSessionsView playerId={playerId} isEmbedded={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Next Steps

1. **Run Migration**: `npx prisma migrate dev --name add-coach-player-rating`
2. **Choose Integration**: Pick the integration pattern that fits your app best
3. **Test Locally**: Test the rating form and progress display
4. **Deploy**: Deploy the changes to production

## Common Integration Points

- **Player Dashboard**: Home view or new "Training" tab
- **Player Profile**: New tab or section in profile
- **Coach Dashboard**: New section for rating players
- **Session Details**: Button to rate completed sessions
- **Analytics**: Chart showing progress over time
- **Notifications**: Alert player of new ratings

## Styling Consistency

All components use the same color scheme:
- Primary: `#79bf3e` (lime green)
- Secondary: `#f0c040` (yellow)
- Success: `#7dc142` (green)
- Danger: `#d94f4f` (red)
- Text: `#e8f5e0` (light)
- Muted: `#7aaa6a` (gray)
- Background: `#081107` (dark)
- Card: `#0f1f0f` (darker)

Adjust as needed for your design system.
