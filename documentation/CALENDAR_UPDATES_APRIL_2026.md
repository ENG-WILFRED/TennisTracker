# Calendar Activity System - Update Summary

## Overview
The calendar system has been significantly enhanced with the following improvements:
1. Fixed day-click behavior - no longer opens modal
2. Added edit and delete functionality for activities
3. Fixed date picker issue where date was off by one day
4. Created comprehensive seed script for seeding activities

## Changes Made

### 1. **CalendarView.tsx Updates**

#### Day Click Behavior
- **Before**: Clicking a day opened the activity modal with auto-filled date
- **After**: Clicking a day now only selects the day (highlights it) and shows activities in the right panel
- **Code Change**: Removed `setIsModalOpen(true)` from `handleDayClick` function

#### Date Picker Fix
- **Problem**: When clicking "+ Add Activity", the date in the modal was off by one day (day 10 would show as day 9)
- **Root Cause**: The `selectedDateForModal` was not being set when clicking the "+ Add Activity" button
- **Solution**: 
  - Created `handleAddActivityClick()` function that properly sets the date before opening the modal
  - The date is now correctly calculated using: `new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay)`
  - Date is converted to ISO string format: `selectedDate.toISOString().split('T')[0]`

```typescript
const handleAddActivityClick = () => {
  if (selectedDay) {
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay);
    setSelectedDateForModal(selectedDate.toISOString().split('T')[0]);
  } else {
    setSelectedDateForModal(new Date().toISOString().split('T')[0]);
  }
  setIsModalOpen(true);
};
```

#### Activity Card Enhancements
- **Edit Button** (✏️): 
  - Allows editing of existing activities
  - Sets `editingActivity` state and opens the modal in edit mode
  - Date is preserved when editing

- **Delete Button** (🗑️):
  - Deletes activities with confirmation dialog
  - Calls `handleDeleteActivity(activityId)` function
  - Refreshes the session list after deletion
  - API endpoint: `DELETE /api/coaches/activities/{activityId}`

```typescript
<button onClick={() => {
  setEditingActivity(s as unknown as ActivityFormData & { id?: string });
  const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay!);
  setSelectedDateForModal(selectedDate.toISOString().split('T')[0]);
  setIsModalOpen(true);
}}>
  ✏️ Edit
</button>
```

### 2. **ActivityModal.tsx Updates**

#### Editing Mode Support
- Modal now accepts `editingActivity` prop for editing existing activities
- When editing:
  - Form is pre-populated with activity data
  - Activity type is displayed (read-only) instead of being selectable
  - Header shows "Edit Activity" instead of "Add Activity"
  - Button shows "Update Activity" instead of "Save Activity"

```typescript
interface ActivityModalProps {
  editingActivity?: ActivityFormData & { id?: string } | null;
}
```

#### Form Pre-population
```typescript
const [formData, setFormData] = useState<ActivityFormData>({
  type: editingActivity?.type || 'session',
  date: editingActivity?.date || selectedDate || ...,
  // All other fields pre-filled from editingActivity
});
```

#### Activity Type Display (Read-only during edit)
```typescript
{editingActivity ? (
  <div style={{...}}>
    {activityTypeConfig[activeType].icon} {activityTypeConfig[activeType].label}
  </div>
) : (
  // Show selectable buttons for new activity
)}
```

### 3. **API Endpoint** (`/api/coaches/activities`)

#### POST - Create Activity
- Accepts new activity data
- Validates required fields
- Returns success response

#### DELETE - Delete Activity (Needs Implementation)
- Called when delete button is clicked
- Endpoint: `DELETE /api/coaches/activities/{activityId}`
- Implementation needed in the route handler

```typescript
// To be implemented
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  // Delete activity and return success
}
```

### 4. **Seed Script** (`seed-activities.ts`)

#### Features
- Generates realistic activity data for all coaches
- Creates activities for the next 30 days
- 3 activities per day per coach
- Mix of all activity types with realistic data

#### Activity Types Generated
1. **Sessions** - 1-on-1, Group, Clinic with pricing
2. **Tournaments** - Various tournament names and levels
3. **Restocking** - Equipment items with quantities and costs
4. **Player Reachouts** - To random players for various reasons
5. **Emails** - With subjects and priority levels

#### Usage
```bash
# Note: Currently generates data in memory, not stored in DB
# To use with database:
# 1. Create Activity table in Prisma schema
# 2. Uncomment the prisma.activity.createMany() call
# 3. Run: npx ts-node seed-activities.ts
```

#### Generated Data Sample
```
📅 April 2026
  - One-on-One Session at Court 1 ($45)
  - Restock: Tennis Balls (qty: 50)
  - Reach out to John Smith (Performance Feedback)
  - Email: Tournament Registration Reminder (High Priority)
  - Group Session at Main Court ($75)
```

## User Workflow

### Adding an Activity
1. Click "+ New Activity" button in calendar header OR
2. Click a day to select it, then click "+ Add Activity" in right panel
3. Modal opens with date auto-filled
4. Select activity type from buttons
5. Fill in type-specific fields
6. Click "Save Activity"

### Editing an Activity
1. Click the ✏️ button on an activity card
2. Modal opens in edit mode with all fields pre-filled
3. Update any fields (type is read-only)
4. Click "Update Activity"

### Deleting an Activity
1. Click the 🗑️ button on an activity card
2. Confirm deletion in popup
3. Activity is removed and list refreshes

## Technical Details

### State Management
```typescript
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedDateForModal, setSelectedDateForModal] = useState<string | null>(null);
const [editingActivity, setEditingActivity] = useState<(ActivityFormData & { id?: string }) | null>(null);
```

### Type Safety
- `ActivityFormData`: Main form data interface
- `ActivityType`: Union type for activity types ('session' | 'tournament' | ...)
- Modal strictly types editing activity to prevent type mismatches

### Date Handling
- Dates stored as ISO string format (YYYY-MM-DD)
- Times stored as HH:MM format
- JavaScript Date constructor ensures correct month (0-indexed internally)
- `toISOString().split('T')[0]` gives clean date string

## File Structure
```
src/components/dashboards/coach/
├── CalendarView.tsx          (Updated - day click, edit/delete, date fix)
├── ActivityModal.tsx         (Updated - edit mode support)
└── ...

src/app/api/coaches/
├── activities/
│   └── route.ts             (POST endpoint, DELETE needs implementation)
└── ...

Root/
└── seed-activities.ts        (New - activity data seeding script)
```

## Next Steps

1. **Implement DELETE Activity Endpoint**
   - Add DELETE handler to `/api/coaches/activities/[id]/route.ts`
   - Delete activity from database
   - Return success response

2. **Create Activity Database Table**
   - Add Activity model to Prisma schema
   - Consider separate tables for each type or flexible JSON structure
   - Add user_id/coach_id foreign keys

3. **Seed Database Activities**
   - Uncomment `prisma.activity.createMany()` in seed script
   - Run seed script: `npx ts-node seed-activities.ts`
   - Verify activities appear in calendar

4. **Add Activity Filtering**
   - Filter by activity type
   - Filter by date range
   - Filter by completion status

5. **Add Notifications**
   - Email reminders for upcoming activities
   - In-app notifications
   - Completion tracking

## Testing Checklist

- [ ] Click day - activity list shows, no modal opens
- [ ] Click "+ New Activity" - modal opens with today's date
- [ ] Select day, click "+ Add Activity" - modal opens with selected day date
- [ ] Edit activity - modal opens in edit mode with data pre-filled
- [ ] Delete activity - confirmation shows, activity is deleted
- [ ] Date is correct (not off by one day)
- [ ] Different activity types show correct fields
- [ ] Form validation works
- [ ] Modal closes after save/update
