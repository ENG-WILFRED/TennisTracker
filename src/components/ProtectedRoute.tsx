'use client';

import React, { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useRole } from '@/context/RoleContext';
import { useAuth } from '@/context/AuthContext';
import { UserRole, getRoleConfig } from '@/config/roles';
import { hasRouteAccess, getRouteConfig } from '@/lib/route-protection';

export interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
  requiredPermissions?: string[];
  fallback?: React.ReactNode;
}

/**
 * Client-side route protection component
 * Ensures user has required role and permissions
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
  requiredPermissions,
  fallback,
}) => {
  const { currentRole, isRoleLoaded } = useRole();
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    // Wait for role to load
    if (!isRoleLoaded) {
      return;
    }

    // Check route access
    if (!hasRouteAccess(currentRole, pathname, requiredPermissions || [])) {
      if (currentRole && user?.id) {
        router.push(`/dashboard/${currentRole}/${user.id}`);
      } else {
        router.push('/dashboard');
      }
      return;
    }

    // Check specific required roles if provided
    if (requiredRoles && !requiredRoles.includes(currentRole || 'player')) {
      if (currentRole && user?.id) {
        router.push(`/dashboard/${currentRole}/${user.id}`);
      } else {
        router.push('/dashboard');
      }
      return;
    }
  }, [isLoggedIn, isRoleLoaded, currentRole, pathname, router, requiredRoles, requiredPermissions, user?.id]);

  // Show loading while checking access
  if (!isLoggedIn || !isRoleLoaded) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-gray-600 mt-2">Checking access...</p>
          </div>
        </div>
      )
    );
  }

  // Check access and show denied message if needed
  const routeConfig = getRouteConfig(pathname);
  if (routeConfig) {
    const hasAccess = hasRouteAccess(currentRole, pathname, requiredPermissions || []);
    if (!hasAccess) {
      return (
        fallback || (
          <div className="min-h-screen flex items-center justify-center bg-red-50">
            <div className="max-w-md text-center">
              <h1 className="text-4xl font-bold text-red-700 mb-4">Access Denied</h1>
              <p className="text-red-600 mb-6">You don't have permission to access this page.</p>
              <div className="bg-white p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Current Role:</strong> {currentRole ? getRoleConfig(currentRole).displayName : 'None'}
                </p>
                {routeConfig.requiredRoles && (
                  <p className="text-sm text-gray-600">
                    <strong>Required Roles:</strong> {routeConfig.requiredRoles.join(', ')}
                  </p>
                )}
                {routeConfig.requiredPermissions && (
                  <p className="text-sm text-gray-600">
                    <strong>Required Permissions:</strong> {routeConfig.requiredPermissions.join(', ')}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  if (currentRole && user?.id) {
                    router.push(`/dashboard/${currentRole}/${user.id}`);
                  } else {
                    router.push('/dashboard');
                  }
                }}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )
      );
    }
  }

  return <>{children}</>;
};

/**
 * Hook to check if user has access to a specific route
 */
export const useHasRouteAccess = (pathname: string, requiredPermissions?: string[]): boolean => {
  const { currentRole } = useRole();
  return hasRouteAccess(currentRole, pathname, requiredPermissions || []);
};

/**
 * Hook to check if user has specific required roles
 */
export const useHasRole = (...roles: UserRole[]): boolean => {
  const { currentRole } = useRole();
  return roles.includes(currentRole || 'player');
};
