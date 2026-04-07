# Coach Calendar Activity Modal Implementation

## Overview
The calendar system has been enhanced with a dynamic activity modal that allows coaches to log various types of activities beyond just sessions. This serves as a comprehensive reminder system for managing the coach's schedule.

## Features Implemented

### 1. **Dynamic Activity Modal** (`ActivityModal.tsx`)
A reusable modal component that supports five different activity types:

#### Activity Types:
- **Session** 📚
  - Session type (1-on-1, Group, Clinic)
  - Court/Location
  - Max participants
  - Pricing
  
- **Tournament** 🏆
  - Tournament name
  - Level (Beginner, Intermediate, Advanced, Professional)
  - Location
  
- **Restocking** 📦
  - Item name
  - Quantity
  - Supplier
  - Cost

- **Player Reachout** 📞
  - Player name
  - Player email
  - Reason for reachout (General, Feedback, Schedule, Motivation, Follow-up)

- **Email** ✉️
  - Email subject
  - Priority level (Low, Medium, High)

### 2. **Modal Features**
- **Date Auto-Fill**: When a calendar day is clicked, the selected date automatically fills in the modal
- **Time Selection**: Start and end times can be set for all activities
- **Form Validation**: Required fields are validated before submission
- **Error Handling**: User-friendly error messages displayed in the modal
- **Loading State**: Submit button shows loading state during processing
- **Type-Specific Fields**: The form dynamically shows only relevant fields based on selected activity type

### 3. **Calendar Integration**
- **Modified CalendarView.tsx**:
  - Added modal state management
  - Day clicking now opens the modal with auto-filled date
  - "+ New Activity" button opens modal with today's date
  - "+ Add Activity" button in the right panel opens modal with selected day
  - Modal seamlessly integrates with the calendar UI

### 4. **API Endpoint**
- **POST `/api/coaches/activities`**:
  - Accepts activity data from the modal
  - Validates required fields
  - Stores activity metadata
  - Returns success response

## How to Use

### Opening the Modal

**Method 1: Click a calendar day**
- Click any day in the calendar grid
- Modal opens with that date pre-filled

**Method 2: Use the "+ New Activity" button**
- Click the button in the calendar header
- Modal opens with today's date

**Method 3: Select a day then click "+ Add Activity"**
- Click a day to select it
- Click "+ Add Activity" in the right panel
- Modal opens with the selected day

### Filling Out the Form

1. **Select Activity Type**: Choose from the 5 activity types at the top
2. **Set Date & Time**: 
   - Date is auto-filled based on which day was clicked
   - Set start and end times
3. **Add Title**: Required field describing the activity
4. **Add Description**: Optional notes about the activity
5. **Type-Specific Details**: Fill in relevant fields based on activity type
6. **Submit**: Click "Save Activity"

## Styling
The modal uses the same color scheme as the rest of the dashboard:
- Primary: Lime green (#79bf3e, #a8d84e)
- Accent colors for different types
- Dark theme with borders for visual hierarchy
- Responsive design that works on different screen sizes

## Form Validation
The modal validates:
- ✓ Title is not empty
- ✓ Date is selected
- ✓ Start time is set
- Type-specific validations can be added as needed

## Next Steps for Production

1. **Database Storage**: Implement actual database storage for activities
   - Consider creating separate tables for each activity type or a flexible JSON structure
   - Add user_id/coach_id foreign keys

2. **Activity Viewing**: Create views to display saved activities
   - Daily, weekly, monthly activity summaries
   - Filter by activity type
   - Mark activities as complete

3. **Notifications**: Send reminders for upcoming activities
   - Email reminders
   - In-app notifications
   - Calendar notifications

4. **Activity History**: Track completed activities
   - Show completion status
   - Archive old activities
   - Generate reports/statistics

5. **Integration**: Connect with other systems
   - Sync with external calendars (Google, Outlook)
   - Link tournaments/matches to tournament activities
   - Auto-create reachout reminders from player profiles

## File Structure
```
src/components/dashboards/coach/
├── CalendarView.tsx       (Updated - integrated modal)
├── ActivityModal.tsx       (New - dynamic activity form)
└── ...

src/app/api/coaches/
└── activities/
    └── route.ts           (New - API endpoint)
```

## Component Props

### ActivityModal Props
```typescript
interface ActivityModalProps {
  isOpen: boolean;                           // Modal visibility
  selectedDate: string | null;               // Pre-filled date (YYYY-MM-DD)
  onClose: () => void;                       // Close handler
  onSave: (data: ActivityFormData) => Promise<void>;  // Save handler
  coachId: string;                           // Coach identifier
}
```

### ActivityFormData
```typescript
interface ActivityFormData {
  type: ActivityType;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  // Type-specific fields...
}
```

## Example Usage in CalendarView

```typescript
const handleActivitySave = async (formData: ActivityFormData) => {
  const response = await fetch('/api/coaches/activities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...formData, coachId }),
  });
  // Handle response...
};

<ActivityModal
  isOpen={isModalOpen}
  selectedDate={selectedDateForModal}
  onClose={() => setIsModalOpen(false)}
  onSave={handleActivitySave}
  coachId={coachId}
/>
```

## Design Highlights

1. **User-Friendly**: Clear activity type icons and colors
2. **Responsive**: Works on different screen sizes
3. **Accessible**: Proper form labels and error messages
4. **Consistent**: Matches dashboard design language
5. **Extensible**: Easy to add new activity types or fields
