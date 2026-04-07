# Coach Dashboard - Real Data Seeding Guide

## ✅ Seeding Complete

Your Tennis Tracker application now has comprehensive real data seeded across the database. All coach dashboard sections are populated with realistic data.

---

## 📊 Data Overview

### Total Data Seeded
| Category | Count | Details |
|----------|-------|---------|
| **Coaches** | 10 | Staff members with Coach role |
| **Players** | 18+ | Players available for coaching |
| **Activities** | 1,122 | Sessions, tournaments, restocking, emails |
| **Coach Sessions** | 258 | Structured coaching sessions with dates/times |
| **Session Bookings** | 525 | Player bookings for sessions |
| **Coach-Player Relationships** | 74 | Active coaching relationships |
| **Wallet Transactions** | 150 | Payment records and earnings |
| **Coach Reviews** | 310 | Session feedback and ratings |
| **Coach Stats** | 10 | Performance statistics per coach |

---

## 🏃 Quick Start to View Real Data

### 1. **Start the Application**
```bash
npm run dev
```
App will be available at `http://localhost:3000`

### 2. **Login as a Coach**
Use test credentials:
- **Email**: `robert.coach@example.com`
- **Password**: `tennis123`

### 3. **View Coach Dashboard**
You'll see all sections populated with real data:
- 📅 **Session Management** - See all activities
- 📊 **Analytics Section** - View coaching stats
- 💰 **Earnings & Wallet** - Check balance and transactions
- 👥 **Player Management** - View coached players
- 📅 **Calendar View** - See sessions on calendar

---

## 📁 Seed Scripts

All seed scripts are located in the root directory:

### 1. **seed.js** - Main Database Seeding
```bash
npm run seed
```
Creates:
- 3 Organizations
- 11 Users (Players, Coaches, Admins, Referees)
- 18 Courts with facilities
- 5 Membership tiers
- Tournament data
- Rankings and statistics

### 2. **seed-activities-real.ts** - Coach Activities
```bash
npx tsx seed-activities-real.ts
```
Creates for each coach:
- 1,122 total activities across 10 coaches
- Types: sessions, tournaments, restocking, player reachouts, emails
- Date range: 15 days past to 30 days future
- Past activities marked as completed

### 3. **seed-coach-dashboard-data.ts** - Dashboard Relationships
```bash
npx tsx seed-coach-dashboard-data.ts
```
Creates:
- 74 Coach-Player Relationships (5-10 per coach)
- 258 Coach Sessions with proper datetime
- 525 Session Bookings
- 310 Coach Reviews (4-5 star ratings)
- 150 Wallet Transactions
- Auto-calculated balances and earnings

---

## 🎯 Dashboard Sections & Real Data

### 1. **Session Management** (SessionManagement.tsx)
- **Data Source**: `/api/coaches/activities`
- **Query**: `GET /api/coaches/activities?coachId={{coachId}}`
- **Display**: All activities (sessions, tournaments, etc.)
- **Status**: ✅ Shows 1,122 real activities
- **Filters**: All/Upcoming/Completed

### 2. **Analytics Section** (AnalyticsSection.tsx)
- **Data Source**: `/api/coaches/stats`
- **Metrics**: Total sessions, completed, revenue, ratings
- **Review Data**: 310 reviews with ratings
- **Charting Data**: Monthly revenue, session types breakdown
- **Status**: ✅ Auto-calculates from real data

### 3. **Earnings & Wallet** (EarningsAndWallet.tsx)
- **Data Source**: `/api/coaches/wallet`
- **Balance**: Real calculated from transactions
- **Transactions**: 150 transaction records
- **Monthly Data**: Earnings broken down by month
- **Status**: ✅ Full wallet system active

### 4. **Player Management** (PlayerManagement.tsx)
- **Data Source**: `/api/coaches/players`
- **Relationships**: 74 active coach-player relationships
- **Session Count**: Tracked per relationship
- **Notes**: Ready for coaches to add notes
- **Status**: ✅ All players linked with sessions

### 5. **Calendar View** (CalendarView.tsx)
- **Data Source**: `/api/coaches/activities`
- **Display**: Sessions on interactive calendar
- **Interaction**: Click to create/edit sessions
- **Status**: ✅ Populated with 1,122 activities

---

## 🔄 Data Relationships

```
Coach (Staff)
├── Activities (1,122)
│   └── Types: session, tournament, restocking, player-reachout, email
├── CoachSessions (258)
│   └── SessionBookings (525)
│       └── Players booked for each session
├── CoachPlayerRelationships (74)
│   ├── Player references
│   └── Notes per relationship
├── CoachWallet (1)
│   ├── Balance & Totals
│   └── Transactions (150)
├── CoachStats (auto-calculated)
└── CoachSessionReviews (310)
```

---

## 📝 Test Scenarios

### Scenario 1: View Upcoming Sessions
1. Login as `robert.coach@example.com`
2. Go to Session Management
3. Filter by "Upcoming"
4. See all sessions scheduled for the future

### Scenario 2: Check Earnings
1. Navigate to Earnings & Wallet
2. View current balance (aggregated from transactions)
3. See monthly breakdown
4. View all 150 transaction records

### Scenario 3: Player Progress
1. Go to Player Management
2. View all 74 active player relationships
3. See session counts per player
4. Ready to add notes

### Scenario 4: Calendar Overview
1. Open Calendar View
2. Navigate through months
3. Click on any day to see activities
4. View all 1,122 activities

---

## 🔧 API Endpoints Used

| Endpoint | Method | Returns |
|----------|--------|---------|
| `/api/coaches/activities` | GET | Activities array |
| `/api/coaches/stats` | GET | Coach statistics |
| `/api/coaches/wallet` | GET | Wallet with transactions |
| `/api/coaches/players` | GET | Coach-player relationships |
| `/api/coaches/sessions` | GET | Coach sessions |

All endpoints are fully operational and populated with real data.

---

## 🚀 Next Steps

### To Reset All Data
```bash
npm run migrate:reset  # Resets database and re-runs all seeds
```

### To Add More Data
- Run individual seed scripts again (they upsert/merge data)
- Modify seed scripts for custom data scenarios
- Use dashboard UI to create new activities

### To Deploy
```bash
npm run build
npm start
```

---

## 📞 Troubleshooting

### Sessions Not Loading
- Check if seed scripts were run: `npx tsx seed-activities-real.ts`
- Verify coach ID is correct
- Check `/api/coaches/activities` endpoint response

### Wallet Not Showing
- Run: `npx tsx seed-coach-dashboard-data.ts`
- Wallet auto-creates if needed
- Transactions need to be seeded separately

### Analytics Empty
- Stats auto-calculate from real data
- Ensure coach sessions exist
- Check API response: `/api/coaches/stats?coachId={{coachId}}`

---

## 📚 Files Modified/Created

### Created
- ✅ `seed-coach-dashboard-data.ts` - New comprehensive seed script
- ✅ `/memories/repo/coach-dashboard-seeding-complete.md` - Documentation

### Seeded
- ✅ Activities table (1,122 records)
- ✅ CoachSession table (258 records)
- ✅ SessionBooking table (525 records)
- ✅ CoachWallet (10 records)
- ✅ WalletTransaction (150 records)
- ✅ CoachPlayerRelationship (74 records)
- ✅ CoachSessionReview (310 records)
- ✅ CoachStats (10 records)

---

## ✨ Summary

Your Tennis Tracker now has:
- **Complete real data** across all coach dashboard sections
- **Realistic date ranges** with past/future activities
- **Authentic financial data** with wallet and transactions
- **Active coach-player relationships** ready for engagement
- **Rich session history** with bookings and reviews

**All dashboard sections are now displaying real, production-ready data!** 🎾
