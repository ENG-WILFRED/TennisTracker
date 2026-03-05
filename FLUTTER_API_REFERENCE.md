# Flutter Pages - Real API Integration Reference

## Quick API Reference for All Pages

### 🎮 Main Pages (Data Display)

#### 1. **Players Page** (`vico_app/lib/pages/players.dart`)
```dart
// API Call
_players = api.fetchPlayers();

// Response Type: List<dynamic>
// Fields Expected:
{
  "id": "uuid",
  "name": "John Doe",           // String: Combined first + last name
  "username": "johndoe",        // String: User handle
  "email": "john@example.com",  // String: Email address
  "wins": 15,                   // int: Total wins
  "matchesPlayed": 22,          // int: Total matches
  "level": "Intermediate",      // String: Player level/rating
  "nationality": "USA",         // String: Country
  "img": "https://..."          // String URL: Player photo
}

// Search Filter: name, username
// Status: ✅ WORKING - Displays real player data with images
```

#### 2. **Coaches Page** (`vico_app/lib/pages/coaches.dart`)
```dart
// API Call
_coaches = api.fetchCoaches();

// Response Type: List<dynamic>
// Fields Expected:
{
  "id": "uuid",
  "name": "Coach Name",         // String: Full name
  "expertise": "Tennis Training",// String: Specialization
  "role": "Head Coach",         // String: Position
  "photo": "https://...",       // String URL: Coach photo
  "studentCount": 5             // int: Number of students coached
}

// Status: ✅ WORKING - Shows coach details with student metrics
```

#### 3. **Matches Page** (`vico_app/lib/pages/matches.dart`)
```dart
// API Call
_matches = api.fetchMatches();

// Response Type: List<dynamic>
// Fields Expected:
{
  "id": "uuid",
  "date": "2026-03-04T10:30:00Z",    // DateTime: Match date
  "playerA": {
    "id": "uuid",
    "name": "Player A Name"           // String: Player name
  },
  "playerB": {
    "id": "uuid", 
    "name": "Player B Name"           // String: Player name
  },
  "status": "COMPLETED" | "PENDING",  // String: Match status
  "score": "6-4 7-5",                 // String: Final score
  "winner": {                         // Object or null
    "id": "uuid",
    "name": "Winner Name"
  }
}

// Status: ✅ WORKING - Displays match results with correct player names
```

#### 4. **Referees Page** (`vico_app/lib/pages/referees.dart`)
```dart
// API Call
_referees = api.fetchReferees();

// Response Type: List<dynamic>
// Fields Expected:
{
  "id": "uuid",
  "firstName": "John",          // String: First name
  "lastName": "Smith",          // String: Last name
  "nationality": "USA",         // String: Country
  "matchesRefereed": 45,        // int: Matches as referee
  "ballCrewMatches": 20,        // int: Ball crew assignments
  "experience": 10,             // int: Years of experience
  "photo": "https://...",       // String URL: Photo
  "certifications": ["ITF"]     // Array<String>: Certifications
}

// Filters: All, Referees, Ball Crew
// Status: ✅ WORKING - Shows referee experience and credentials
```

#### 5. **Staff Page** (`vico_app/lib/pages/staff.dart`)
```dart
// API Call
_staff = api.fetchStaff();

// Response Type: List<dynamic>
// Fields Expected:
{
  "id": "uuid",
  "user": {
    "firstName": "John",        // String: First name
    "lastName": "Doe",          // String: Last name
    "email": "john@example.com" // String: Email
  },
  "role": "Manager",            // String: Staff role
  "expertise": "Court Maintenance",  // String: Specialty
  "contact": "555-1234"         // String: Phone/contact
}

// Filters: By role
// Status: ✅ WORKING - Handles nested user structure
```

#### 6. **Inventory Page** (`vico_app/lib/pages/inventory.dart`)
```dart
// API Call
_inventory = api.fetchInventory();

// Response Type: List<dynamic>
// Fields Expected:
{
  "id": "uuid",
  "name": "Tennis Ball",        // String: Item name
  "category": "Equipment",      // String: Category
  "quantity": 50,               // int: Stock count
  "condition": "Good",          // String: Quality status
  "location": "Storage Room A"  // String: Storage location
}

// Filters: By category
// Status: ✅ WORKING - Tracks inventory with condition indicators
```

#### 7. **Leaderboard Page** (`vico_app/lib/pages/leaderboard.dart`)
```dart
// API Call
_rankings = api.fetchLeaderboard(sort: 'rating');

// Response Type: List<dynamic>
// Fields Expected: (Same as Players endpoint)
{
  "id": "uuid",
  "name": "John Doe",
  "wins": 15,
  "matchesPlayed": 22,
  "level": "Intermediate",      // Used as rating
  "nationality": "USA"
}

// Display: Ranked by wins, medals for top 3
// Status: ✅ WORKING - Shows player rankings with stats
```

#### 8. **Analytics Page** (`vico_app/lib/pages/analytics.dart`)
```dart
// API Call
_analytics = api.getAnalytics(range: timeRange);  // week|month|year

// Response Type: Map<String, dynamic>
// Fields Expected: (Dynamic based on selected range)
{
  "totalMatches": 45,
  "totalPlayers": 120,
  "averageAttendance": 15,
  "topPlayer": { "id": "uuid", "name": "Player Name" },
  "period": "March 2026"
}

// Time Range Selection: Week, Month, Year
// Status: ✅ WORKING - Shows period-specific analytics
```

#### 9. **Organizations Page** (`vico_app/lib/pages/organization.dart`)
```dart
// API Call
_orgs = api.fetchOrganizations();

// Response Type: List<dynamic>
// Fields Expected:
{
  "id": "uuid",
  "name": "Tennis Club A",      // String: Club name
  "description": "Professional tennis club",  // String
  "city": "New York",           // String: Location
  "country": "USA",             // String: Country
  "rating": 4.5,                // float: Club rating
  "activityScore": 90           // int: Activity level
}

// Filters: By country
// Status: ✅ WORKING - Organizations viewable with details
```

#### 10. **RegisterCoach Page** (`vico_app/lib/pages/register_coach.dart`)
```dart
// API Call
_coaches = api.fetchCoaches();  // Then filters unassigned

// Filters: Where employedById == null
// Response: Same as Coaches page
// Status: ✅ WORKING - Coach employment workflow functional
```

---

### 👤 Detail Pages (Single Item View)

#### 11. **Player Detail Page** (`vico_app/lib/pages/player_detail.dart`)
```dart
// API Call
_player = api.getPlayer(widget.playerId);

// Response Type: Map<String, dynamic>
// Fields Expected:
{
  "id": "uuid",
  "firstName": "John",
  "lastName": "Doe", 
  "email": "john@example.com",
  "nationality": "USA",
  "wins": 15,
  "matchesPlayed": 22,
  "level": "Intermediate"
}

// Status: ✅ WORKING - Displays individual player details
```

#### 12. **Coach Detail Page** (`vico_app/lib/pages/coach_detail.dart`)
```dart
// API Call
// Note: No individual endpoint, fetches all coaches then filters by ID
final list = await api.fetchCoaches();
return list.firstWhere((c) => c['id'] == widget.coachId, orElse: () => {});

// Response: Same as Coaches list item
// Status: ✅ WORKING - Coach detail retrieval with fallback
```

#### 13. **Match Detail Page** (`vico_app/lib/pages/match_detail.dart`)
```dart
// API Call
_match = api.getMatch(widget.matchId);

// Response Type: Map<String, dynamic>
// Fields Expected:
{
  "id": "uuid",
  "round": 1,
  "createdAt": "2026-03-04T10:30:00Z",
  "status": "COMPLETED",
  "playerA": { "id": "uuid", "name": "Player A" },
  "playerB": { "id": "uuid", "name": "Player B" },
  "score": "6-4 7-5",
  "winner": { "id": "uuid", "name": "Winner" }
}

// Status: ✅ WORKING - Full match details with winner
```

#### 14. **Organization Detail Page** (`vico_app/lib/pages/organization_detail.dart`)
```dart
// API Call
_org = api.getOrganization(widget.orgId);

// Response Type: Map<String, dynamic>
// Fields Expected:
{
  "id": "uuid",
  "name": "Tennis Club Name",
  "description": "...",
  "city": "City Name",
  "country": "Country",
  "rating": 4.5,
  "staff": [],      // Array of staff members
  "inventory": [],  // Array of inventory items
  "players": []     // Array of players
}

// Status: ✅ WORKING - Organization with nested resources
```

---

### 🏢 Organization Sub-Pages

#### 15. **Organization Staff** (`vico_app/lib/pages/org_staff.dart`)
```dart
// API Call
_staff = api.fetchOrgStaff(widget.orgId);

// Response Type: List<dynamic>
// Fields Expected: (Staff under specific organization)
{
  "id": "uuid",
  "user": {
    "firstName": "John",
    "lastName": "Doe"
  },
  "role": "Manager",
  "expertise": "Court Maintenance"
}

// Status: ✅ WORKING - Organization-specific staff
```

#### 16. **Organization Inventory** (`vico_app/lib/pages/org_inventory.dart`)
```dart
// API Call
_inventory = api.fetchOrgInventory(widget.orgId);

// Response Type: List<dynamic>
// Fields Expected: (Inventory for specific organization)
{
  "id": "uuid",
  "name": "Tennis Racket",
  "category": "Equipment",
  "quantity": 20,
  "condition": "Good"
}

// Status: ✅ WORKING - Organization-specific inventory
```

---

## 🔐 Authentication Flow

```dart
// Login
final data = await authService.login(username, password);
final token = data['accessToken'];

// Store Token
await api.setAuthToken(token);

// All subsequent requests include:
// Authorization: Bearer {token}
```

---

## 📊 API Service Methods Summary

```dart
class ApiService {
  // List Methods (returning List<dynamic>)
  Future<List<dynamic>> fetchPlayers({String? query})
  Future<List<dynamic>> fetchCoaches()
  Future<List<dynamic>> fetchMatches()
  Future<List<dynamic>> fetchReferees()
  Future<List<dynamic>> fetchOrganizations()
  Future<List<dynamic>> fetchOrgStaff(String orgId)
  Future<List<dynamic>> fetchOrgInventory(String orgId)
  Future<List<dynamic>> fetchOrgPlayers(String orgId)
  Future<List<dynamic>> fetchStaff()
  Future<List<dynamic>> fetchInventory()
  Future<List<dynamic>> fetchLeaderboard({String sort = 'rating'})

  // Detail Methods (returning Map<String, dynamic>)
  Future<Map<String, dynamic>> getPlayer(String id)
  Future<Map<String, dynamic>> getCoach(String id)
  Future<Map<String, dynamic>> getMatch(String id)
  Future<Map<String, dynamic>> getReferee(String id)
  Future<Map<String, dynamic>> getOrganization(String id)
  Future<Map<String, dynamic>> getAnalytics({String? range})

  // Generic Methods
  Future<dynamic> get(String path)
  Future<dynamic> postData(String path, Map<String, dynamic> body)
}
```

---

## ✅ Data Flow Verification

All pages follow the same pattern:
1. ✅ Call correct API method in `initState()`
2. ✅ Use `FutureBuilder` to handle async data
3. ✅ Extract typed fields from response
4. ✅ Display with proper null-coalescing
5. ✅ Handle errors gracefully

**Result:** 100% Real Data Integration - No Mock/Placeholder Data

---

**Last Updated:** March 4, 2026  
**Status:** All APIs Functional and Verified ✨
