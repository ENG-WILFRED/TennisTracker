/**
 * Route Protection Utilities
 * Provides utilities for protecting routes based on roles and permissions
 */

import { UserRole } from '@/config/roles';

export interface ProtectedRouteConfig {
  requiredRoles?: UserRole[];
  requiredPermissions?: string[];
  redirectTo?: string;
}

export const PROTECTED_ROUTES: Record<string, ProtectedRouteConfig> = {
  // Dashboard routes
  '/dashboard': {
    requiredRoles: ['player', 'coach', 'admin', 'finance_officer', 'referee', 'org'],
  },

  // Player routes
  '/matches': {
    requiredRoles: ['player', 'coach', 'admin', 'referee'],
    redirectTo: '/login',
  },
  '/players': {
    requiredRoles: ['player', 'coach', 'admin'],
    redirectTo: '/login',
  },
  '/coaches': {
    requiredRoles: ['player', 'spectator'],
    redirectTo: '/login',
  },
  '/leaderboard': {
    requiredRoles: ['player', 'coach', 'admin'],
    redirectTo: '/login',
  },

  // Coach routes
  '/staff/manage': {
    requiredRoles: ['coach', 'admin', 'org'],
    redirectTo: '/dashboard',
  },
  '/staff/schedule': {
    requiredRoles: ['coach', 'admin', 'org'],
    redirectTo: '/dashboard',
  },
  '/staff/profile': {
    requiredRoles: ['coach', 'admin', 'org'],
    redirectTo: '/dashboard',
  },

  // Admin routes
  '/organization/members': {
    requiredRoles: ['admin', 'org'],
    requiredPermissions: ['manage_members'],
    redirectTo: '/dashboard',
  },
  '/organization/events': {
    requiredRoles: ['admin', 'org'],
    requiredPermissions: ['manage_events'],
    redirectTo: '/dashboard',
  },
  '/inventory': {
    requiredRoles: ['admin', 'org'],
    requiredPermissions: ['manage_courts'],
    redirectTo: '/dashboard',
  },
  '/organization/announcements': {
    requiredRoles: ['admin', 'org'],
    requiredPermissions: ['manage_announcements'],
    redirectTo: '/dashboard',
  },
  '/analytics': {
    requiredRoles: ['admin', 'org'],
    requiredPermissions: ['view_analytics'],
    redirectTo: '/dashboard',
  },

  // Finance Officer routes
  '/organization/finances': {
    requiredRoles: ['finance_officer', 'org'],
    requiredPermissions: ['view_revenue', 'view_financial_reports'],
    redirectTo: '/dashboard',
  },
  '/organization/memberships': {
    requiredRoles: ['finance_officer', 'org'],
    requiredPermissions: ['manage_memberships'],
    redirectTo: '/dashboard',
  },
  '/organization/transactions': {
    requiredRoles: ['finance_officer', 'org'],
    requiredPermissions: ['manage_transactions'],
    redirectTo: '/dashboard',
  },
  '/organization/invoices': {
    requiredRoles: ['finance_officer', 'org'],
    requiredPermissions: ['generate_invoices'],
    redirectTo: '/dashboard',
  },

  // Referee routes
  '/referees': {
    requiredRoles: ['referee', 'admin'],
    requiredPermissions: ['view_assignments', 'manage_matches'],
    redirectTo: '/dashboard',
  },
  '/referees/submit-score': {
    requiredRoles: ['referee'],
    requiredPermissions: ['submit_scores'],
    redirectTo: '/dashboard',
  },
  '/referees/history': {
    requiredRoles: ['referee'],
    redirectTo: '/dashboard',
  },
  '/referees/profile': {
    requiredRoles: ['referee'],
    redirectTo: '/dashboard',
  },

  // Organization routes
  '/organization/settings': {
    requiredRoles: ['org'],
    requiredPermissions: ['manage_organization'],
    redirectTo: '/dashboard',
  },
  '/organization/analytics': {
    requiredRoles: ['org', 'admin'],
    requiredPermissions: ['view_analytics'],
    redirectTo: '/dashboard',
  },
  '/organization/billing': {
    requiredRoles: ['org'],
    requiredPermissions: ['manage_billing'],
    redirectTo: '/dashboard',
  },
  '/organization/roles': {
    requiredRoles: ['org'],
    requiredPermissions: ['manage_roles'],
    redirectTo: '/dashboard',
  },

  // Chat routes
  '/chat': {
    requiredRoles: ['player', 'coach', 'admin', 'referee'],
    redirectTo: '/login',
  },
};

/**
 * Check if a route requires protection
 */
export function isProtectedRoute(pathname: string): boolean {
  return Object.keys(PROTECTED_ROUTES).some((route) => {
    if (route === pathname) return true;
    // Allow nested routes
    if (route.endsWith('/*')) {
      const baseRoute = route.slice(0, -2);
      return pathname.startsWith(baseRoute);
    }
    return false;
  });
}

/**
 * Get route protection config
 */
export function getRouteConfig(pathname: string): ProtectedRouteConfig | null {
  return PROTECTED_ROUTES[pathname] || null;
}

/**
 * Check if user has access to route
 */
export function hasRouteAccess(
  userRole: UserRole | null,
  pathname: string,
  permissions: string[] = []
): boolean {
  if (!userRole) return false;

  const config = getRouteConfig(pathname);
  if (!config) return true; // Unprotected route

  // Check role requirement
  if (config.requiredRoles && !config.requiredRoles.includes(userRole)) {
    return false;
  }

  // Check permission requirement
  if (config.requiredPermissions) {
    const hasAllPermissions = config.requiredPermissions.every((permission) => permissions.includes(permission));
    if (!hasAllPermissions) {
      return false;
    }
  }

  return true;
}
