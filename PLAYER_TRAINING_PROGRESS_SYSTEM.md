# Player Training Progress & Coach Rating System

## Overview

This feature enables coaches to rate players after completed training sessions and allows players to view their training progress with detailed performance feedback.

## What Was Implemented

### 1. Database Schema
- **CoachPlayerRating Model**: Tracks coach ratings of players including:
  - Overall rating (1-5)
  - Individual performance metrics (technique, mental, fitness, teamwork)
  - Strengths and areas for improvement
  - Session context and notes

### 2. Components

#### For Players
- **CompletedSessionsView** (`/src/components/players/CompletedSessionsView.tsx`)
  - Displays list of completed sessions
  - Shows coach ratings and feedback
  - Filters by rated/pending sessions
  - Visual progress indicators

- **PlayerProgress** (`/src/components/players/PlayerProgress.tsx`)
  - Shows overall training progress
  - Displays average ratings over time
  - Breaks down performance metrics
  - Trend analysis for last 3 months

#### For Coaches
- **CoachRatingForm** (`/src/components/coaches/CoachRatingForm.tsx`)
  - Modal form for rating players after sessions
  - 5-star ratings for multiple dimensions
  - Text fields for strengths and improvement areas
  - Notes field for additional feedback

- **CoachCompletedSessions** (`/src/components/coaches/CoachCompletedSessions.tsx`)
  - Shows all completed sessions needing ratings
  - Quick access to rate players
  - Visual indicators for unrated sessions

### 3. API Endpoints

#### GET `/api/players/[playerId]/completed-sessions`
Returns all completed sessions for a player with coach ratings

**Response:**
```json
{
  "sessions": [
    {
      "id": "session-id",
      "title": "Serve Training",
      "sessionType": "training",
      "startTime": "2024-05-10T10:00:00Z",
      "coachName": "John Doe",
      "rating": {
        "overallRating": 4.5,
        "strengths": "Great footwork",
        "areasForImprovement": "Volley technique"
      }
    }
  ]
}
```

#### POST `/api/coaches/rate-player`
Coach submits a rating for a player

**Request Body:**
```json
{
  "coachId": "coach-id",
  "playerId": "player-id",
  "sessionId": "session-id",
  "overallRating": 4,
  "techniquRating": 4,
  "mentalRating": 4,
  "fitnessRating": 4,
  "teamworkRating": 4,
  "strengths": "Excellent serve accuracy",
  "areasForImprovement": "Improve backhand consistency",
  "notes": "Great effort in the session"
}
```

#### GET `/api/players/[playerId]/progress`
Returns detailed player progress with ratings analytics

**Response:**
```json
{
  "player": {
    "id": "player-id",
    "name": "John Smith",
    "matchesPlayed": 25,
    "matchesWon": 15,
    "matchesLost": 10
  },
  "stats": {
    "totalCompletedSessions": 10,
    "totalRatedSessions": 8,
    "averageRating": "4.2",
    "averageTechniqueRating": "4.1",
    "averageMentalRating": "4.3"
  },
  "trend": {
    "last3MonthsAverage": "4.3",
    "improvement": "+0.2"
  }
}
```

#### GET `/api/coaches/completed-sessions`
Returns completed sessions for a coach that need ratings

## Integration Guide

### For Player Dashboard

Add to your player dashboard component:

```tsx
import { CompletedSessionsView } from '@/components/players/CompletedSessionsView';
import { PlayerProgress } from '@/components/players/PlayerProgress';

export default function PlayerDashboard({ userId }: { userId: string }) {
  return (
    <div>
      {/* Your existing dashboard content */}
      
      {/* Add these sections */}
      <PlayerProgress playerId={userId} isEmbedded={true} />
      
      <CompletedSessionsView playerId={userId} isEmbedded={true} />
    </div>
  );
}
```

### For Coach Dashboard

Add to your coach dashboard component:

```tsx
import { CoachCompletedSessions } from '@/components/coaches/CoachCompletedSessions';

export default function CoachDashboard({ coachId, orgId }: { coachId: string; orgId?: string }) {
  return (
    <div>
      {/* Your existing dashboard content */}
      
      {/* Add this section */}
      <CoachCompletedSessions coachId={coachId} organizationId={orgId} />
    </div>
  );
}
```

### In Player Profile Page

Add progress tracking to player profile:

```tsx
import { PlayerProgress } from '@/components/players/PlayerProgress';

export default function PlayerProfile({ playerId }: { playerId: string }) {
  return (
    <div>
      {/* Existing profile content */}
      
      {/* Add this tab or section */}
      <PlayerProgress playerId={playerId} />
    </div>
  );
}
```

## Database Migration

Run the migration to add the new CoachPlayerRating model:

```bash
npx prisma migrate dev --name add-coach-player-rating
```

This will:
1. Create the `CoachPlayerRating` table
2. Add relations to `Staff`, `Player`, and `CoachSession` models
3. Create necessary indexes for performance

## Features

### Player Features
✅ View all completed training sessions
✅ See coach feedback and ratings
✅ Track performance metrics over time
✅ Filter sessions by rating status
✅ View improvement trends
✅ Monitor 5 key performance areas:
   - Overall Performance
   - Technique & Skills
   - Mental Toughness
   - Fitness & Stamina
   - Teamwork & Attitude

### Coach Features
✅ View all completed sessions needing ratings
✅ Submit detailed player ratings
✅ Provide specific feedback
✅ Track rating completion status
✅ Add session-specific notes
✅ Rate multiple dimensions of performance

## Usage Flow

### For Coaches
1. Navigate to Coach Dashboard
2. See "Completed Sessions" section
3. Click "Rate" on a session you want to rate
4. Fill out the rating form with:
   - Star ratings for each performance dimension
   - Strengths observed
   - Areas for improvement
   - Any additional notes
5. Submit the rating
6. Rating appears immediately in the player's progress

### For Players
1. Navigate to Player Dashboard
2. View "Completed Sessions" to see all training history
3. Each session shows:
   - Date and coach name
   - Coach rating (if available)
   - Detailed feedback on strengths and improvements
4. View "Training Progress" to see:
   - Average ratings across all sessions
   - Performance breakdown by category
   - 3-month trend and improvement

## Key Features

- **Real-time Updates**: Ratings appear immediately in player progress
- **Multiple Metrics**: Track 5 different performance dimensions
- **Text Feedback**: Coaches can provide detailed written feedback
- **Progress Tracking**: Players can see improvement over time
- **Status Tracking**: See which sessions are awaiting ratings
- **Responsive Design**: Works on desktop and mobile
- **Accessible UI**: High contrast colors and large touch targets

## Future Enhancements

Potential improvements:
1. **Automated Insights**: AI-powered suggestions for improvement areas
2. **Goal Tracking**: Set and track performance goals
3. **Comparison**: Compare performance metrics over different time periods
4. **Benchmarking**: Compare player performance to organization averages
5. **Export**: Download progress reports as PDF
6. **Notifications**: Notify players when new ratings are available
7. **Mobile App**: Native mobile experience for coaches and players
8. **Video Playback**: Link video recordings to specific sessions
9. **Milestone Badges**: Award badges for achieving performance milestones
10. **Parent Access**: Allow parents to view player progress

## Support

For issues or questions:
1. Check the component implementation
2. Verify API endpoints are properly set up
3. Ensure prisma client is configured correctly
4. Check browser console for any errors
