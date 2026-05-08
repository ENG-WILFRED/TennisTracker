/**
 * Staff Department Configurations
 * Defines all staff departments, roles, permissions, and UI elements
 */

import { DepartmentConfig, StaffDepartment } from '@/types/staff-dashboard';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

export const STAFF_DEPARTMENTS: Record<StaffDepartment, DepartmentConfig> = {
  finance: {
    name: 'Finance',
    icon: '💵',
    description: 'Financial management and reporting',
    color: G.lime,
    sidebarItems: [
      { label: 'Overview', icon: '📊', section: 'overview' },
      { label: 'Transactions', icon: '📝', section: 'transactions' },
      { label: 'Expenses', icon: '💸', section: 'expenses' },
      { label: 'Payroll', icon: '👥', section: 'payroll' },
      { label: 'Invoices', icon: '📄', section: 'invoices' },
      { label: 'Reports', icon: '📈', section: 'reports', requiresPermission: 'view_reports' },
      { label: 'Budgets', icon: '🎯', section: 'budgets', requiresPermission: 'manage_budgets' },
    ],
    modules: ['overview', 'transactions', 'expenses', 'payroll', 'invoices', 'reports', 'budgets'],
    roles: [
      {
        roleId: 'finance_manager',
        title: 'Finance Manager',
        permissions: ['view_all', 'edit_all', 'approve_payments', 'view_reports', 'manage_budgets', 'export_data'],
        modules: ['overview', 'transactions', 'expenses', 'payroll', 'invoices', 'reports', 'budgets'],
        canViewReports: true,
        canManageStaff: false,
        canApprove: true,
      },
      {
        roleId: 'finance_officer',
        title: 'Finance Officer',
        permissions: ['view_all', 'edit_own', 'view_reports'],
        modules: ['overview', 'transactions', 'expenses', 'invoices'],
        canViewReports: true,
        canManageStaff: false,
        canApprove: false,
      },
    ],
  },

  hr: {
    name: 'Human Resources',
    icon: '👔',
    description: 'Employee and staffing management',
    color: '#8b5cf6',
    sidebarItems: [
      { label: 'Overview', icon: '📊', section: 'overview' },
      { label: 'Employees', icon: '👥', section: 'employees' },
      { label: 'Attendance', icon: '📅', section: 'attendance' },
      { label: 'Leave Requests', icon: '🏖️', section: 'leaves' },
      { label: 'Recruitment', icon: '💼', section: 'recruitment', requiresPermission: 'manage_recruitment' },
      { label: 'Reports', icon: '📈', section: 'reports', requiresPermission: 'view_reports' },
    ],
    modules: ['overview', 'employees', 'attendance', 'leaves', 'recruitment', 'reports'],
    roles: [
      {
        roleId: 'hr_manager',
        title: 'HR Manager',
        permissions: ['view_all', 'edit_all', 'approve_leave', 'manage_recruitment', 'view_reports', 'manage_staff'],
        modules: ['overview', 'employees', 'attendance', 'leaves', 'recruitment', 'reports'],
        canViewReports: true,
        canManageStaff: true,
        canApprove: true,
      },
      {
        roleId: 'hr_officer',
        title: 'HR Officer',
        permissions: ['view_all', 'edit_own', 'submit_leave'],
        modules: ['overview', 'employees', 'attendance', 'leaves'],
        canViewReports: false,
        canManageStaff: false,
        canApprove: false,
      },
    ],
  },

  reception: {
    name: 'Reception',
    icon: '🔔',
    description: 'Front desk and member services',
    color: '#06b6d4',
    sidebarItems: [
      { label: 'Overview', icon: '📊', section: 'overview' },
      { label: 'Check-ins', icon: '✅', section: 'checkins' },
      { label: 'Bookings', icon: '📅', section: 'bookings' },
      { label: 'Visitors', icon: '👋', section: 'visitors' },
      { label: 'Members', icon: '💳', section: 'members' },
      { label: 'Support Tickets', icon: '🎫', section: 'support' },
      { label: 'Schedules', icon: '⏰', section: 'schedules' },
    ],
    modules: ['overview', 'checkins', 'bookings', 'visitors', 'members', 'support', 'schedules'],
    roles: [
      {
        roleId: 'receptionist',
        title: 'Receptionist',
        permissions: ['checkin_members', 'view_bookings', 'register_visitors', 'handle_support', 'view_schedules'],
        modules: ['overview', 'checkins', 'bookings', 'visitors', 'members', 'support', 'schedules'],
        canViewReports: false,
        canManageStaff: false,
        canApprove: false,
      },
    ],
  },

  security: {
    name: 'Security',
    icon: '🔐',
    description: 'Security and facility monitoring',
    color: '#ef4444',
    sidebarItems: [
      { label: 'Overview', icon: '📊', section: 'overview' },
      { label: 'Visitor Logs', icon: '📋', section: 'visitors' },
      { label: 'Incidents', icon: '⚠️', section: 'incidents' },
      { label: 'Patrols', icon: '🚶', section: 'patrols' },
      { label: 'Alerts', icon: '🚨', section: 'alerts' },
    ],
    modules: ['overview', 'visitors', 'incidents', 'patrols', 'alerts'],
    roles: [
      {
        roleId: 'security_officer',
        title: 'Security Officer',
        permissions: ['log_visitors', 'report_incidents', 'update_patrols', 'view_alerts'],
        modules: ['overview', 'visitors', 'incidents', 'patrols', 'alerts'],
        canViewReports: false,
        canManageStaff: false,
        canApprove: false,
      },
      {
        roleId: 'watchman',
        title: 'Watchman',
        permissions: ['log_visitors', 'report_incidents', 'update_patrols'],
        modules: ['overview', 'visitors', 'incidents', 'patrols'],
        canViewReports: false,
        canManageStaff: false,
        canApprove: false,
      },
    ],
  },

  maintenance: {
    name: 'Maintenance',
    icon: '🔧',
    description: 'Facility maintenance and repairs',
    color: '#f59e0b',
    sidebarItems: [
      { label: 'Overview', icon: '📊', section: 'overview' },
      { label: 'Repair Tickets', icon: '🎫', section: 'repairs' },
      { label: 'Equipment', icon: '⚙️', section: 'equipment' },
      { label: 'Schedules', icon: '📅', section: 'schedules' },
      { label: 'Reports', icon: '📈', section: 'reports' },
    ],
    modules: ['overview', 'repairs', 'equipment', 'schedules', 'reports'],
    roles: [
      {
        roleId: 'maintenance_manager',
        title: 'Maintenance Manager',
        permissions: ['view_all', 'create_tickets', 'assign_tasks', 'view_reports', 'manage_equipment'],
        modules: ['overview', 'repairs', 'equipment', 'schedules', 'reports'],
        canViewReports: true,
        canManageStaff: true,
        canApprove: true,
      },
      {
        roleId: 'maintenance_staff',
        title: 'Maintenance Staff',
        permissions: ['view_assigned', 'update_tickets', 'report_completion'],
        modules: ['overview', 'repairs', 'schedules'],
        canViewReports: false,
        canManageStaff: false,
        canApprove: false,
      },
    ],
  },

  inventory: {
    name: 'Inventory',
    icon: '📦',
    description: 'Stock and asset management',
    color: '#8b5cf6',
    sidebarItems: [
      { label: 'Overview', icon: '📊', section: 'overview' },
      { label: 'Stock Levels', icon: '📦', section: 'inventory' },
      { label: 'Purchases', icon: '🛒', section: 'purchases' },
      { label: 'Assignments', icon: '🎯', section: 'assignments' },
      { label: 'Low Stock Alerts', icon: '🚨', section: 'alerts' },
      { label: 'Reports', icon: '📈', section: 'reports' },
    ],
    modules: ['overview', 'inventory', 'purchases', 'assignments', 'alerts', 'reports'],
    roles: [
      {
        roleId: 'inventory_manager',
        title: 'Inventory Manager',
        permissions: ['view_all', 'edit_all', 'create_purchases', 'manage_assignments', 'view_reports'],
        modules: ['overview', 'inventory', 'purchases', 'assignments', 'alerts', 'reports'],
        canViewReports: true,
        canManageStaff: false,
        canApprove: true,
      },
    ],
  },

  support: {
    name: 'Customer Support',
    icon: '🎧',
    description: 'Member support and issue resolution',
    color: '#10b981',
    sidebarItems: [
      { label: 'Overview', icon: '📊', section: 'overview' },
      { label: 'Tickets', icon: '🎫', section: 'tickets' },
      { label: 'Complaints', icon: '😞', section: 'complaints' },
      { label: 'Live Chat', icon: '💬', section: 'chat' },
      { label: 'Knowledge Base', icon: '📚', section: 'knowledge' },
    ],
    modules: ['overview', 'tickets', 'complaints', 'chat', 'knowledge'],
    roles: [
      {
        roleId: 'support_manager',
        title: 'Support Manager',
        permissions: ['view_all', 'manage_tickets', 'manage_knowledge', 'view_reports'],
        modules: ['overview', 'tickets', 'complaints', 'chat', 'knowledge'],
        canViewReports: true,
        canManageStaff: true,
        canApprove: true,
      },
      {
        roleId: 'support_staff',
        title: 'Support Staff',
        permissions: ['view_assigned', 'update_tickets', 'respond_chat'],
        modules: ['overview', 'tickets', 'chat'],
        canViewReports: false,
        canManageStaff: false,
        canApprove: false,
      },
    ],
  },

  marketing: {
    name: 'Marketing',
    icon: '📢',
    description: 'Marketing campaigns and promotions',
    color: '#ec4899',
    sidebarItems: [
      { label: 'Overview', icon: '📊', section: 'overview' },
      { label: 'Campaigns', icon: '📢', section: 'campaigns' },
      { label: 'Social Media', icon: '📱', section: 'social' },
      { label: 'Sponsors', icon: '🤝', section: 'sponsors' },
      { label: 'Analytics', icon: '📈', section: 'analytics' },
    ],
    modules: ['overview', 'campaigns', 'social', 'sponsors', 'analytics'],
    roles: [
      {
        roleId: 'marketing_manager',
        title: 'Marketing Manager',
        permissions: ['create_campaigns', 'manage_social', 'manage_sponsors', 'view_analytics'],
        modules: ['overview', 'campaigns', 'social', 'sponsors', 'analytics'],
        canViewReports: true,
        canManageStaff: false,
        canApprove: true,
      },
    ],
  },

  operations: {
    name: 'Operations',
    icon: '⚡',
    description: 'Daily facility operations and scheduling',
    color: '#06b6d4',
    sidebarItems: [
      { label: 'Overview', icon: '📊', section: 'overview' },
      { label: 'Staff Scheduling', icon: '📅', section: 'scheduling' },
      { label: 'Facilities', icon: '🏢', section: 'facilities' },
      { label: 'Staff Directory', icon: '👥', section: 'staff' },
      { label: 'Incidents', icon: '⚠️', section: 'incidents' },
      { label: 'Reports', icon: '📈', section: 'reports' },
    ],
    modules: ['overview', 'scheduling', 'facilities', 'staff', 'incidents', 'reports'],
    roles: [
      {
        roleId: 'operations_manager',
        title: 'Operations Manager',
        permissions: ['manage_schedules', 'monitor_facilities', 'manage_staff_access', 'view_all', 'view_reports'],
        modules: ['overview', 'scheduling', 'facilities', 'staff', 'incidents', 'reports'],
        canViewReports: true,
        canManageStaff: true,
        canApprove: true,
      },
    ],
  },
};

export const DEPARTMENT_LIST: StaffDepartment[] = [
  'finance',
  'hr',
  'reception',
  'security',
  'maintenance',
  'inventory',
  'support',
  'marketing',
  'operations',
];

export const getDepartmentConfig = (department: StaffDepartment): DepartmentConfig | null => {
  return STAFF_DEPARTMENTS[department] || null;
};

export const getRoleConfig = (department: StaffDepartment, roleId: string) => {
  const departmentConfig = getDepartmentConfig(department);
  if (!departmentConfig) return null;
  return departmentConfig.roles.find(role => role.roleId === roleId) || null;
};
