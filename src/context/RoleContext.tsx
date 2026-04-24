'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { UserRole, getRoleConfig, getRoleColor, hasPermission, ROLES } from '@/config/roles';

export interface Membership {
  role: UserRole;
  orgId: string;
  orgName: string;
}

export interface RoleContextType {
  currentRole: UserRole | null;
  currentOrgId: string | null;
  currentOrgName: string;
  availableMemberships: Membership[];
  setCurrentRole: (role: UserRole, orgId?: string | null, orgName?: string) => void;
  setCurrentOrgId: (orgId: string | null) => void;
  hasPermission: (permission: string) => boolean;
  getRoleConfig: (role?: UserRole) => any;
  getRoleColor: (role?: UserRole) => any;
  isRoleLoaded: boolean;
  userMemberships: Membership[];
  setUserMemberships: (memberships: Membership[]) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export interface RoleProviderProps {
  defaultRole?: UserRole;
  children: React.ReactNode;
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ children, defaultRole = 'player' }) => {
  const [currentRole, setCurrentRole] = useState<UserRole | null>(defaultRole);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [currentOrgName, setCurrentOrgName] = useState<string>('Platform');
  const [userMemberships, setUserMemberships] = useState<Membership[]>([{ role: defaultRole, orgId: '', orgName: 'Platform' }]);
  const [isRoleLoaded, setIsRoleLoaded] = useState(false);

  // Load role from localStorage on mount
  useEffect(() => {
    const storedRole = localStorage.getItem('userRole') as UserRole | null;
    const storedOrgId = localStorage.getItem('userOrgId');
    const storedOrgName = localStorage.getItem('userOrgName');
    const storedMemberships = localStorage.getItem('userMemberships');

    if (storedRole && ROLES[storedRole]) {
      setCurrentRole(storedRole);
    }

    if (storedOrgId) {
      setCurrentOrgId(storedOrgId);
    }

    if (storedOrgName) {
      setCurrentOrgName(storedOrgName);
    }

    if (storedMemberships) {
      try {
        const memberships = JSON.parse(storedMemberships) as Membership[];
        setUserMemberships(memberships);
      } catch (error) {
        console.error('Failed to parse stored memberships:', error);
      }
    }

    setIsRoleLoaded(true);
  }, []);

  // Save role to localStorage when it changes
  const handleSetCurrentOrgId = useCallback((orgId: string | null) => {
    setCurrentOrgId(orgId);
    localStorage.setItem('userOrgId', orgId || '');
  }, []);

  const handleSetCurrentRole = useCallback((role: UserRole, orgId?: string | null, orgName?: string) => {
    if (ROLES[role]) {
      setCurrentRole(role);
      localStorage.setItem('userRole', role);

      if (role === 'member') {
        setCurrentOrgId('');
        setCurrentOrgName('Membership Center');
        localStorage.setItem('userOrgId', '');
        localStorage.setItem('userOrgName', 'Membership Center');
      } else if (orgId != null) {
        setCurrentOrgId(orgId);
        setCurrentOrgName(orgName || 'Organization');
        localStorage.setItem('userOrgId', orgId);
        localStorage.setItem('userOrgName', orgName || 'Organization');
      }
    }
  }, []);

  const handleSetUserMemberships = useCallback((memberships: Membership[]) => {
    setUserMemberships(memberships);
    localStorage.setItem('userMemberships', JSON.stringify(memberships));

    // If current role is member, preserve it as the membership dashboard role.
    if (currentRole === 'member') {
      return;
    }

    const matchingMembership = memberships.find((m) => m.role === currentRole);
    if (matchingMembership) {
      if (currentOrgId !== matchingMembership.orgId) {
        setCurrentOrgId(matchingMembership.orgId);
        setCurrentOrgName(matchingMembership.orgName);
        localStorage.setItem('userOrgId', matchingMembership.orgId);
        localStorage.setItem('userOrgName', matchingMembership.orgName);
      }
      return;
    }

    // If current role is not in available memberships, switch to first available
    if (memberships.length > 0) {
      const firstMembership = memberships[0];
      handleSetCurrentRole(firstMembership.role, firstMembership.orgId, firstMembership.orgName);
    }
  }, [currentRole, currentOrgId, handleSetCurrentRole]);

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
    currentOrgId,
    currentOrgName,
    availableMemberships: userMemberships,
    setCurrentRole: handleSetCurrentRole,
    setCurrentOrgId: handleSetCurrentOrgId,
    hasPermission: handleHasPermission,
    getRoleConfig: getRoleConfigWithDefault,
    getRoleColor: getRoleColorWithDefault,
    isRoleLoaded,
    userMemberships,
    setUserMemberships: handleSetUserMemberships,
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
