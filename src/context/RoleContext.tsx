'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { UserRole, getRoleConfig, getRoleColor, hasPermission, ROLES } from '@/config/roles';

export interface RoleContextType {
  currentRole: UserRole | null;
  availableRoles: UserRole[];
  setCurrentRole: (role: UserRole) => void;
  hasPermission: (permission: string) => boolean;
  getRoleConfig: (role?: UserRole) => any;
  getRoleColor: (role?: UserRole) => any;
  isRoleLoaded: boolean;
  userRoles: UserRole[];
  setUserRoles: (roles: UserRole[]) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export interface RoleProviderProps {
  defaultRole?: UserRole;
  children: React.ReactNode;
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ children, defaultRole = 'player' }) => {
  const [currentRole, setCurrentRole] = useState<UserRole | null>(defaultRole);
  const [userRoles, setUserRoles] = useState<UserRole[]>([defaultRole]);
  const [isRoleLoaded, setIsRoleLoaded] = useState(false);

  // Load role from localStorage on mount
  useEffect(() => {
    const storedRole = localStorage.getItem('userRole') as UserRole | null;
    const storedRoles = localStorage.getItem('userRoles');

    if (storedRole && ROLES[storedRole]) {
      setCurrentRole(storedRole);
    }

    if (storedRoles) {
      try {
        const roles = JSON.parse(storedRoles) as UserRole[];
        setUserRoles(roles);
      } catch (error) {
        console.error('Failed to parse stored roles:', error);
      }
    }

    setIsRoleLoaded(true);
  }, []);

  // Save role to localStorage when it changes
  const handleSetCurrentRole = useCallback((role: UserRole) => {
    if (ROLES[role]) {
      setCurrentRole(role);
      localStorage.setItem('userRole', role);
    }
  }, []);

  const handleSetUserRoles = useCallback((roles: UserRole[]) => {
    setUserRoles(roles);
    localStorage.setItem('userRoles', JSON.stringify(roles));

    // If current role is not in available roles, switch to first available
    if (roles.length > 0 && !roles.includes(currentRole || 'player')) {
      handleSetCurrentRole(roles[0]);
    }
  }, [currentRole, handleSetCurrentRole]);

  const handleHasPermission = useCallback(
    (permission: string): boolean => {
      return currentRole ? hasPermission(currentRole, permission) : false;
    },
    [currentRole]
  );

  const getRoleConfigWithDefault = useCallback(
    (role?: UserRole) => {
      return getRoleConfig(role || currentRole || 'player');
    },
    [currentRole]
  );

  const getRoleColorWithDefault = useCallback(
    (role?: UserRole) => {
      return getRoleColor(role || currentRole || 'player');
    },
    [currentRole]
  );

  const value: RoleContextType = {
    currentRole,
    availableRoles: userRoles,
    setCurrentRole: handleSetCurrentRole,
    hasPermission: handleHasPermission,
    getRoleConfig: getRoleConfigWithDefault,
    getRoleColor: getRoleColorWithDefault,
    isRoleLoaded,
    userRoles,
    setUserRoles: handleSetUserRoles,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

/**
 * Hook to use role context
 * Throws error if used outside RoleProvider
 */
export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within RoleProvider');
  }
  return context;
};

/**
 * Hook to check if user has specific permission
 */
export const useHasPermission = (permission: string): boolean => {
  const { hasPermission: checkPermission } = useRole();
  return checkPermission(permission);
};

/**
 * Hook to get current role config
 */
export const useRoleConfig = () => {
  const { getRoleConfig: getConfig } = useRole();
  return getConfig();
};

/**
 * Hook to get current role color
 */
export const useRoleColor = () => {
  const { getRoleColor: getColor } = useRole();
  return getColor();
};

/**
 * Higher-order component for role-based access control
 */
export const withRoleProtection = <P extends object>(
  Component: React.ComponentType<P>,
  requiredRole: UserRole | UserRole[]
) => {
  return (props: P) => {
    const { currentRole } = useRole();
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    if (!currentRole || !requiredRoles.includes(currentRole)) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-red-50">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-red-700 mb-4">Access Denied</h1>
            <p className="text-red-600">You don't have permission to access this page.</p>
            <p className="text-gray-600 mt-2">Required role: {requiredRoles.join(', ')}</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};
