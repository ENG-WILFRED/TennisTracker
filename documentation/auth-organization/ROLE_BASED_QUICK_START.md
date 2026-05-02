# Quick Start: Role-Based System

## 5-Minute Setup

### 1. System is Already Integrated ✓

The role-based system has been fully integrated into TennisTracker:
- ✅ Login flow detects and routes to role selection
- ✅ Dashboards are role-specific
- ✅ Navigation changes based on role
- ✅ Route protection enforces permissions

### 2. Test the System

#### Login with a Player Account
```
1. Go to /login
2. Enter player credentials
3. If user has multiple roles, select a role
4. Land on Player Dashboard (Blue theme)
```

#### Switch Roles
```
1. From any dashboard, click your role in the top navigation
2. Select a different role you have access to
3. Dashboard updates immediately with new role's interface
```

### 3. Using Role Features in Components

#### Access Current Role
```tsx
import { useRole } from '@/context/RoleContext';

function MyComponent() {
  const { currentRole, getRoleColor } = useRole();
  
  return <div className={getRoleColor().primary}>
    Current: {currentRole}
  </div>;
}
```

#### Check Permissions
```tsx
import { useHasPermission } from '@/context/RoleContext';

function DeleteButton() {
  const canDelete = useHasPermission('manage_members');
  return <button disabled={!canDelete}>Delete</button>;
}
```

#### Protect a Page
```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';

function AdminPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'org']}>
      <AdminContent />
    </ProtectedRoute>
  );
}
```

## Role Colors Quick Reference

Use these classes in your components:

```typescript
// Primary colors
bg-blue-600      // Player
bg-green-600     // Coach
bg-red-600       // Admin
bg-purple-600    // Finance Officer
bg-yellow-600    // Referee
bg-indigo-600    // Organization Owner
bg-gray-600      // Spectator

// Use role colors dynamically
const { getRoleColor } = useRole();
<div className={getRoleColor().primary}>Colored by role</div>
```

## Creating Role-Specific Pages

### Step 1: Create Protected Page

```tsx
// src/app/admin/page.tsx
'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useRole } from '@/context/RoleContext';

export default function AdminPage() {
  const { getRoleColor, getRoleConfig } = useRole();
  const color = getRoleColor();
  const config = getRoleConfig();

  return (
    <ProtectedRoute requiredRoles={['admin', 'org']}>
      <div className={`${color.primary} text-white p-8 rounded-lg`}>
        <h1>{config.displayName} Dashboard</h1>
        {/* Your content */}
      </div>
    </ProtectedRoute>
  );
}
```

### Step 2: Add Route to Navigation

Edit `src/components/navigation/RoleBasedNavigation.tsx`:

```typescript
// In getNavItems() switch statement
case 'admin':
  items.push(
    // ... existing items
    { label: 'MyNewPage', href: '/admin', icon: '🆕' }
  );
  break;
```

### Step 3: Configure Route Protection

Edit `src/lib/route-protection.ts`:

```typescript
'/admin': {
  requiredRoles: ['admin', 'org'],
  requiredPermissions: ['manage_organization'],
  redirectTo: '/dashboard'
}
```

## Common Patterns

### Conditional Rendering by Role

```tsx
import { useRole } from '@/context/RoleContext';

export function RoleBasedUI() {
  const { currentRole } = useRole();

  return (
    <>
      {currentRole === 'player' && <PlayerFeatures />}
      {currentRole === 'coach' && <CoachFeatures />}
      {currentRole === 'admin' && <AdminFeatures />}
    </>
  );
}
```

### Icon Badges with Role Colors

```tsx
import { useRole } from '@/context/RoleContext';
import { getRoleConfig } from '@/config/roles';

export function RoleBadge() {
  const { currentRole, getRoleColor } = useRole();
  const config = getRoleConfig(currentRole!);
  
  return (
    <span className={`${getRoleColor().badge} px-3 py-1 rounded-full`}>
      {config.icon} {config.name}
    </span>
  );
}
```

### Role-Specific Forms

```tsx
import { getRoleConfig } from '@/config/roles';

export function FormHeader() {
  const { currentRole, getRoleColor } = useRole();
  const config = getRoleConfig(currentRole!);
  
  return (
    <div className={`border-l-4 ${getRoleColor().border} ${getRoleColor().secondary} p-4`}>
      <h2 className={`font-bold ${getRoleColor().text}`}>
        {config.displayName} Form
      </h2>
    </div>
  );
}
```

## Testing Checklist

- [ ] Can login with player account
- [ ] Multiple role selection modal appears for multi-role users
- [ ] Single role users bypass modal
- [ ] Dashboard colors match role
- [ ] Navigation items match role
- [ ] Role switcher only shows for multi-role users
- [ ] Protected routes redirect unauthorized users
- [ ] Permissions enforced correctly
- [ ] Color scheme is consistent across app
- [ ] Mobile navigation is responsive

## Debugging

### Check Current Role
```tsx
import { useRole } from '@/context/RoleContext';

function DebugComponent() {
  const { currentRole, availableRoles, isRoleLoaded } = useRole();
  
  return <pre>{JSON.stringify({
    currentRole,
    availableRoles,
    isRoleLoaded
  }, null, 2)}</pre>;
}
```

### Check localStorage
```javascript
// In browser console
localStorage.getItem('userRole')      // Current role
localStorage.getItem('userRoles')     // Available roles
localStorage.getItem('auth_tokens')   // Auth tokens
```

### Verify Login Response
```javascript
// Add to login handler
console.log('User data:', {
  role: data.user.role,
  availableRoles: data.user.availableRoles
});
```

## Customization

### Add New Role Color

Edit `src/config/roles.ts`:

```typescript
export const ROLE_COLORS: Record<UserRole, RoleConfig['color']> = {
  // ... existing colors
  myRole: {
    primary: 'bg-cyan-600',
    secondary: 'bg-cyan-100',
    text: 'text-cyan-700',
    border: 'border-cyan-300',
    badge: 'bg-cyan-200',
  },
};
```

### Modify Permissions

Edit `src/config/roles.ts`:

```typescript
export const ROLES: Record<UserRole, RoleConfig> = {
  player: {
    // ...
    permissions: [
      // Add new permissions here
      'new_permission',
      // ...
    ],
  },
};
```

### Update Navigation Items

Edit `src/components/navigation/RoleBasedNavigation.tsx` in the `getNavItems()` function to add/remove navigation items for each role.

## API Changes Made

### Login Endpoint

**Old Response:**
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": { "id": "...", "role": "player" }
}
```

**New Response:**
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "id": "...",
    "role": "player",
    "availableRoles": ["player", "coach"]
  }
}
```

## Next Steps

1. **Test all roles** - Create test accounts for each role
2. **Verify permissions** - Test that protected routes work
3. **Customize dashboards** - Add role-specific content to each dashboard
4. **Add integrations** - Connect real data from API to dashboard cards
5. **Style consistency** - Ensure all components use color system

## Support

For issues or questions:
1. Check `ROLE_BASED_SYSTEM.md` for detailed documentation
2. Review component source code in `src/components/dashboards/`
3. Verify role configuration in `src/config/roles.ts`
4. Check browser console for errors

