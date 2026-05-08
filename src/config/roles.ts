/**
 * Role Configuration with Colors, Descriptions, and Permissions
 * Centralized configuration for all user roles in the system
 */

export type UserRole = 
  | 'player' 
  | 'coach' 
  | 'admin' 
  | 'staff' 
  | 'referee' 
  | 'org' 
  | 'member' 
  | 'spectator' 
  | 'developer'
  // Staff department roles
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

export interface RoleConfig {
  id: UserRole;
  name: string;
  displayName: string;
  description: string;
  color: {
    primary: string;      // Tailwind bg color
    secondary: string;    // Lighter variant
    text: string;         // Text color for contrast
    border: string;       // Border color
    badge: string;        // Badge background
  };
  icon: string;           // Icon name/emoji
  permissions: string[];
  dashboardRoute: string;
  features: string[];
}

export const ROLE_COLORS: Record<UserRole, RoleConfig['color']> = {
  player: {
    primary: 'bg-blue-600',
    secondary: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
    badge: 'bg-blue-200',
  },
  coach: {
    primary: 'bg-green-600',
    secondary: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
    badge: 'bg-green-200',
  },
  admin: {
    primary: 'bg-red-600',
    secondary: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-300',
    badge: 'bg-red-200',
  },
  staff: {
    primary: 'bg-purple-600',
    secondary: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-300',
    badge: 'bg-purple-200',
  },
  referee: {
    primary: 'bg-yellow-600',
    secondary: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-300',
    badge: 'bg-yellow-200',
  },
  org: {
    primary: 'bg-indigo-600',
    secondary: 'bg-indigo-100',
    text: 'text-indigo-700',
    border: 'border-indigo-300',
    badge: 'bg-indigo-200',
  },
  member: {
    primary: 'bg-cyan-600',
    secondary: 'bg-cyan-100',
    text: 'text-cyan-700',
    border: 'border-cyan-300',
    badge: 'bg-cyan-200',
  },
  spectator: {
    primary: 'bg-gray-600',
    secondary: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
    badge: 'bg-gray-200',
  },
  developer: {
    primary: 'bg-emerald-700',
    secondary: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
    badge: 'bg-emerald-200',
  },
  // Finance department roles
  finance_manager: {
    primary: 'bg-green-700',
    secondary: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
    badge: 'bg-green-200',
  },
  finance_officer: {
    primary: 'bg-green-600',
    secondary: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
    badge: 'bg-green-200',
  },
  // HR department roles
  hr_manager: {
    primary: 'bg-blue-700',
    secondary: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
    badge: 'bg-blue-200',
  },
  hr_officer: {
    primary: 'bg-blue-600',
    secondary: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
    badge: 'bg-blue-200',
  },
  // Reception
  receptionist: {
    primary: 'bg-purple-600',
    secondary: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-300',
    badge: 'bg-purple-200',
  },
  // Security department roles
  security_officer: {
    primary: 'bg-red-700',
    secondary: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-300',
    badge: 'bg-red-200',
  },
  watchman: {
    primary: 'bg-red-600',
    secondary: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-300',
    badge: 'bg-red-200',
  },
  // Maintenance department roles
  maintenance_manager: {
    primary: 'bg-orange-700',
    secondary: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-300',
    badge: 'bg-orange-200',
  },
  maintenance_staff: {
    primary: 'bg-orange-600',
    secondary: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-300',
    badge: 'bg-orange-200',
  },
  cleaner: {
    primary: 'bg-orange-500',
    secondary: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-300',
    badge: 'bg-orange-200',
  },
  janitor: {
    primary: 'bg-orange-500',
    secondary: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-300',
    badge: 'bg-orange-200',
  },
  // Inventory
  inventory_manager: {
    primary: 'bg-teal-700',
    secondary: 'bg-teal-100',
    text: 'text-teal-700',
    border: 'border-teal-300',
    badge: 'bg-teal-200',
  },
  // Support department roles
  support_manager: {
    primary: 'bg-indigo-700',
    secondary: 'bg-indigo-100',
    text: 'text-indigo-700',
    border: 'border-indigo-300',
    badge: 'bg-indigo-200',
  },
  support_staff: {
    primary: 'bg-indigo-600',
    secondary: 'bg-indigo-100',
    text: 'text-indigo-700',
    border: 'border-indigo-300',
    badge: 'bg-indigo-200',
  },
  // Marketing
  marketing_manager: {
    primary: 'bg-pink-700',
    secondary: 'bg-pink-100',
    text: 'text-pink-700',
    border: 'border-pink-300',
    badge: 'bg-pink-200',
  },
  // Operations
  operations_manager: {
    primary: 'bg-slate-700',
    secondary: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    badge: 'bg-slate-200',
  },
};

export const ROLES: Record<UserRole, RoleConfig> = {
  player: {
    id: 'player',
    name: 'Player',
    displayName: 'Tennis Player',
    description: 'Participate in matches, track stats, and improve your game',
    color: ROLE_COLORS.player,
    icon: '🎾',
    permissions: ['view_profile', 'play_matches', 'view_stats', 'manage_profile', 'book_courts', 'view_coaches'],
    dashboardRoute: '/dashboard/player',
    features: ['Match Participation', 'Statistics Tracking', 'Badge Achievements', 'Coach Hiring', 'Court Booking'],
  },
  coach: {
    id: 'coach',
    name: 'Coach',
    displayName: 'Tennis Coach',
    description: 'Train players and manage coaching sessions',
    color: ROLE_COLORS.coach,
    icon: '👨‍🏫',
    permissions: [
      'manage_students',
      'view_students',
      'schedule_sessions',
      'manage_sessions',
      'submit_scores',
      'view_profile',
      'manage_profile',
    ],
    dashboardRoute: '/dashboard/coach',
    features: ['Student Management', 'Session Scheduling', 'Performance Tracking', 'Availability Management', 'Pricing Setup'],
  },
  admin: {
    id: 'admin',
    name: 'Admin',
    displayName: 'Organization Admin',
    description: 'Manage club operations, members, and events',
    color: ROLE_COLORS.admin,
    icon: '⚙️',
    permissions: [
      'manage_members',
      'manage_coaches',
      'manage_events',
      'manage_courts',
      'manage_rankings',
      'manage_announcements',
      'view_analytics',
      'manage_roles',
      'view_all_data',
    ],
    dashboardRoute: '/dashboard/admin',
    features: [
      'Member Management',
      'Event Organization',
      'Court Management',
      'Ranking System',
      'Analytics Dashboard',
      'Announcements',
    ],
  },
  staff: {
    id: 'staff',
    name: 'Staff',
    displayName: 'Staff Dashboard',
    description: 'Handle club finances, memberships, and revenue tracking',
    color: ROLE_COLORS.staff,
    icon: '💼',
    permissions: [
      'view_revenue',
      'manage_memberships',
      'manage_transactions',
      'view_financial_reports',
      'generate_invoices',
      'view_budget',
    ],
    dashboardRoute: '/dashboard/staff',
    features: ['Revenue Dashboard', 'Membership Management', 'Financial Reports', 'Transaction Tracking', 'Invoice Generation'],
  },
  referee: {
    id: 'referee',
    name: 'Referee',
    displayName: 'Match Referee',
    description: 'Officiate matches and submit match results',
    color: ROLE_COLORS.referee,
    icon: '🏆',
    permissions: ['view_assignments', 'submit_scores', 'manage_matches', 'view_profile', 'manage_profile'],
    dashboardRoute: '/dashboard/referee',
    features: ['Match Assignments', 'Score Submission', 'Match Management', 'Statistics Tracking'],
  },
  org: {
    id: 'org',
    name: 'Organization',
    displayName: 'Organization Owner',
    description: 'Full control over organization settings and operations',
    color: ROLE_COLORS.org,
    icon: '🏛️',
    permissions: ['full_access', 'manage_organization', 'manage_all_features', 'manage_billing'],
    dashboardRoute: '/dashboard/organization',
    features: [
      'Organization Settings',
      'Full Analytics',
      'Team Management',
      'Billing & Plans',
      'Advanced Features',
    ],
  },
  member: {
    id: 'member',
    name: 'Membership Center',
    displayName: 'Member Dashboard',
    description: 'Manage your organization memberships, billing, and membership access',
    color: ROLE_COLORS.member,
    icon: '💳',
    permissions: ['view_memberships', 'manage_memberships', 'view_billing', 'contact_support'],
    dashboardRoute: '/dashboard/member',
    features: [
      'Membership Status',
      'Access & Entitlements',
      'Billing Summary',
      'Upgrade Opportunities',
      'Support Requests',
    ],
  },
  spectator: {
    id: 'spectator',
    name: 'Spectator',
    displayName: 'Spectator',
    description: 'View matches and events',
    color: ROLE_COLORS.spectator,
    icon: '👁️',
    permissions: ['view_matches', 'view_leaderboard', 'view_events'],
    dashboardRoute: '/dashboard/spectator',
    features: ['Match Viewing', 'Leaderboard Access', 'Event Calendar'],
  },
  // Staff Department Roles
  finance_manager: {
    id: 'finance_manager',
    name: 'Finance Manager',
    displayName: 'Finance Manager',
    description: 'Oversee financial operations, budgets, and revenue management',
    color: ROLE_COLORS.finance_manager,
    icon: '💰',
    permissions: ['manage_finances', 'view_revenue', 'manage_budget', 'generate_reports', 'approve_transactions'],
    dashboardRoute: '/dashboard/staff/finance',
    features: ['Revenue Dashboard', 'Budget Management', 'Financial Reports', 'Transaction Approval', 'Invoice Management'],
  },
  finance_officer: {
    id: 'finance_officer',
    name: 'Finance Officer',
    displayName: 'Finance Officer',
    description: 'Handle day-to-day financial transactions and record keeping',
    color: ROLE_COLORS.finance_officer,
    icon: '📊',
    permissions: ['view_revenue', 'manage_transactions', 'generate_invoices', 'view_budget'],
    dashboardRoute: '/dashboard/staff/finance',
    features: ['Transaction Processing', 'Invoice Generation', 'Financial Records', 'Payment Tracking'],
  },
  hr_manager: {
    id: 'hr_manager',
    name: 'HR Manager',
    displayName: 'HR Manager',
    description: 'Manage employee relations, recruitment, and organizational development',
    color: ROLE_COLORS.hr_manager,
    icon: '👔',
    permissions: ['manage_employees', 'manage_recruitment', 'view_hr_reports', 'approve_leave', 'manage_training'],
    dashboardRoute: '/dashboard/staff/hr',
    features: ['Employee Management', 'Recruitment', 'Leave Management', 'Training Programs', 'HR Analytics'],
  },
  hr_officer: {
    id: 'hr_officer',
    name: 'HR Officer',
    displayName: 'HR Officer',
    description: 'Support HR operations and employee administration',
    color: ROLE_COLORS.hr_officer,
    icon: '📋',
    permissions: ['view_employees', 'manage_leave_requests', 'process_recruitment', 'view_hr_reports'],
    dashboardRoute: '/dashboard/staff/hr',
    features: ['Leave Processing', 'Employee Records', 'Recruitment Support', 'HR Administration'],
  },
  receptionist: {
    id: 'receptionist',
    name: 'Receptionist',
    displayName: 'Receptionist',
    description: 'Manage front desk operations and member services',
    color: ROLE_COLORS.receptionist,
    icon: '📞',
    permissions: ['manage_bookings', 'view_members', 'handle_inquiries', 'manage_facility_access'],
    dashboardRoute: '/dashboard/staff/reception',
    features: ['Booking Management', 'Member Services', 'Facility Access', 'Inquiry Handling'],
  },
  security_officer: {
    id: 'security_officer',
    name: 'Security Officer',
    displayName: 'Security Officer',
    description: 'Ensure facility security and member safety',
    color: ROLE_COLORS.security_officer,
    icon: '🔐',
    permissions: ['monitor_security', 'manage_access', 'view_incidents', 'emergency_response'],
    dashboardRoute: '/dashboard/staff/security',
    features: ['Security Monitoring', 'Access Control', 'Incident Reporting', 'Emergency Response'],
  },
  watchman: {
    id: 'watchman',
    name: 'Watchman',
    displayName: 'Security Guard',
    description: 'Provide overnight security and facility monitoring',
    color: ROLE_COLORS.watchman,
    icon: '👁️',
    permissions: ['monitor_facility', 'patrol_premises', 'report_incidents'],
    dashboardRoute: '/dashboard/staff/security',
    features: ['Facility Monitoring', 'Night Patrol', 'Incident Reporting', 'Access Control'],
  },
  maintenance_manager: {
    id: 'maintenance_manager',
    name: 'Maintenance Manager',
    displayName: 'Maintenance Manager',
    description: 'Oversee facility maintenance and equipment management',
    color: ROLE_COLORS.maintenance_manager,
    icon: '🔧',
    permissions: ['manage_maintenance', 'schedule_repairs', 'manage_equipment', 'supervise_staff'],
    dashboardRoute: '/dashboard/staff/maintenance',
    features: ['Maintenance Scheduling', 'Equipment Management', 'Staff Supervision', 'Facility Inspections'],
  },
  maintenance_staff: {
    id: 'maintenance_staff',
    name: 'Maintenance Staff',
    displayName: 'Maintenance Technician',
    description: 'Perform facility maintenance and repairs',
    color: ROLE_COLORS.maintenance_staff,
    icon: '🛠️',
    permissions: ['perform_repairs', 'maintain_equipment', 'report_issues'],
    dashboardRoute: '/dashboard/staff/maintenance',
    features: ['Equipment Repair', 'Facility Maintenance', 'Issue Reporting', 'Preventive Maintenance'],
  },
  cleaner: {
    id: 'cleaner',
    name: 'Cleaner',
    displayName: 'Facility Cleaner',
    description: 'Maintain cleanliness and hygiene of facilities',
    color: ROLE_COLORS.cleaner,
    icon: '🧹',
    permissions: ['clean_facilities', 'maintain_supplies', 'report_cleaning_issues'],
    dashboardRoute: '/dashboard/staff/maintenance',
    features: ['Facility Cleaning', 'Supply Management', 'Hygiene Maintenance', 'Quality Control'],
  },
  janitor: {
    id: 'janitor',
    name: 'Janitor',
    displayName: 'Janitor',
    description: 'Handle general maintenance and cleaning duties',
    color: ROLE_COLORS.janitor,
    icon: '🧽',
    permissions: ['general_maintenance', 'cleaning_duties', 'waste_management'],
    dashboardRoute: '/dashboard/staff/maintenance',
    features: ['General Maintenance', 'Cleaning Services', 'Waste Management', 'Facility Upkeep'],
  },
  inventory_manager: {
    id: 'inventory_manager',
    name: 'Inventory Manager',
    displayName: 'Inventory Manager',
    description: 'Manage inventory, supplies, and procurement',
    color: ROLE_COLORS.inventory_manager,
    icon: '📦',
    permissions: ['manage_inventory', 'procure_supplies', 'track_stock', 'manage_vendors'],
    dashboardRoute: '/dashboard/staff/inventory',
    features: ['Stock Management', 'Procurement', 'Vendor Relations', 'Inventory Tracking'],
  },
  support_manager: {
    id: 'support_manager',
    name: 'Support Manager',
    displayName: 'Support Manager',
    description: 'Oversee customer support and service operations',
    color: ROLE_COLORS.support_manager,
    icon: '🎧',
    permissions: ['manage_support', 'handle_escalations', 'supervise_team', 'improve_processes'],
    dashboardRoute: '/dashboard/staff/support',
    features: ['Team Management', 'Process Improvement', 'Quality Assurance', 'Customer Relations'],
  },
  support_staff: {
    id: 'support_staff',
    name: 'Support Staff',
    displayName: 'Support Representative',
    description: 'Provide customer support and assistance',
    color: ROLE_COLORS.support_staff,
    icon: '💬',
    permissions: ['handle_inquiries', 'resolve_issues', 'provide_assistance'],
    dashboardRoute: '/dashboard/staff/support',
    features: ['Customer Service', 'Issue Resolution', 'Information Provision', 'Service Quality'],
  },
  marketing_manager: {
    id: 'marketing_manager',
    name: 'Marketing Manager',
    displayName: 'Marketing Manager',
    description: 'Develop and execute marketing strategies',
    color: ROLE_COLORS.marketing_manager,
    icon: '📢',
    permissions: ['manage_marketing', 'create_campaigns', 'analyze_performance', 'manage_brand'],
    dashboardRoute: '/dashboard/staff/marketing',
    features: ['Campaign Management', 'Brand Development', 'Performance Analytics', 'Market Research'],
  },
  operations_manager: {
    id: 'operations_manager',
    name: 'Operations Manager',
    displayName: 'Operations Manager',
    description: 'Oversee daily operations and business processes',
    color: ROLE_COLORS.operations_manager,
    icon: '⚙️',
    permissions: ['manage_operations', 'optimize_processes', 'coordinate_departments', 'strategic_planning'],
    dashboardRoute: '/dashboard/staff/operations',
    features: ['Process Optimization', 'Department Coordination', 'Strategic Planning', 'Performance Monitoring'],
  },
  developer: {
    id: 'developer',
    name: 'Developer',
    displayName: 'Developer',
    description: 'Monitor site health, bugs, and performance in realtime',
    color: ROLE_COLORS.developer,
    icon: '💻',
    permissions: ['view_monitoring', 'manage_bugs', 'view_performance'],
    dashboardRoute: '/dashboard/developer',
    features: ['Bug Tracking', 'Performance Monitoring', 'Release Notifications', 'Incident Response'],
  },
};

/**
 * Get role configuration by ID
 */
export function getRoleConfig(roleId: UserRole): RoleConfig {
  return ROLES[roleId] || ROLES.player;
}

/**
 * Check if user has permission
 */
export function hasPermission(roleId: UserRole, permission: string): boolean {
  const role = ROLES[roleId];
  return role.permissions.includes(permission) || roleId === 'org';
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(roleId: UserRole): string[] {
  return ROLES[roleId].permissions;
}

/**
 * Get role color by ID
 */
export function getRoleColor(roleId: UserRole) {
  return ROLE_COLORS[roleId] || ROLE_COLORS.player;
}
