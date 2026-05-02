# 🏢 Organization Admin Login Guide

This guide lists all seeded organizations and their admin/finance officer login credentials.

## Test Credentials

All passwords are: **`tennis123`**

---

## Organizations

### 1. Central Tennis Club

**Location:** New York, USA  
**Rating:** ⭐⭐⭐⭐⭐ 4.8 (156 reviews)  
**Verified:** ✅ Yes

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@centraltennis.com` | `tennis123` |
| **Finance Officer** | `finance@centraltennis.com` | `tennis123` |

**Features:**
- 8 courts with various surfaces (Clay, Hard, Grass)
- Indoor and outdoor facilities
- High activity score (92/100)
- Premium venue with verified badge

---

### 2. Elite Sports Academy

**Location:** Los Angeles, USA  
**Rating:** ⭐⭐⭐⭐⭐ 4.9 (203 reviews)  
**Verified:** ✅ Yes

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@elitesports.com` | `tennis123` |
| **Finance Officer** | `finance@elitesports.com` | `tennis123` |

**Features:**
- International-level coaching facility
- Professional coaching staff
- Highest activity engagement (96/100)
- Tournament-ready facilities

---

### 3. Community Tennis Courts

**Location:** Chicago, USA  
**Rating:** ⭐⭐⭐⭐ 4.5 (98 reviews)  
**Verified:** ❌ No (community facility)

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@communitytennis.org` | `tennis123` |
| **Finance Officer** | `finance@communitytennis.org` | `tennis123` |

**Features:**
- Affordable public facility
- Community-focused programming
- Growing player base
- Developing tournament programs

---

## What Organization Admins Can Do

Once logged in as an organization admin, you can:

✅ **Manage Courts**
- Add/edit/delete courts
- Set court availability
- Configure surface types and lighting
- Track maintenance schedules

✅ **Manage Members**
- View all registered players
- Add/remove members
- Assign roles (admin, member, coach, officer)
- Handle member suspension/reactivation
- Track membership payments

✅ **Manage Events**
- Create tournaments and competitions
- Schedule matches and events
- Set tournament brackets
- Manage event announcements

✅ **Financial Management** (Finance Officers)
- View payment records
- Track member balances
- Generate financial reports
- Manage subscription/membership billing
- Process refunds

✅ **Announcements & Communications**
- Post club announcements
- Send notifications to members
- Update club information
- Manage club logo and branding

✅ **Analytics & Reporting**
- View member statistics
- Track court usage
- Monitor tournament participation
- Track revenue and expenses

---

## How to Log In

1. Go to the login page
2. Enter the email address (e.g., `admin@centraltennis.com`)
3. Enter password: `tennis123`
4. Select "Organization" as role (if prompted)
5. Dashboard will load with organization management tools

---

## Database Relationships

Each organization has:
- **Members:** Players registered with the club
- **Courts:** Physical tennis courts with different surfaces
- **Bookings:** Court reservations
- **Events:** Tournaments, matches, and competitions
- **Staff:** Coaches, trainers, and support staff
- **Finances:** Membership fees, bookings revenue, expenses
- **Announcements:** Club communications
- **Rankings:** Player rankings within the organization

---

## Testing Scenarios

### Scenario 1: New Organization Setup
1. Login as admin for Central Tennis Club
2. Edit organization profile
3. Add new courts
4. Create membership tiers
5. Invite players

### Scenario 2: Event Management
1. Login as admin for Elite Sports Academy
2. Create a tournament
3. Add matches to bracket
4. Assign referees
5. Publish tournament announcements

### Scenario 3: Financial Tracking
1. Login as finance officer for Community Tennis Courts
2. View member account balances
3. Generate revenue report
4. Process refund
5. View payment history

---

## Seeding Information

The organization seeding:
- Automatically creates admin user accounts
- Links admins to organizations as owners
- Sets up ClubMember relationships
- Assigns appropriate roles (admin, officer)
- Pre-populates with demo data
- Creates associated courts, members, and events

When you run `npm run seed`, all organizations and their admin accounts are automatically created.

---

## Notes

- All passwords are the same for testing: `tennis123`
- **DO NOT use these credentials in production**
- Each organization has independent data/members
- Admins can manage only their own organization
- Finance officers have access to financial reports
- Coaches can manage students and schedules

---

## Support Contacts

**Central Tennis Club**  
Email: contact@centraltennis.com  
Phone: +1-555-0100

**Elite Sports Academy**  
Email: info@elitesports.com  
Phone: +1-555-0200

**Community Tennis Courts**  
Email: admin@communitytennis.org  
Phone: +1-555-0300
