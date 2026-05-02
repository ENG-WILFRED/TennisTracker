# Referee Task Management - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Referee user account created and linked to an organization
- Task assigned with context containing `eventId` (for tournament tasks)
- Database migrations applied (Prisma Migrate completed)

### Running the System

#### 1. **Access the Referee Dashboard**
```
Navigate to: /dashboard/referee/[refereeId]
```

#### 2. **Go to Tasks Tab**
- Click the **Tasks (✓)** tab in sidebar
- View list of assigned tasks
- Click on any task to open details

#### 3. **Task Workflow**

**Step 1: Accept Task**
```
1. Open task details modal
2. You see current status: "ASSIGNED"
3. Click "Accept Task" button
4. Status changes to: "ACCEPTED"
```

**Step 2: Start Task**
```
1. With status "ACCEPTED"
2. Click "Start Task" button
3. Status changes to: "IN_PROGRESS"
4. startedAt timestamp is recorded
```

**Step 3: Manage Tournament Matches** (if tournament task)
```
Matches Tab:
1. See progress bar showing match completion
2. Click "New Match" button
3. Select Player A and Player B from dropdown
4. Optionally set scheduled time
5. Click "Create Match"
6. Match appears in list immediately
```

**Step 4: Update Match Scores**
```
Click on any match to edit:
1. Enter Set A score (e.g., "6")
2. Enter Set B score (e.g., "4")
3. Mark winner (if needed)
4. Change status to "done"
5. Click update button
```

**Step 5: Request Resources**
```
Resources Tab:
1. Click "Request Resource" button
2. Select resource type:
   - VAR Machine
   - Ball Crew
   - Line Judges
   - Net Repair
   - Court Lights
   - Medical Staff
   - Other
3. Enter quantity needed
4. Add optional description
5. Click "Submit Request"
6. Track approval status in resource list
```

**Step 6: View Progress**
```
Progress Tab shows:
- Overall completion % (based on completed matches)
- Match statistics breakdown
- Top performers by wins
- Upcoming matches (next 3 scheduled)
- Recent match results
- Resource request status summary
```

**Step 7: Complete Task**
```
1. With status "IN_PROGRESS"
2. Navigate to Details tab
3. Click "Mark Complete" button
4. Status changes to: "COMPLETED"
5. completedAt timestamp is recorded
```

## 📋 Common Scenarios

### Scenario 1: Managing a Tournament

1. **Receive assignment**: "Tournament Control" task with event ID
2. **Open task**: Click task in list
3. **Review**: See all 32 registered players in Details tab
4. **Create All Matches**: 
   - Go to Matches tab
   - Create 16 first-round matches
5. **Update during tournament**:
   - As matches complete, update scores
   - Mark winners
6. **Track Progress**: 
   - Watch progress % increase in Progress tab
   - Identify top performers
7. **Request Resources**: Ask for VAR machine and extra line judges
8. **Complete**: When all matches done, mark task complete

### Scenario 2: Incident Investigation

1. **Receive task**: "Player Conduct Investigation" task
2. **Review details**: See investigation parameters in task notes
3. **Request resources**: Ask for video equipment if needed
4. **Update status** as you progress through investigation
5. **Complete**: Mark as completed when investigation finished

### Scenario 3: Line Judges Assignment

1. **Receive task**: "Ball Crew Assignment" task
2. **See players**: Check who needs to be assigned
3. **Request equipment**: Request ball crew and related items
4. **Update matches**: Assign line judges to specific matches
5. **Track**: Monitor completion in Progress tab

## 🔧 Managing Status Transitions

```
ASSIGNED (Initial)
    ↓
ACCEPTED (Click "Accept Task")
    ↓
IN_PROGRESS (Click "Start Task")
    ↓
COMPLETED (Click "Mark Complete")
    or ↓ (if issues)
    FAILED (Only from IN_PROGRESS)
```

**Important**: You can't skip steps. Must go through Accept → Start → Complete in order.

## 📊 Reading the Progress Tab

### Progress Percentage
- Shows overall task completion based on matches
- Formula: (Completed Matches / Total Matches) × 100

### Match Breakdown
- **Total**: All matches in tournament
- **Completed**: Matches with results entered
- **In Progress**: Matches currently being played
- **Scheduled**: Upcoming matches not yet played
- **Cancelled**: Matches that were cancelled

### Player Performance
- Ranked by most wins first
- Shows matches played and win/loss record
- Helps identify standout players

### Resources Summary
- **Pending**: Awaiting approval
- **Approved**: Granted and ready for use
- **Rejected**: Request denied (see notes for reason)

## 🎯 Tips & Best Practices

1. **Accept Immediately**: Accept tasks as soon as assigned to show availability
2. **Schedule in Advance**: Set match times before tournament starts
3. **Update Live**: Update scores during matches for real-time progress
4. **Request Early**: Request resources before match day to ensure availability
5. **Check Timeline**: Use timeline in Progress tab to track tournament flow
6. **Monitor Players**: Watch player performance to identify issues
7. **Document Notes**: Add notes when rejecting tasks or marking failed
8. **Review History**: Check task history for all changes and who made them

## ⚙️ Settings & Options

### Resource Types
You can request any business resource type:
- Standard: VAR Machine, Ball Crew, Line Judges, Lights
- Maintenance: Net Repair, Equipment Cleaning
- Medical: Medical Staff, First Aid Equipment
- Other: Custom resources (specify in description)

### Match Scores
- Enter set scores individually
- Support for 3-set matches (best of 3)
- System automatically calculates winner

### Time Formats
- Dates/times follow your browser's local format
- Times always UTC in database for consistency
- Frontend displays in local timezone

## 🚨 Troubleshooting

### Task won't open
- Verify task is assigned to you
- Check auth token is valid
- Refresh page and try again

### Can't create match
- Verify event has registered players
- Select two different players
- Check both players exist in tournament

### Resource request stuck on PENDING
- Contact organization admin
- Requests may need manual approval
- Check request details for any issues

### Progress not updating
- Refresh the tab
- Verify match status was saved
- Check browser console for errors

### Historical data missing
- History is automatically tracked for all changes
- Check task History section in Details tab
- May need to refresh if recent changes

## 📱 Mobile Access

The task management system is optimized for:
- Desktop: Full feature set
- Tablet: Touch-friendly buttons
- Mobile: Swipe through tabs, simplified view

## 🔐 Privacy & Security

- **Your tasks only**: Can only see tasks assigned to you
- **Audit trail**: All changes logged with timestamp and user
- **Secure**: All data transmitted over HTTPS
- **Personal data**: Protected and never shared without consent

## 📞 Support

If you encounter issues:
1. **Check the logs**: Browser console (F12)
2. **Verify task data**: Ensure event/tournament data exists
3. **Test API**: Use provided curl commands in main documentation
4. **Contact admin**: Report bugs to organization administrator

---

**Last Updated**: April 10, 2026  
**Version**: 1.0  
**Status**: Production Ready ✅
