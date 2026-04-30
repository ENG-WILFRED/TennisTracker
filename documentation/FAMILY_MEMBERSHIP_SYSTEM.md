# Family Membership System Documentation

## Overview

The Family Membership System allows:
- **Parents/Guardians** to manage their kids' memberships within organizations
- **Kids** to inherit membership from their parents/guardians
- **Independent Players** to have standalone memberships
- **Coaches** to be mandatorily assigned to organizations

## Database Schema

### Guardian Model

```prisma
model Guardian {
  id             String      @id @default(uuid())
  guardianId     String      // User ID of parent/guardian
  dependentId    String      // User ID of child/dependent
  relationship   String      // 'parent', 'guardian', 'legal_guardian'
  isApproved     Boolean     @default(false)
  approvedAt     DateTime?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  
  guardian       User        @relation("Guardian", fields: [guardianId], references: [id], onDelete: Cascade)
  dependent      User        @relation("Dependent", fields: [dependentId], references: [id], onDelete: Cascade)

  @@unique([guardianId, dependentId])
}
```

### User Model Updates

```prisma
model User {
  // ... existing fields ...
  
  // Guardian relationships
  guardianOf   Guardian[] @relation("Guardian")  // Children this user is guardian for
  guardians    Guardian[] @relation("Dependent")  // Parents/guardians of this user
}
```

## Core Features

### 1. Parent-Child Relationships

Parents can add their kids to the system, creating a guardian relationship:

```typescript
import { addDependent } from '@/actions/guardians';

// Parent adds their child
await addDependent(
  parentId,
  childId,
  'parent' // relationship type
);
```

### 2. Inherited Membership

Kids automatically inherit their parent's organization memberships:

```typescript
import { getInheritedMemberships } from '@/actions/guardians';

// Get all orgs child has access to through parent
const inheritedMemberships = await getInheritedMemberships(childId);

// Example response:
// [
//   {
//     orgId: 'org-123',
//     orgName: 'Tennis Club A',
//     status: 'accepted',
//     inheritedFrom: 'John Doe',
//     inheritedFromUserId: 'parent-id'
//   }
// ]
```

### 3. Login Flow with Inherited Membership

When a kid logs in, they automatically get access to their parent's organizations:

```typescript
// Login returns available roles including inherited memberships
{
  role: 'member',
  orgId: 'org-123',
  orgName: 'Parent Organization',
  status: 'accepted',
  inheritedFrom: 'John Doe'
}
```

### 4. Coach Organization Requirement

All coaches MUST belong to an organization. The system enforces this:

```typescript
import { validateCoachHasOrg, assignCoachToOrg } from '@/actions/staff';

// Validate coach has org
const validation = await validateCoachHasOrg(coachId);
if (!validation.hasOrg) {
  // Assign coach to organization
  await assignCoachToOrg(coachId, orgId);
}
```

## API Actions

### Guardian Management

#### `addDependent(guardianId, dependentId, relationship)`
- Adds a child to a parent's account
- Auto-approves when parent adds their own child
- Returns the guardian relationship

#### `removeDependent(guardianId, dependentId)`
- Removes a child from a parent's account
- Cascades deletions

#### `getDependents(guardianId)`
- Get all children of a guardian
- Returns approved dependencies only

#### `getGuardians(dependentId)`
- Get all parents/guardians of a child
- Returns approved relationships only

#### `getInheritedMemberships(dependentId)`
- Get all organization memberships a child inherits from parents
- Includes inheritance source information

#### `hasInheritedOrgAccess(userId, orgId)`
- Check if child can access an org through parent
- Returns boolean

### Coach Management

#### `validateCoachHasOrg(coachId)`
- Verify coach has organization assigned
- Returns: `{ hasOrg: boolean, orgId?, orgName? }`

#### `assignCoachToOrg(coachId, orgId)`
- Assign coach to organization
- Creates membership record automatically
- Returns updated coach

#### `getCoachesWithoutOrg()`
- Get all coaches missing organization assignment
- Useful for admin dashboards

#### `getOrgCoaches(orgId)`
- Get all coaches in an organization
- Returns coach details with user info

#### `isCoachInPlayerOrg(coachId, playerId)`
- Check if coach and player share organization
- Considers:
  - Direct organization assignment
  - Membership records
  - Inherited memberships
- Returns boolean

## Login Flow Details

### Step 1: User Logs In
```
POST /api/auth/login
{
  "usernameOrEmail": "username",
  "password": "password"
}
```

### Step 2: System Loads Roles
1. Gets direct memberships
2. Gets club memberships
3. Checks if user is coach (validates org requirement)
4. **NEW:** Gets guardian relationships
5. **NEW:** Loads inherited memberships for kids

### Step 3: Response Includes
```typescript
{
  roles: [
    // Direct roles
    { role: 'member', orgId: 'org-1', orgName: 'Club A', status: 'accepted' },
    
    // Inherited role (for kids)
    { 
      role: 'member', 
      orgId: 'org-1', 
      orgName: 'Club A', 
      status: 'accepted',
      inheritedFrom: 'John Doe'
    },
    
    // Coach role (must have org)
    { role: 'coach', orgId: 'org-1', orgName: 'Club A', status: 'accepted' }
  ],
  tokens: { ... }
}
```

## Migration Steps

### 1. Database Migration
```bash
npx prisma migrate dev --name add_guardian_model
```

### 2. Update Deployment
- Deploy schema changes
- Deploy updated login route
- Deploy new actions files

### 3. Data Migration (Optional)
- If existing data has parent-child info, migrate to Guardian model
- Update player records to reflect relationships

## Usage Examples

### Parent Adding Child

```typescript
// Parent UI
import { addDependent } from '@/actions/guardians';

async function addMyChild(childEmail: string) {
  // First, find the child user by email
  const child = await prisma.user.findUnique({
    where: { email: childEmail }
  });
  
  if (!child) {
    throw new Error('Child not found');
  }
  
  // Add as dependent
  await addDependent(parentId, child.id, 'parent');
}
```

### Coach Org Assignment

```typescript
// Admin dashboard
import { getCoachesWithoutOrg, assignCoachToOrg } from '@/actions/staff';

async function fixCoachesWithoutOrg() {
  const coaches = await getCoachesWithoutOrg();
  
  for (const coach of coaches) {
    // Assign to a default org or prompt for selection
    await assignCoachToOrg(coach.userId, defaultOrgId);
  }
}
```

### Kid Login Experience

```typescript
// When child logs in with inherited membership
const roles = await getUserAvailableRoles(childId);

// Includes:
// 1. Any direct memberships
// 2. All parent's org memberships (inherited)
// 3. Indicator of which parent provided access

// UI can show:
// "You have access through Parent Name"
```

## Validation Rules

1. **Coaches MUST have an organization**
   - Login throws error if coach has no org
   - Admin can't create coach without org assignment

2. **Guardian relationships are unique**
   - Same parent-child pair can only exist once
   - Cascade deletes dependents' memberships if relationship removed

3. **Inherited memberships are read-only**
   - Kids can't modify parent's org membership
   - Parent controls inheritance via guardian relationship

4. **Independent players remain independent**
   - Direct memberships not affected by guardian status
   - Player can have both direct and inherited memberships

## Future Enhancements

1. **Membership request approval flow** - Parents approve kids' membership requests
2. **Age-based access control** - Different memberships for different age groups
3. **Multiple guardians** - Support multiple parents/guardians
4. **Coach delegation** - Coaches can manage dependent's training plans
5. **Billing integration** - Group billing for families
6. **Dashboard widgets** - Family member management UI
