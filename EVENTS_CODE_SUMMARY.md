# 📝 Events System - Code Changes Summary

## Files Modified

### 1. Frontend Component Updates

#### `/src/components/organization/dashboard-sections/OrganizationEventsSection.tsx` ✏️
**Changed:** Static mock data → Real database events

**What's New:**
- Fetch events from `/api/organization/{orgId}/events`
- Dynamic registration counting
- Status calculation (Upcoming/Ongoing/Completed)
- Real revenue calculations
- View Details, Edit, and Delete buttons
- Loading and error states

**Key Functions:**
```typescript
fetchEvents()  // Fetch from API
handleDeleteEvent()  // Delete with confirmation
getEventStatus()  // Determine event status
```

### 2. New Event Detail Page

#### `/src/app/organization/[id]/events/[eventId]/page.tsx` ✨
**New Component:** Full event management interface

**Features:**
- Event details display with edit capability
- Registration statistics dashboard
- Registrations table with member details
- Event staff/client assignment form
- Revenue tracking

**Components:**
- Event Details Card (edit-enabled)
- Registration Stats Dashboard
- Registrations Table
- Staff Assignment Section

### 3. API Endpoints

#### `/src/app/api/organization/[orgId]/events/[eventId]/route.ts` ✨
**New Endpoints:**

**GET** - Fetch event details
- Includes registrations, bracket, matches, announcements
- Validates organization visibility

**PUT** - Update event
- Authorization check (owner/admin)
- Updatable fields: name, description, dates, fees, etc.
- Returns updated event

**DELETE** - Delete event
- Authorization check (owner/admin)
- Cascades delete related data
- Returns success message

#### `/src/app/api/organization/[orgId]/events/[eventId]/staff/route.ts` ✨
**New Endpoints:** Event staff/client management

**GET** - View assigned staff
- Returns event with all service providers
- Includes provider details

**POST** - Assign staff/client
- Parameters: staffId, role, responsibility
- Creates Service record linking provider to event
- Authorization: owner/admin only

**DELETE** - Remove assignment
- Deletes Service record
- Authorization: owner/admin only

### 4. Database Seeding

#### `/prisma/seeds/events.ts` ✨
**New Script:** Seed events for all organizations

**Functionality:**
- Creates 6 event templates per organization
- Includes diverse event types:
  - Tournaments (future, ongoing, completed)
  - Clinics
  - Coaching sessions
  - Social events
- Auto-registers 2-6 members per event
- Sets realistic dates relative to current date

**Run:** `npx tsx prisma/seeds/events.ts`

---

## Code Architecture

### Component Hierarchy
```
OrganizationDashboard
└── OrganizationEventsSection
    └── Events List with Actions
        ├── View Details (→ EventDetailsPage)
        ├── Edit (inline)
        └── Delete (with confirmation)

EventDetailsPage
├── Event Details Card (editable)
├── Registration Stats Cards
├── Registrations Table
└── Staff Assignment Section
    ├── Assignment Form
    └── Staff List
```

### Data Flow
```
Organization Dashboard
    ↓
GET /api/organization/{orgId}/events
    ↓
OrganizationEventsSection renders list
    ↓
User clicks "View Details"
    ↓
EventDetailsPage loads
    ↓
GET /api/organization/{orgId}/events/{eventId}
    ↓
Display full event details

User edits event
    ↓
PUT /api/organization/{orgId}/events/{eventId}
    ↓
Database updates
    ↓
Component re-fetches and displays

User assigns staff
    ↓
POST /api/organization/{orgId}/events/{eventId}/staff
    ↓
Service record created
    ↓
Staff list updates
```

---

## Database Schema Usage

### Models Used
1. **ClubEvent** - Main event entity
2. **EventRegistration** - Member registrations
3. **Service** - Staff/client assignments
4. **Organization** - Event owner
5. **ClubMember** - Registered participants
6. **ProviderProfile** - Staff/service providers
7. **User** - Core user data

### Queries/Operations

**Fetch Events:**
```prisma
clubEvent.findMany({
  where: { organizationId }
  include: { registrations, services, etc. }
})
```

**Get Event Detail:**
```prisma
clubEvent.findUnique({
  where: { id }
  include: { 
    registrations: { include: { member: { include: { player: { include: { user } } } } } }
    services: { include: { provider } }
  }
})
```

**Create Registration:**
```prisma
eventRegistration.create({
  data: { eventId, memberId, status, signupOrder }
})
```

**Assign Staff:**
```prisma
service.create({
  data: { eventId, providerId, serviceType, description, status }
})
```

---

## State Management

### Component State
- **events** - Array of ClubEvent
- **loading** - Boolean for async operations
- **error** - Error message string
- **editMode** - Boolean for edit form visibility
- **formData** - Event form data (during edit)
- **selectedEvent** - Currently selected event
- **showStaffForm** - Staff assignment form visibility
- **staffForm** - Staff assignment form data

### URL Parameters
- `[id]` - Organization ID
- `[eventId]` - Event ID (in detail page)

---

## Styling Approach

### Color Scheme (from G object)
```typescript
const G = {
  dark: '#0f1f0f',        // Background
  sidebar: '#152515',     // Secondary background
  card: '#1a3020',        // Card background
  cardBorder: '#2d5a35',  // Border
  bright: '#3d7a32',      // Button green
  lime: '#7dc142',        // Accent green
  accent: '#a8d84e',      // Highlight
  text: '#e8f5e0',        // Text
  muted: '#7aaa6a'        // Secondary text
};
```

### Component Spacing
- Large gap: 20px
- Medium gap: 12px
- Small gap: 6-8px
- Padding: 12-20px

---

## Error Handling

### Frontend
- Try/catch blocks for async operations
- User-friendly error messages
- Alert dialogs for confirmations
- Loading states during API calls

### Backend
- Authorization validation
- Organization verification
- 404 for not found
- 403 for unauthorized
- 500 for server errors

---

## Authorization Flow

### Check Organization Owner
```typescript
const isOwner = await prisma.organization.findFirst({
  where: { id: orgId, createdBy: auth.playerId }
});
```

### Check Admin Role
```typescript
const isAdmin = await prisma.clubMember.findFirst({
  where: { 
    organizationId: orgId, 
    playerId: auth.playerId, 
    role: 'admin' 
  }
});
```

### Decide Permission
```typescript
if (!isOwner && !isAdmin) {
  return Response with 403 Forbidden
}
```

---

## Testing Recommendations

### Unit Tests
- Event status calculation
- Revenue calculation
- Date formatting

### Integration Tests
- API endpoint responses
- Database queries
- Authorization checks

### E2E Tests
- Flow: Login → View Events → View Details → Edit → Save
- Flow: Assign Staff → Verify → Remove
- Flow: Delete Event → Confirm absence

---

## Future Extensions

### Potential Additions
1. **Bracket Management** - Auto-generate tournament brackets
2. **Match Scheduling** - Create matches from bracket
3. **Payment Processing** - Charge entry fees
4. **Waitlist** - Queue when capacity reached
5. **Notifications** - Email confirmations/updates
6. **Analytics** - Revenue and attendance reports
7. **Export** - Download event data as CSV/PDF
8. **Bulk Actions** - Batch edit/delete events

### Performance Optimizations
1. Pagination for large event lists
2. Lazy loading of registrations table
3. Caching frequently accessed data
4. Indexed database queries

---

## Integration Points

### Existing Systems
- Organization authentication (uses existing auth)
- Club member system (registrations)
- Staff/Provider profiles (for assignments)
- CourtBooking system (can reference courts)

### Related Features
- Tournament brackets (TournamentBracket model)
- Match scheduling (TournamentMatch model)
- Announcements (TournamentAnnouncement model)
- Payment tracking (PaymentReminder model)

---

**Implementation Date:** March 27, 2026
**Status:** ✅ Complete and Ready for Integration
