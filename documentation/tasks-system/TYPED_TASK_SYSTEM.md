# Typed Task System - Role-aware Workflow Engine

## Overview

A production-grade task management system that distinguishes between **role-based workflows**:

- **REFEREE**: Event-driven, tournament/match control (complex orchestration)
- **COACH**: Form-driven, structured tasks with submissions (simpler, submission-based)
- **ADMIN**: Template creation and task orchestration

## Architecture

### Core Models

```
TaskTemplate
  ├─ FormSection (for form-based tasks)
  │  └─ FormField
  ├─ Task (multiple instances of the template)
  │  ├─ TaskSubmission (proof of completion)
  │  └─ TaskHistory (audit trail)
```

### Key Principles

1. **Type Safety**: Each task belongs to ONE role
2. **Proof Required**: All completion requires evidence (submission or events)
3. **Lifecycle Clear**: Defined state transitions per role
4. **Extensible**: Easy to add new task types

---

## Data Structures

### TaskTemplate

Defines **what kind of work exists** (created by admin).

```typescript
{
  id: string;
  organizationId: string;
  name: "Manage Tournament" | "Training Plan";
  role: "REFEREE" | "COACH";
  type: "TOURNAMENT_CONTROL" | "TRAINING_PLAN";
  isFormBased: boolean; // false=event-driven (referee), true=form-driven (coach)
  contextFields: string[]; // ["tournamentId", "playerIds"]
  instructions?: string;
  estimatedHours?: number;
  sections?: FormSection[]; // For form-based tasks
}
```

### Task (Instance)

An **actual task assigned to a user**.

```typescript
{
  id: string;
  templateId: string;
  organizationId: string;
  assignedToId: string; // Staff user ID
  assignedById: string; // Admin user ID
  status: "ASSIGNED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  statusHistory: { status, timestamp, changedBy, notes }[];
  context: { tournamentId, playerIds, ...}; // Task-specific data
  dueDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
}
```

### TaskSubmission (Proof)

**Proof of completion for form-based tasks**.

```typescript
{
  id: string;
  taskId: string;
  submittedByUserId: string;
  formData: { fieldName: value, ... };
  pdfUrl?: string; // Generated PDF
  reviewStatus: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "NEEDS_REVISION";
  reviewedByUserId?: string;
  reviewNotes?: string;
}
```

---

## Workflow Flows

### 🔵 COACH FLOW (Form-Driven)

```
Step 1: Admin assigns "Training Plan" task
       ↓
Task Status: ASSIGNED
  - Coach sees task on dashboard
  
Step 2: Coach accepts task
       ↓
Task Status: ACCEPTED
  - Task becomes "Active Work"
  
Step 3: Coach starts working
       ↓
Task Status: IN_PROGRESS
  - Timer starts (if tracking)
  
Step 4: Coach completes work and submits form
       ↓
TaskSubmission Created
  - FormData saved
  - PDF generated
  - ReviewStatus: PENDING_REVIEW
  
Step 5: Admin reviews submission
       ↓
       ├─ APPROVED → Task Status: COMPLETED ✅
       ├─ REJECTED → Task Status: FAILED ❌
       └─ NEEDS_REVISION → Coach resubmits
```

**Key**: Completion = form submission + admin approval

---

### 🟣 REFEREE FLOW (Event-Driven)

```
Step 1: Admin assigns "Manage Tournament"
       ↓
Task Status: ASSIGNED
  - Referee sees tournament assignment
  
Step 2: Referee accepts tournament
       ↓
Task Status: ACCEPTED
  
Step 3: Referee starts tournament
       ↓
Task Status: IN_PROGRESS
  - Referee creates matches
  - Assigns players
  - Runs live match tracking
  
Step 4: Referee manages matches
  During the tournament:
  ├─ Create fixtures
  ├─ Update scores in real-time (LiveMatch)
  ├─ Record incidents
  └─ Mark matches complete
  
Step 5: Referee generates/submits match reports
  ├─ For each completed match
  └─ MatchReport model stores PDF
  
Step 6: AUTOMATIC completion when:
  ├─ All matches finished AND
  └─ All match reports submitted
       ↓
Task Status: COMPLETED ✅
```

**Key**: Completion = derived from tournament finish + all reports submitted

---

## API Endpoints

### Admin: Create Template

```http
POST /api/admin/task-templates

{
  "organizationId": "org-123",
  "template": {
    "name": "Training Plan",
    "role": "COACH",
    "type": "TRAINING_PLAN",
    "isFormBased": true,
    "contextFields": ["playerIds", "schedule"],
    "instructions": "Create a training plan for the assigned players",
    "estimatedHours": 2,
    "sections": [
      {
        "title": "Player Info",
        "fields": [
          {
            "name": "playerIds",
            "label": "Players",
            "type": "select",
            "required": true,
            "options": [...]
          }
        ]
      },
      {
        "title": "Training Schedule",
        "fields": [
          {
            "name": "schedule",
            "label": "Schedule",
            "type": "textarea",
            "required": true
          }
        ]
      }
    ]
  }
}

Response:
{
  "success": true,
  "data": { template object with ID }
}
```

### Admin: Get Templates

```http
GET /api/admin/task-templates?organizationId=org-123&role=COACH

Response:
{
  "success": true,
  "data": [ ...templates ],
  "count": 5
}
```

### Admin: Assign Task

```http
POST /api/admin/tasks/assign

{
  "organizationId": "org-123",
  "assignmentPayload": {
    "templateId": "template-456",
    "assignedToId": "coach-user-789",
    "context": {
      "playerIds": ["player-1", "player-2"],
      "schedule": "Mon/Wed/Fri"
    },
    "dueDate": "2026-04-30T23:59:59Z",
    "notes": "Priority task for Q2"
  }
}

Response:
{
  "success": true,
  "data": { task with status: "ASSIGNED" }
}
```

### Coach: Get Dashboard

```http
GET /api/coach/dashboard

Response:
{
  "success": true,
  "data": {
    "assignedCount": 3,
    "assigned": [ ...tasks ],
    "acceptedCount": 1,
    "inProgressCount": 1,
    "completedCount": 5,
    "submittedForReviewCount": 2,
    "submittedForReview": [ ...submissions ]
  }
}
```

### Coach: Accept Task

```http
PUT /api/coach/tasks/[taskId]

{
  "action": "accept"
}

Response:
{
  "success": true,
  "data": { task with status: "ACCEPTED" },
  "message": "Task accept successful"
}
```

### Coach: Start Work

```http
PUT /api/coach/tasks/[taskId]

{
  "action": "start"
}

Response:
{
  "success": true,
  "data": { task with status: "IN_PROGRESS", startedAt: ... }
}
```

### Coach: Submit Work (with form)

```http
PUT /api/coach/tasks/[taskId]

{
  "action": "submit",
  "payload": {
    "formData": {
      "playerIds": ["player-1", "player-2"],
      "schedule": "Mon 10am, Wed 2pm, Fri 3pm",
      "notes": "Customized for each player"
    }
  }
}

Response:
{
  "success": true,
  "data": { submission object },
  "message": "Work submitted for review"
}
```

### Admin: Get Pending Submissions

```http
GET /api/submissions/pending?organizationId=org-123

Response:
{
  "success": true,
  "data": [ ...submissions with reviewStatus: "PENDING_REVIEW" ],
  "count": 3
}
```

### Admin: Review Submission (Approve)

```http
PUT /api/submissions/[submissionId]

{
  "reviewStatus": "APPROVED",
  "reviewNotes": "Excellent work!"
}

Response:
{
  "success": true,
  "data": { 
    submission with reviewStatus: "APPROVED",
    task now has status: "COMPLETED"
  }
}
```

### Admin: Review Submission (Request Revision)

```http
PUT /api/submissions/[submissionId]

{
  "reviewStatus": "NEEDS_REVISION",
  "reviewNotes": "Please add more detail on conditioning"
}

Response:
{
  "success": true,
  "data": { submission with reviewStatus: "NEEDS_REVISION" }
}
```

### Referee: Get Dashboard

```http
GET /api/referee/dashboard

Response:
{
  "success": true,
  "data": {
    "assignedTournamentsCount": 1,
    "assigned": [ ...tasks ],
    "activeTournamentsCount": 2,
    "active": [ ...tasks in progress ],
    "completedTournamentsCount": 8,
    "pendingReportsCount": 3,
    "pendingReports": [ ...matches needing reports ]
  }
}
```

### Referee: Get Tournament Status

```http
GET /api/referee/tasks/[taskId]

Response:
{
  "success": true,
  "data": {
    "task": { ...task object },
    "tournament": { ...tournament with matches },
    "progress": {
      "totalMatches": 16,
      "completedMatches": 14,
      "progress": 87.5,
      "pendingReports": 2,
      "allReportsSubmitted": false
    }
  }
}
```

### Referee: Start Tournament

```http
PUT /api/referee/tasks/[taskId]

{
  "action": "start"
}

Response:
{
  "success": true,
  "data": { task with status: "IN_PROGRESS" },
  "message": "Tournament task start successful"
}
```

### Referee: Complete Tournament (only when all ready)

```http
PUT /api/referee/tasks/[taskId]

{
  "action": "complete"
}

Response (Success):
{
  "success": true,
  "data": { task with status: "COMPLETED" }
}

Response (Error - incomplete):
{
  "error": "Cannot complete: 2 matches pending completion or reports"
}
```

---

## Database Schema

### Key Tables

```sql
TaskTemplate
├─ id, organizationId, name, role, type
├─ isFormBased, contextFields
├─ instructions, estimatedHours
└─ createdAt, updatedAt

FormSection (Child of TaskTemplate)
├─ id, templateId, title, position
└─ fields: FormField[]

FormField (Child of FormSection)
├─ name, label, type (text, textarea, select, etc)
├─ required, placeholder, validation
└─ options (for select/checkbox)

Task
├─ id, templateId, organizationId
├─ assignedToId, assignedById
├─ status (ASSIGNED, ACCEPTED, IN_PROGRESS, COMPLETED, FAILED)
├─ statusHistory (JSON array of status changes)
├─ context (JSON - task-specific data)
├─ dueDate, startedAt, completedAt
└─ createdAt, updatedAt

TaskSubmission
├─ id, taskId, submittedByUserId
├─ formData (JSON filled form)
├─ pdfUrl, pdfFileName, pdfGeneratedAt
├─ reviewStatus (PENDING_REVIEW, APPROVED, REJECTED, NEEDS_REVISION)
├─ reviewedByUserId, reviewedAt, reviewNotes
└─ submittedAt, updatedAt

TaskHistory
├─ id, taskId
├─ status, action
├─ changedByUserId, notes
└─ createdAt
```

---

## Usage Patterns

### Pattern 1: Create and Assign a Coach Training Plan

```typescript
import { taskTemplateService } from "@/services/task-template.service";
import { taskLifecycleService } from "@/services/task-lifecycle.service";

// Admin: Create template once
const template = await taskTemplateService.createTemplate(
  "org-123",
  {
    name: "Monthly Training Plan",
    role: "COACH",
    type: "TRAINING_PLAN",
    isFormBased: true,
    contextFields: ["playerIds", "month"],
    sections: [
      {
        title: "Athletes",
        fields: [
          {
            name: "playerIds",
            label: "Select Athletes",
            type: "select",
          }
        ]
      }
    ]
  }
);

// Admin: Assign to coach
const task = await taskLifecycleService.assignTask(
  "org-123",
  "admin-user-id",
  {
    templateId: template.id,
    assignedToId: "coach-user-id",
    context: { playerIds: ["p1", "p2"], month: "April 2026" },
    dueDate: new Date("2026-04-30"),
    notes: "H1 planning"
  }
);

// Coach: Accept
await taskLifecycleService.acceptTask(task.id, "coach-user-id");

// Coach: Start and work
await taskLifecycleService.startTask(task.id, "coach-user-id");

// Coach: Submit
import { coachTaskOrchestrator } from "@/services/coach-task.orchestrator";
const submission = await coachTaskOrchestrator.submitWork(
  task.id,
  "coach-user-id",
  {
    formData: {
      playerIds: ["p1", "p2"],
      plan: "Increased conditioning focus..."
    }
  }
);

// Admin: Review
import { taskSubmissionService } from "@/services/task-submission.service";
await taskSubmissionService.approveSubmission(
  submission.id,
  "admin-user-id"
);
// Task now COMPLETED ✅
```

### Pattern 2: Tournament Referee Management

```typescript
import { taskLifecycleService } from "@/services/task-lifecycle.service";
import { refereeTaskOrchestrator } from "@/services/referee-task.orchestrator";

// Admin: Assign tournament
const task = await taskLifecycleService.assignTask(
  "org-123",
  "admin-id",
  {
    templateId: "tournament-template-id",
    assignedToId: "referee-user-id",
    context: { tournamentId: "tourney-456" }
  }
);

// Referee: Accept
await refereeTaskOrchestrator.acceptTournament(task.id, "referee-user-id");

// Referee: Start
await refereeTaskOrchestrator.startTournament(task.id, "referee-user-id");

// Referee: (During tournament)
// - Create matches
// - Run live tracking (separate LiveMatch system)
// - Generate reports

// Referee: Check status
const status = await refereeTaskOrchestrator.getTournamentStatus(
  task.id,
  "referee-user-id"
);
console.log(status.progress); // { totalMatches: 16, completedMatches: 14, ... }

// When ready: Complete
await refereeTaskOrchestrator.completeTournament(task.id, "referee-user-id");
// Task now COMPLETED ✅
```

---

## Features

### ✅ What's Included

1. **Type-safe** - Full TypeScript support
2. **Role separation** - REFEREE and COACH have completely different flows
3. **Audit trail** - Full history of all actions
4. **Status tracking** - Clear lifecycle with state machine
5. **Form schema** - Dynamic forms with validation
6. **PDF generation** - Placeholder for PDF from submission
7. **Review workflow** - Admin approval/rejection with feedback
8. **Event-driven** - Referee completion derived from match events

### 📋 Still TODO

1. **PDF Generation** - Implement actual PDF generation (puppeteer, pdfkit, etc)
2. **Notifications** - Notify users when tasks assigned/reviewed
3. **Permissions** - Add role-based authorization checks
4. **Analytics** - Task completion rates, average time, etc
5. **UI Components** - Form renderer, task cards, dashboards
6. **Search/Filtering** - Advanced task queries
7. **Bulk Operations** - Assign multiple tasks at once
8. **Escalation** - Workflow for overdue tasks

---

## Integration Points

### With Existing Systems

**LiveMatch System**
- Referee task completion triggered by match completion

**MatchReport System**
- Match reports stored in existing `MatchReport` model
- Used to validate tournament task completion

**Organization/Staff Models**
- Tasks assigned to `Staff` (coaches, referees via userId)
- Organization owns task templates

---

## Best Practices

1. **Always verify role** - Check assignee is correct role
2. **Use context** - Store task-specific data in context JSON
3. **Track history** - Always add notes to status changes
4. **Fail gracefully** - Provide clear error messages on invalid transitions
5. **Generate PDFs** - For all coach task submissions (audit trail)
6. **Notify users** - When task transitions happen
7. **Test workflows** - Both COACH and REFEREE paths

---

## Troubleshooting

### "Cannot accept task" error
- Check task status is ASSIGNED
- Verify userId matches assignedToId

### "Cannot complete referee tournament"
- Check all matches finished (status = COMPLETED)
- Check all matches have reports submitted
- Use `canCompleteTournament()` for details

### "Cannot submit form"
- Verify task.template.isFormBased === true
- Check task status is IN_PROGRESS

---

## Next Steps

1. Create UI components for task dashboards
2. Add PDF generation for submissions
3. Implement notification system
4. Add permission checks to all routes
5. Create task templates in admin panel
6. Test end-to-end workflows
