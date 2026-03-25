# Quick API Reference

## All Available API Endpoints

### Dashboard
- **GET** `/api/dashboard?playerId={id}` - Complete player dashboard data

### Players
- **GET** `/api/players` - List players (with optional search: `?query=` or `?q=`)
- **GET** `/api/players/[id]` - Get individual player

### Coaches  
- **GET** `/api/coaches` - List all coaches
- **GET** `/api/coaches/available` - List available coaches (not employed)
- **POST** `/api/coaches/employ` - Employ a coach

### Referees
- **GET** `/api/referees` - List all referees
- **GET** `/api/referees/[id]` - Get individual referee
- **PUT** `/api/referees/[id]` - Update referee profile (authenticated)

### Matches
- **GET** `/api/matches` - List recent matches
- **GET** `/api/matches/[id]` - Get individual match details

### Chat (additional endpoints)
- **GET** `/api/chat/me` - Current user chat info
- **GET** `/api/chat/dm` - Get DMs
- **POST** `/api/chat/rooms` - Create room
- **PUT** `/api/chat/rooms/[roomId]/participants` - Manage participants
- **GET** `/api/chat/rooms/[roomId]/messages` - Get room messages
- **POST** `/api/chat/messages/[messageId]/reactions` - Add emoji reactions
- **WS** `/api/chat/ws` - WebSocket for real-time chat

### Authentication
- **POST** `/api/auth/register` - Create new account
- **POST** `/api/auth/login` - Login (JWT token)
- **POST** `/api/auth/logout` - Logout
- **POST** `/api/auth/refresh` - Refresh JWT token

### Other
- **GET** `/api/contact` - Contact form endpoints
- **GET** `/api/rules` - Tennis rules
- **GET** `/api/organization/[orgId]` - Organization details
- **GET** `/api/organization/[orgId]/inventory` - Organization inventory

---

## Common Response Patterns

### Success Response
```json
{
  "id": "string",
  "name": "string",
  // ... other fields
}
```

### Error Response
```json
{
  "error": "error message"
}
```

### List Response
```json
[
  { /* item 1 */ },
  { /* item 2 */ }
]
```

---

## Request Headers

### Standard Headers
```
Content-Type: application/json
```

### Authentication Headers (for protected routes)
```
Authorization: Bearer <JWT_TOKEN>
```

---

## URL Query Patterns

### Search/Filter
```
GET /api/players?query=john
GET /api/players?q=john
```

### Pagination (pattern for future use)
```
GET /api/players?page=1&limit=20
```

---

## Status Codes Used

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (missing params) |
| 401 | Unauthorized (auth required) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not found |
| 500 | Server error |

---

## Response Caching

### Cached Endpoints (5-second max-age)
- `/api/players`
- `/api/players/[id]`
- `/api/coaches`
- `/api/coaches/available`
- `/api/referees`
- `/api/referees/[id]`

### Not Cached
- `/api/dashboard` (real-time player data)
- `/api/matches` 
- `/api/auth/*`
- `/api/chat/*`

---

## Data Relationships

```
User
  ├── Player (stats, matches, badges)
  ├── Referee (matches refereed, certifications)
  ├── Staff (coaches - pricing, reviews, students)
  └── Spectator

Match
  ├── playerA (Player)
  ├── playerB (Player)
  ├── winner (Player, optional)
  └── referee (Referee, optional)

Organization
  ├── Players
  ├── Coaches (Staff)
  ├── Inventory
  └── Courts

Badge
  ├── PlayerBadge (earned by players)
  └── Category (Wins, Referee, Participation)
```

---

## Integration Examples

### Fetch Player Data
```javascript
const response = await fetch('/api/players?query=john');
const players = await response.json();
```

### Get Dashboard Data
```javascript
const response = await fetch(`/api/dashboard?playerId=${userId}`);
const dashboardData = await response.json();
// Contains: player, rank, badges, matches, coaches, attendance, inventory
```

### Get Specific Match
```javascript
const response = await fetch(`/api/matches/match-id-123`);
const match = await response.json();
// Contains: playerA, playerB, referee, winner, score, status
```

### Update Referee Profile
```javascript
const response = await fetch(`/api/referees/${refereeId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`
  },
  body: JSON.stringify({
    bio: 'Updated bio',
    photo: 'https://...',
    nationality: 'USA',
    experience: '10'
  })
});
```

---

## Dashboard Routes (Frontend)

| Route | Component | Data Endpoint |
|-------|-----------|----------------|
| `/dashboard/player` | PlayerDashboard | `/api/dashboard` |
| `/dashboard/coach` | CoachDashboard | (uses mock data) |
| `/dashboard/referee` | RefereeDashboard | (uses mock data) |
| `/dashboard/admin` | AdminDashboard | (not documented) |
| `/dashboard/finance_officer` | FinanceDashboard | (not documented) |
| `/dashboard/org` | OrganizationDashboard | (not documented) |

---

## Key Features Using APIs

### Search Players
```
Input: query string
Endpoint: GET /api/players?query={string}
Output: Filtered player list (prefix match on firstName/lastName)
Order: By matchesWon DESC
Limit: Top 20 if query, top 8 if no query
```

### Find Available Coaches
```
Endpoint: GET /api/coaches/available
Output: List of coaches not employed by anyone
```

### Track Player Rank
```
Calculation: Rank based on matchesWon across all players
Endpoint: /api/dashboard (includes rank)
```

### Player Performance
```
Tracked:
  - matchesPlayed (total)
  - matchesWon (wins)
  - matchesLost (losses)
  - Skill level (auto calculated: Beginner/Intermediate/Advanced)
```

### Match Statistics
```
Tracked per referee:
  - matchesRefereed (count)
  - ballCrewMatches (support role count)
  - experience (string, e.g., "10 years")
  - certifications (array, e.g., ["ITF", "ATP"])
```

