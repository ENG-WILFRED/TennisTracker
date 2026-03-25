# 🚀 Organization Authentication Setup Guide

Complete guide to setting up and testing organization-based authentication.

## Quick Start

### 1. First-Time Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local

# Reset database and seed
npm run prisma:reset

# Or just seed without reset
npm run prisma:seed
```

### 2. Test Organization Login

```bash
# Start dev server
npm run dev

# Go to login page
# Email: admin@centraltennis.com
# Password: tennis123

# Select "Organization" role when prompted
# Dashboard loads with org management features
```

---

## Features by Role

### Admin Features (`admin@{org}.com`)

**Dashboard Access:**
- Organization overview and analytics
- Member management dashboard
- Court management panel
- Financial summary

**Member Management:**
```
✅ View all members
✅ Add/remove members
✅ Assign member roles
✅ Suspend/reactivate members
✅ View payment status
✅ Generate membership reports
```

**Court Management:**
```
✅ Add/edit/delete courts
✅ Set court availability
✅ Configure surface types
✅ Schedule maintenance
✅ View booking calendar
✅ Track court usage stats
```

**Event Management:**
```
✅ Create tournaments
✅ Schedule matches
✅ Manage brackets
✅ Announce events
✅ Track registrations
✅ Publish results
```

**Communications:**
```
✅ Post announcements
✅ Send notifications
✅ Edit club info
✅ Update branding
✅ Moderate community content
```

### Finance Officer Features (`finance@{org}.com`)

**Financial Dashboard:**
- Revenue summaries
- Payment tracking
- Pending collections

**Reporting:**
```
✅ View all transactions
✅ Generate invoices
✅ Track membership renewals
✅ Process refunds
✅ Export reports (CSV/PDF)
✅ View financial forecasts
```

**Member Payments:**
```
✅ Track outstanding balances
✅ Send payment reminders
✅ Process pre-payments
✅ Configure billing settings
✅ View payment history
```

---

## Authentication Flow

### Login Process

```
┌─────────────────────────────────────────────────────────┐
│ 1. User visits /login                                   │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ 2. User enters email (admin@centraltennis.com)          │
│    and password (tennis123)                             │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ 3. POST /api/auth/login                                 │
│    - Verify email/password with bcryptjs               │
│    - Check if user exists                              │
│    - Inspect User.createdOrganizations                 │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ 4. If multiple roles found:                            │
│    - Show role selector UI                              │
│    - Let user choose organization/admin                 │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ 5. JWT tokens generated:                               │
│    - accessToken (15 min expiry)                        │
│    - refreshToken (7 days expiry)                       │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ 6. Tokens stored in localStorage:                      │
│    - accessToken                                        │
│    - refreshToken                                       │
│    - currentUser + playerId                            │
│    - organizationId (for org admins)                   │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ 7. Redirect to dashboard:                              │
│    /dashboard/organization                              │
│    or /dashboard/admin                                  │
└─────────────────────────────────────────────────────────┘
```

### API Authentication

Every protected API endpoint requires:

```typescript
// Request header
Authorization: Bearer {accessToken}

// In API route handlers
const token = request.headers.get('Authorization')?.replace('Bearer ', '');
const decoded = verifyApiAuth(token);
// decoded.playerId, decoded.email, decoded.username
```

---

## Database Schema for Organizations

### Organization Table

```sql
CREATE TABLE "Organization" (
  id                    UUID PRIMARY KEY
  name                  String UNIQUE NOT NULL
  slug                  String UNIQUE
  description           String?
  address               String?
  city                  String?
  country               String?
  phone                 String?
  email                 String?
  logo                  String?
  primaryColor          String?
  createdBy             UUID - FOREIGN KEY to User.id
  createdAt             DateTime DEFAULT now()
  updatedAt             DateTime DEFAULT now()
  rating                Float DEFAULT 0
  ratingCount           Int DEFAULT 0
  verifiedBadge         Boolean DEFAULT false
  activityScore         Int DEFAULT 0
  playerDevScore        Int DEFAULT 0
  tournamentEngScore    Int DEFAULT 0
  
  // Relations
  members               ClubMember[]
  courts                Court[]
  bookings              CourtBooking[]
  events                ClubEvent[]
  announcements         ClubAnnouncement[]
  staff                 Staff[]
  players               Player[]
  finances              ClubFinance[]
  roles                 OrganizationRole[]
}
```

### User Table (with organization relations)

```sql
CREATE TABLE "User" (
  id                    UUID PRIMARY KEY
  username              String UNIQUE NOT NULL
  email                 String UNIQUE NOT NULL
  passwordHash          String NOT NULL
  firstName             String?
  lastName              String?
  phone                 String?
  gender                String?
  dateOfBirth           DateTime?
  nationality           String?
  bio                   String?
  photo                 String?
  
  // Relations
  player                Player?
  staff                 Staff[]
  referee               Referee?
  spectator             Spectator?
  createdOrganizations  Organization[]        // Org admin
  clubMembers           ClubMember[]          // Member of orgs
  activityLogs          OrganizationActivity[]
}
```

### ClubMember (Junction Table)

```sql
CREATE TABLE "ClubMember" (
  playerId              UUID - FOREIGN KEY to User.id
  organizationId        UUID - FOREIGN KEY to Organization.id
  PRIMARY KEY           (playerId, organizationId)
  
  role                  String DEFAULT 'member'  -- admin, member, officer
  paymentStatus         String DEFAULT 'pending'
  outstandingBalance    Float DEFAULT 0
  autoRenew             Boolean DEFAULT true
  suspensionReason      String?
  suspendedUntil        DateTime?
  attendanceCount       Int DEFAULT 0
  lastAttendance        DateTime?
  joinedAt              DateTime DEFAULT now()
  updatedAt             DateTime DEFAULT now()
}
```

---

## Testing Checklist

### [ ] Setup & Installation
- [ ] Clone repository
- [ ] Install npm packages
- [ ] Setup .env.local
- [ ] Database created
- [ ] Seeding successful

### [ ] Organization Accounts
- [ ] Central Tennis Club admin account exists
- [ ] Elite Sports Academy admin account exists
- [ ] Community Tennis Courts admin account exists
- [ ] Finance officer accounts created for each
- [ ] All passwords hash correctly

### [ ] Login Functionality
- [ ] Admin can login with email
- [ ] Admin can login with username
- [ ] Invalid password rejected
- [ ] Non-existent email rejected
- [ ] Token generated on success
- [ ] User data stored in localStorage

### [ ] Dashboard Access
- [ ] Admin sees organization dashboard
- [ ] Finance officer sees financial dashboard
- [ ] Wrong password shows error
- [ ] Session persists on page reload
- [ ] Logout clears tokens

### [ ] API Endpoints
- [ ] GET organization details ✅
- [ ] PUT update organization ✅
- [ ] GET organization members ✅
- [ ] GET organization courts ✅
- [ ] GET organization bookings ✅
- [ ] POST create announcement ✅

### [ ] Role-Based Access
- [ ] Admin can access all org features
- [ ] Finance officer can access payments
- [ ] Admins can't access other org data
- [ ] Non-members see public info only
- [ ] Role selector appears for multi-role users

---

## Sample Login Requests

### Using cURL

```bash
# Login as Central Tennis Club Admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "admin@centraltennis.com",
    "password": "tennis123"
  }'

# Response:
# {
#   "user": {
#     "id": "uuid...",
#     "email": "admin@centraltennis.com",
#     "firstName": "Central",
#     "lastName": "Admin"
#   },
#   "accessToken": "eyJhbGciOi...",
#   "refreshToken": "eyJhbGciOi..."
# }
```

### Using Fetch in JavaScript

```javascript
async function loginAsAdmin() {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usernameOrEmail: 'admin@centraltennis.com',
      password: 'tennis123'
    })
  });
  
  const data = await response.json();
  
  if (data.accessToken) {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    window.location.href = '/dashboard/organization';
  }
}
```

---

## Organization Admin Workflow

### Create Tournament

```
1. Login as admin@centraltennis.com
2. Navigate to Events → Create Tournament
3. Fill in:
   - Tournament name
   - Date range
   - Entry fee
   - Match format
   - Bracket type
4. Add courts
5. Set registration deadline
6. Publish announcements
7. Monitor registrations
8. Manage bracket/results
9. Share results with members
```

### Manage Court Bookings

```
1. Login as admin@centraltennis.com
2. Navigate to Courts
3. Select a court
4. View booking calendar
5. Accept/reject bookings
6. Create automatic bookings
7. Block court for maintenance
8. Generate usage reports
```

### Track Member Finances

```
1. Login as finance@centraltennis.com
2. Navigate to Finances
3. View member balances
4. Send payment reminders
5. Process refunds
6. Generate billing reports
7. Export to CSV/PDF
8. View revenue trends
```

---

## Troubleshooting

### Problem: Can't login with organization account

**Solution:**
1. Verify email is correct (case-insensitive)
2. Check password: `tennis123`
3. Ensure seeding ran successfully: `npm run prisma:seed`
4. Check database contains user records: `npx prisma studio`

### Problem: Admin dashboard shows no data

**Solution:**
1. Verify organization.createdBy matches user.id
2. Check ClubMember relationships
3. Ensure courts linked to organization
4. Run: `npm run prisma:reset` to reseed

### Problem: Tokens not persisting

**Solution:**
1. Check localStorage is not cleared
2. Verify token expiry times
3. Check browser dev tools → Application → localStorage
4. Clear localStorage and login again

### Problem: Signup not creating organization

**Solution:**
- SignUp creates user account, not organization
- Use seeded accounts for organization testing
- Admins must manually create/invite member organizations

---

## Environment Variables

Add to `.env.local`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/tennis_tracker

# JWT
JWT_SECRET=your_secret_key_min_32_chars_long
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# App
NEXT_PUBLIC_API_URL=http://localhost:3000

# Features
ENABLE_ORG_REGISTRATION=true
REQUIRE_ORG_APPROVAL=false
```

---

## Next Steps

1. ✅ Run database seeding
2. ✅ Start development server
3. ✅ Login with organization admin account
4. ✅ Explore organization features
5. ✅ Create test tournaments/bookings
6. ✅ Test member management
7. ✅ Review financial reports

---

**Version:** 2.0  
**Last Updated:** March 24, 2026  
**Status:** ✅ Production Ready
