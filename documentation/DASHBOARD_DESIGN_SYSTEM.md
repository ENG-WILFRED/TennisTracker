# Dashboard Design System & Component Architecture

## Overview
The Tennis Tracker application uses a consistent design language across all dashboard components (Player, Coach, Admin, Organization, Finance, Referee). The system is built with:
- **Styling**: Inline-style React components with custom color palette (no Tailwind in dashboards)
- **Styling Framework**: Tailwind CSS used selectively in other components (FloatingMessagesPanel, CommentThread)
- **Layout**: Flexbox-based layouts with sidebar navigation + main content + optional right sidebar
- **Real-time Features**: WebSocket integration for community posts, comments, and reactions

---

## Color Palette (Global `G` Object)

All dashboard components use a consistent color palette defined as a `const G` at the top:

```typescript
const G = {
  dark:       '#0f1f0f',    // Primary black background
  sidebar:    '#152515',    // Left sidebar background
  card:       '#1a3020',    // Card/panel background
  cardBorder: '#2d5a35',    // Card border color
  mid:        '#2d5a27',    // Mid-tone backgrounds
  bright:     '#3d7a32',    // Bright green accent
  lime:       '#7dc142',    // Primary lime/green action color
  accent:     '#a8d84e',    // Accent/highlight color
  text:       '#e8f5e0',    // Primary text color
  muted:      '#7aaa6a',    // Secondary/muted text
  yellow:     '#f0c040',    // Warning/alert color
  red:        '#dc2626',    // Error/delete color (not in all components)
};
```

**Color Purpose Mapping:**
- `dark` (#0f1f0f): Main background
- `sidebar` (#152515): Sidebar background
- `card` (#1a3020): Card containers
- `cardBorder` (#2d5a35): Card borders - `border: 1px solid ${G.cardBorder}`
- `lime` (#7dc142): Primary CTAs and active states
- `accent` (#a8d84e): Numeric highlights, statistics
- `text` (#e8f5e0): Primary text
- `muted` (#7aaa6a): Secondary text, help text
- `mid` (#2d5a27): Secondary backgrounds, disabled states

---

## Layout Patterns

### 1. Standard Dashboard Layout
All dashboards follow a 3-column structure:

```
┌─────────────────────────────────────────────────┐
│ LEFT SIDEBAR    │    MAIN CONTENT    │   RIGHT   │
│   (188px)       │    (flex: 1)       │  SIDEBAR  │
│  • Navigation   │  • Stats cards     │  (188px)  │
│  • Logo         │  • Chart areas     │  • User   │
│  • CTA button   │  • Tables          │  • Events │
│  • Upcoming     │  • Feed            │  • Friends│
│    event        │  • Comments        │           │
└─────────────────────────────────────────────────┘
```

**Layout CSS:**
```typescript
// Container
{
  display: 'flex',
  height: '100vh',
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  background: G.dark,
  color: G.text,
  overflow: 'hidden'
}

// Left Sidebar
{
  width: 188,
  background: G.sidebar,
  borderRight: `1px solid ${G.cardBorder}`,
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0
}

// Main Content
{
  flex: 1,
  overflowY: 'auto',
  padding: 14,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  minWidth: 0
}

// Right Sidebar
{
  width: 188,
  background: G.sidebar,
  borderLeft: `1px solid ${G.cardBorder}`,
  padding: '14px 12px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  flexShrink: 0
}
```

---

## Sidebar Navigation

### Left Sidebar Structure
```typescript
const navItems = [
  { label: 'Home', icon: '🏠' },
  { label: 'My Profile', icon: '👤' },
  { label: 'Tournaments', icon: '🏆' },
  // ... more items
];

// Navigation items render as buttons with active state
{
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '9px 14px',
  background: activeNav === item.label ? G.mid : 'transparent',
  color: activeNav === item.label ? '#fff' : G.muted,
  border: 'none',
  cursor: 'pointer',
  fontSize: 12.5,
  textAlign: 'left',
  borderLeft: activeNav === item.label ? `3px solid ${G.lime}` : '3px solid transparent',
  transition: 'all 0.2s ease'
}
```

**Key Features:**
- Icon + label format (emoji icons)
- Active state: `G.mid` background + `G.lime` left border (3px)
- Inactive state: transparent background + `G.muted` text + transparent border
- Left border indicator (3px) shows active tab

### Sidebar CTA Button
```typescript
{
  width: '100%',
  background: `linear-gradient(135deg, ${G.lime}, #5aa832)`,
  color: '#0f1f0f',
  border: 'none',
  borderRadius: 8,
  padding: '10px 0',
  fontWeight: 800,
  fontSize: 12.5,
  cursor: 'pointer'
}
```

---

## Card Components

### Standard Card Styling
All data cards follow this pattern:

```typescript
{
  background: G.card,
  border: `1px solid ${G.cardBorder}`,
  borderRadius: 8,        // or 10 for larger cards
  padding: 14,            // or 12/16 depending on content
  display: 'flex',        // or grid
  flexDirection: 'column',
  gap: 12                 // space between child elements
}
```

### Card Header
```typescript
{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
  fontWeight: 800,
  fontSize: 13,
  color: G.text
}
```

### Stat Cards (4-column grid)
```typescript
// Stats container
{
  display: 'grid',
  gridTemplateColumns: 'repeat(4,1fr)',
  gap: 10
}

// Individual stat card
{
  background: G.card,
  border: `1px solid ${G.cardBorder}`,
  borderRadius: 8,
  padding: '11px 14px'
}

// Stat label (uppercase, muted)
{
  color: G.muted,
  fontSize: 10,
  marginBottom: 4
}

// Stat value (large, accent color)
{
  color: G.accent,
  fontSize: 24,
  fontWeight: 900,
  marginTop: 4
}

// Progress bar
{
  height: 2,
  background: G.mid,
  borderRadius: 1,
  marginTop: 8,
  overflow: 'hidden'
}
```

---

## Button Styles

### Primary Button (Lime Gradient)
```typescript
{
  padding: '10px 16px',
  background: `linear-gradient(135deg, ${G.lime}, ${G.bright})`,
  color: '#0f1f0f',
  border: 'none',
  borderRadius: 6,     // or 8
  fontSize: 12,        // or 12.5
  fontWeight: 800,
  cursor: 'pointer',
  transition: 'all 0.2s'
}
```

### Secondary Button (Outline)
```typescript
{
  padding: '7px 14px',
  background: 'transparent',
  color: G.lime,
  border: `1.5px solid ${G.lime}`,
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer'
}
```

### Subtle Button
```typescript
{
  background: G.mid,
  border: 'none',
  color: G.muted,
  borderRadius: 4,
  padding: '3px 7px',
  fontSize: 10,
  cursor: 'pointer'
}
```

### Approval/Action Buttons (in cards)
```typescript
// Approve button
{
  background: '#2d5a2799',
  color: G.lime,
  border: `1px solid ${G.lime}44`,
  borderRadius: 4,
  padding: '4px 8px',
  fontSize: 10.5,
  cursor: 'pointer',
  fontWeight: 700
}

// Reject button
{
  background: '#5a2d2d33',
  color: '#e57373',
  border: '1px solid #e5737344',
  borderRadius: 4,
  padding: '4px 8px',
  fontSize: 10.5,
  cursor: 'pointer'
}
```

---

## Tab Navigation

### Tab Container
```typescript
{
  display: 'flex',
  gap: 0,
  background: G.card,
  borderRadius: 8,
  padding: 4,
  border: `1px solid ${G.cardBorder}`
}

// Individual tab button
{
  flex: 1,
  padding: '7px 0',
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 700,
  background: activeTab === t ? G.lime : 'transparent',
  color: activeTab === t ? '#0f1f0f' : G.muted
}
```

### Underline Tabs (Alternative)
Used in CommunityView:
```typescript
{
  display: 'flex',
  gap: 12,
  borderBottom: `1px solid ${G.cardBorder}`,
  marginBottom: 24
}

// Tab button
{
  background: 'transparent',
  border: 'none',
  color: activeTab === 'feed' ? G.lime : G.muted,
  fontSize: 13,
  fontWeight: 700,
  paddingBottom: 12,
  borderBottom: activeTab === 'feed' ? `2px solid ${G.lime}` : 'none',
  cursor: 'pointer'
}
```

---

## Form Elements

### Text Input / Textarea
```typescript
{
  width: '100%',
  minHeight: '100px',
  padding: '12px',
  background: G.dark,
  border: `1px solid ${G.cardBorder}`,
  borderRadius: 6,
  color: G.text,
  fontSize: 13,
  fontFamily: 'inherit',
  resize: 'none',
  outline: 'none'
}
```

### Inline Input (Activity Feed)
```typescript
{
  background: G.mid,
  border: 'none',
  color: G.text,
  borderRadius: 6,
  padding: '6px 10px',
  fontSize: 11.5,
  outline: 'none'
}
```

---

## Community / Comments Implementation

### Comment Structure with State Management
```typescript
interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentCommentId?: string | null;  // For nested replies
  replies?: Comment[];               // Nested reply comments
  reactions?: Array<{
    id: string;
    userId: string;
    type: string;  // 'like', 'love', 'haha', 'wow', 'sad', 'angry'
  }>;
  author: {
    userId: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      photo?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}
```

### Comment Thread Component Features
1. **Real-time Updates via WebSocket**: `useCommunityUpdates` hook
2. **Nested Replies**: Tree structure with `parentCommentId`
3. **Reactions**: 6 reaction types with emoji mapping
4. **Actions**: Reply, React, Delete (owner only)

### Comment Styling (Tailwind in CommentThread.tsx)
```typescript
// Comment container
className="comment mb-4"

// Comment header
className="flex items-center gap-3 mb-2"

// Author photo
className="w-8 h-8 rounded-full"

// Comment text
className="text-sm mb-3 text-gray-700"

// Reactions display
className="flex gap-2 mb-3 flex-wrap"
className="bg-gray-100 rounded px-2 py-1 text-xs flex items-center gap-1"

// Reply form
className="bg-gray-50 p-3 rounded mb-3"

// Nested replies
className="ml-6 mt-3 border-l-2 border-gray-200 pl-3"
```

### Post Card Structure (CommunityView.tsx)
```typescript
// Post container
{
  padding: '16px 14px',
  background: G.card,
  border: `1px solid ${G.cardBorder}`,
  borderRadius: 8
}

// Post header with avatar
{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'start',
  marginBottom: 12
}

// Author avatar (gradient background with initial)
{
  width: 40,
  height: 40,
  borderRadius: '50%',
  background: `linear-gradient(135deg, ${G.lime}, ${G.bright})`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 18,
  flexShrink: 0
}

// Post content
{
  fontSize: 13,
  color: G.text,
  lineHeight: 1.5,
  marginBottom: 12,
  wordWrap: 'break-word'
}

// Engagement stats
{
  display: 'flex',
  gap: 16,
  fontSize: 11,
  color: G.muted,
  paddingBottom: 12,
  borderBottom: `1px solid ${G.cardBorder}`
}

// Reaction buttons
{
  flex: 1,
  padding: '8px',
  background: userReaction ? `${G.lime}30` : 'transparent',
  border: `1px solid ${userReaction ? G.lime : G.cardBorder}`,
  color: userReaction ? G.lime : G.muted,
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600
}
```

### Comment Input Form (in expandable section)
```typescript
// Form container
{
  paddingTop: 12,
  borderTop: `1px solid ${G.cardBorder}`,
  display: 'grid',
  gap: 12
}

// Comment card display
{
  padding: '10px',
  background: G.dark,
  borderRadius: 4,
  fontSize: 12
}
```

---

## Data Visualization

### Progress Bars
```typescript
const ProgressBar: React.FC<{ value: number; color?: string }> = ({ value, color = G.lime }) => (
  <div style={{ height: 6, background: G.dark, borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
    <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 3, transition: 'width 0.5s' }} />
  </div>
);
```

### Bar Chart
```typescript
const BarChart: React.FC<{ data: number[]; color?: string }> = ({ data, color = G.lime }) => {
  const max = Math.max(...data);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 48 }}>
      {data.map((v, i) => (
        <div 
          key={i}
          style={{
            flex: 1,
            background: i === data.length - 1 ? color : G.bright,
            borderRadius: '2px 2px 0 0',
            height: `${(v / max) * 100}%`,
            minHeight: 4
          }}
        />
      ))}
    </div>
  );
};
```

### Line Chart (SVG)
```typescript
const LineChart: React.FC<{ data: number[] }> = ({ data }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 120},${40 - ((v - min) / (max - min)) * 36}`)
    .join(' ');
  return (
    <svg width="100%" height="40" viewBox="0 0 120 40">
      <polygon points={`0,40 ${points} 120,40`} fill={`${G.lime}25`} />
      <polyline
        points={points}
        fill="none"
        stroke={G.lime}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
```

---

## Messages & Announcements (FloatingMessagesPanel)

### Floating Button
```typescript
className="fixed bottom-6 right-6 z-40 inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200"
```

### Notification Badge
```typescript
className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full"
```

### Panel Styling
```typescript
className="fixed bottom-24 right-6 z-40 w-full md:w-[500px] max-w-[calc(100vw-3rem)] bg-white rounded-xl shadow-2xl border border-gray-200"

// Header
className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4"

// Content
className="max-h-96 overflow-y-auto"

// Announcement item
className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100"

// Event item
className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-100"
```

---

## Spacing & Typography

### Standard Spacing
- **Container padding**: 14px (main) / 12px (sidebar)
- **Card padding**: 14px / 12px / 11px
- **Item gaps**: 12px (columns) / 8px-10px (items)
- **Border radius**: 4px (buttons) / 6px (inputs, cards) / 8px+ (large cards) / 10px (prominent cards)

### Font Sizes
- **Large headers**: 20px (fontWeight: 700)
- **Card titles**: 13-14px (fontWeight: 800)
- **Body text**: 12-13px (fontWeight: 400)
- **Small text**: 10-11.5px (color: muted)
- **Labels**: 9-10px (fontWeight: 700, uppercase)
- **Stat values**: 18-24px (fontWeight: 900, color: accent)

### Font Weights
- **Extra Bold**: 900 (stat values, numbers)
- **Bold**: 800 (headers, titles)
- **Semi-bold**: 700 (buttons, labels)
- **Normal**: 400-600 (body text)

---

## Border & Shadow Props

### Standard Borders
```typescript
border: `1px solid ${G.cardBorder}`     // Most cards
border: `2px solid ${G.lime}`           // Active indicators
border: `1.5px solid ${G.lime}`         // Active buttons
```

### Shadows (Tailwind)
```typescript
shadow-lg      // FloatingMessagesPanel button
shadow-xl      // Hover state
shadow-2xl     // Panel container
```

### Gradients
```typescript
// Primary action gradient
`linear-gradient(135deg, ${G.lime}, ${G.bright})`

// Secondary gradient
`linear-gradient(145deg, ${G.mid} 0%, #1d3d1d 100%)`

// Subtle background
`${G.lime}25`  // 25% opacity
`${G.lime}30`  // 30% opacity
`${G.yellow}33` // 33% opacity
```

---

## Responsive Breakpoints

**Note**: Most dashboards do NOT use responsive Tailwind breakpoints due to inline styling. Instead:
- Right sidebar hidden on mobile (not implemented in current version)
- Main content takes up remaining space with `flex: 1`
- Grid layouts use fixed columns (no media queries visible)

**FloatingMessagesPanel is responsive:**
```typescript
"fixed bottom-24 right-6 z-40 w-full md:w-[500px]"
// Mobile: full width
// Desktop (md+): 500px width
```

---

## State Management Patterns

### Active States (Navigation, Tabs)
```typescript
const [activeNav, setActiveNav] = useState('Home');      // Sidebar nav
const [activeTab, setActiveTab] = useState('Overview');  // Tab groups
const [expandedComments, setExpandedComments] = useState<string | null>(null);  // Post comments
```

### Form States
```typescript
const [feedPost, setFeedPost] = useState('');
const [newPostContent, setNewPostContent] = useState('');
const [commentContent, setCommentContent] = useState('');
const [replyingTo, setReplyingTo] = useState<string | null>(null);
```

### Loading & Submission
```typescript
const [loading, setLoading] = useState(true);
const [posting, setPosting] = useState(false);
const [submitting, setSubmitting] = useState(false);
```

### Toast Notifications
```typescript
const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
// Types: 'success', 'error'
// Auto-dismiss recommended
```

---

## Real-time Features (WebSocket)

### Hook: `useCommunityUpdates`
Manages real-time community post/comment updates:
```typescript
const isConnected = useCommunityUpdates(
  (newPost) => { /* onPostCreated */ },
  (comment) => { /* onCommentAdded */ },
  (reply) => { /* onCommentReplyAdded */ },
  (reactionData) => { /* onCommentReactionAdded */ },
  (reactionData) => { /* onCommentReactionRemoved */ }
);
```

### Hook: `useAutoRefresh`
Auto-refresh data at intervals:
```typescript
useAutoRefresh(loadFeed, 30000);  // Refresh every 30 seconds
```

---

## Common Patterns

### Conditional Rendering for Embedded Views
```typescript
{showProfile ? (
  <ProfileView isEmbedded={true} canEdit={true} />
) : showBooking ? (
  <BookingView isEmbedded={true} canBook={true} organizationId={organizationId} />
) : (
  // Default view
)}
```

### Empty State Messaging
```typescript
{posts.length === 0 ? (
  <div style={{ textAlign: 'center', padding: '40px 20px', color: G.muted }}>
    <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
    <div>No posts yet. Be the first to share! 🎾</div>
  </div>
) : (
  // Content
)}
```

### Loading States
```typescript
if (loading) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: G.dark, color: G.text }}>
      Loading...
    </div>
  );
}
```

---

## Accessibility Notes

- **Focus states**: Not explicitly styled (should be added for keyboard navigation)
- **Color contrast**: Lime (#7dc142) on dark (#0f1f0f) has good contrast
- **Semantic HTML**: Limited (most divs/buttons without ARIA)
- **Emoji usage**: Extensively used as icons (consider alt text)

---

## File Locations

- **Dashboard components**: `src/components/dashboards/`
- **Community components**: `src/components/community/`
- **Comment component**: `src/components/CommentThread.tsx`
- **Floating messages**: `src/components/FloatingMessagesPanel.tsx`
- **Colors defined in**: Each dashboard component file (const G)
- **APIs**: `/api/dashboard`, `/api/community`, `/api/player/*`

---

## Key Implementation Files & Patterns

| Component | File | Key Features |
|-----------|------|--------------|
| PlayerDashboard | `src/components/dashboards/PlayerDashboard.tsx` | Leaderboard, activity feed, upcoming matches, stats charts |
| CoachDashboard | `src/components/dashboards/CoachDashboard.tsx` | Student progress, drill tracking, live match display |
| AdminDashboard | `src/components/dashboards/AdminDashboard.tsx` | KPIs, pending approvals, court status, events |
| OrganizationDashboard | `src/components/dashboards/OrganizationDashboard.tsx` | Revenue trends, schedule, staff roles, announcements |
| CommunityView | `src/components/community/CommunityView.tsx` | Post creation, feed, reactions, comments, follow system |
| CommentThread | `src/components/CommentThread.tsx` | Nested comments, replies, reactions, real-time updates |
| FloatingMessagesPanel | `src/components/FloatingMessagesPanel.tsx` | Announcements, events, notifications (Tailwind styled) |

