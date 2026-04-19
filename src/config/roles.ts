/**
 * Role Configuration with Colors, Descriptions, and Permissions
 * Centralized configuration for all user roles in the system
 */

export type UserRole = 'player' | 'coach' | 'admin' | 'finance_officer' | 'referee' | 'org' | 'member' | 'spectator' | 'developer';

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
  finance_officer: {
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
  finance_officer: {
    id: 'finance_officer',
    name: 'Finance Officer',
    displayName: 'Finance Officer',
    description: 'Handle finances, memberships, and revenue tracking',
    color: ROLE_COLORS.finance_officer,
    icon: '💰',
    permissions: [
      'view_revenue',
      'manage_memberships',
      'manage_transactions',
      'view_financial_reports',
      'generate_invoices',
      'view_budget',
    ],
    dashboardRoute: '/dashboard/finance',
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
