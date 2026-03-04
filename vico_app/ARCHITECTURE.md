# Flutter App - File Structure & Navigation Map

## Key Files Created/Modified

### 📱 Pages Directory (`lib/pages/`)

#### Organization Feature Pages
```
organization.dart                 - List all organizations with search
organized_detail.dart            - Single organization details
org_staff.dart                   - Staff members for organization  
org_inventory.dart               - Inventory items for organization
```

#### Enhanced Pages
```
referees.dart                    - Improved UI with search
register_coach.dart              - Enhanced coach employment page
```

### 🔧 Services (`lib/services/`)
```
api_service.dart                 - HTTP client with new organization methods
auth_service.dart                - Authentication handling (existing)
```

### 📚 Documentation (Root of vico_app/)
```
API_SETUP.md                     - API configuration guide
IMPLEMENTATION_SUMMARY.md        - Feature implementation summary
TESTING_CHECKLIST.md            - Complete testing guide
```

---

## Navigation Flow

```
Home/Dashboard
├── Organizations (NEW)
│   ├── Organization List
│   │   ├── [Search]
│   │   ├── [Create Org FAB]
│   │   └── [Select Organization]
│   │       └── Organization Detail
│   │           ├── Stats Cards
│   │           ├── View Staff
│   │           │   └── Staff List
│   │           │       ├── Staff Name
│   │           │       ├── Staff Role
│   │           │       └── User Email
│   │           └── View Inventory
│   │               └── Inventory List
│   │                   ├── Item Name
│   │                   ├── Quantity
│   │                   └── Condition
├── Referees (ENHANCED)
│   ├── [Search]
│   └── Referee Cards
│       ├── Avatar
│       ├── Name
│       ├── Nationality
│       └── Matches Refereed
├── Register Coach (ENHANCED)
│   ├── Available Coaches List
│   │   ├── Coach Card
│   │   ├── Experience
│   │   └── [Employ Button]
├── Coaches
├── Players
├── Matches
├── Dashboard
├── Chat
├── Analytics
├── Inventory (Placeholder)
├── Staff (Placeholder)
├── Leaderboard
├── Knockout
├── Teachings
├── Login (for auth)
└── Register (for new users)
```

---

## Data Models

### Organization
```dart
{
  'id': String,
  'name': String,
  'description': String,
  'city': String,
  'country': String,
  'primaryColor': String (hex),
  'logo': String (url),
  'rating': double,
  '_count': {
    'members': int,
    'courts': int,
    'events': int,
  }
}
```

### Staff
```dart
{
  'id': String,
  'userId': String,
  'role': String,
  'expertise': String,
  'contact': String,
  'user': {
    'id': String,
    'firstName': String,
    'lastName': String,
    'email': String,
    'phone': String,
  }
}
```

### Inventory Item
```dart
{
  'id': String,
  'name': String,
  'count': int,
  'condition': String, // Good/Fair/Poor
}
```

### Referee
```dart
{
  'id': String,
  'firstName': String,
  'lastName': String,
  'photo': String (url),
  'nationality': String,
  'matchesRefereed': int,
  'ballCrewMatches': int,
  'experience': String,
  'certifications': List<String>,
}
```

---

## API Service Methods

### Organization Methods
```dart
// Fetch all organizations
Future<List<dynamic>> fetchOrganizations()

// Get single organization details
Future<Map<String, dynamic>> getOrganization(String id)

// Get staff for organization
Future<List<dynamic>> fetchOrgStaff(String orgId)

// Get inventory for organization  
Future<List<dynamic>> fetchOrgInventory(String orgId)

// Get players for organization
Future<List<dynamic>> fetchOrgPlayers(String orgId)
```

### Referee Methods
```dart
// Fetch all referees
Future<List<dynamic>> fetchReferees()

// Get single referee
Future<Map<String, dynamic>> getReferee(String id)
```

### Existing Methods
```dart
// General
Map<String, String> _headers()
Future<Map<String, dynamic>> post(String path, Map<String, dynamic> body)

// Coaches
Future<List<dynamic>> fetchCoaches()

// Players
Future<List<dynamic>> fetchPlayers({String? query})

// Matches
Future<List<dynamic>> fetchMatches()
Future<Map<String, dynamic>> getMatch(String id)
```

---

## Color & Styling Guide

### Gradient Headers
- Default: `Colors.blue.shade600` → `Colors.indigo.shade600`
- Dynamic: Uses organization's `primaryColor` field if available

### Card Styling
- Margin: `EdgeInsets.symmetric(horizontal: 8, vertical: 4)`
- Child: `ListTile` with title, subtitle, leading avatar
- Spacing: `SizedBox(height: 4-16)`

### Search Bars
- TextField with prefixIcon: `Icons.search`
- Label: "Search [feature name]"
- Case-insensitive filtering
- Real-time updates on text change

### Buttons
- Elevated buttons for primary actions
- Disabled state when loading
- Loading spinner during async operations

### Empty States
- Centered column with icon
- Descriptive text
- Helper text in gray

---

## State Management

All pages use:
- **StatefulWidget** for pages with dynamic content
- **FutureBuilder** for async API calls
- **Local setState()** for UI updates
- **Try-catch** for error handling
- **ScaffoldMessenger** for snackbar notifications

---

## Error Handling

All API calls wrap in try-catch:
```dart
try {
  final result = await api.methodCall();
  // Update UI
} catch (e) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text('Error: $e'))
  );
}
```

---

## Performance Considerations

- ✅ Lazy loading via FutureBuilder
- ✅ Search filters client-side (after fetch)
- ✅ Reusable components (cards, stat widgets)
- ✅ Proper widget lifecycle (dispose, mounted checks)
- ✅ No infinite loops or rebuild cycles
- ✅ Token management via SharedPreferences

---

## Browser Testing

To test in browser (if configured):
1. Run `flutter run -d chrome`
2. All network requests same as mobile
3. Same API endpoints required
4. SharedPreferences uses browser storage

---

## Deployment Checklist

- [ ] Replace all `https://your-tennistracker-domain.com` with real URL
- [ ] Test login flow end-to-end
- [ ] Verify all API endpoints are accessible
- [ ] Test with real organization data
- [ ] Verify image URLs work
- [ ] Test search/filter functionality
- [ ] Check error states with network disconnected
- [ ] Verify token refresh logic
- [ ] Test rapid navigation (no crashes)
- [ ] Verify back button behavior
- [ ] Test with slow network (loading states visible)

