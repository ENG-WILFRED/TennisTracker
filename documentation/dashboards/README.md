# Staff Dashboard System - Enterprise Architecture

## 🎯 Overview

A comprehensive, role-based dashboard system for managing all staff operations at Vico Sports. Each staff member sees a customized dashboard based on their department and role, with specific permissions and access controls.

## ✨ Key Features

### 🏗️ Architecture
- **9 Departments**: Finance, HR, Reception, Security, Maintenance, Inventory, Support, Marketing, Operations
- **16+ Roles**: Department-specific roles with granular permissions
- **Dynamic UI**: Sidebar and modules render based on user role
- **Fully TypeScript**: End-to-end type safety
- **Mobile Responsive**: Optimized for all device sizes

### 🔐 Permission System
```
Role-Based Access Control (RBAC)
├── Finance Manager: Full access to all financial operations
├── Finance Officer: Limited to transactions and basic reports
├── HR Manager: Full staff management and recruitment
├── HR Officer: Basic HR operations
├── Receptionist: Member check-ins and bookings
├── Security Officer: Visitor logs and incidents
├── Maintenance Staff: Assigned repairs
└── ... and more
```

### 📊 Department Dashboards

#### 💵 Finance Dashboard
**Sidebar Items**: Overview, Transactions, Expenses, Payroll, Invoices, Reports, Budgets
- Revenue charts
- Expense breakdowns
- Transaction history
- Collection rates
- Budget management

#### 👔 HR Dashboard
**Sidebar Items**: Overview, Employees, Attendance, Leave Requests, Recruitment, Reports
- Team member overview
- Attendance tracking
- Leave management
- Recruitment pipeline
- Employee directory

#### 🔔 Reception Dashboard
**Sidebar Items**: Overview, Check-ins, Bookings, Visitors, Members, Support, Schedules
- Daily check-ins
- Court bookings
- Visitor management
- Member registration
- Support tickets

#### 🔐 Security Dashboard
**Sidebar Items**: Overview, Visitors, Incidents, Patrols, Alerts
- Visitor logs
- Incident reporting
- Patrol management
- Security alerts

#### 🔧 Maintenance Dashboard
**Sidebar Items**: Overview, Repairs, Equipment, Schedules, Reports
- Repair tickets
- Equipment tracking
- Maintenance schedules
- Work orders

#### 📦 Inventory Dashboard
**Sidebar Items**: Overview, Stock Levels, Purchases, Assignments, Low Stock Alerts, Reports
- Stock management
- Purchase orders
- Asset assignments
- Low stock alerts

#### 🎧 Support Dashboard
**Sidebar Items**: Overview, Tickets, Complaints, Live Chat, Knowledge Base
- Support tickets
- Complaint tracking
- Live chat management
- Knowledge base

#### 📢 Marketing Dashboard
**Sidebar Items**: Overview, Campaigns, Social Media, Sponsors, Analytics
- Campaign management
- Social media tracking
- Sponsor relations
- Performance analytics

#### ⚡ Operations Dashboard
**Sidebar Items**: Overview, Staff Scheduling, Facilities, Staff Directory, Incidents, Reports
- Staff scheduling
- Facility monitoring
- Staff management
- Incident overview

## 🚀 Quick Start

### Access Staff Dashboard
```
URL Pattern: /dashboard/staff/{department}/{userId}?org={organizationId}

Example:
/dashboard/staff/finance/user-123?org=org-456
```

### Add Staff with Role in Organization Dashboard
```tsx
import { STAFF_DEPARTMENTS, DEPARTMENT_LIST } from '@/config/staff-departments';

// Select department
const [department, setDepartment] = useState('finance');
const config = STAFF_DEPARTMENTS[department];

// Select role from available roles
const [role, setRole] = useState(config.roles[0].roleId);

// Link to dashboard
<Link href={`/dashboard/staff/${department}/${staffId}?org=${orgId}`}>
  View Dashboard
</Link>
```

## 📁 File Structure

```
src/
├── types/
│   └── staff-dashboard.ts (Type definitions)
├── config/
│   └── staff-departments.ts (Configuration)
├── components/dashboards/
│   └── staff/
│       ├── StaffDashboard.tsx (Main container)
│       ├── finance/FinanceDashboard.tsx
│       ├── hr/HRDashboard.tsx
│       ├── reception/ReceptionDashboard.tsx
│       ├── security/SecurityDashboard.tsx
│       ├── maintenance/MaintenanceDashboard.tsx
│       ├── inventory/InventoryDashboard.tsx
│       ├── support/SupportDashboard.tsx
│       ├── marketing/MarketingDashboard.tsx
│       └── operations/OperationsDashboard.tsx
├── actions/staff/
│   └── getStaffDashboard.ts (Server actions)
└── app/
    └── dashboard/staff/
        └── [department]/[userId]/
            └── page.tsx (Page route)

documentation/
└── dashboards/
    └── STAFF_DASHBOARD_IMPLEMENTATION.md (Full guide)
```

## 🔧 Type System

### Core Types

**StaffDepartment** - Union of all 9 departments
```typescript
type StaffDepartment = 
  | 'finance' | 'hr' | 'reception' | 'security' 
  | 'maintenance' | 'inventory' | 'support' 
  | 'marketing' | 'operations'
```

**StaffRole** - 16+ roles with department-specific permissions
```typescript
type StaffRole = 
  | 'finance_manager' | 'finance_officer'
  | 'hr_manager' | 'hr_officer'
  | 'receptionist'
  | ... and more
```

**DepartmentConfig** - Configuration for each department
```typescript
interface DepartmentConfig {
  name: string
  icon: string
  description: string
  color: string
  sidebarItems: SidebarItem[]
  modules: string[]
  roles: RoleConfig[]
}
```

## 🔐 Permission Model

### Permission Types
- `view_all` / `edit_all` / `delete_all` - Full CRUD access
- `view_own` / `edit_own` - Limited to own items
- `view_reports` - Financial/operational reports
- `manage_budgets` - Budget management
- `manage_staff` - Staff management
- `approve_*` - Approval workflows

### Example: Finance Manager
```typescript
permissions: [
  'view_all',
  'edit_all',
  'approve_payments',
  'view_reports',
  'manage_budgets',
  'export_data'
]
```

## 🎨 UI Components

### Main Container (StaffDashboard.tsx)
- Responsive sidebar with department navigation
- Mobile hamburger menu
- Profile card with quick actions
- Dynamic content area

### Department Dashboards
- Overview section with KPI cards
- Interactive charts and graphs
- Data tables
- Status indicators
- Action buttons

### Responsive Grid System
```tsx
gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))'
// Mobile: 1 column
// Tablet: 2-3 columns
// Desktop: 4+ columns
```

## 🔄 Data Flow

```
User Login
    ↓
Organization Dashboard
    ↓
Select Staff Role (dropdown)
    ↓
Link to /dashboard/staff/{department}/{userId}
    ↓
Server validates access
    ↓
Fetch StaffDashboardData
    ↓
Render StaffDashboard with department-specific component
    ↓
Dynamic sidebar + mobile header
    ↓
Show sections based on permissions
```

## 🗄️ Database Integration

### Required User Fields
```prisma
model User {
  // ... existing fields
  staffDepartment    String?      // 'finance', 'hr', etc.
  staffRole          String?      // 'finance_manager', etc.
  staffPermissions   String[]     // Permission array
  joinDateAsStaff    DateTime?    // When they joined as staff
}
```

## 🚀 Implementation Checklist

- [x] Type definitions and configuration
- [x] Main StaffDashboard container
- [x] All 9 department dashboards
- [x] Server actions for data fetching
- [x] Page route with validation
- [x] Mobile responsive design
- [ ] Database schema updates
- [ ] Implement getDepartmentStats with real data
- [ ] Implement getStaffActivity with audit logs
- [ ] Permission validation middleware
- [ ] Organization dashboard integration
- [ ] Real-time data updates
- [ ] Export and reporting features

## 📚 Documentation

- **Architecture**: `/memories/repo/staff-dashboard-architecture.md`
- **Implementation Guide**: `documentation/dashboards/STAFF_DASHBOARD_IMPLEMENTATION.md`
- **Type Definitions**: `src/types/staff-dashboard.ts`
- **Configuration**: `src/config/staff-departments.ts`

## 🎯 Next Steps

### 1. Database Setup
```sql
-- Add to User table
ALTER TABLE users ADD COLUMN staff_department VARCHAR(50);
ALTER TABLE users ADD COLUMN staff_role VARCHAR(50);
ALTER TABLE users ADD COLUMN staff_permissions TEXT[];
ALTER TABLE users ADD COLUMN join_date_as_staff TIMESTAMP;
```

### 2. Organization Dashboard Integration
```tsx
// Add staff role dropdown in org dashboard
import { STAFF_DEPARTMENTS } from '@/config/staff-departments';

<select>
  {Object.entries(STAFF_DEPARTMENTS).map(([key, dept]) => (
    <option key={key} value={key}>{dept.name}</option>
  ))}
</select>
```

### 3. Implement Backend Stats
```typescript
// In getDepartmentStats, add real database queries
export async function getDepartmentStats(department, orgId) {
  switch(department) {
    case 'finance':
      // Fetch real financial data
    case 'hr':
      // Fetch real HR data
    // etc.
  }
}
```

## 🔍 Permissions per Department

| Department | Manager Access | Staff Access |
|-----------|---|---|
| Finance | All + Reports + Budgets | View + Transactions |
| HR | All + Reports + Recruitment | View + Leave |
| Reception | All | Check-ins + Bookings |
| Security | Reporting | Logging |
| Maintenance | All + Assignments | Assigned Tasks |
| Inventory | All + Purchases | View Stock |
| Support | All + Knowledge Base | Assigned Tickets |
| Marketing | Campaigns + Social | View Only |
| Operations | All + Facility | View |

## 🎓 Best Practices

1. **Always validate access** on the backend
2. **Use database roles** instead of hardcoding
3. **Implement audit logging** for sensitive operations
4. **Cache permission checks** for performance
5. **Use TypeScript** for type safety
6. **Mobile first** development approach
7. **Consistent styling** using G color constants

## 🐛 Troubleshooting

**Issue**: "Access Denied"
- ✅ Check user's staffDepartment matches requested department
- ✅ Verify user has staffRole assigned
- ✅ Confirm organizationId matches

**Issue**: Dashboard shows empty
- ✅ Check getDepartmentStats implementation
- ✅ Verify database queries
- ✅ Check browser console for errors

**Issue**: Sidebar not showing all items
- ✅ Check roleConfig.permissions includes required permission
- ✅ Verify sidebarItem.requiresPermission is correct

## 📞 Support

For questions or issues:
1. Check the implementation guide
2. Review type definitions
3. Check configuration file
4. Review server actions

## 📝 License

Part of Vico Sports platform
