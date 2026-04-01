# 🎾 Courts Visibility Analysis: Players vs Organizations

## Executive Summary
Players and organizations see different courts due to **different data fetching layers and filtering logic**. Here's what's happening:

---

## 1. COURT MODEL (Prisma Schema)

**Location:** `prisma/schema.prisma` (line 491-512)

```prisma
model Court {
  id                String            @id @default(uuid())
  organizationId    String
  name              String
  courtNumber       Int
  surface           String
  indoorOutdoor     String            @default("outdoor")
  lights            Boolean           @default(false)
  status            String            @default("available")
  maintenedUntil    DateTime?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  organization      Organization      @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  bookings          CourtBooking[]
  comments          CourtComment[]
  complaints        CourtComplaint[]
  tournamentMatches TournamentMatch[]

  @@unique([organizationId, courtNumber])
  @@index([organizationId])
  @@index([status])
}
```

**Key Point:** Each court belongs to exactly ONE organization via `organizationId`.

---

## 2. HOW ORGANIZATIONS VIEW COURTS

### Organization Dashboard Component
**File:** `src/components/organization/dashboard-sections/OrganizationCourtsSection.tsx` (line 43-60)

```typescript
async function fetchCourts() {
  if (!orgId) {
    setError('Organization ID is missing');
    setLoading(false);
    return;
  }
  try {
    setLoading(true);
    const res = await authenticatedFetch(`/api/organization/${orgId}/courts`);
    if (!res.ok) throw new Error('Failed to fetch courts');
    const data = await res.json();
    setCourts(data.courts || []);
    setError(null);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Error loading courts');
  } finally {
    setLoading(false);
  }
}
```

### Organization API Endpoint
**File:** `src/app/api/organization/[orgId]/courts/route.ts` (line 8-28)

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    if (!verifyApiAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await params;

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const courts = await prisma.court.findMany({
      where: { organizationId: orgId },  // ← FILTERS BY ORGANIZATION ID
      orderBy: { courtNumber: 'asc' },
    });

    return NextResponse.json({ courts });
  } catch (error) {
    console.error('GET /api/organization/[orgId]/courts error:', error);
    return NextResponse.json({ error: 'Failed to fetch courts' }, { status: 500 });
  }
}
```

**Result:** ✅ Organizations see ONLY their own courts

---

## 3. HOW PLAYERS VIEW COURTS

### Player Dashboard → BookingView
**File:** `src/components/dashboards/PlayerDashboard.tsx` (line 62-68)

```typescript
const res = await fetch(`/api/dashboard?playerId=${user.id}`);
const data = await res.json();
setPlayerData(data);

// Try to get organization ID (first club membership)
const orgRes = await fetch(`/api/player/organization?playerId=${user.id}`);
const orgData = await orgRes.json();
if (orgData.organizationId) {
  setOrganizationId(orgData.organizationId);
}
```

### BookingView Component
**File:** `src/components/booking/BookingView.tsx` (line 186-225)

```typescript
export function BookingView({ onClose, isEmbedded = false, canBook = true, organizationId }: BookingViewProps) {
  const { user: authUser } = useAuth();
  const [courts, setCourts] = useState<any[]>([]);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  // ...
  
  useEffect(() => {
    const loadData = async () => {
      if (!userIdFromURL) return;
      try {
        const courtsData = await getAvailableCourts(userIdFromURL);  // ← FILTERS BY PLAYER'S ORG
        setCourts(courtsData);
        if (organizationId) {
          const bookingsData = await getPlayerBookings(userIdFromURL, organizationId);
          setExistingBookings(bookingsData);
        }
        if (courtsData.length > 0) setSelectedCourt(courtsData[0].id);
      } catch (error: any) {
        if (error.message?.includes('not a member')) setHasClubMembership(false);
        else showToast('error', error.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userIdFromURL, organizationId]);
}
```

### getAvailableCourts() Server Action
**File:** `src/actions/bookings.ts` (line 8-44)

```typescript
export async function getAvailableCourts(playerId: string) {
  try {
    // ← FINDS PLAYER'S CLUB MEMBERSHIP
    const clubMember = await prisma.clubMember.findFirst({
      where: { playerId },
      include: {
        organization: true,
      },
    });

    if (!clubMember) {
      throw new Error("Player is not a member of any club");
    }

    // ← GETS COURTS ONLY FOR THAT ORGANIZATION
    const courts = await prisma.court.findMany({
      where: {
        organizationId: clubMember.organizationId,  // ← FILTERS BY PLAYER'S ORG
        status: { in: ["available", "booked"] },
      },
      select: {
        id: true,
        name: true,
        courtNumber: true,
        surface: true,
        indoorOutdoor: true,
        lights: true,
      },
    });

    return courts;
  } catch (error: any) {
    throw new Error(`Failed to fetch courts: ${error.message}`);
  }
}
```

**Result:** ✅ Players see ONLY their own organization's courts (via BookingView)

---

## 4. PUBLIC COURTS PAGE (DIFFERENT BEHAVIOR)

### Player Public Courts Page
**File:** `src/app/courts/page.tsx` (line 1-80)

```typescript
export default function CourtsPage() {
  const [courts, setCourts] = useState<Court[]>([]);
  // ...
  
  const [filters, setFilters] = useState({
    surface: searchParams.get('surface') || '',
    indoorOutdoor: searchParams.get('indoorOutdoor') || '',
    city: searchParams.get('city') || '',
    hasLights: searchParams.get('hasLights') || '',
  });

  useEffect(() => {
    const loadCourts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filters.surface) params.append('surface', filters.surface);
        if (filters.indoorOutdoor) params.append('indoorOutdoor', filters.indoorOutdoor);
        if (filters.city) params.append('city', filters.city);
        if (filters.hasLights) params.append('hasLights', filters.hasLights);

        const response = await fetch(`/api/courts/search?${params.toString()}`);  // ← NO PLAYER ORG FILTER!
        if (!response.ok) throw new Error('Failed to load courts');
        
        const data = await response.json();
        setCourts(data.courts);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCourts();
  }, [filters]);
}
```

### Public Courts Search API
**File:** `src/app/api/courts/search/route.ts` (line 1-60)

```typescript
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const surface = searchParams.get('surface');
    const indoorOutdoor = searchParams.get('indoorOutdoor');
    const orgId = searchParams.get('orgId');  // ← CAN FILTER BY ORG IF PROVIDED
    const city = searchParams.get('city');
    const hasLights = searchParams.get('hasLights');
    const status = searchParams.get('status') || 'available';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const where: any = {
      status: { in: [status, 'booked'] },
    };

    // Filters applied
    if (surface) {
      where.surface = { in: surface.split(',').map((s) => s.trim()) };
    }

    if (indoorOutdoor) {
      where.indoorOutdoor = { in: indoorOutdoor.split(',').map((s) => s.trim()) };
    }

    // ← IF orgId QUERY PARAM PROVIDED, FILTER BY IT
    if (orgId) {
      where.organizationId = orgId;
    }

    if (hasLights !== null) {
      where.lights = hasLights === 'true';
    }

    if (city) {
      where.organization = {
        city: {
          contains: city,
          mode: 'insensitive',
        },
      };
    }

    const total = await prisma.court.count({ where });

    const courts = await prisma.court.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            country: true,
            address: true,
            phone: true,
            email: true,
            logo: true,
            rating: true,
            ratingCount: true,
            primaryColor: true,
          },
        },
        // ... bookings and other includes
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { organization: { rating: 'desc' } },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({
      courts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Court search error:', error);
    return NextResponse.json(
      { error: `Failed to search courts: ${error.message}` },
      { status: 500 }
    );
  }
}
```

**Result:** ⚠️ Players see ALL courts from ALL organizations (searches across all orgs)

---

## 5. CLUB MEMBER RELATIONSHIP MODEL

**File:** `prisma/schema.prisma` (line 604-644)

```prisma
model ClubMember {
  id                     String               @id @default(uuid())
  organizationId         String
  playerId               String
  tierId                 String?
  joinDate               DateTime             @default(now())
  expiryDate             DateTime?
  autoRenew              Boolean              @default(true)
  paymentStatus          String               @default("active")
  outstandingBalance     Float                @default(0)
  attendanceCount        Int                  @default(0)
  lastAttendance         DateTime?
  role                   String               @default("member")
  suspensionReason       String?
  suspendedUntil         DateTime?
  createdAt              DateTime             @default(now())
  updatedAt              DateTime             @updatedAt
  organization           Organization         @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  player                 Player               @relation(fields: [playerId], references: [userId], onDelete: Cascade)
  membershipTier         MembershipTier?      @relation("membershipTier", fields: [tierId], references: [id])
  bookings               CourtBooking[]

  @@unique([organizationId, playerId])
  @@index([organizationId])
  @@index([playerId])
  @@index([createdAt])
  @@index([paymentStatus])
  @@index([organizationId, paymentStatus])
}
```

**Key Point:** Players can be members of multiple organizations (via ClubMember), but `getAvailableCourts()` only returns courts from the FIRST membership found.

---

## 6. THE VISIBILITY DISCREPANCY

### Scenario: Player "Alice" is in Organization "Tennis Club A" and "Tennis Club B"

| Context | URL/Component | Data Source | Courts Shown | Notes |
|---------|---------------|------------|--------------|-------|
| Dashboard Booking | `/dashboard/player/[id]?booking=true` | `getAvailableCourts()` | Only "Tennis Club A" courts | Uses FIRST membership found |
| Public Courts Page | `/courts` | `/api/courts/search` (no orgId filter) | ALL courts from A, B, and any other org | No player org filtering |
| Organization Dashboard | `/organization/[id]` | `/api/organization/[id]/courts` | Only that specific org's courts | Correctly filtered |

### Why the Difference?

1. **Players in BookingView**: Explicitly filtered to their primary organization
2. **Players on Public Courts Page**: NO player-specific filtering - sees all courts
3. **Organizations**: Always see only their own courts

---

## 7. CLIENT-SIDE RELATIONSHIPS

**Player Model** includes:
- `organizationId?: string` (nullable - direct link)
- `clubMembers: ClubMember[]` (can be in multiple orgs)

A player can be in multiple organizations through `ClubMember`, but:
- Player dashboard booking uses `getAvailableCourts()` which takes the FIRST club membership
- Public courts page shows all organizations' courts

---

## 🔴 ROOT CAUSES OF VISIBILITY DIFFERENCES

### For Players:
1. ✅ **BookingView (Dashboard)** → Filtered to player's PRIMARY organization
2. ⚠️ **Public Courts Page** → NO player organization filtering (shows all org courts)

### For Organizations:
1. ✅ **Organization Dashboard** → Correctly filtered to their courts only

### The Issue:
- **Same player, different views** = different courts shown
- Player might see their org's courts in BookingView but ALL courts on public page
- Organizations always see only their courts (consistent)

---

## 📋 Filtering Logic Summary

```
ORGANIZATION:
  Dashboard/Courts → /api/organization/[orgId]/courts
  Filter: WHERE organizationId = orgId
  Result: ✅ Only their courts

PLAYER:
  BookingView → getAvailableCourts(playerId)
    Step 1: Find clubMember WHERE playerId (takes FIRST)
    Step 2: Find courts WHERE organizationId = clubMember.organizationId
    Result: ✅ Only their primary org courts
  
  Public Page → /api/courts/search
    Filter: WHERE [surface/city/orgId filters if provided]
    NO PLAYER ORG FILTER
    Result: ⚠️ ALL organizations' courts
```

---

## 🔧 Recommendations to Align Visibility

1. **Option A: Filter public courts to player's org(s)**
   - Modify `/api/courts/search` to accept `playerId` parameter
   - Filter to only courts from organizations where player is a member

2. **Option B: Show all orgs but indicate membership**
   - Keep public page showing all courts
   - Add visual indicator: "Your Organization" vs "Available at Other Orgs"
   - Allow cross-org booking if permitted

3. **Option C: Add multi-org support to BookingView**
   - Modify `getAvailableCourts()` to return courts from ALL player's memberships
   - Let player select which org to view/book from

