# TennisTracker Referee System Summary

## 1. Current Referee Seed Data (MINIMAL)

### Location
- **File**: [prisma/seeds/users.ts](prisma/seeds/users.ts)
- **Status**: Single referee currently seeded inline with user creation

### Current Seed Data
```typescript
{
  username: 'referee_john',
  email: 'john.referee@example.com',
  firstName: 'John',
  lastName: 'Harris',
  phone: '+1-555-4001',
  gender: 'Male',
  dateOfBirth: new Date('1978-10-28'),
  nationality: 'USA',
  bio: 'Professional referee with ITF certification',
  photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80',
  role: 'referee',
  refereeData: {
    matchesRefereed: 87,
    experience: '15 years',
    certifications: ['ITF', 'ATP', 'WTA'],
  },
}
```

### No Dedicated Referee Seed File
- ❌ No `prisma/seeds/referees.ts` file exists
- ❌ Referees are created inline during user seeding only
- ❌ Only 1 referee is currently seeded (john.referee@example.com)

---

## 2. Complete Referee Model Schema

### Location
- **File**: [prisma/schema.prisma](prisma/schema.prisma#L94)

### Full Model Definition
```prisma
model Referee {
  matchesRefereed  Int             @default(0)
  ballCrewMatches  Int             @default(0)
  experience       String?
  certifications   String[]        @default([])
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
  userId           String          @id
  refereedMatches  Match[]         @relation("Referee")
  ballCrewReferees MatchBallCrew[] @relation("BallCrewReferee")
  user             User            @relation(fields: [userId], references: [id])
}
```

### Referee Model Fields
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `userId` | String | (Primary Key) | Foreign key to User model |
| `matchesRefereed` | Int | 0 | Count of matches this referee has officiated |
| `ballCrewMatches` | Int | 0 | Count of matches where referee was in ball crew |
| `experience` | String? | null | Text description of experience (e.g., "15 years") |
| `certifications` | String[] | [] | Array of certification strings (e.g., ["ITF", "ATP", "WTA"]) |
| `createdAt` | DateTime | now() | Record creation timestamp |
| `updatedAt` | DateTime | auto-updated | Last update timestamp |

### Relations
- **To User**: `@relation(fields: [userId], references: [id])` - One-to-one relationship with User model
- **Matches Refereed**: `refereedMatches` - One-to-many relationship with Match model (via "Referee" relation)
- **Ball Crew Matches**: `ballCrewReferees` - One-to-many relationship with MatchBallCrew model (via "BallCrewReferee" relation)

---

## 3. Related Models

### Match Model
**Location**: [prisma/schema.prisma](prisma/schema.prisma#L365)

```prisma
model Match {
  id        String          @id @default(uuid())
  round     Int
  playerAId String
  playerBId String
  refereeId String?
  winnerId  String?
  score     String?
  createdAt DateTime        @default(now())
  group     String?
  playerA   Player          @relation("PlayerA", fields: [playerAId], references: [userId])
  playerB   Player          @relation("PlayerB", fields: [playerBId], references: [userId])
  referee   Referee?        @relation("Referee", fields: [refereeId], references: [userId])
  winner    Player?         @relation(fields: [winnerId], references: [userId])
  ballCrew  MatchBallCrew[]
}
```

**Key Fields for Referees**:
- `refereeId`: Optional FK to Referee (can be null if no referee assigned)
- `referee`: Relation to Referee model
- `ballCrew`: Array of MatchBallCrew entries for this match

### MatchBallCrew Model
**Location**: [prisma/schema.prisma](prisma/schema.prisma#L382)

```prisma
model MatchBallCrew {
  id              String   @id @default(uuid())
  matchId         String
  playerId        String
  refereeId       String?
  match           Match    @relation(fields: [matchId], references: [id])
  player          Player   @relation(fields: [playerId], references: [userId])
  ballCrewReferee Referee? @relation("BallCrewReferee", fields: [refereeId], references: [userId])
}
```

**Purpose**: 
- Represents ball crew assignments during matches
- `refereeId` is optional - allows tracking if a referee was part of ball crew
- Links a match with players serving on ball crew and a potential referee

### Certification Model
**Location**: [prisma/schema.prisma](prisma/schema.prisma#L287)

```prisma
model Certification {
  id        String    @id @default(uuid())
  staffId   String
  name      String
  issuer    String?
  issuedAt  DateTime?
  expiresAt DateTime?
  createdAt DateTime  @default(now())
  staff     Staff     @relation(fields: [staffId], references: [userId], onDelete: Cascade)

  @@unique([staffId, name])
}
```

**Note**: 
- Currently linked to Staff (coaches), NOT Referees
- Referees store certifications as a simple String array on the Referee model
- Could be expanded to link referees as well

---

## 4. How Referees Are Seeded

### Seed Data Structure (from users.ts)
```typescript
interface UserData {
  // ... other fields
  role: 'player' | 'coach' | 'admin' | 'finance_officer' | 'referee' | 'spectator';
  refereeData?: {
    matchesRefereed?: number;
    experience?: string;
    certifications?: string[];
  };
}
```

### Seed Creation Logic (from users.ts)
```typescript
referee:
  userData.role === 'referee'
    ? {
        create: {
          matchesRefereed: userData.refereeData?.matchesRefereed || 0,
          experience: userData.refereeData?.experience,
          certifications: userData.refereeData?.certifications || [],
        },
      }
    : undefined,
```

---

## 5. Coach Seed Data Structure (FOR REFERENCE)

### Location
- **File**: [prisma/seeds/staff.ts](prisma/seeds/staff.ts)
- **File**: [prisma/seeds/users.ts](prisma/seeds/users.ts) (inline with user creation)

### Coach Seed Examples in users.ts

```typescript
{
  username: 'coach_robert',
  email: 'robert.coach@example.com',
  firstName: 'Robert',
  lastName: 'Alexander',
  phone: '+1-555-2001',
  gender: 'Male',
  dateOfBirth: new Date('1975-01-20'),
  nationality: 'USA',
  bio: 'Head coach at Central Tennis Club. 20 years experience.',
  photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80',
  role: 'coach',
  organizationId: organizations[0].id,
  staffData: {
    yearsOfExperience: 20,
    expertise: 'Tennis coaching - singles and doubles',
    coachingLevel: 'Professional',
    certifications: [
      {
        name: 'ITF Level 3',
        issuer: 'International Tennis Federation',
        issuedAt: new Date('2015-06-15'),
        expiresAt: new Date('2027-06-15'),
      },
      {
        name: 'ATP Certified Coach',
        issuer: 'Association of Tennis Professionals',
        issuedAt: new Date('2018-03-10'),
      },
    ],
  },
}
```

### Staff/Coach Creation Logic (from users.ts)
```typescript
staff:
  userData.role === 'coach'
    ? {
        create: {
          role: 'Head Coach',
          contact: userData.email,
          yearsOfExperience: userData.staffData?.yearsOfExperience || 0,
          expertise: userData.staffData?.expertise,
          coachingLevel: userData.staffData?.coachingLevel,
          organizationId: userData.organizationId,
          certifications: {
            createMany: {
              data: userData.staffData?.certifications || [],
            },
          },
        },
      }
    : undefined,
```

---

## 6. How Referees Are Used in Matches

### Match Creation (from prisma/seeds/matches.ts)
```typescript
const match = await prisma.match.create({
  data: {
    round: matchData.round,
    playerAId: playerA.id,
    playerBId: playerB.id,
    winnerId: winner ? winner.id : null,
    refereeId: referee ? referee.id : null,  // Optional referee assignment
    score: matchData.score,
  },
});

// Update referee statistics
if (referee && referee.referee) {
  await prisma.referee.update({
    where: { userId: referee.id },
    data: {
      matchesRefereed: { increment: 1 },  // Increment match count
    },
  });
}
```

### Sample Match Data with Referees
```typescript
{
  playerAEmail: 'marcus.johnson@example.com',
  playerBEmail: 'anna.martinez@example.com',
  winnerEmail: 'marcus.johnson@example.com',
  refereeEmail: 'john.referee@example.com',  // Referee assigned
  score: '6-4, 6-3',
  round: 1,
}
```

---

## 7. Key Differences: Referee vs Coach Models

| Aspect | Referee | Coach (Staff) |
|--------|---------|---------------|
| Certifications Storage | String[] array (simple) | Certification model (composite with issuer, dates) |
| Experience Storage | Single text field | `yearsOfExperience` (Int) + `expertise` field |
| Role Property | N/A (single role) | Flexible `role` field (Head Coach, Assistant, etc.) |
| Organization Link | None | Yes (`organizationId`) |
| Availability | None | Availability model |
| Pricing | None | CoachPricing model |
| Sessions/Bookings | None | CoachSession + SessionBooking models |
| Reviews | None | CoachReview model |
| Stats Tracking | Basic (matchesRefereed, ballCrewMatches) | Advanced (CoachStats, CoachDailyStats) |

---

## 8. Training, Courses, and Certifications

### Current Implementation
- **NO dedicated Training model**
- **NO dedicated Course model**
- **NO explicit Course/Training tracking in Referee model**

### Training-Related Data on Staff Model
```prisma
trainingTypes          String[]         @default([])
playerAgeGroups        String[]         @default([])
skillLevelsTrained     String[]         @default([])
```

### Certifications Approach
- **For Coaches**: Certification model (linked, with issuer and expiration dates)
- **For Referees**: String array on Referee model

---

## 9. Summary of Findings

### ✅ What Exists
1. **Referee Model** - Complete with experience and certifications storage
2. **Match Integration** - Matches can be assigned a referee
3. **Ball Crew Integration** - MatchBallCrew can track referee participation
4. **User Relationship** - Referees linked to User model
5. **Seed Data** - One referee example in users.ts

### ❌ What's Missing
1. **No dedicated referee seed file** - Referees seeded inline only
2. **Minimal seed data** - Only 1 referee seeded
3. **No referee API routes** (likely - would need separate check)
4. **No referee dashboard/features** (likely - would need separate check)
5. **No training/course tracking** - Not yet modeled
6. **No referee certification model** - Uses string array instead

---

## Next Steps for Enhancement

### To Create a Complete Referee System:
1. Create `prisma/seeds/referees.ts` for comprehensive referee seeding
2. Add more referee seed data variations (experience levels, certifications)
3. Consider creating a Certification model for referees (similar to coaches)
4. Add referee rating/review system
5. Track referee performance metrics
6. Create referee availability/scheduling system
7. Add referee assignment automation for matches
