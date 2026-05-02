# Quick Start Guide - My Players Feature

## ⚡ 5-Minute Setup

### 1. Run the Seeds
```bash
# Terminal 1: Start the app
npm run dev

# Terminal 2: Seed the database
npm run seed                           # Create users, players, coaches, org
node seed-courts.js                    # Create courts
node seed-coach-players.js             # Create coach-player relationships ⭐
```

### 2. Login
- Open http://localhost:3000
- Login as: `organizational` user from seed
- Or: admin user with organization role

### 3. Navigate to My Players
- Click "👨‍🏫 My Players" in the left sidebar
- You should see:
  - Dashboard stats (My Players count, Total Players, Available to Recruit)
  - Two tabs: "My Players" and "All Players"
  - List of players with their stats

### 4. Try the Features
- **Search:** Type a player name in the search box
- **Message:** Click 💬 Message button to start a chat
- **Switch Tabs:** View all available players or just your managed players
- **View Stats:** See player level, matches, win rate, sessions

---

## 📊 Expected Data After Seeds

| Metric | Count | Notes |
|--------|-------|-------|
| Coaches | 4 | With "Coach" role in staff |
| Players | 20+ | In organization |
| Coach-Player Relationships | ~20 | 5 per coach |
| Coaching Sessions | ~45+ | 1-5 per player relationship |
| Courts | 6 | Created in seed-courts.js |
| Court Bookings | ~30 | 5+ per court |

---

## 🎯 Main Workflows

### View All Available Players
```
1. Navigate: My Players section
2. Click: "All Players" tab
3. See: All organization players with stats
4. Action: Message any player to offer coaching
```

### Manage Your Players
```
1. Navigate: My Players section
2. Click: "My Players" tab
3. See: Your 5 managed players
4. Info: Sessions completed, Win rate, Level
5. Action: Message player, view progress
```

### Recruit a New Player
```
1. Go to: All Players tab
2. Find: Player by searching
3. Click: 💬 Message button
4. Send: Coaching offer message
5. Track: Relationship starts once accepted
```

### View Player Progress
```
1. Go to: My Players tab
2. See: All player stats at a glance
3. Filter: By skill level or performance
4. Sort: By sessions or win rate
```

---

## 📱 User Roles & Access

### Organization Manager / Admin
- ✅ See all players
- ✅ Message any player
- ✅ View statistics
- ✅ Manage relationships
- ✅ Track progress

### Coach (Staff with "Coach" role)
- ✅ See all organization players
- ✅ Message players to recruit
- ✅ See managed players
- ✅ Track coaching sessions
- ✅ View player progress

### Regular Player
- ❌ No access to this feature
- 📊 Own stats in player dashboard

---

## 📋 Data Displayed Per Player

### In All Players View
- Photo / Avatar
- Name & Username
- Email
- **Skill Level** (calculated from wins)
  - Beginner: 0-10 wins
  - Intermediate: 11-20 wins
  - Advanced: 21+ wins
- **Matches**: Total played
- **Win Rate**: Percentage ((wins/played) × 100)

### In My Players View
(Everything above, plus:)
- **Sessions**: Coaching sessions completed
- **Joined Date**: When you started coaching them
- **Last Session**: When they last trained with you

---

## 🔄 Session Execution Order

**IMPORTANT:** Follow this exact order for first-time setup:

```bash
# Step 1: Create base data (users, players, coaches, organization)
npm run seed
# Wait for completion...
# Output: ✅ Seeded org admin and linked...

# Step 2: Create courts
node seed-courts.js
# Wait for completion...
# Output: ✅ Court seeding completed successfully!

# Step 3: Create coach-player relationships
node seed-coach-players.js
# Wait for completion...
# Output: ✅ Coach-player relationship seeding completed!
```

---

## 🚨 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| No players in list | Run `npm run seed` first |
| Coaches aren't showing | Ensure staff has "Coach" in role |
| Can't message players | Verify `/api/chat/dm` endpoint works |
| Wrong statistics | Check player `matchesWon` in database |
| Sessions not showing | Run `node seed-coach-players.js` |

---

## 🧪 Quick Test Commands

```bash
# Check if seeds completed
sqlite3 .env.local
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Player";
SELECT COUNT(*) FROM "Staff";
SELECT COUNT(*) FROM "CoachPlayerRelationship";

# View coach-player relationships
SELECT s.user.firstName, p.user.firstName, cpr.sessionsCount 
FROM "CoachPlayerRelationship" cpr
JOIN "Staff" s ON cpr.coachId = s.userId
JOIN "Player" p ON cpr.playerId = p.userId;
```

---

## 🎨 Visual Layout

```
┌─────────────┬──────────────────────────────────┬──────────────┐
│             │        MY PLAYERS                │              │
│   SIDEBAR   │      SECTION                     │   RIGHT BAR  │
│             │ ┌────────────────────────────────┤              │
│π My Players │ │ 📍 My Players                   │              │
│ (selected)  │ │                                │              │
│             │ │ Stats Grid (3 cols):           │ User Profile │
│             │ │ ┌──────┬──────┬──────┐       │              │
│             │ │ │My    │Total │Available│       │              │
│             │ │ │Players│Players│         │       │              │
│             │ │ │  5   │  20  │    15    │       │              │
│             │ │ └──────┴──────┴──────┘       │              │
│             │ │                                │              │
│             │ │ Tabs: [My Players] [All]      │              │
│             │ │                                │              │
│             │ │ Search: _____________ [✕]    │              │
│             │ │                                │              │
│             │ │ Players: (Cards Grid)          │              │
│             │ │ ┌─────────────────────────────┤              │
│             │ │ │ 👤 John Smith               │              │
│             │ │ │ @johnsmith • john@email.com │              │
│             │ │ │ Level: Advanced │ 25 │ 92% │ │ 5          │              │
│             │ │ │                   [💬 Message]│              │
│             │ │ └─────────────────────────────┘              │
│             │ │                                │              │
│             │ └────────────────────────────────┤              │
│             │                                  │              │
└─────────────┴──────────────────────────────────┴──────────────┘
```

---

## 📞 Need Help?

1. **Check Documentation**
   - `MY_PLAYERS_IMPLEMENTATION.md` - Feature details
   - `MY_PLAYERS_SUMMARY.md` - Complete summary

2. **Database Issues**
   - Review `prisma/schema.prisma`
   - Run migrations if needed

3. **API Issues**
   - Check `/src/app/api/organization/[orgId]/players/route.ts`
   - Test with `curl` or Postman

4. **UI Issues**
   - Check browser console logs
   - Review component in VSCode
   - Check styling against design system

---

## 🎉 You're Ready!

The "My Players" feature is now fully integrated. To summarize:

✅ **Can do:**
- View all players in organization
- Search and filter by name
- See player statistics (matches, level, win rate)
- Send direct messages to recruit or communicate
- Track coaching sessions and progress
- Manage player relationships

✅ **Seeded with:**
- 20+ organization players
- 4+ coaches
- 20+ coach-player relationships
- 45+ coaching sessions
- Player statistics and feedback

🚀 **Ready to:**
- Login and navigate to My Players
- Test all features
- Scale to production
- Add additional features as needed

---

**Happy coaching! 🎾**

Last Updated: April 3, 2026
