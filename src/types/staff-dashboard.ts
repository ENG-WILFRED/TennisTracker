/**
 * Staff Dashboard Type Definitions
 * Comprehensive role-based architecture for enterprise staff management
 */

export type StaffDepartment = 
  | 'finance'
  | 'hr'
  | 'reception'
  | 'security'
  | 'maintenance'
  | 'inventory'
  | 'support'
  | 'marketing'
  | 'operations';

export type StaffRole = 
  | 'finance_manager'
  | 'finance_officer'
  | 'hr_manager'
  | 'hr_officer'
  | 'receptionist'
  | 'security_officer'
  | 'watchman'
  | 'maintenance_staff'
  | 'maintenance_manager'
  | 'inventory_manager'
  | 'support_staff'
  | 'support_manager'
  | 'marketing_manager'
  | 'operations_manager'
  | 'cleaner'
  | 'janitor';

export interface SidebarItem {
  label: string;
  icon: string;
  section: string;
  requiresPermission?: string;
}

export interface DepartmentConfig {
  name: string;
  icon: string;
  description: string;
  color: string;
  sidebarItems: SidebarItem[];
  modules: string[];
  roles: RoleConfig[];
}

export interface RoleConfig {
  roleId: StaffRole;
  title: string;
  permissions: string[];
  modules: string[];
  canViewReports: boolean;
  canManageStaff: boolean;
  canApprove: boolean;
}

export interface StaffUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photo: string | null;
  role: StaffRole;
  department: StaffDepartment;
  organizationId: string;
  isActive: boolean;
  joinDate: string;
}

export interface StaffDashboardData {
  user: StaffUser;
  department: DepartmentConfig;
  roleConfig: RoleConfig;
  permissions: string[];
  stats: Record<string, any>;
  sectionData?: Record<string, any>;
  recentActivity: ActivityLog[];
}

export interface ActivityLog {
  id: string;
  title: string;
  description: string;
  type: string;
  timestamp: string;
  icon: string;
}

export interface DepartmentStats {
  [department: string]: {
    [key: string]: number | string;
  };
}

export interface StaffPermissions {
  canView: string[];
  canEdit: string[];
  canDelete: string[];
  canApprove: string[];
  canReports: boolean;
}

export interface NavigationSection {
  label: string;
  items: SidebarItem[];
}

/**
 * Staff widget types for consistent component structure
 */
export interface StaffWidget {
  id: string;
  title: string;
  icon: string;
  department: StaffDepartment;
  component: React.ComponentType<any>;
  requiresPermission?: string;
}
