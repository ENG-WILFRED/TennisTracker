# 🎾 Tennis Tracker - Organization & Authentication System

Complete implementation guide for organization-based login and management.

---

## 📋 What Was Implemented

### 1. **Organization Admin Accounts** ✅
- Each organization has two dedicated user accounts
- Admin account for management and oversight
- Finance officer account for billing and payments
- Accounts created automatically during seeding

### 2. **Organization Ownership** ✅
- Organizations linked to admin user via `createdBy` field
- Admin user becomes organization owner
- Role-based access control implemented
- ClubMember relationships establish membership hierarchy

### 3. **Seeding Infrastructure** ✅
- Updated `prisma/seeds/organizations.ts` with:
  - Organization creation
  - Admin user generation with hashed passwords
  - Finance officer user generation
  - ClubMember relationship setup
- Credentials displayed in console during seeding

### 4. **Documentation** ✅
Three comprehensive guides created:
- **ORGANIZATION_LOGIN_GUIDE.md** - Quick reference for credentials and features
- **ORGANIZATION_SEEDING_REFERENCE.md** - Technical details about seeding
- **ORGANIZATION_AUTH_SETUP.md** - Complete authentication setup guide

---

## 🔐 Login Credentials

### Central Tennis Club
```
Admin:   admin@centraltennis.com          / tennis123
Finance: finance@centraltennis.com        / tennis123
```

### Elite Sports Academy
```
Admin:   admin@elitesports.com            / tennis123
Finance: finance@elitesports.com          / tennis123
```

### Community Tennis Courts
```
Admin:   admin@communitytennis.org        / tennis123
Finance: finance@communitytennis.org      / tennis123
```

**All passwords:** `tennis123` (for development/testing only)

---

## 🗄️ Database Changes

### New Data Created During Seeding

```
✅ 3 Organizations
   ├── Central Tennis Club (verified)
   ├── Elite Sports Academy (verified)
   └── Community Tennis Courts (unverified)

✅ 6 User Accounts (2 per organization)
   ├── 3 Admin users (organization owners)
   └── 3 Finance officer users

✅ 6 ClubMember Records
   ├── 3 admin roles
   └── 3 officer roles

✅ Password Hashing
   └── All passwords encrypted with bcryptjs (10 rounds)
```

### Organization Schema Updates

**Organization Table now tracks:**
- `createdBy` → Links to User.id (owner/admin)
- `createdAt` / `updatedAt` → Timestamps
- `verifiedBadge` → Organization verification status
- Scores for engagement tracking

**User Table relationships:**
- Users can own multiple organizations
- Users can be members of multiple organizations
- User roles determine access permissions

**ClubMember Table:**
- Junction table linking Users to Organizations
- Tracks membership status and payments
- Stores role assignments (admin, member, officer)

---

## 🚀 How to Use

### 1. Seed the Database

```bash
# First time setup - resets database and seeds all data
npm run prisma:reset

# Or just seed without reset
npm run prisma:seed

# Expected output:
# 🏢 Seeding organizations with admin accounts...
# ✓ Central Tennis Club
#   └─ Admin: admin@centraltennis.com (password: tennis123)
#   └─ Finance: finance@centraltennis.com (password: tennis123)
# [... more organizations ...]
# 📋 Organization Admin Login Credentials:
# ───────────────────────────────────────────────────────────────
# Central Tennis Club:
#   Admin   → admin@centraltennis.com / tennis123
#   Finance → finance@centraltennis.com / tennis123
```

### 2. Login as Organization Admin

1. Navigate to `/login` page
2. Enter email: `admin@centraltennis.com`
3. Enter password: `tennis123`
4. Select "Organization" role (if prompted)
5. You're now logged in as organization admin

### 3. Access Organization Features

Once authenticated, admins can:

```
📊 Dashboard
  └── Overview & Analytics
  
👥 Members
  ├── View all members
  ├── Add/remove members
  ├── Assign roles
  └── Track payments

🎾 Courts
  ├── Manage court information
  ├── Set availability
  ├── Track maintenance
  └── View usage stats

📅 Events
  ├── Create tournaments
  ├── Schedule matches
  ├── Manage brackets
  └── Publish announcements

💰 Finances (Finance Officer Only)
  ├── View member balances
  ├── Process refunds
  ├── Generate reports
  └── Track revenue
```

---

## 🔧 Technical Details

### File Changes

**Modified Files:**
1. `/prisma/seeds/organizations.ts` - Enhanced with user account creation
2. `/prisma/seeds/users.ts` - Removed duplicate admin accounts

**New Documentation Files:**
1. `/ORGANIZATION_LOGIN_GUIDE.md` - User-facing guide
2. `/ORGANIZATION_SEEDING_REFERENCE.md` - Technical reference
3. `/ORGANIZATION_AUTH_SETUP.md` - Implementation details

### Seeding Flow

```typescript
// 1. Create organization
const org = await prisma.organization.create({ ... })

// 2. Create admin user
const admin = await prisma.user.create({
  email: 'admin@...com',
  passwordHash: bcrypt.hash('tennis123', 10)
})

// 3. Link admin to organization
await prisma.organization.update({
  where: { id: org.id },
  data: { createdBy: admin.id }
})

// 4. Create ClubMember relationship
await prisma.clubMember.create({
  playerId: admin.id,
  organizationId: org.id,
  role: 'admin'
})
```

### Authentication Flow

```
User Input (email/password)
    ↓
POST /api/auth/login
    ↓
Verify email exists in User table
    ↓
Verify password with bcryptjs
    ↓
Check user's roles:
  - Check if Player exists
  - Check if Coach exists
  - Check if Admin exists
  - Check if owns Organization
    ↓
Generate JWT tokens:
  - accessToken (15 min)
  - refreshToken (7 days)
    ↓
Store in localStorage
    ↓
Redirect to dashboard
```

---

## 📊 Data Model

### Organization Structure

```
Organization
├── id (UUID)
├── name (string) - Unique
├── createdBy (UUID) → User.id ⭐ KEY RELATION
├── slug (string)
├── description
├── address, city, country
├── phone, email
├── logo, primaryColor
├── rating, ratingCount
├── verifiedBadge
├── activityScore, playerDevScore, tournamentEngScore
└── Relationships:
    ├── User (via createdBy) ← Organization owner
    ├── ClubMember[] ← Association to multiple users
    ├── Court[]
    ├── CourtBooking[]
    ├── Staff[]
    ├── ClubEvent[]
    └── etc.
```

### User Structure

```
User
├── id (UUID)
├── username (string) - Unique
├── email (string) - Unique
├── passwordHash (string) - Bcrypt hashed
├── firstName, lastName
├── phone, gender, dateOfBirth, nationality, bio, photo
└── Relationships:
    ├── createdOrganizations[] ← Organizations owned
    ├── clubMembers[] ← Organization memberships
    ├── player (1) ← Player profile
    ├── staff[] ← Coach/staff roles
    ├── referee (1) ← Referee profile
    └── spectator (1) ← Spectator profile
```

### ClubMember Structure

```
ClubMember (Junction Table)
├── playerId (UUID Foreign Key)
├── organizationId (UUID Foreign Key)
├── PRIMARY KEY (playerId, organizationId)
├── role (string) - 'admin', 'member', 'officer'
├── paymentStatus (string) - 'paid', 'pending', 'overdue'
├── outstandingBalance (float)
├── autoRenew (boolean)
├── suspensionReason, suspendedUntil
├── attendanceCount, lastAttendance
└── joinedAt, updatedAt
```

---

## 🧪 Testing

### Manual Testing Steps

**Test 1: Organization Admin Login**
```
1. Go to /login
2. Email: admin@centraltennis.com
3. Password: tennis123
4. ✅ Should redirect to /dashboard/organization
5. ✅ Should show Central Tennis Club dashboard
```

**Test 2: Finance Officer Access**
```
1. Go to /login
2. Email: finance@centraltennis.com
3. Password: tennis123
4. ✅ Should show financial dashboard
5. ✅ Should see member payment information
```

**Test 3: Multi-Organization Admin**
```
1. Create custom admin account for multiple orgs
2. Login should show role selector
3. ✅ Should allow organization selection
4. ✅ Dashboard should switch orgs on selection
```

**Test 4: Invalid Credentials**
```
1. Wrong password → ❌ Error message shown
2. Non-existent email → ❌ Error message shown
3. Case-insensitive email → ✅ Should work
```

**Test 5: Token Management**
```
1. Login and get accessToken
2. ✅ Token stored in localStorage
3. ✅ Token sent in Authorization header
4. ✅ Expired token triggers refresh
5. ✅ Invalid token causes re-login
```

### Database Queries to Verify

```sql
-- Check organizations exist
SELECT * FROM "Organization";
-- Should return 3 organizations

-- Check admin users
SELECT * FROM "User" WHERE email LIKE 'admin@%';
-- Should return 3 admin users

-- Check organization ownership
SELECT o.name, u.email, u.username 
FROM "Organization" o
JOIN "User" u ON o."createdBy" = u.id;
-- Should show each org with its admin

-- Check ClubMember relationships
SELECT u.email, o.name, cm.role
FROM "ClubMember" cm
JOIN "User" u ON cm."playerId" = u.id
JOIN "Organization" o ON cm."organizationId" = o.id
WHERE cm.role = 'admin' OR cm.role = 'officer';
-- Should show 6 records (3 admins + 3 officers)
```

---

## 🔒 Security Notes

### Current Implementation (Development)
- ✅ Passwords hashed with bcryptjs (10 rounds)
- ✅ JWT tokens with expiry times
- ✅ Role-based access control
- ⚠️ Demo passwords in console (development only)
- ⚠️ localStorage for token storage (vulnerable to XSS)

### Production Recommendations
- [ ] Use httpOnly cookies instead of localStorage
- [ ] Implement CSRF protection
- [ ] Add rate limiting on login endpoint
- [ ] Enable 2FA for organization admins
- [ ] Use environment variables for passwords
- [ ] Implement audit logging for admin actions
- [ ] Add IP whitelisting for admin access
- [ ] Use HTTPS only

---

## 📝 Configuration

### Environment Variables

Add to `.env.local`:

```env
# Database (already configured)
DATABASE_URL=postgresql://...

# JWT Configuration
JWT_SECRET=your-secret-key-min-32-chars-long
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Organization Settings
ENABLE_ORG_ADMIN_REGISTRATION=true
REQUIRE_ORG_VERIFICATION=false
ORG_ADMIN_EMAIL_DOMAIN=@example.com

# API
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Admin can't login** | Run `npm run prisma:seed` to create accounts |
| **Password always fails** | Check bcryptjs is installed: `npm install bcryptjs` |
| **No organizations in DB** | Run `npm run prisma:reset` |
| **ClubMember not created** | Verify createdBy is set before creating ClubMember |
| **Tokens not persisting** | Clear localStorage and login again |
| **Wrong dashboard shown** | Check organizationId in localStorage |
| **Duplicate accounts** | Run `npm run prisma:reset` to clean database |
| **Finance endpoints return 403** | Verify user has 'officer' role in ClubMember |

---

## 📚 Additional Resources

### Documentation Files
- [ORGANIZATION_LOGIN_GUIDE.md](/ORGANIZATION_LOGIN_GUIDE.md) - Quick credentials reference
- [ORGANIZATION_SEEDING_REFERENCE.md](/ORGANIZATION_SEEDING_REFERENCE.md) - Database details
- [ORGANIZATION_AUTH_SETUP.md](/ORGANIZATION_AUTH_SETUP.md) - Full implementation guide

### Code Files Modified
- [prisma/seeds/organizations.ts](/prisma/seeds/organizations.ts) - Organization seeding
- [prisma/seeds/users.ts](/prisma/seeds/users.ts) - User seeding

### Related APIs
- `/api/auth/login` - Authentication endpoint
- `/api/organization/[orgId]` - Organization management
- `/api/user-settings` - User preferences
- `/api/player/organization` - Current player's org

---

## ✅ Implementation Checklist

- [x] Organization model supports admin accounts
- [x] User seeding creates admin/finance accounts
- [x] Organizations linked to admin via `createdBy`
- [x] ClubMember relationships established
- [x] Passwords hashed with bcryptjs
- [x] Login endpoint supports organization accounts
- [x] Credentials printed on seed completion
- [x] Documentation created (3 guides)
- [x] Database schema verified
- [x] Testing steps documented
- [x] Troubleshooting guide provided

---

## 🎯 Next Steps

1. **Run Seeding**
   ```bash
   npm run prisma:seed
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Login with Organization Admin**
   - Email: `admin@centraltennis.com`
   - Password: `tennis123`

4. **Explore Features**
   - View organization dashboard
   - Manage members and courts
   - Create events and tournaments
   - Review financial reports

5. **Integration Testing**
   - Test all admin features
   - Verify finance officer access
   - Check permission enforcement
   - Validate multi-organization support

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review implementation guides
3. Verify database with: `npx prisma studio`
4. Check console for error messages
5. Reseed database: `npm run prisma:reset`

---

**Status:** ✅ **Complete and Ready for Testing**

**Last Updated:** March 24, 2026  
**Version:** 1.0  
**Environment:** Development
