# Staff Dashboard Implementation Guide

## Quick Start

### 1. Access Staff Dashboard
```
URL: /dashboard/staff/{department}/{userId}?org={organizationId}

Example:
/dashboard/staff/finance/user-123?org=org-456
```

### 2. Available Departments
```typescript
'finance' | 'hr' | 'reception' | 'security' | 'maintenance' | 
'inventory' | 'support' | 'marketing' | 'operations'
```

### 3. Available Roles (per department)
```
Finance: finance_manager, finance_officer
HR: hr_manager, hr_officer
Reception: receptionist
Security: security_officer, watchman
Maintenance: maintenance_manager, maintenance_staff
Inventory: inventory_manager
Support: support_manager, support_staff
Marketing: marketing_manager
Operations: operations_manager
```

## Integration with Organization Dashboard

### Step 1: Add Staff Role Dropdown

In `OrganizationDashboard` or staff management section:

```tsx
import { DEPARTMENT_LIST, STAFF_DEPARTMENTS } from '@/config/staff-departments';

// Create staff with role selection
const [selectedDepartment, setSelectedDepartment] = useState('finance');
const [selectedRole, setSelectedRole] = useState('finance_manager');

const departmentConfig = STAFF_DEPARTMENTS[selectedDepartment];
const availableRoles = departmentConfig.roles;

return (
  <div>
    <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
      {DEPARTMENT_LIST.map(dept => (
        <option key={dept} value={dept}>
          {STAFF_DEPARTMENTS[dept].name}
        </option>
      ))}
    </select>

    <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
      {availableRoles.map(role => (
        <option key={role.roleId} value={role.roleId}>
          {role.title}
        </option>
      ))}
    </select>

    {/* Create/Update staff with role */}
  </div>
);
```

### Step 2: Link to Staff Dashboard

```tsx
import Link from 'next/link';

// From organization dashboard
<Link href={`/dashboard/staff/${staffMember.department}/${staffMember.userId}?org=${orgId}`}>
  <button>View {staffMember.role} Dashboard</button>
</Link>
```

## Database Schema Updates Needed

### Add to User/Staff Model

```prisma
model User {
  // ... existing fields
  
  // New fields for staff
  staffDepartment    String?     @db.Enum  // 'finance', 'hr', etc.
  staffRole          String?     @db.Enum  // 'finance_manager', 'finance_officer', etc.
  staffPermissions   String[]    // Array of permission strings
  joinDateAsStaff    DateTime?
}
```

### Update Permissions Table (if exists)

Map role names to database roles:
```
'Finance Manager' → finance_manager
'HR Officer' → hr_officer
'Receptionist' → receptionist
etc.
```

## Backend Integration

### Update `getStaffUser` Action

Currently uses role name from database. Update to:

```typescript
export async function getStaffUser(userId: string, organizationId: string): Promise<StaffUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { organization: true }
  });

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    photo: user.photo,
    role: user.staffRole, // Now uses database field
    department: user.staffDepartment, // Now uses database field
    organizationId: organizationId,
    isActive: !user.suspendedAt,
    joinDate: user.joinDateAsStaff?.toISOString() || new Date().toISOString(),
  };
}
```

### Implement `getDepartmentStats`

Example for Finance:

```typescript
export async function getDepartmentStats(department: StaffDepartment, organizationId: string) {
  if (department === 'finance') {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        memberships: true,
        bookings: true,
        transactions: true,
      }
    });

    return {
      totalRevenue: org?.metrics?.totalRevenue || 0,
      monthlyExpenses: org?.metrics?.monthlyExpenses || 0,
      activeMembers: org?.memberships?.length || 0,
      monthlyRevenue: org?.metrics?.monthlyRevenue || 0,
      netProfit: org?.metrics?.netProfit || 0,
      collectionRate: org?.metrics?.collectionRate || 94,
    };
  }
  // Similar for other departments
}
```

### Implement `getStaffActivity`

```typescript
export async function getStaffActivity(userId: string, organizationId: string, limit: number = 10) {
  const activityLogs = await prisma.activityLog.findMany({
    where: {
      userId: userId,
      organizationId: organizationId,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return activityLogs.map(log => ({
    id: log.id,
    title: log.title,
    description: log.description,
    type: log.type,
    timestamp: log.createdAt.toISOString(),
    icon: getIconForType(log.type),
  }));
}
```

## Frontend Customization

### Add Custom Widgets

Create department-specific widget in each dashboard component:

```tsx
interface FinanceDashboardProps {
  // ... existing props
}

const CustomWidget = ({ data }) => (
  <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
    <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>Custom Widget</div>
    {/* Widget content */}
  </div>
);

const FinanceDashboard = (props) => {
  const renderOverview = () => (
    <>
      {/* Existing overview */}
      <CustomWidget data={props.stats} />
    </>
  );
  // ...
};
```

### Add New Sections

1. Add to `DepartmentConfig.sidebarItems` in config
2. Add section renderer in department component
3. Add to `sectionRenderers` mapping

```tsx
const sectionRenderers: Record<string, () => JSX.Element> = {
  overview: renderOverview,
  transactions: renderTransactions,
  newSection: renderNewSection, // Add here
};
```

## Permission Checking

### Frontend Permission Check

```tsx
// In component
if (!roleConfig.canViewReports) {
  return <div>Access Denied</div>;
}

// Or for specific permission
if (!roleConfig.permissions.includes('manage_budgets')) {
  return <div>Access Denied</div>;
}
```

### Backend Permission Check

Create middleware:

```typescript
export async function checkStaffPermission(
  userId: string,
  permission: string,
  organizationId: string
): Promise<boolean> {
  const staffUser = await getStaffUser(userId, organizationId);
  if (!staffUser) return false;

  const roleConfig = getRoleConfig(staffUser.department, staffUser.role);
  return roleConfig?.permissions.includes(permission) || false;
}
```

## Mobile Responsiveness Checklist

- ✅ Sidebar collapses on mobile
- ✅ Header hamburger menu
- ✅ Grid layouts use auto-fit
- ✅ Padding adjusted for mobile
- ✅ Touch-friendly button sizes
- ✅ Readable font sizes on small screens

## Testing

### Test Access Control

```bash
# Should work
GET /dashboard/staff/finance/user-123?org=org-456
# User is finance staff

# Should redirect
GET /dashboard/staff/hr/user-123?org=org-456
# User is not HR staff
```

### Test Permission Boundaries

- Finance Manager can view all sections
- Finance Officer cannot view reports/budgets
- Receptionist cannot access finance
- etc.

## Troubleshooting

### Issue: "Access Denied"
- Check user's staffDepartment in database
- Verify organizationId matches
- Ensure user.staffRole is set

### Issue: "Failed to load dashboard"
- Check getDepartmentStats implementation
- Verify database connection
- Check console for error messages

### Issue: Sidebar not showing items
- Check roleConfig.permissions
- Verify sidebarItem.requiresPermission is in permissions
- Check departmentConfig is loaded correctly

## Performance Optimization

### Implement Caching

```typescript
export async function getStaffDashboardData(
  userId: string,
  department: StaffDepartment,
  organizationId: string
): Promise<StaffDashboardData | null> {
  const cacheKey = `staff_dashboard_${userId}_${department}`;
  
  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Fetch data
  const data = await fetchData(...);

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(data));

  return data;
}
```

### Optimize Database Queries

Use `select` to fetch only needed fields:

```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    photo: true,
    staffRole: true,
    staffDepartment: true,
  }
});
```

## Future Enhancements

1. **Real-time Data**: Add WebSocket updates for live stats
2. **Analytics**: Department-specific dashboards with charts
3. **Notifications**: Real-time alerts per role
4. **Reports**: PDF export and scheduling
5. **Automation**: Workflow automation per department
6. **Audit Logs**: Complete activity tracking
7. **Custom Widgets**: Drag-and-drop widget system
8. **Role Templates**: Save and reuse permission sets

## Support

For questions about:
- Architecture: See `/memories/repo/staff-dashboard-architecture.md`
- Types: See `src/types/staff-dashboard.ts`
- Configuration: See `src/config/staff-departments.ts`
