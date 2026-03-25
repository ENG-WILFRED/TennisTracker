# 📊 Organization Seeding Reference

Quick reference for all organization-related seeding data.

## Seeding Overview

```
Organizations Seeded: 3
├── Central Tennis Club (New York)
│   ├── Admin Account: admin@centraltennis.com
│   ├── Finance Account: finance@centraltennis.com
│   ├── Courts: 8
│   ├── Membership Tiers: 3
│   └── Verified: ✅
├── Elite Sports Academy (Los Angeles)
│   ├── Admin Account: admin@elitesports.com
│   ├── Finance Account: finance@elitesports.com
│   ├── Courts: 6
│   ├── Membership Tiers: 4
│   └── Verified: ✅
└── Community Tennis Courts (Chicago)
    ├── Admin Account: admin@communitytennis.org
    ├── Finance Account: finance@communitytennis.org
    ├── Courts: 5
    ├── Membership Tiers: 2
    └── Verified: ❌
```

## Organization Data Structure

### Organization Entity
```typescript
{
  id: UUID                      // Auto-generated
  name: string                  // e.g., "Central Tennis Club"
  slug: string                  // URL-friendly version
  createdBy: string            // Admin user ID (owner)
  createdAt: Date              // Timestamp
  updatedAt: Date              // Timestamp
  description: string          // About the organization
  address: string              // Street address
  city: string                 // City name
  country: string              // Country
  phone: string                // Contact phone
  email: string                // Contact email
  logo: string                 // Logo URL
  primaryColor: string         // Hex color (e.g., "#2563eb")
  rating: number               // 0-5 stars
  ratingCount: number          // Number of reviews
  verifiedBadge: boolean       // Verified status
  activityScore: number        // 0-100
  playerDevScore: number       // 0-100
  tournamentEngScore: number   // 0-100
}
```

## Related Entities (Auto-Created)

### ClubMember
- Admin user added as `admin` role
- Finance user added as `officer` role
- Links users to organizations
- Tracks membership status and payments

### User Accounts Created Per Organization

| Account Type | Email Template | Default Password | Roles |
|--------------|---|---|---|
| **Organization Admin** | `admin@{organization}.com` | `tennis123` | admins, manage_members, manage_courts, manage_announcements |
| **Finance Officer** | `finance@{organization}.com` | `tennis123` | finance_officer, manage_finances, view_reports |

## Seed File Execution Order

```
1. seedOrganizations()     → Creates orgs + admin/finance users
2. seedUsers()             → Creates remaining players, coaches, referees
3. seedCourts()            → Creates courts for each organization
4. seedMemberships()       → Adds players to organizations
5. seedMatches()           → Creates match records
6. seedBookings()          → Creates court bookings
7. seedCommunity()         → Creates social posts/comments
8. seedTournaments()       → Creates tournament brackets
9. seedStats()             → Creates player rankings
10. seedTournamentComments() → Adds tournament discussion
```

## Database Counts After Seeding

```
Organizations:  3
Users:         18
├─ Players:     12
├─ Coaches:      2
├─ Referees:     1
├─ Spectators:   1
└─ Admins:       6 (3 orgs × 2 admins/finance)

ClubMembers:   ~25 (total memberships)
Courts:        ~19 (all organizations combined)
Bookings:      ~30+
Matches:       ~40+
Tournaments:    2
Community Posts: 10+
```

## API Endpoints for Organization Management

```
GET  /api/organization/{orgId}               → Get organization details
PUT  /api/organization/{orgId}               → Update organization
GET  /api/organization/{orgId}/members       → List members
POST /api/organization/{orgId}/members       → Add member
GET  /api/organization/{orgId}/courts        → List courts
POST /api/organization/{orgId}/courts        → Add court
GET  /api/organization/{orgId}/bookings      → List bookings
GET  /api/organization/{orgId}/rankings      → View rankings
POST /api/organization/{orgId}/announcements → Create announcement
```

## Test Data Relationships

### Central Tennis Club
```
Created by: admin@centraltennis.com
Members (via ClubMember):
  - David Kim (player)
  - Sophia Chen (player)
  - Robert Alexander (coach)
  - Michael Thompson (admin)
  - Patricia Williams (finance officer)
  
Courts: CT-001 to CT-008 (8 courts)
  - Mix of Clay, Hard, Grass
  - Indoor/Outdoor facilities
  - Lighting on some courts
```

### Elite Sports Academy
```
Created by: admin@elitesports.com
Members:
  - Lucas Santos (player)
  - Elena Petrov (coach)
  
Courts: EA-001 to EA-006 (6 premium courts)
  - Mostly Hard courts
  - Professional grade
  - All lit for evening play
```

### Community Tennis Courts
```
Created by: admin@communitytennis.org
Members:
  - Emma Turner (player)
  
Courts: CT-001 to CT-005 (5 community courts)
  - Affordable rates
  - Mix of surfaces
  - Basic amenities
```

## Password Management

**For Development/Testing:**
- All test accounts use: `tennis123`
- Set in `DEMO_PASSWORD` constant in users.ts
- Override in `.env` if needed

**For Production:**
- Generate strong random passwords
- Use environment variables
- Never commit credentials

## Updating Organization Data

To update seeded data:

```bash
# Reset and reseed
npm run prisma:seed

# Or for a fresh start
npm run prisma:reset
```

## Adding New Organizations

Edit `prisma/seeds/organizations.ts` and add to the `organizationData` array:

```typescript
{
  org: {
    name: 'New Club',
    slug: 'new-club',
    city: 'City',
    // ... other fields
  },
  admin: {
    username: 'new_admin',
    email: 'admin@newclub.com',
    // ... admin details
  },
  finance: {
    username: 'new_finance',
    email: 'finance@newclub.com',
    // ... finance details
  }
}
```

Then run `npm run prisma:seed`

## Verification Checklist

After seeding, verify:

- [ ] 3 organizations exist in database
- [ ] 6 admin/finance user accounts created (2 per org)
- [ ] Each organization has `createdBy` set to admin user ID
- [ ] ClubMember records link admins to organizations
- [ ] All users can login with email and password `tennis123`
- [ ] Courts are assigned to correct organizations
- [ ] Players are registered with organization members
- [ ] Community posts exist from multiple users
- [ ] Booking records are present
- [ ] Match history is populated

## Common Issues

**Issue:** Admin can't login  
**Solution:** Ensure `bcryptjs` is installed and passwords are hashed during seeding

**Issue:** Organization shows no members  
**Solution:** Verify ClubMember relationships in database

**Issue:** Courts don't appear for organization  
**Solution:** Check if courts have correct `organizationId` reference

**Issue:** Duplicate admin accounts  
**Solution:** Run `npm run prisma:reset` to clear and reseed

---

Last Updated: March 2026  
Seeding Version: 2.0 (Organization Admin Support)
