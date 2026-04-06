# Dashboard Component Implementation Guide

Quick reference for building new dashboard components and features following Tennis Tracker design patterns.

---

## 1. Creating a New Dashboard Component

### Template Structure

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

// Define color palette
const G = {
  dark: '#0f1f0f',
  sidebar: '#152515',
  card: '#1a3020',
  cardBorder: '#2d5a35',
  mid: '#2d5a27',
  bright: '#3d7a32',
  lime: '#7dc142',
  accent: '#a8d84e',
  text: '#e8f5e0',
  muted: '#7aaa6a',
  yellow: '#f0c040',
  red: '#dc2626',
};

export const YourDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeNav, setActiveNav] = useState('Home');
  const [activeTab, setActiveTab] = useState('Overview');

  // Navigation items
  const navItems = [
    { label: 'Home', icon: '🏠' },
    { label: 'Settings', icon: '⚙️' },
    // Add more items...
  ];

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        background: G.dark,
        color: G.text,
        overflow: 'hidden',
      }}
    >
      {/* LEFT SIDEBAR */}
      <aside
        style={{
          width: 180,
          background: G.sidebar,
          borderRight: `1px solid ${G.cardBorder}`,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Your sidebar content */}
      </aside>

      {/* MAIN CONTENT */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minWidth: 0,
        }}
      >
        {/* Your main content */}
      </main>

      {/* RIGHT SIDEBAR (optional) */}
      <aside
        style={{
          width: 188,
          background: G.sidebar,
          borderLeft: `1px solid ${G.cardBorder}`,
          padding: '14px 12px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          flexShrink: 0,
        }}
      >
        {/* Your right sidebar content */}
      </aside>
    </div>
  );
};
```

---

## 2. Sidebar Navigation

### Navigation Button Pattern

```typescript
{navItems.map(item => (
  <button
    key={item.label}
    onClick={() => setActiveNav(item.label)}
    style={{
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
    }}
  >
    <span>{item.icon}</span>
    {item.label}
  </button>
))}
```

### Sidebar Logo Section

```typescript
<div
  style={{
    padding: '15px 14px 10px',
    borderBottom: `1px solid ${G.cardBorder}`,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }}
>
  <span style={{ fontSize: 20 }}>🎾</span>
  <div style={{ color: G.lime, fontWeight: 900, fontSize: 14 }}>Vico Sports</div>
</div>
```

### Sidebar CTA Button

```typescript
<div style={{ padding: '10px 12px 14px' }}>
  <button
    style={{
      width: '100%',
      background: `linear-gradient(135deg, ${G.lime}, #5aa832)`,
      color: '#0f1f0f',
      border: 'none',
      borderRadius: 8,
      padding: '9px 0',
      fontWeight: 800,
      fontSize: 12,
      cursor: 'pointer',
    }}
  >
    🏆 Action Button
  </button>
</div>
```

### Sidebar Info Box

```typescript
<div
  style={{
    margin: '0 10px 12px',
    background: G.mid,
    borderRadius: 8,
    padding: '10px 12px',
  }}
>
  <div
    style={{
      fontSize: 9,
      color: G.accent,
      fontWeight: 700,
      letterSpacing: 1,
    }}
  >
    UPCOMING EVENT
  </div>
  <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>Event Name</div>
  <div style={{ fontSize: 10, color: G.muted, marginTop: 2 }}>Date Info</div>
</div>
```

---

## 3. Tab Navigation

### Tab Bar (Pill Style)

```typescript
<div
  style={{
    display: 'flex',
    gap: 0,
    background: G.card,
    borderRadius: 8,
    padding: 4,
    border: `1px solid ${G.cardBorder}`,
    marginBottom: 12,
  }}
>
  {['Overview', 'Team', 'Reports'].map(tab => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      style={{
        flex: 1,
        padding: '7px 0',
        borderRadius: 6,
        border: 'none',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 700,
        background: activeTab === tab ? G.lime : 'transparent',
        color: activeTab === tab ? '#0f1f0f' : G.muted,
      }}
    >
      {tab}
    </button>
  ))}
</div>
```

### Underline Tabs (Alternative)

```typescript
<div
  style={{
    display: 'flex',
    gap: 12,
    marginBottom: 24,
    borderBottom: `1px solid ${G.cardBorder}`,
  }}
>
  {['Feed', 'Following'].map(tab => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      style={{
        background: 'transparent',
        border: 'none',
        color: activeTab === tab ? G.lime : G.muted,
        fontSize: 13,
        fontWeight: 700,
        paddingBottom: 12,
        borderBottom: activeTab === tab ? `2px solid ${G.lime}` : 'none',
        cursor: 'pointer',
      }}
    >
      {tab}
    </button>
  ))}
</div>
```

---

## 4. Stat Cards Grid

### 4-Column Stats Card

```typescript
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
  {[
    { label: 'Members', value: 142, icon: '👥' },
    { label: 'Events', value: 5, icon: '📅' },
    { label: 'Courts', value: 4, icon: '🏟️' },
    { label: 'Revenue', value: '$8,420', icon: '💰' },
  ].map((stat, i) => (
    <div
      key={i}
      style={{
        background: G.card,
        border: `1px solid ${G.cardBorder}`,
        borderRadius: 8,
        padding: '11px 14px',
      }}
    >
      <div style={{ color: G.muted, fontSize: 10 }}>{stat.label}</div>
      <div
        style={{
          color: G.accent,
          fontSize: 22,
          fontWeight: 900,
          marginTop: 4,
        }}
      >
        {stat.icon} {stat.value}
      </div>
      <div
        style={{
          height: 2,
          background: G.mid,
          borderRadius: 1,
          marginTop: 8,
        }}
      >
        <div
          style={{
            height: 2,
            width: '70%',
            background: G.lime,
            borderRadius: 1,
          }}
        />
      </div>
    </div>
  ))}
</div>
```

---

## 5. Common Card Patterns

### Content Card with Header

```typescript
<div
  style={{
    background: G.card,
    border: `1px solid ${G.cardBorder}`,
    borderRadius: 10,
    padding: '14px',
  }}
>
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    }}
  >
    <div style={{ fontWeight: 800, fontSize: 13 }}>📊 Title</div>
    <Link href="/path">
      <span style={{ color: G.lime, fontSize: 11, cursor: 'pointer' }}>
        View All →
      </span>
    </Link>
  </div>
  {/* Content goes here */}
</div>
```

### List Item in Card

```typescript
{items.map((item, i) => (
  <div
    key={i}
    style={{
      padding: '8px 10px',
      background: '#0f1f0f',
      borderRadius: 8,
      marginBottom: 6,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}
  >
    <span style={{ fontSize: 22 }}>{item.icon}</span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{item.name}</div>
      <div style={{ fontSize: 10.5, color: G.muted }}>{item.subtitle}</div>
    </div>
  </div>
))}
```

---

## 6. Button Styles

### Primary Action Button

```typescript
<button
  onClick={handleAction}
  style={{
    padding: '10px 16px',
    background: `linear-gradient(135deg, ${G.lime}, ${G.bright})`,
    color: '#0f1f0f',
    border: 'none',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  }}
>
  ✓ Action
</button>
```

### Secondary Button

```typescript
<button
  style={{
    padding: '7px 14px',
    background: 'transparent',
    color: G.lime,
    border: `1.5px solid ${G.lime}`,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  }}
>
  Cancel
</button>
```

### Icon Button (Subtle)

```typescript
<button
  style={{
    background: G.mid,
    border: 'none',
    color: G.muted,
    borderRadius: 4,
    padding: '3px 7px',
    fontSize: 10,
    cursor: 'pointer',
  }}
>
  👍
</button>
```

### Approval/Reject Pair

```typescript
<div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
  {/* Approve */}
  <button
    style={{
      background: '#2d5a2799',
      color: G.lime,
      border: `1px solid ${G.lime}44`,
      borderRadius: 4,
      padding: '4px 8px',
      fontSize: 10.5,
      cursor: 'pointer',
      fontWeight: 700,
    }}
  >
    ✓
  </button>
  {/* Reject */}
  <button
    style={{
      background: '#5a2d2d33',
      color: '#e57373',
      border: '1px solid #e5737344',
      borderRadius: 4,
      padding: '4px 8px',
      fontSize: 10.5,
      cursor: 'pointer',
    }}
  >
    ✕
  </button>
</div>
```

---

## 7. Form Elements

### Textarea for Posts/Comments

```typescript
<textarea
  value={content}
  onChange={(e) => setContent(e.target.value)}
  placeholder="What's on your mind? 🎾"
  style={{
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
  }}
/>
```

### Inline Input

```typescript
<input
  value={feedPost}
  onChange={(e) => setFeedPost(e.target.value)}
  placeholder="Post an update..."
  style={{
    background: G.mid,
    border: 'none',
    color: G.text,
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: 11.5,
    width: 180,
    outline: 'none',
  }}
/>
```

---

## 8. Progress Indicators

### Horizontal Progress Bar

```typescript
const ProgressBar: React.FC<{ value: number; color?: string }> = ({
  value,
  color = G.lime,
}) => (
  <div
    style={{
      height: 6,
      background: G.dark,
      borderRadius: 3,
      overflow: 'hidden',
      marginTop: 4,
    }}
  >
    <div
      style={{
        height: '100%',
        width: `${value}%`,
        background: color,
        borderRadius: 3,
        transition: 'width 0.5s',
      }}
    />
  </div>
);

// Usage
<ProgressBar value={85} color={G.lime} />
```

---

## 9. Charts

### Bar Chart Component

```typescript
const BarChart: React.FC<{ data: number[]; color?: string }> = ({
  data,
  color = G.lime,
}) => {
  const max = Math.max(...data);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 3,
        height: 48,
      }}
    >
      {data.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            background: i === data.length - 1 ? color : G.bright,
            borderRadius: '2px 2px 0 0',
            height: `${(v / max) * 100}%`,
            minHeight: 4,
          }}
        />
      ))}
    </div>
  );
};

// Usage
<BarChart data={[12, 18, 14, 22, 16, 25, 20]} />
```

### Line Chart Component

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

// Usage
<LineChart data={[40, 55, 48, 62, 58, 70, 65, 72]} />
```

---

## 10. Community/Comments Implementation

### Basic Post Card Structure

```typescript
<div
  style={{
    padding: '16px 14px',
    background: G.card,
    border: `1px solid ${G.cardBorder}`,
    borderRadius: 8,
    marginBottom: 12,
  }}
>
  {/* Post Header */}
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'start',
      marginBottom: 12,
    }}
  >
    <div style={{ display: 'flex', gap: 10 }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${G.lime}, ${G.bright})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        {authorInitial}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{authorName}</div>
        <div style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>
          {formattedDate}
        </div>
      </div>
    </div>
  </div>

  {/* Post Content */}
  <div
    style={{
      fontSize: 13,
      color: G.text,
      lineHeight: 1.5,
      marginBottom: 12,
    }}
  >
    {content}
  </div>

  {/* Engagement Stats */}
  <div
    style={{
      display: 'flex',
      gap: 16,
      fontSize: 11,
      color: G.muted,
      paddingBottom: 12,
      borderBottom: `1px solid ${G.cardBorder}`,
    }}
  >
    <div>👍 {likeCount}</div>
    <div>💬 {commentCount}</div>
  </div>

  {/* Reaction Buttons */}
  <div style={{ display: 'flex', gap: 8, paddingTop: 12 }}>
    <button
      onClick={() => handleReaction()}
      style={{
        flex: 1,
        padding: '8px',
        background: isLiked ? `${G.lime}30` : 'transparent',
        border: `1px solid ${isLiked ? G.lime : G.cardBorder}`,
        color: isLiked ? G.lime : G.muted,
        borderRadius: 4,
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {isLiked ? '👍 Liked' : '👍 Like'}
    </button>
    <button
      onClick={() => toggleComments()}
      style={{
        flex: 1,
        padding: '8px',
        background: expanded ? `${G.lime}30` : 'transparent',
        border: `1px solid ${expanded ? G.lime : G.cardBorder}`,
        color: expanded ? G.lime : G.muted,
        borderRadius: 4,
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      💬 Comment
    </button>
  </div>
</div>
```

### Comment Item in Thread

```typescript
<div
  style={{
    padding: '10px',
    background: G.dark,
    borderRadius: 4,
    fontSize: 12,
    marginBottom: 8,
  }}
>
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 4,
    }}
  >
    <div style={{ fontWeight: 600, color: G.text }}>Commenter Name</div>
    {canDelete && (
      <button
        onClick={() => deleteComment()}
        style={{
          background: 'transparent',
          border: 'none',
          color: G.red,
          cursor: 'pointer',
          fontSize: 10,
        }}
      >
        ✕
      </button>
    )}
  </div>
  <div style={{ color: G.text, marginBottom: 4 }}>Comment content here</div>
  <div style={{ fontSize: 10, color: G.muted }}>Date posted</div>
</div>
```

---

## 11. Empty States

### Empty Feed

```typescript
{items.length === 0 ? (
  <div style={{ textAlign: 'center', padding: '40px 20px', color: G.muted }}>
    <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
    <div>No posts yet. Be the first to share! 🎾</div>
  </div>
) : (
  // Content
)}
```

### Loading State

```typescript
if (loading) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: G.dark,
        color: G.text,
      }}
    >
      Loading...
    </div>
  );
}
```

---

## 12. Gradient & Visual Effects

### Commonly Used Gradients

```typescript
// Primary action gradient
background: `linear-gradient(135deg, ${G.lime}, ${G.bright})`

// Banner/attention gradient
background: `linear-gradient(135deg, ${G.mid}, #1d3d1d)`

// Subtle tint (for active states)
background: `${G.lime}30`  // 30% opacity

// Announcement gradients
background: `linear-gradient(135deg, ${G.lime}, #5aa832)`
```

---

## 13. Common API Patterns

### Fetching Dashboard Data

```typescript
useEffect(() => {
  if (user?.id) {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/dashboard?playerId=${user.id}`);
        const data = await res.json();
        setPlayerData(data);
      } catch (err) {
        console.error('Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }
}, [user?.id]);
```

### Creating a Post

```typescript
const handleCreatePost = async () => {
  if (!postContent.trim()) return;

  try {
    const response = await fetch('/api/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create-post',
        userId: user.id,
        content: postContent,
      }),
    });

    if (!response.ok) throw new Error('Failed to create post');

    // Update local state
    const newPost = await response.json();
    setPosts([newPost, ...posts]);
    setPostContent('');
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## 14. Quick Copy-Paste Snippets

### Live Match Banner

```typescript
<div
  style={{
    background: `linear-gradient(135deg, ${G.mid}, #1d3d1d)`,
    borderRadius: 10,
    padding: '12px 16px',
    border: `1px solid ${G.cardBorder}`,
  }}
>
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
    <span
      style={{
        background: '#e53935',
        color: '#fff',
        fontSize: 9,
        fontWeight: 800,
        padding: '2px 7px',
        borderRadius: 3,
        letterSpacing: 1,
      }}
    >
      ● LIVE
    </span>
    <span style={{ fontSize: 11, color: G.muted }}>Court 1</span>
  </div>
  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 16, fontWeight: 800 }}>Player 1</div>
      <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>vs Player 2</div>
    </div>
    <button
      style={{
        background: G.lime,
        color: '#0f1f0f',
        border: 'none',
        borderRadius: 8,
        padding: '9px 16px',
        fontWeight: 800,
        fontSize: 12,
        cursor: 'pointer',
      }}
    >
      ▶ Watch
    </button>
  </div>
</div>
```

### Pending Badge

```typescript
<span
  style={{
    background: G.yellow + '33',
    color: G.yellow,
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 10,
  }}
>
  3 Pending
</span>
```

### Status Indicator

```typescript
<div
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    color: statusColor,
    fontWeight: 700,
  }}
>
  <div
    style={{
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: statusColor,
    }}
  />
  {statusText}
</div>
```

---

## File Structure Reference

```
src/
├── components/
│   ├── dashboards/
│   │   ├── PlayerDashboard.tsx
│   │   ├── CoachDashboard.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── OrganizationDashboard.tsx
│   │   ├── FinanceDashboard.tsx
│   │   └── RefereeDashboard.tsx
│   ├── community/
│   │   └── CommunityView.tsx
│   ├── CommentThread.tsx
│   ├── FloatingMessagesPanel.tsx
│   ├── Button.tsx
│   └── [other components]
├── actions/
│   └── community.ts
└── hooks/
    └── useCommunityWebSocket.ts
```

---

## Color Scheme Quick Reference

```
🎨 Tennis/Sports Theme - Green Palette

Dark Mode (Default for All Dashboards):
  Dark Background:       #0f1f0f  (very dark green/black)
  Sidebar:               #152515  (dark green)
  Card Background:       #1a3020  (medium green)
  Card Border:           #2d5a35  (border green)

Accent Colors:
  Lime (Primary CTA):    #7dc142  (bright lime green)
  Bright (Secondary):    #3d7a32  (forest green)
  Accent/Highlight:      #a8d84e  (light green/yellow)
  Yellow (Alert):        #f0c040  (warning/attention)
  Red (Error/Delete):    #dc2626  (danger)

Text:
  Primary Text:          #e8f5e0  (very light green/white)
  Muted Text:            #7aaa6a  (medium gray-green)
```

