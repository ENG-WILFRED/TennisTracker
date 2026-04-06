# 🎾 Events System - Quick Test Guide

## Organization Login Credentials

### Central Tennis Club
- Email: `admin@centraltennis.com`
- Password: `tennis123`
- Organization ID: `cc06f187-b786-4410-8869-2218f6b591df`

### Elite Sports Academy
- Email: `admin@elitesports.com`
- Password: `tennis123`
- Organization ID: `c827ae53-4300-437d-be45-08551c968cf7`

### Community Tennis Courts
- Email: `admin@communitytennis.org`
- Password: `tennis123`
- Organization ID: `4eabf1cf-8c56-4c47-8393-09fe23a26d31`

## 🚀 Quick Start Testing Steps

### Step 1: Login to Organization
1. Go to login page
2. Select "Organization" role
3. Enter: `admin@centraltennis.com` / `tennis123`
4. You'll be in the Central Tennis Club dashboard

### Step 2: View Events
1. Click on "🎾 Events" tab in the dashboard
2. You should see:
   - ✅ **Total Events**: 6 events
   - ✅ **Registrations**: ~25 members registered
   - ✅ **Total Revenue**: ~$2,500+ (based on registrations × entry fees)

### Step 3: View Event Details
1. Click "View Details" on any event (e.g., "Spring Championship 2026")
2. You'll see:
   - Event information (name, type, dates)
   - Registration stats with visual progress bar
   - Full list of registered members
   - Staff assignments section

### Step 4: Test Edit Functionality
1. On the event detail page, click "Edit Event"
2. Update the event name or entry fee
3. Click "Save Changes"
4. Verify the change appears immediately

### Step 5: Test Staff Assignment
1. On the event detail page, click "+ Assign Staff"
2. Enter staff details:
   - Staff ID: (Use any provider ID from database)
   - Role: `Referee` or `Coach`
   - Responsibility: `Match supervision` or similar
3. Click "Assign"
4. Staff should appear in the list below

### Step 6: View Event Revenue
1. Check the "Total Revenue" stat:
   - Calculation: (Registered Members) × (Entry Fee)
   - Example: 5 members × $100 fee = $500

### Step 7: Test Delete (Optional)
1. Go back to the events list
2. Click "Delete" on any event
3. Confirm the deletion
4. The event should disappear from the list

## 📊 Sample Event Data

### Spring Championship 2026
- Type: Tournament
- Entry Fee: $100
- Registration Cap: 64
- Prize Pool: $10,000
- Registered: ~5 members

### Beginner Clinic
- Type: Clinic
- Entry Fee: $25
- Registration Cap: 20
- Prize Pool: $0
- Registered: ~4 members

### Advanced Coaching
- Type: Coaching
- Entry Fee: $75
- Registration Cap: 10
- Prize Pool: $0
- Registered: ~5 members

## 🧪 API Testing (Using Postman/cURL)

### Get All Events
```bash
GET /api/organization/cc06f187-b786-4410-8869-2218f6b591df/events
```
Expected Response: Array of 6 events with registrations

### Get Event Details
```bash
GET /api/organization/cc06f187-b786-4410-8869-2218f6b591df/events/{eventId}
```
Response includes registrations, staff, and brackets

### Update Event
```bash
PUT /api/organization/cc06f187-b786-4410-8869-2218f6b591df/events/{eventId}
Content-Type: application/json

{
  "name": "Updated Event Name",
  "entryFee": 150,
  "prizePool": 15000,
  "description": "Updated description"
}
```

### Assign Staff
```bash
POST /api/organization/cc06f187-b786-4410-8869-2218f6b591df/events/{eventId}/staff
Content-Type: application/json

{
  "staffId": "staff-member-id",
  "role": "Referee",
  "responsibility": "Main court supervision"
}
```

### Delete Event
```bash
DELETE /api/organization/cc06f187-b786-4410-8869-2218f6b591df/events/{eventId}
```

## ✅ Verification Checklist

- [ ] Can login to organization dashboard
- [ ] Events tab loads with 6 events
- [ ] Total events, registrations, and revenue stats display
- [ ] Can click "View Details" on an event
- [ ] Event detail page shows all information
- [ ] Can edit event and changes save
- [ ] Can view all registered members in table
- [ ] Can assign staff to event
- [ ] Can view assigned staff
- [ ] Revenue calculation is correct (members × fee)
- [ ] Event status shows correct state (Upcoming/Ongoing/Completed)
- [ ] Can delete event from dashboard
- [ ] API endpoints return correct data formats

## 🐛 Troubleshooting

### Events not showing?
1. Verify you're logged in as organization admin
2. Check organization ID matches
3. Ensure database was seeded (`npm run seed`)

### Edit not working?
1. Make sure you're authorized (owner or admin)
2. Check browser console for errors
3. Verify API endpoint is accessible

### Staff assignment failing?
1. Verify staffId exists in database
2. Check authorization headers
3. Look for error message in response

### Refresh for live updates:
- After edit: Page updates automatically
- After delete: Return to list to refresh
- For new assignments: Refresh the event detail page

## 📞 Support

If you encounter issues:
1. Check browser console (F12) for JS errors
2. Check terminal for server errors
3. Verify database connection
4. Ensure all migrations are applied (`npm run migrate`)
