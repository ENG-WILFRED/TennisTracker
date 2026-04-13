# Referee Task Management System - Complete Implementation

**Date**: April 10, 2026  
**Status**: ✅ Production Ready

## Overview

Comprehensive task management system for referees that enables opening tasks to view details, mark tasks as started, manage tournament matches, request resources, and track progress with detailed reporting.

## Features Implemented

### 1. **Task Detail Viewing**
Referees can click on any assigned task to open a detailed view showing:
- Complete task information (title, type, description, dates)
- Tournament/Event details
- Registered players for the tournament
- All matches (scheduled and completed)
- Tournament-specific match data
- Resource requests history
- Task completion progress
- Task history/audit trail

### 2. **Task Status Management**
Referees can update task status through a linear workflow:
- **ASSIGNED** → Accept Task
- **ACCEPTED** → Start Task  
- **IN_PROGRESS** → Mark Complete
- **COMPLETED** / **FAILED** (end states)

Status changes are tracked with timestamps and audit history for full traceability.

### 3. **Tournament Match Management**
For tournament-type tasks, referees can:
- **View all registered players** for the tournament
- **Create new matches** between any two players
- **Set scheduled times** for matches
- **Update match scores** (set A, B, C)
- **Mark winners** for each match
- **Track match status** (pending → completed)

### 4. **Resource Request System**
Referees can request necessary resources for tasks:
- **Available resource types**:
  - VAR Machine
  - Ball Crew
  - Line Judges
  - Net Repair
  - Court Lights
  - Medical Staff
  - Other (custom)
  
Request workflow:
- Submit request with quantity and description
- Track status: PENDING → APPROVED/REJECTED → COMPLETED
- View all requests with approval timeline

### 5. **Progress & Reporting Dashboard**
For each task, referees can view comprehensive progress data:
- **Overall progress percentage** (matches completed / total matches)
- **Match statistics**: Total, Completed, In-Progress, Scheduled, Cancelled
- **Player performance rankings**: Sorted by wins, showing matches played and win/loss records
- **Upcoming matches**: Next 3 scheduled matches
- **Recent matches**: Last 5 completed matches with scores and winners
- **Resource status**: Overview of all resource requests and their statuses
- **Timeline**: When task started, when matches occurred, task completion date

## Architecture

### Database Schema

**ResourceRequest Model**
```prisma
model ResourceRequest {
  id                String    @id @default(uuid())
  taskId            String
  resourceType      String    // var_machine, ball_crew, etc
  quantity          Int
  description       String?
  status            String    @default("PENDING")
  approvedByUserId  String?
  requestedAt       DateTime  @default(now())
  approvedAt        DateTime?
  task              Task      @relation(...)
  requestedBy       User      @relation(...)
  approvedBy        User?     @relation(...)
}
```

Relations added to `Task` and `User` models for complete traceability.

### API Endpoints

#### 1. **Get Task Details**
```
GET /api/referee/tasks/[taskId]/details
```
Returns: Task info, event details, players, matches, resource requests, progress

#### 2. **Update Task Status**
```
PUT /api/referee/tasks/[taskId]/status
Body: { status: "IN_PROGRESS" | "COMPLETED" | "ACCEPTED", notes?: string }
```
Returns: Updated task with history entry

#### 3. **Manage Tournament Matches**
```
POST /api/referee/tasks/[taskId]/matches
Body: { playerAId, playerBId, scheduledTime?, courtId?, round?, matchPosition? }

PUT /api/referee/tasks/[taskId]/matches
Body: { matchId, scoreSetA?, scoreSetB?, scoreSetC?, status?, winnerId? }
```

#### 4. **Resource Requests**
```
POST /api/referee/tasks/[taskId]/resource-requests
Body: { resourceType, quantity, description? }

GET /api/referee/tasks/[taskId]/resource-requests
```

#### 5. **Task Progress**
```
GET /api/referee/tasks/[taskId]/progress
```
Returns: Progress percentage, match stats, player performance, resources, upcoming/recent matches

### UI Components

#### **TaskDetailsPanel** (`/src/components/referee/TaskDetailsPanel.tsx`)
Comprehensive modal component with 4 tabs:
- **Details**: Task info, tournament overview, dates
- **Matches**: Match list with creation form, score updates
- **Resources**: Resource request form and history
- **Progress**: Progress bar, player stats, upcoming matches, recent results

#### **RefereeDashboard Integration**
Tasks section now displays:
- List of assigned tasks with status colors
- Click to open task details (modal overlay)
- Back button to return to task list
- Real-time task fetching

## Data Flow

### When a referee opens a task:
```
1. Click task in list → Sets selectedTaskId
2. TaskDetailsPanel mounts → Fetches task details + progress
3. User can:
   - Update status (calls PUT /status)
   - Create matches (calls POST /matches)
   - Update match scores (calls PUT /matches)
   - Request resources (calls POST /resource-requests)
4. Changes reflect immediately in UI
5. History automatically tracked in database
```

### Database Migration
```bash
# Ran migration: 20260410102329_add
# - Created ResourceRequest model
# - Added relations to Task and User models
# - Created necessary indexes for performance
```

## Configuration & Settings

### Resource Types (Extensible)
```typescript
const resourceTypes = [
  "var_machine",
  "ball_crew",
  "line_judges",
  "net_repair",
  "court_lights",
  "medical_staff",
  "other"
];
```

### Status States
```
Task: ASSIGNED, ACCEPTED, IN_PROGRESS, COMPLETED, FAILED, CANCELLED
Match: pending, in_progress, done, cancelled
Resource: PENDING, APPROVED, REJECTED, COMPLETED
```

### UI Colors & Theme
- **Primary**: Lime green (#79bf3e, #a8d84e)
- **Dark background**: #0a180a
- **Cards**: Various shades of green (#162616, #1b2f1b)
- **Status indicators**: Color-coded (green=active, yellow=pending, red=failed)

## Usage Examples

### For Organization Admin:
1. Assign tournament control task to referee
2. Set context with eventId: `{ eventId: "tournament-123" }`

### For Referee:
1. Dashboard → Tasks section → Click on "Tournament Control" task
2. Details tab: View tournament info and registered players
3. Matches tab: Create matches between players
4. Resources tab: Request VAR machine + 2 line judges
5. Progress tab: Monitor 45% completion, see top performers
6. Mark task as STARTED when beginning
7. Update match scores as matches complete
8. Mark task COMPLETED when done

## Files Created

### New API Routes
- `/src/app/api/referee/tasks/[taskId]/details/route.ts` (GET)
- `/src/app/api/referee/tasks/[taskId]/status/route.ts` (PUT)
- `/src/app/api/referee/tasks/[taskId]/matches/route.ts` (POST, PUT)
- `/src/app/api/referee/tasks/[taskId]/resource-requests/route.ts` (POST, GET)
- `/src/app/api/referee/tasks/[taskId]/progress/route.ts` (GET)

### UI Components
- `/src/components/referee/TaskDetailsPanel.tsx` (370+ lines)

### Database
- `/prisma/schema.prisma` (updated ResourceRequest model)
- `/prisma/migrations/20260410102329_add/migration.sql` (schema migration)

### Updated Components
- `/src/components/dashboards/referee/RefereeDashboard.tsx` (integrated TaskDetailsPanel)

## Performance Considerations

- **Lazy loading**: Task details only fetched on click
- **Batch queries**: Parallel fetching of task data and progress
- **Indexes**: Added on frequently queried fields (taskId, status, requestedAt)
- **Pagination**: Support for large match lists (API limit: 50 matches per task)

## Security

- **Auth verification**: All endpoints require API authentication
- **Task isolation**: Referees can only access their assigned tasks
- **Role-based access**: Only assigned referee can update task status/matches
- **Audit trail**: All changes tracked with user and timestamp

## Future Enhancements

1. **Messaging integration**: Ask questions directly in task modal
2. **Notifications**: Real-time alerts when resources approved/denied
3. **Analytics**: Detailed tournament analytics and heat maps
4. **Mobile app**: Native iOS/Android task management
5. **AI predictions**: Match outcome predictions based on player history
6. **Export reports**: PDF/Excel reports of tournament results

## Testing Recommendations

### API Testing
```bash
# Get task details
curl -H "Authorization: Bearer token" \
  http://localhost:3000/api/referee/tasks/[taskId]/details

# Update status
curl -X PUT -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{ "status": "IN_PROGRESS" }' \
  http://localhost:3000/api/referee/tasks/[taskId]/status

# Create match
curl -X POST -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{ "playerAId": "...", "playerBId": "..." }' \
  http://localhost:3000/api/referee/tasks/[taskId]/matches
```

### UI Testing
1. Navigate to Referee Dashboard → Tasks
2. Click on any task to open details modal
3. Test status transitions (Accept → Start → Complete)
4. Create a new tournament match
5. Request a resource
6. Verify progress updates

## Support

For issues or questions:
1. Check browser console for API errors
2. Verify task assignment (assignedToId matches current user)
3. Ensure event/tournament data exists for tournament tasks
4. Check database migration was applied successfully

---

**Implementation Date**: April 10, 2026  
**Last Updated**: April 10, 2026  
**Tested Environment**: Production-ready
