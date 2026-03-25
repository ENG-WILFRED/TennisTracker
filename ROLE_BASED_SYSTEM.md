# Role-Based Login & Dashboard System

## Overview

This document describes the complete role-based authentication and authorization system implemented in Vico Tennis Management. The system provides role-specific dashboards, navigation, permissions, and color-coded interfaces for different user types.

## Architecture

### 1. Role Configuration (`src/config/roles.ts`)

The role system is centrally configured with the following user roles:

| Role | Icon | Primary Color | Description |
|------|------|---------------|-------------|
| **Player** | 🎾 | Blue (`bg-blue-600`) | Tennis players tracking stats and matches |
| **Coach** | 👨‍🏫 | Green (`bg-green-600`) | Coaches managing students and sessions |
| **Admin** | ⚙️ | Red (`bg-red-600`) | Organization admins managing operations |
| **Finance Officer** | 💰 | Purple (`bg-purple-600`) | Finance staff handling payments |
| **Referee** | 🏆 | Yellow (`bg-yellow-600`) | Match officials managing results |
| **Organization Owner** | 🏛️ | Indigo (`bg-indigo-600`) | Full system access |
| **Spectator** | 👁️ | Gray (`bg-gray-600`) | View-only access |

Each role has:
- **Color scheme**: Primary, secondary, text, border, and badge colors
- **Permissions**: Array of allowed actions
- **Dashboard route**: Dedicated dashboard URL
- **Features**: Role-specific features available

### 2. Authentication Flow

#### Login Process

1. User enters credentials on `/login` page
2. Backend validates credentials against `User` table
3. Backend detects all available roles for the user:
   - Checks `Player` relation
   - Checks `Referee` relation
   - Checks `Staff` relation
   - Checks `Organization.createdBy` (Org owner)
   - Checks `ClubMember.role` (Admin/Finance)

4. **Single Role**: Redirect directly to dashboard
5. **Multiple Roles**: Show `RoleSelection` modal for user to choose
6. Role is stored in:
   - Context state (`RoleContext`)
   - localStorage (`userRole`)
   - Auth context (`user.role`)

#### Role Selection Modal

When a user has multiple roles, they see a styled modal showing:
- Role name and description
- Role icon and color
- Key features for each role
- Selection confirmation

### 3. Context Architecture

#### RoleContext (`src/context/RoleContext.tsx`)

Manages the current user's role and permissions:

```typescript
{
  currentRole: UserRole | null;           // Current selected role
  availableRoles: UserRole[];             // All roles user can access
  setCurrentRole: (role: UserRole) => void;
  hasPermission: (permission: string) => boolean;
  getRoleConfig: (role?: UserRole) => RoleConfig;
  getRoleColor: (role?: UserRole) => RoleColor;
  isRoleLoaded: boolean;
}
```

**Hooks:**
- `useRole()` - Main hook for role context
- `useHasPermission(permission)` - Check specific permission
- `useRoleConfig()` - Get current role configuration
- `useRoleColor()` - Get current role colors
- `withRoleProtection(Component, requiredRole)` - HOC for role protection

#### AuthContext (Updated)

The existing `AuthContext` now includes:
- `user.role` - Current role
- `user.availableRoles` - All available roles

### 4. Dashboard System

#### Role-Specific Dashboards

Each role has a dedicated dashboard component:

| Component | Path | Shows |
|-----------|------|-------|
| `PlayerDashboard` | `/dashboard` (Player) | Matches, stats, coaches, court availability |
| `CoachDashboard` | `/dashboard` (Coach) | Students, sessions, ratings, availability |
| `AdminDashboard` | `/dashboard` (Admin) | Members, events, courts, analytics |
| `FinanceDashboard` | `/dashboard` (Finance) | Revenue, memberships, transactions, reports |
| `RefereeDashboard` | `/dashboard` (Referee) | Assignments, scores, history, certifications |
| `OrganizationDashboard` | `/dashboard` (Org) | All features, settings, billing, roles |

All dashboards feature:
- Role-colored hero section with user photo
- Key statistics cards (4-column grid)
- Quick action buttons (role-specific)
- Detailed information panels
- Color-coded sections matching role colors

### 5. Navigation System

#### RoleBasedNavigation (`src/components/navigation/RoleBasedNavigation.tsx`)

Dynamic navigation bar that:
- Shows role-colored navbar matching current role
- Displays role-specific menu items
- Shows user profile menu with logout
- **Role Switcher**: Dropdown to switch between available roles (appears only if user has multiple roles)
- Responsive design with mobile menu support

**Navigation Items by Role:**
- **Player**: Dashboard, Matches, Players, Coaches, Leaderboard, Chat
- **Coach**: Dashboard, My Students, Schedule, Profile, Chat
- **Admin**: Dashboard, Members, Events, Courts, Rankings, Announcements, Analytics
- **Finance**: Dashboard, Reports, Memberships, Transactions, Invoices
- **Referee**: Dashboard, Assignments, Submit Score, History, Profile
- **Org Owner**: Dashboard, Settings, Members, Analytics, Billing, Roles

### 6. Route Protection

#### Protection Configuration (`src/lib/route-protection.ts`)

Routes are protected with role and permission requirements:

```typescript
// Example
'/organization/members': {
  requiredRoles: ['admin', 'org'],
  requiredPermissions: ['manage_members'],
  redirectTo: '/dashboard'
}
```

Protected routes enforce:
- Role verification
- Permission verification
- Automatic redirection to dashboard if unauthorized

#### ProtectedRoute Component (`src/components/ProtectedRoute.tsx`)

Wrapper component for protecting pages:

```tsx
<ProtectedRoute requiredRoles={['admin', 'org']}>
  <AdminPage />
</ProtectedRoute>
```

**Hooks:**
- `useHasRouteAccess(pathname)` - Check route access
- `useHasRole(...roles)` - Check if user has specific roles

### 7. Layout Integration

#### DashboardLayout (`src/components/DashboardLayout.tsx`)

Wraps all dashboard pages with:
- `RoleBasedNavigation` at top
- Role-contextual content area
- Footer with copyright

#### Root Layout Updated

`src/app/layout.tsx` updated to include:
- `RoleProvider` after `AuthProvider`
- Ensures role context is available app-wide

## Implementation Guide

### Using the Role System

#### Check Current Role

```tsx
import { useRole } from '@/context/RoleContext';

export function MyComponent() {
  const { currentRole, getRoleColor, hasPermission } = useRole();
  
  return (
    <div className={`${getRoleColor().primary} text-white`}>
      Welcome, {getRoleConfig().displayName}!
    </div>
  );
}
```

#### Check Permissions

```tsx
import { useHasPermission } from '@/context/RoleContext';

export function DeleteButton() {
  const hasPermission = useHasPermission('manage_members');
  
  return (
    <button disabled={!hasPermission}>
      Delete Member
    </button>
  );
}
```

#### Protect Routes

```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';

export function AdminPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'org']}>
      <AdminContent />
    </ProtectedRoute>
  );
}
```

#### Switch Roles

```tsx
import { useRole } from '@/context/RoleContext';

export function RoleSwitcher() {
  const { currentRole, availableRoles, setCurrentRole } = useRole();
  
  return (
    <select value={currentRole} onChange={(e) => setCurrentRole(e.target.value as UserRole)}>
      {availableRoles.map(role => (
        <option key={role} value={role}>{role}</option>
      ))}
    </select>
  );
}
```

## Color Codes Reference

```javascript
Player:         Blue (#2563eb)
Coach:          Green (#16a34a)
Admin:          Red (#dc2626)
Finance:        Purple (#a855f7)
Referee:        Yellow (#ca8a04)
Organization:   Indigo (#4f46e5)
Spectator:      Gray (#4b5563)
```

## Database Integration

The role system works with the existing Prisma schema:

- `User` - Base user with all shared fields
- `Player` - Player-specific data
- `Referee` - Referee-specific data
- `Staff` - Coach/staff profiles with `role` field
- `Organization` - Org profiles with `createdBy` field
- `ClubMember` - Organization membership with `role` field
- `OrganizationRole` - Custom roles per organization
- `RolePermission` - Granular permissions per role

## API Integration Points

### Login Endpoint (`/api/auth/login`)

Updated to:
- Return `availableRoles` array
- Return currently selected `role`
- Accept optional `selectedRole` parameter for role-specific login

```typescript
// Request
POST /api/auth/login
{
  usernameOrEmail: "player@example.com",
  password: "password123",
  selectedRole?: "player" // Optional
}

// Response
{
  accessToken: "...",
  refreshToken: "...",
  user: {
    id: "...",
    name: "...",
    role: "player",
    availableRoles: ["player", "coach"],
    ...
  }
}
```

## Future Enhancements

1. **API Authorization**: Add backend middleware to verify role permissions
2. **Advanced Permissions**: Implement granular permission checking in API routes
3. **Role-Based Data Filtering**: Filter API responses by role
4. **Audit Logging**: Track role changes and permission-based actions
5. **Custom Roles**: Allow organizations to create custom roles
6. **Dynamic Permissions**: Load permissions from database instead of hardcoded

## Troubleshooting

### Role Not Persisting

- Check if `localStorage` is enabled
- Verify `RoleProvider` is wrapping your app
- Check browser console for errors

### Redirect Loops

- Verify route protection configuration
- Check if current role has required permissions
- Ensure role is properly loaded (check `isRoleLoaded`)

### Role Color Not Applying

- Verify Tailwind CSS classes match color codes
- Check if custom CSS is overriding Tailwind
- Use `getRoleColor()` hook instead of hardcoding

## Files Created/Modified

### New Files
- `src/config/roles.ts`
- `src/context/RoleContext.tsx`
- `src/components/RoleSelection.tsx`
- `src/components/navigation/RoleBasedNavigation.tsx`
- `src/components/DashboardLayout.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/components/dashboards/PlayerDashboard.tsx`
- `src/components/dashboards/CoachDashboard.tsx`
- `src/components/dashboards/AdminDashboard.tsx`
- `src/components/dashboards/FinanceDashboard.tsx`
- `src/components/dashboards/RefereeDashboard.tsx`
- `src/components/dashboards/OrganizationDashboard.tsx`
- `src/lib/route-protection.ts`
- `src/app/dashboard/layout.tsx`

### Modified Files
- `src/app/api/auth/login/route.ts`
- `src/app/login/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/layout.tsx`

