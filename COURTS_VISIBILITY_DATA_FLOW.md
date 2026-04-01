# 🎾 Courts Visibility: Data Flow Comparison

## Side-by-Side Data Fetching

### 👥 ORGANIZATION VIEW
```
Organization Manager logs in → Dashboard
                              ↓
                     OrganizationCourtsSection
                              ↓
                  /api/organization/[orgId]/courts
                              ↓
    prisma.court.findMany({
      where: { organizationId: orgId }  ← FILTERED BY ORG ID
    })
                              ↓
            Returns ONLY courts for that organization
            Example: org="Tennis_Club_A" → 5 courts
```

---

### 🎾 PLAYER VIEW - BOOKING DASHBOARD
```
Player logs in → PlayerDashboard
                   ↓
            Gets organizationId from DB
                   ↓
             BookingView component
                   ↓
         getAvailableCourts(playerId)
                   ↓
    clubMember = findFirst({
      where: { playerId }  ← FINDS FIRST MEMBERSHIP
    })
                   ↓
    courts = findMany({
      where: {
        organizationId: clubMember.organizationId  ← PLAYER'S PRIMARY ORG
        status: { in: ["available", "booked"] }
      }
    })
                   ↓
        Returns courts from player's PRIMARY org only
        Example: player="Alice", org="Tennis_Club_A" → 5 courts
```

---

### 🏟️ PLAYER VIEW - PUBLIC COURTS PAGE
```
Player visits /courts page
           ↓
      CourtsPage component
           ↓
   Builds URL: /api/courts/search?surface=Clay&city=NYC
           ↓
prisma.court.findMany({
  where: {
    surface: { in: ['Clay'] }        ← ONLY THESE FILTERS
    organization: {                   ← NO PLAYER ORG FILTER!
      city: { contains: 'NYC' }
    }
    status: { in: ['available', 'booked'] }
  }
})
           ↓
    Returns ALL courts matching filters from ALL orgs
    Example: filters applied → 12 courts from 3 organizations
```

---

## 🔍 The Core Issue Visualized

```
                    DATABASE (All Courts)
                (18 courts across 3 organizations)
                     /      |       \
                   /        |         \
                 /          |           \
    Tennis_Club_A      Tennis_Club_B   Tennis_Club_C
    (5 courts)         (5 courts)       (8 courts)


ALICE (Player) is member of Tennis_Club_A and Tennis_Club_B

┌─────────────────────────────────────────────────────────────┐
│                      WHAT ALICE SEES                   │
├─────────────────────────────────────────────────────────────┤
│                                                         │
│  Dashboard Booking View              Public Courts Page │
│  ├─ getAvailableCourts()            ├─ /api/courts/search
│  └─ WHERE orgId = A (FIRST)         └─ WHERE no player filter
│                                                         │
│  👁️  5 courts from Club_A           👁️  18 courts (ALL)
│  ❌ 5 courts from Club_B hidden    ✅ Includes Club_B
│  ❌ 8 courts from Club_C hidden    ✅ Includes Club_C
│                                                         │
└─────────────────────────────────────────────────────────────┘


ORGANIZATION (Tennis_Club_A_Manager)

┌─────────────────────────────────────────────────────────────┐
│            WHAT ORGANIZATION MANAGER SEES            │
├─────────────────────────────────────────────────────────────┤
│                                                         │
│  Organization Dashboard                               │
│  ├─ /api/organization/[orgId]/courts                 │
│  └─ WHERE organizationId = A                         │
│                                                         │
│  👁️  5 courts from Club_A           ✅ Only their courts
│  ❌ 5 courts from Club_B not shown                   │
│  ❌ 8 courts from Club_C not shown                   │
│                                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Query Comparison Table

| Aspect | Organization API | Player Booking | Player Public Page |
|--------|------------------|---------------|--------------------|
| **Endpoint** | `/api/organization/[id]/courts` | `getAvailableCourts()` | `/api/courts/search` |
| **Filter Logic** | WHERE organizationId = ? | WHERE organizationId = clubMember.orgId | WHERE surface/city/lights filters |
| **Player Org Filter** | N/A (org context) | ✅ YES (player's primary org) | ❌ NO |
| **Multi-org Support** | N/A (org view) | ❌ NO (takes first only) | ✅ YES (all orgs) |
| **Courts Returned** | Only that org's courts | Only player's primary org courts | All matching courts from all orgs |
| **Results Example** | 5 courts | 5 courts | 18 courts |
| **Consistency** | ✅ Always same | ⚠️ Depends on primary org | ✅ Always same |

---

## 🎯 Where the Filtering Happens

### Organization → Always Filtered ✅
```javascript
// src/app/api/organization/[orgId]/courts/route.ts
const courts = await prisma.court.findMany({
  where: { organizationId: orgId }  ← Always filters here
});
```

### Player Booking → Always Filtered ✅
```javascript
// src/actions/bookings.ts
const clubMember = await prisma.clubMember.findFirst({
  where: { playerId }  ← Finds membership
});
const courts = await prisma.court.findMany({
  where: { organizationId: clubMember.organizationId }  ← Filters to that org
});
```

### Player Public Page → NO PLAYER FILTER ❌
```javascript
// src/app/api/courts/search/route.ts
const courts = await prisma.court.findMany({
  where: {
    status: { in: [status, 'booked'] }
    // Only status filtered, NO player org context
  }
});
```

---

## 🔴 Why This Creates a Discrepancy

**The Problem Scenario:**

1. Alice is a member of both Tennis_Club_A AND Tennis_Club_B
2. Alice opens her dashboard → BookingView loads
   - Finds Alice's FIRST membership (Tennis_Club_A)
   - Shows only Tennis_Club_A's 5 courts
3. Alice browses public courts page
   - No player filtering applied
   - Sees all 18 courts from all 3 organizations
4. Alice is confused: "Why do I see different courts in two places?"

**Why Organizations Don't Have This Problem:**

- Organizations never use `getAvailableCourts()` (that's player-specific)
- Organizations use `/api/organization/[id]/courts` which explicitly knows the org context
- The org context is ALWAYS in the URL: `/organization/[id]/...`
- So they always see consistent results

---

## 🧪 Test This Yourself

### Step 1: Create test data
- Player: Alice (member of 2 orgs)
- Org_A: 5 courts
- Org_B: 5 courts

### Step 2: Test different views
```
A) Dashboard Booking: /dashboard/player/alice-id?booking=true
   Expected: 5 courts shown (Org_A only)

B) Public Courts: /courts
   Expected: 10 courts shown (Org_A + Org_B)

C) Organization View: /organization/org-a-id
   Expected: 5 courts shown (Org_A only)
```

### Step 3: Observe the discrepancy
- Alice sees different court counts in BookingView vs PublicPage
- Organization manager always sees consistent count

---

## 💡 The Root Cause

The **two different APIs serve different purposes**:

1. **Organization API** = "What courts does THIS organization own?"
   - Context: Organization is known (in URL)
   - Filter: WHERE organizationId = known_org
   - Result: Consistent, predictable

2. **Player Booking API** = "What courts can THIS player book?"
   - Context: Player is known
   - Filter: WHERE organizationId = player's_first_membership.organizationId
   - Result: Limited to primary org

3. **Public Search API** = "Show me all courts matching these criteria"
   - Context: No user/org context needed
   - Filter: WHERE surface/city/lights (user parameters)
   - NO player context
   - Result: All org courts

**Missing Link:** Public API doesn't know WHO is asking (no player context), so it can't filter by player's organization(s).

