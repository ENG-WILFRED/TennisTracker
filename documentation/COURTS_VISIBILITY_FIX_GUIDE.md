# 🔧 Fix Recommendations & Code References

## Problem Summary
Players see different courts depending on the context:
- **Dashboard BookingView**: ONLY their primary organization's courts (filtered)
- **Public Courts Page**: ALL courts from ALL organizations (unfiltered)
- **Organizations**: Always ONLY their courts (correctly filtered)

---

## 📍 Code References

### Issue Location 1: Player BookingView
**File:** [src/components/booking/BookingView.tsx](src/components/booking/BookingView.tsx#L225)

```typescript
// Line 225: Calls getAvailableCourts which filters by FIRST org
const courtsData = await getAvailableCourts(userIdFromURL);
```

**Limitation:** Only shows courts from player's first ClubMember record
- If player is in Org_A and Org_B, only Org_A courts shown
- No way to switch organizations in BookingView

---

### Issue Location 2: getAvailableCourts() Server Action
**File:** [src/actions/bookings.ts](src/actions/bookings.ts#L8-44)

```typescript
// Line 18: Takes FIRST membership
const clubMember = await prisma.clubMember.findFirst({
  where: { playerId },
  include: { organization: true }
});

// Line 24: Filters to that organization only
const courts = await prisma.court.findMany({
  where: {
    organizationId: clubMember.organizationId,  // ← FIRST ORG ONLY
    status: { in: ["available", "booked"] }
  }
});
```

**Problem:** `findFirst()` takes whichever membership Prisma returns first (no guaranteed order)

---

### Issue Location 3: Public Courts Search API
**File:** [src/app/api/courts/search/route.ts](src/app/api/courts/search/route.ts#L1-60)

```typescript
// Line 8: No player context in API
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Line 23: Optional orgId filter, but player context is MISSING
  if (orgId) {
    where.organizationId = orgId;
  }
  
  // Result: Returns ALL courts matching filters (no player filtering)
}
```

**Problem:** No way to pass player context to API; it doesn't know who's asking

---

### Issue Location 4: Player Public Courts Page
**File:** [src/app/courts/page.tsx](src/app/courts/page.tsx#L66-78)

```typescript
// Line 66-78: Builds search params WITHOUT player organization
const params = new URLSearchParams();
if (filters.surface) params.append('surface', filters.surface);
if (filters.indoorOutdoor) params.append('indoorOutdoor', filters.indoorOutdoor);
if (filters.city) params.append('city', filters.city);
if (filters.hasLights) params.append('hasLights', filters.hasLights);
// ← NO playerId OR organizationId ADDED HERE

const response = await fetch(`/api/courts/search?${params.toString()}`);
```

**Problem:** Doesn't pass player context to server; server returns all courts

---

## 🛠️ Fix Options

### Option A: Add Player Organization Filter to Public Courts API (RECOMMENDED)

**Changes Required:**

1. **Update API to accept playerId parameter**
   ```typescript
   // FILE: src/app/api/courts/search/route.ts
   
   const searchParams = request.nextUrl.searchParams;
   const playerId = searchParams.get('playerId');  // ← ADD THIS
   
   // Get player's organizations
   let playerOrganizationIds: string[] = [];
   if (playerId) {
     const clubMembers = await prisma.clubMember.findMany({
       where: { playerId },
       select: { organizationId: true }
     });
     playerOrganizationIds = clubMembers.map(cm => cm.organizationId);
   }
   
   // Add to where clause
   if (playerOrganizationIds.length > 0) {
     where.organizationId = { in: playerOrganizationIds };  // ← FILTER TO PLAYER'S ORGS
   }
   ```

2. **Update CourtsPage to pass playerId**
   ```typescript
   // FILE: src/app/courts/page.tsx
   
   const params = new URLSearchParams();
   if (filters.surface) params.append('surface', filters.surface);
   if (filters.indoorOutdoor) params.append('indoorOutdoor', filters.indoorOutdoor);
   if (filters.city) params.append('city', filters.city);
   if (filters.hasLights) params.append('hasLights', filters.hasLights);
   if (authUser?.id) params.append('playerId', authUser.id);  // ← ADD THIS
   
   const response = await fetch(`/api/courts/search?${params.toString()}`);
   ```

**Pros:**
- ✅ Consistent filtering for players across all pages
- ✅ Minimal changes to existing code
- ✅ Public page only shows courts player can actually book

**Cons:**
- ❌ Players can't browse courts from other organizations
- ❌ Breaks cross-organization court discovery

---

### Option B: Add Organization Selector to BookingView (RECOMMENDED FOR UX)

**Show all player's organizations and let them choose:**

1. **Update getAvailableCourts to return multi-org option**
   ```typescript
   // FILE: src/actions/bookings.ts
   
   export async function getAvailableCourtsWithOrganizations(playerId: string) {
     const clubMembers = await prisma.clubMember.findMany({
       where: { playerId },
       include: { organization: true }
     });
     
     if (clubMembers.length === 0) {
       throw new Error("Player is not a member of any club");
     }
     
     const courtsPerOrg = await Promise.all(
       clubMembers.map(async (cm) => ({
         organizationId: cm.organizationId,
         organizationName: cm.organization.name,
         courts: await prisma.court.findMany({
           where: {
             organizationId: cm.organizationId,
             status: { in: ["available", "booked"] }
           }
         })
       }))
     );
     
     return courtsPerOrg;
   }
   ```

2. **Add org selector to BookingView**
   ```typescript
   // FILE: src/components/booking/BookingView.tsx
   
   const [organizationOptions, setOrganizationOptions] = useState<any[]>([]);
   const [selectedOrgId, setSelectedOrgId] = useState<string>('');
   
   // Filter courts based on selected org
   const filteredCourts = courts.filter(c => c.organizationId === selectedOrgId);
   
   // Render org selector
   <select onChange={(e) => setSelectedOrgId(e.target.value)}>
     {organizationOptions.map(org => (
       <option key={org.organizationId} value={org.organizationId}>
         {org.organizationName}
       </option>
     ))}
   </select>
   ```

**Pros:**
- ✅ Players can see all their organization's courts
- ✅ Better UX: explicit organization choice
- ✅ No privacy concerns

**Cons:**
- ⚠️ More development work
- ⚠️ Requires UI changes

---

### Option C: Show All Courts + Indicate Membership (DISCOVERY APPROACH)

**Keep public page showing all courts, but add visual indicators:**

```typescript
// Modify courts to include membership status
const courts = await prisma.court.findMany({
  where: { /* filters */ },
  include: {
    organization: { /* select fields */ }
  }
});

// In response, add player org context
const playerOrgIds = playerId 
  ? (await prisma.clubMember.findMany({ where: { playerId } }))
      .map(cm => cm.organizationId)
  : [];

const courtsWithMembership = courts.map(court => ({
  ...court,
  isMembershipOrg: playerOrgIds.includes(court.organizationId),
  membershipStatus: playerOrgIds.includes(court.organizationId) 
    ? 'member_org' 
    : 'other_org'
}));
```

**UI Example:**
```
Court Name: Central Tennis
Organization: Tennis Club A [✅ Your Organization]  ← Visual indicator
Surface: Clay
Lights: Yes

vs.

Court Name: Valley Tennis
Organization: Park Sports [🔒 Other Organization]  ← Different indicator
Surface: Hard
Lights: No
```

**Pros:**
- ✅ Players can discover courts from other orgs
- ✅ Minimal backend changes
- ✅ Shows where player can book

**Cons:**
- ⚠️ Players in other orgs not members of can't book
- ⚠️ UI clutter

---

## 🎯 Recommended Fix Path

### Priority 1: Fix BookingView (Most Important)
**What:** Add organization selector to BookingView
**Why:** Players should easily switch between their organizations
**Impact:** Fixes inconsistent court display in primary context

**Steps:**
1. Add `getAvailableCourtsWithOrganizations()` to [src/actions/bookings.ts](src/actions/bookings.ts)
2. Update [src/components/booking/BookingView.tsx](src/components/booking/BookingView.tsx) to show org selector
3. Filter courts based on selected org

**Effort:** Medium (2-3 hours)

---

### Priority 2: Document Filtering Logic
**What:** Add comments explaining organization filtering throughout codebase
**Why:** Prevents future bugs from misunderstanding context

**Files to update:**
- [src/app/api/courts/search/route.ts](src/app/api/courts/search/route.ts)
- [src/actions/bookings.ts](src/actions/bookings.ts)
- [src/components/booking/BookingView.tsx](src/components/booking/BookingView.tsx)

**Effort:** Low (30 mins)

---

### Priority 3 (Optional): Align Public Page
**What:** Either filter public page to player's orgs OR add membership indicators
**Why:** Consistency across application

**Choose either:**
- Option A: Filter to player's orgs only
- Option C: Add membership indicators

**Effort:** Medium (2-4 hours depending on choice)

---

## 📋 Testing Checklist

After implementing fix:

- [ ] Create test player in 2 organizations
- [ ] **BookingView Test:**
  - [ ] Dashboard displays courses from org 1
  - [ ] Can switch to org 2 (if Option B implemented)
  - [ ] Can book court from org 2
- [ ] **Public Courts Test:**
  - [ ] If Option A: Only sees own org courts
  - [ ] If Option C: Sees all courts with membership status
- [ ] **Organization Manager Test:**
  - [ ] Still sees only own courts
  - [ ] No regression
- [ ] **Single-org Player Test:**
  - [ ] No UI changes required
  - [ ] Still works normally

---

## 🚀 Quick Implementation (Option B - Recommended)

```typescript
// 1. Update bookings.ts
export async function getPlayerOrganizations(playerId: string) {
  return await prisma.clubMember.findMany({
    where: { playerId },
    include: {
      organization: {
        select: { id: true, name: true }
      }
    }
  });
}

// 2. Update BookingView.tsx
useEffect(() => {
  const loadData = async () => {
    if (!userIdFromURL) return;
    try {
      // Get orgs
      const membership = await getPlayerOrganizations(userIdFromURL);
      if (membership.length > 0) {
        setAvailableOrgs(membership);
        setSelectedOrgId(membership[0].organizationId);
      }
      // Get courts for first org
      const courtsData = await getAvailableCourts(userIdFromURL);
      setCourts(courtsData);
    } catch (error: any) {
      if (error.message?.includes('not a member')) setHasClubMembership(false);
    }
  };
  loadData();
}, [userIdFromURL]);

// 3. Render org selector in UI
<select value={selectedOrgId} onChange={(e) => setSelectedOrgId(e.target.value)}>
  {availableOrgs.map(org => (
    <option key={org.organizationId} value={org.organizationId}>
      {org.organization.name}
    </option>
  ))}
</select>
```

