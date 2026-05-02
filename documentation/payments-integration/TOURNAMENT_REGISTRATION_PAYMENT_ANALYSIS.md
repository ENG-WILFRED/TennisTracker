# Tournament Registration & Payment System Analysis

**Last Updated:** March 25, 2026

---

## 1. TOURNAMENT REGISTRATION FLOW

### 1.1 How Players Register/Apply

**Registration Entry Points:**
- [TournamentDetailView.tsx](src/app/tournaments/[id]/components/TournamentDetailView.tsx) - Player-facing tournament view with apply button
- [CheckoutModal.tsx](src/app/tournaments/[id]/components/CheckoutModal.tsx) - Modal for initiating registration with payment

**Registration Process:**

1. **Player Clicks "Register" Button**
   - Triggered in tournament detail page when viewing a public tournament
   - Opens CheckoutModal which presents payment options

2. **Payment Method Selection**
   - **Mobile Money (M-Pesa)**: Sends STK push to phone
   - **PayPal**: Redirects to PayPal checkout
   - **Stripe/Card**: Redirects to Stripe checkout
   - **Free Tournaments** (entryFee == 0): Direct registration without payment

3. **Application Submitted via `applyForTournament()`**
   - Location: [src/actions/tournaments.ts](src/actions/tournaments.ts#L523-L700)
   - Creates EventRegistration record in database
   - Status defaults to `'registered'` or `'waitlisted'` if at capacity

**Key Code:**
```typescript
// CheckoutModal handles payment initiation
const handlePay = async () => {
  // Payment method selected (mobile, bank/paypal, card/stripe)
  // After successful payment, EventRegistration is created
}

// applyForTournament creates the registration
const registration = await prisma.eventRegistration.create({
  data: {
    eventId: tournamentId,
    memberId: clubMember.id,
    status: 'registered',  // or 'waitlisted'
    signupOrder,
  },
});
```

---

## 2. PAYMENT TIMING

### 2.1 When Payment Occurs

**Payment Required: BEFORE Registration Confirmation**

The system has two payment flows:

#### **Flow A: Immediate Online Payment** (Most Common)
1. Player opens tournament → clicks "Register"
2. CheckoutModal appears with payment options
3. Player selects payment method
4. Payment is processed through external provider (M-Pesa/PayPal/Stripe)
5. Payment webhook received (POST `/api/webhooks/{mpesa|paypal|stripe}`)
6. EventRegistration created with status `'registered'`
7. Player sees confirmation

**Timeline:** Payment → PaymentRecord created → Webhook triggers → EventRegistration created

#### **Flow B: Free Tournaments** (No Payment)
1. Player opens tournament → clicks "Register"
2. CheckoutModal appears (shows $0 entry fee)
3. Player confirms registration
4. Direct EventRegistration creation (no payment needed)

### 2.2 Payment Record Tracking

**Database Table:** `PaymentRecord`
```prisma
model PaymentRecord {
  id                    String   @id @default(uuid())
  userId                String
  eventId               String?
  bookingType           String   // 'tournament_entry', 'amenity_booking'
  amount                Float
  currency              String   // 'USD', 'KES'
  provider              String   // 'mpesa', 'paypal', 'stripe'
  providerStatus        String   // 'pending', 'success', 'failed'
  providerTransactionId String?
  checkoutUrl           String?
  metadata              String?  // JSON with additional info
  createdAt             DateTime
  updatedAt             DateTime
}
```

**Status Lifecycle:**
1. `'pending'` - Initial payment record created
2. `'success'` - Webhook confirmed payment success
3. `'failed'` - Webhook reported failure

**After Success:**
- EventRegistration created with status `'registered'`
- OrganizationActivity tracked for analytics
- Payment amounts tallied in organization finances

---

## 3. REGISTRATION STATUS TRACKING

### 3.1 Registration Status Values

**Database Table:** `EventRegistration`
```prisma
model EventRegistration {
  id           String     @id @default(uuid())
  eventId      String
  memberId     String
  registeredAt DateTime   @default(now())
  status       String     @default("registered")  // Main status field
  signupOrder  Int
  event        ClubEvent  @relation(...)
  member       ClubMember @relation(...)
}
```

**Possible Status Values:**
1. `'registered'` - Confirmed player in tournament
2. `'confirmed'` - Seeded/confirmed status (legacy/used interchangeably with 'registered')
3. `'pending'` - Awaiting organizer approval ⚠️ **Currently NOT used in apply flow**
4. `'approved'` - Organizer approved the registration
5. `'rejected'` - Organizer rejected the registration
6. `'waitlisted'` - Tournament at capacity (EventWaitlist table used instead)

### 3.2 Status Flow Issues

⚠️ **Current Implementation Inconsistency:**
- When player applies via CheckoutModal → status = `'registered'` (immediately approved)
- Registration API allows approval/rejection → status = `'approved'` or `'rejected'`
- **No pending approval workflow for player applications**

**What exists:** Organization can approve/reject registrations:
```typescript
// PATCH /api/tournaments/[id]/registrations/[registrationId]
const newStatus = action === 'approve' ? 'approved' : 'rejected';
await prisma.eventRegistration.update({
  where: { id: registrationId },
  data: { status: newStatus },
});
```

**Current behavior:** Players bypass this - they go straight to `'registered'` status.

### 3.3 Waitlist Management

When tournament reaches capacity (`registrationCap` limit):
```typescript
if (registrationCount >= tournament.registrationCap) {
  // Add to EventWaitlist instead
  const waitlistEntry = await prisma.eventWaitlist.create({
    data: {
      eventId: tournamentId,
      memberId: clubMember.id,
      position: waitlistPosition + 1,
    },
  });
  return { status: 'waitlisted', position: waitlistEntry.position };
}
```

**Waitlist Table:**
```prisma
model EventWaitlist {
  id       String     @id @default(uuid())
  eventId  String
  memberId String
  position Int
  addedAt  DateTime   @default(now())
  event    ClubEvent  @relation(...)
  member   ClubMember @relation(...)

  @@unique([eventId, memberId])
}
```

---

## 4. ORGANIZATION DASHBOARD - PENDING APPLICATIONS

### 4.1 Dashboard Components

**Main Component:** [OrganizationTournamentsSection.tsx](src/components/organization/dashboard-sections/OrganizationTournamentsSection.tsx)

**Shows:**
- List of tournaments for organization
- Approved players count vs. registration cap
- Pending applications count (yellow badge)
- Prize pool
- Create new tournament form

**Key Display Code:**
```tsx
<div style={{ background: G.dark, borderRadius: 6, padding: '8px 10px' }}>
  <div style={{ fontSize: 10, color: G.muted, marginBottom: 2 }}>Pending</div>
  <div style={{ fontSize: 14, fontWeight: 700, color: G.yellow }}>
    {pendingPlayers.length}
  </div>
</div>
```

### 4.2 Tournament Management View

**Main Component:** [TournamentManagementView.tsx](src/app/organization/[id]/tournaments/[tournamentId]/components/TournamentManagementView.tsx)

**Key Features:**
- Overview tab - shows pending registrations count
- Registrations tab - detailed view with approve/reject buttons
- Header alerts - "⚡ N registration(s) awaiting review"

**Pending Registrations Section:**
```tsx
{pendingRegistrations.length > 0 && (
  <div className="g-card" style={{ borderColor: 'rgba(240,192,64,0.25)' }}>
    <div className="g-card-title" style={{ color: '#f0c040' }}>
      ⏰ Pending Approvals
      <span>{pendingRegistrations.length}</span>
    </div>
    {/* List pending registrations with approve/reject buttons */}
  </div>
)}
```

**Approved Registrations Section:**
```tsx
{/* Shows filled capacity with progress bar */}
<div style={{ marginBottom: 20 }}>
  <span>Capacity fill</span>
  <span>{fillRate}%</span>
  {/* Progress bar visualization */}
</div>

{/* List approved/registered players */}
{approvedRegistrations.map((reg) => (
  <div className="reg-row" key={reg.id}>
    {/* Player card with approval date */}
  </div>
))}
```

### 4.3 Fetching Pending Registrations

**From Tournament Management Page:**
```typescript
// /api/organization/[orgId]/tournaments/[tournamentId]
const pendingRegistrations = registrations.filter(r => r.status === 'pending');
const approvedRegistrations = registrations.filter(r => r.status === 'approved');
```

**Issue:** Currently, when players apply, they get status `'registered'`, not `'pending'`. So the dashboard shows pending count as `0` even with new registrations.

---

## 5. DATABASE SCHEMA FOR REGISTRATIONS & PAYMENTS

### 5.1 Core Models

#### **ClubEvent** (Tournament)
```prisma
model ClubEvent {
  id                   String              @id @default(uuid())
  organizationId       String
  name                 String
  description          String?
  eventType            String              // 'tournament', 'knockout', 'round_robin'
  startDate            DateTime
  endDate              DateTime?
  registrationDeadline DateTime
  registrationCap      Int                 @default(64)  // Max participants
  entryFee             Float?              // Required payment
  prizePool            Float?
  rules                String?
  instructions         String?
  status               (implicit)          // Derived from startDate/endDate
  createdAt            DateTime
  updatedAt            DateTime
  organization         Organization        @relation(...)
  registrations        EventRegistration[] // All registrations
  amenities            EventAmenity[]
  bracket              TournamentBracket?
  matches              TournamentMatch[]
  comments             TournamentComment[]
}
```

#### **EventRegistration** (Player Registration)
```prisma
model EventRegistration {
  id           String     @id @default(uuid())
  eventId      String     // Foreign key to ClubEvent
  memberId     String     // Foreign key to ClubMember
  registeredAt DateTime   @default(now())
  status       String     @default("registered")  // pending|approved|rejected|registered
  signupOrder  Int        // When they registered (1st, 2nd, etc.)
  event        ClubEvent  @relation(...)
  member       ClubMember @relation(...)

  @@unique([eventId, memberId])  // One player per tournament
}
```

#### **EventWaitlist** (Backup for Capacity)
```prisma
model EventWaitlist {
  id       String     @id @default(uuid())
  eventId  String
  memberId String
  position Int        // Waitlist position
  addedAt  DateTime   @default(now())
  event    ClubEvent  @relation(...)
  member   ClubMember @relation(...)

  @@unique([eventId, memberId])
}
```

#### **PaymentRecord** (Payment Tracking)
```prisma
model PaymentRecord {
  id                    String   @id @default(uuid())
  userId                String
  eventId               String?  // Tournament being paid for
  bookingType           String   // 'tournament_entry', 'amenity_booking'
  amount                Float
  currency              String   // 'USD', 'KES'
  provider              String   // 'mpesa', 'paypal', 'stripe'
  providerStatus        String   @default("pending")  // pending|success|failed
  providerTransactionId String?  // External transaction ID
  checkoutUrl           String?  // For redirects
  metadata              String?  // JSON with ephemeral data
  createdAt             DateTime
  updatedAt             DateTime
}
```

#### **ClubMember** (Org Membership)
```prisma
model ClubMember {
  id                 String               @id @default(uuid())
  organizationId     String
  playerId           String
  tierId             String?
  joinDate           DateTime             @default(now())
  expiryDate         DateTime?
  paymentStatus      String               @default("active")
  role               String               @default("member")
  createdAt          DateTime
  eventRegistrations EventRegistration[]  // Tournaments registered for
  waitlistItems      EventWaitlist[]
}
```

### 5.2 Related Supporting Models

#### **TournamentBracket** (Tournament Structure)
```prisma
model TournamentBracket {
  id          String            @id @default(uuid())
  organizationId String
  eventId     String            @unique
  bracketType String            // 'single_elimination', 'double_elimination', 'round_robin'
  totalRounds Int
  event       ClubEvent         @relation(...)
  matches     TournamentMatch[]
}
```

#### **TournamentMatch** (Match Records)
```prisma
model TournamentMatch {
  id                String            @id @default(uuid())
  organizationId    String
  eventId           String            // Tournament
  bracketId         String
  round             Int
  matchPosition     Int
  playerAId         String?           // ClubMember
  playerBId         String?           // ClubMember
  scoreSetA         String?           // "6-4"
  scoreSetB         String?
  scoreSetC         String?
  winnerId          String?           // Winner's ClubMember ID
  scheduledTime     DateTime?
  courtId           String?
  status            String            // 'pending', 'in_progress', 'completed'
  resultSubmittedAt DateTime?
  resultSubmittedBy String?
  createdAt         DateTime
  playerA           ClubMember?       @relation("matchPlayerA", ...)
  playerB           ClubMember?       @relation("matchPlayerB", ...)
  bracket           TournamentBracket @relation(...)
}
```

#### **EventAmenity** (Tournament Add-ons)
```prisma
model EventAmenity {
  id                 String     @id @default(uuid())
  eventId            String
  name               String     // "Accommodation", "Meals", etc.
  type               String     // 'eating', 'sleeping', 'transport'
  description        String?
  capacity           Int
  price              Float      // Cost for this amenity
  availableFrom      DateTime
  availableUntil     DateTime
  event              ClubEvent  @relation(...)
  bookings           AmenityBooking[]
}
```

---

## 6. API ENDPOINTS

### 6.1 Tournament Registration Endpoints

#### **POST `/api/payments/{mpesa|paypal|stripe}`**
**Purpose:** Initiate payment for tournament entry
**Called from:** CheckoutModal
**Location:** Individual payment provider routes in `src/app/api/payments/`

**Request:**
```json
{
  "userId": "user-id",
  "eventId": "tournament-id",
  "bookingType": "tournament_entry",
  "amount": 50,
  "currency": "USD",
  "mobileNumber": "254XXXXXXXXX",  // M-Pesa only
  "accountReference": "TOURNAMENT-Name-Timestamp",
  "transactionDesc": "Entry fee for Tournament Name"
}
```

**Response:**
```json
{
  "success": true,
  "checkoutUrl": "https://...",  // Stripe/PayPal
  "links": [{ "rel": "approve", "href": "..." }],  // PayPal
  "messageId": "...",  // M-Pesa
  "error": "..."  // On failure
}
```

#### **POST `/api/webhooks/{mpesa|paypal|stripe}`**
**Purpose:** Receive payment confirmation from provider
**Triggered by:** External payment provider
**Location:** `src/app/api/webhooks/{mpesa|paypal|stripe}/route.ts`

**Behavior:**
1. Verify payment success in provider status
2. Update PaymentRecord with success status
3. **If tournament_entry:** Create EventRegistration
4. Track activity for organization analytics
5. Redirect to success page

**Key Code:**
```typescript
if (paymentSuccess && payment.bookingType === 'tournament_entry' && payment.eventId) {
  const member = await prisma.clubMember.findFirst({...});
  const latestRegistration = await prisma.eventRegistration.findFirst({
    orderBy: { signupOrder: 'desc' }
  });
  const signupOrder = (latestRegistration?.signupOrder || 0) + 1;
  
  await prisma.eventRegistration.create({
    data: {
      eventId: payment.eventId,
      memberId: member.id,
      status: 'registered',  // Direct to registered status
      signupOrder,
    },
  });
}
```

#### **PATCH `/api/tournaments/[id]/registrations/[registrationId]`**
**Purpose:** Organization approves or rejects a registration
**Called from:** TournamentManagementView (Registrations tab)
**Location:** [src/app/api/tournaments/[id]/registrations/[registrationId]/route.ts](src/app/api/tournaments/[id]/registrations/[registrationId]/route.ts)

**Request:**
```json
{
  "action": "approve"  // or "reject"
}
```

**Response:**
```json
{
  "id": "registration-id",
  "eventId": "tournament-id",
  "memberId": "member-id",
  "status": "approved",  // or "rejected"
  "event": {...},
  "member": {...}
}
```

**Current Issue:** This API is defined but players never reach "pending" status, so approval flow is incomplete.

#### **GET `/api/tournaments/[id]`**
**Purpose:** Fetch tournament details with registrations
**Located at:** `src/app/api/tournaments/[id]/route.ts`

**Returns:**
```json
{
  "id": "...",
  "name": "...",
  "entryFee": 50,
  "registrationCap": 32,
  "registrations": [
    {
      "id": "...",
      "memberId": "...",
      "status": "registered",
      "registeredAt": "...",
      "member": {
        "id": "...",
        "player": {
          "user": {
            "firstName": "...",
            "email": "...",
            "photo": "..."
          }
        }
      }
    }
  ]
}
```

#### **GET `/api/organization/[orgId]/events?type=tournament`**
**Purpose:** Fetch all tournaments for organization
**Used by:** OrganizationTournamentsSection

**Returns:** Array of ClubEvent objects with registration counts

#### **POST `/api/organization/[orgId]/events`**
**Purpose:** Create new tournament
**Called from:** Organization dashboard tournament creation form

**Request:**
```json
{
  "name": "Spring Championship",
  "eventType": "single_elimination",
  "startDate": "2026-03-01",
  "endDate": "2026-03-15",
  "registrationDeadline": "2026-02-20",
  "registrationCap": 32,
  "entryFee": 50,
  "prizePool": 5000,
  "description": "..."
}
```

#### **POST `/api/organization/[orgId]/events/seed`**
**Purpose:** Seed sample tournaments for testing
**Also creates:** Sample registrations, brackets, matches

### 6.2 Server Action (Alternative to API)

#### **`applyForTournament(tournamentId, userId)`**
**Location:** [src/actions/tournaments.ts](src/actions/tournaments.ts#L523-L700)
**Used by:** Direct application (less common, mostly for internal flows)

**Returns:**
```typescript
{
  success: true,
  status: 'registered' | 'waitlisted',
  message: "...",
  registrationId?: string,
  position?: number  // waitlist position
}
```

**Logic:**
1. Create/get Player profile
2. Create/get ClubMember for player in organization
3. Check if already registered → throw error
4. Check capacity:
   - If at capacity → add to waitlist
   - If available → create registration
5. Track activity
6. Return result

---

## 7. TYPES & INTERFACES

### 7.1 Frontend Types

**Location:** [src/app/tournaments/[id]/components/types.ts](src/app/tournaments/[id]/components/types.ts)

```typescript
export type TournamentStatus = 'open' | 'upcoming' | 'completed' | 'cancelled';
export type ApplicationStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'paid' | 'withdrawn';

export interface Tournament {
  id: string;
  name: string;
  eventType: string;
  format: string;
  startDate: string;
  endDate?: string;
  registrationDeadline?: string;
  location: string;
  prizePool?: number;
  entryFee?: number;
  maxParticipants: number;
  currentParticipants: number;
  status: TournamentStatus;
  organizationId: string;
  applicationStatus: ApplicationStatus;  // Player's status
  paymentDue?: string;
  amenities?: EventAmenity[];
  // ... more fields
}

export interface Application {
  id: string;
  tournamentName: string;
  appliedDate: string;
  entryFee: number;
  status: ApplicationStatus;
}
```

### 7.2 Application Status Display

**Component:** [StatusStrip.tsx](src/app/tournaments/[id]/components/StatusStrip.tsx)

```typescript
const map: Record<ApplicationStatus, { dot: string; text: JSX.Element }> = {
  none: null,
  pending: { dot: 'amber', text: 'Application Under Review' },
  approved: { dot: 'green', text: 'Application Approved — payment due...' },
  rejected: { dot: 'red', text: 'Application Not Accepted' },
  paid: { dot: 'green', text: 'Registered & Fully Paid — see you there!' },
  withdrawn: { dot: 'amber', text: 'Application Withdrawn' },
};
```

---

## 8. PAYMENT WEBHOOK INTEGRATIONS

### 8.1 M-Pesa Integration

**File:** `src/app/api/webhooks/mpesa/route.ts`
**Provider:** Daraja API
**Flow:**
1. STK Push sent to phone
2. User enters PIN
3. Daraja API calls webhook
4. Parse callback data
5. Verify CheckoutRequestID
6. If success: Create EventRegistration, track activity, redirect to success

### 8.2 PayPal Integration

**File:** `src/app/api/webhooks/paypal/route.ts`
**Flow:**
1. CheckoutModal redirects to PayPal approval URL
2. User approves payment
3. PayPal returns to `/api/webhooks/paypal?token=...`
4. Verify token with PayPal
5. Create EventRegistration on success
6. Display success page

### 8.3 Stripe Integration

**File:** `src/app/api/webhooks/stripe/route.ts`
**Flow:**
1. CheckoutModal redirects to Stripe checkout
2. User enters card details
3. Stripe redirects to `/api/webhooks/stripe?session_id=...`
4. Verify session with Stripe
5. Create EventRegistration on success
6. Display success page

---

## 9. CURRENT SYSTEM FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                      TOURNAMENT REGISTRATION FLOW            │
└─────────────────────────────────────────────────────────────┘

PLAYER JOURNEY:
  1. View Tournament → Click "Register"
           ↓
  2. CheckoutModal Opens
     - Shows entryFee
     - Payment method options
           ↓
  3. Free Tournament?
     ├─ YES → Direct to step 5
     └─ NO → Select payment method (Mobile/PayPal/Card)
           ↓
  4. Payment Processing
     - M-Pesa: STK push → User confirms
     - PayPal: Redirect → User confirms
     - Stripe: Redirect → User confirms
           ↓
  5. Payment Webhook Success
     - Verify payment with provider
     - Create PaymentRecord (status='success')
           ↓
  6. Create EventRegistration
     - status = 'registered' ← IMMEDIATELY APPROVED!
     - signupOrder = next number
           ↓
  7. Show Success Page
     - "Registered & Fully Paid — see you there!"

ORGANIZATION JOURNEY:
  1. Dashboard → Tournaments Section
           ↓
  2. View Tournament Card
     - Shows pending count (currently 0)
     - Shows approved count
     - Shows capacity fill %
           ↓
  3. Click Tournament
           ↓
  4. Go to Management View → Registrations Tab
           ↓
  5. See Sections:
     - Pending Approvals (empty because player=registered)
     - Approved Players (shows registered players)
           ↓
  6. Can Approve/Reject (but status already 'registered')
```

---

## 10. KEY ISSUES & GAPS

### ⚠️ Issue #1: No True Pending Approval Workflow
**Problem:** Players immediately get `status = 'registered'` after payment.
**Impact:** Organization's approve/reject buttons become post-approval step, not actual approval gate.
**Recommendation:** 
- Change flow to: Payment → `status = 'pending'` → Admin approves → `status = 'approved'`
- Update dashboard to account for pending registrations properly

### ⚠️ Issue #2: Mixed Status Values
**Problem:** EventRegistration uses both `'registered'` and `'approved'` inconsistently.
**Impact:** Dashboard filtering on `status == 'pending'` returns 0 results.
**Recommendation:**
- Standardize status flow: `none → pending → approved → rejected` or `registered`
- Document status meanings clearly

### ⚠️ Issue #3: Waitlist Not Fully Integrated
**Problem:** When tournament fills, players added to EventWaitlist but UI may not clearly explain this.
**Recommendation:** 
- Improve messaging in CheckoutModal/StatusStrip for waitlist status
- Add waitlist management UI to organization dashboard

### ⚠️ Issue #4: Payment Status Disconnected from Registration
**Problem:** PaymentRecord and EventRegistration are separate - if payment fails, registration still might exist.
**Recommendation:**
- Add foreign key constraint links or explicit validation
- Prevent registration creation if payment fails

### ⚠️ Issue #5: No Cancellation/Withdrawal Flow
**Problem:** No UI for withdrawing from tournament after registration.
**Recommendation:**
- Add "Withdraw Registration" button on player's tournament detail page
- Create endpoint to cancel registration and refund (if applicable)
- Track withdrawal activity

---

## 11. DATA FLOW EXAMPLES

### Example 1: New Player Registration (Free Tournament)

```
1. Player views "Free Spring Clinic" (entryFee = 0)
2. Clicks "Register"
3. CheckoutModal shows:
   - Tournament Name: "Free Spring Clinic"
   - Entry Fee: $0
   - No payment method needed
4. Player clicks "Confirm Registration"
5. Direct call to applyForTournament()
6. EventRegistration created:
   {
     id: "reg_abc123",
     eventId: "tournament_xyz",
     memberId: "member_123",
     status: "registered",
     registeredAt: now(),
     signupOrder: 1
   }
7. Success: "Registration Confirmed"
```

### Example 2: Paid Tournament with M-Pesa

```
1. Player views "Championship 2026" (entryFee = $50)
2. Clicks "Register"
3. CheckoutModal shows payment options
4. Selects "Mobile Money"
5. Enters phone: "254712345678"
6. Clicks "Pay"
7. POST /api/payments/mpesa
   {
     eventId: "tournament_123",
     amount: 50,
     mobileNumber: "254712345678"
   }
8. M-Pesa STK push sent to phone
9. User enters PIN
10. User confirmed payment
11. Daraja calls webhook: POST /api/webhooks/mpesa
12. Webhook verifies MpesaReceiptNumber
13. PaymentRecord created:
    {
      userId: "user_123",
      eventId: "tournament_123",
      bookingType: "tournament_entry",
      amount: 50,
      provider: "mpesa",
      providerStatus: "success",
      providerTransactionId: "LK431BL60XI"
    }
14. EventRegistration created:
    {
      eventId: "tournament_123",
      memberId: "member_456",
      status: "registered",
      signupOrder: 8
    }
15. Redirect to success page
16. Organization dashboard auto-updates:
    - "Approved Players: 8/32"
    - "Collected: $400" (8 × $50)
```

### Example 3: Organization Approving Registration

```
1. Organizer opens tournament management
2. Sees registrations tab
3. Views pending/approved sections
4. Clicks "✓ Approve" on a pending registration
5. PATCH /api/tournaments/tournament_123/registrations/reg_789
   { "action": "approve" }
6. Backend updates:
   EventRegistration {
     id: "reg_789",
     status: "pending" → "approved"  ← Would be here if pending truly existed
   }
7. UI updates in real-time
8. Approved section shows new player
```

---

## 12. SUMMARY TABLE

| Aspect | Current Implementation | Status | Notes |
|--------|----------------------|--------|-------|
| **Registration Entry** | CheckoutModal (payment) or applyForTournament() (direct) | ✅ Working | Multiple payment providers supported |
| **Payment Timing** | BEFORE registration confirmation | ✅ Working | Payment webhooks create registrations |
| **Status Tracking** | EventRegistration.status (registered/approved/rejected) | ⚠️ Inconsistent | Players skip "pending" status |
| **Organization Dashboard** | Shows pending/approved counts | ✅ Displays | But pending count usually 0 |
| **Approve/Reject API** | PATCH /api/tournaments/[id]/registrations/[id] | ✅ Implemented | But rarely reaches "pending" state |
| **Database Schema** | Proper normalized tables (ClubEvent, EventRegistration, PaymentRecord) | ✅ Solid | Foreign keys and constraints in place |
| **Payment Integration** | M-Pesa, PayPal, Stripe webhooks | ✅ Implemented | All three providers hooked up |
| **Amenity Bookings** | EventAmenity + AmenityBooking models | ✅ Defined | Used in tournament detail page |
| **Withdrawal/Cancellation** | No endpoints defined | ❌ Missing | Need cancellation flow |
| **Waitlist Management** | EventWaitlist table + auto-add when full | ✅ Implemented | Could use better UI |

---

## 13. RECOMMENDED NEXT STEPS

1. **Implement Pending Approval Flow**
   - Change registration status to `'pending'` after payment
   - Add approval gate before status → `'approved'`
   - Update dashboard to filter/display pending correctly

2. **Add Withdrawal Capability**
   - Create DELETE/PATCH endpoint for cancellation
   - Open waitlist spot when player withdraws
   - Calculate refund logic

3. **Improve Status UI**
   - Clarify "pending" vs "approved" vs "registered" statuses
   - Update StatusStrip to show all states
   - Add visual indicators for each state

4. **Strengthen Payment-Registration Link**
   - Add foreign key constraints
   - Validate payment success before registration
   - Handle payment failure recovery

5. **Enhance Waitlist Experience**
   - Auto-move from waitlist when spot opens
   - Notify players about pending status
   - Show waitlist position clearly
