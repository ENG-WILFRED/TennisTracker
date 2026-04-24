'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useRole } from '@/context/RoleContext';
import { useAuth } from '@/context/AuthContext';
import { PlayerDashboard } from '@/components/dashboards/PlayerDashboard';
import { CoachDashboard } from '@/components/dashboards/CoachDashboard';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';
import { FinanceDashboard } from '@/components/dashboards/FinanceDashboard';
import { RefereeDashboard } from '@/components/dashboards/referee/RefereeDashboard';
import { OrganizationDashboard } from '@/components/dashboards/OrganizationDashboard';
import { SpectatorDashboard } from '@/components/dashboards/spectator';
import { DeveloperDashboard } from '@/components/dashboards/DeveloperDashboard';
import { MemberDashboard } from '@/components/dashboards/MemberDashboard';
import { UserRole } from '@/config/roles';

export default function DashboardRoleIdPage() {
  const { currentRole, isRoleLoaded, availableMemberships, setCurrentRole } = useRole();
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const roleFromURL = params?.role as string;
  const userIdFromURL = params?.id as string;
  const validRoles: UserRole[] = ['player', 'coach', 'admin', 'finance_officer', 'referee', 'org', 'member', 'spectator', 'developer'];
  const routeRole = validRoles.includes(roleFromURL as UserRole) ? (roleFromURL as UserRole) : null;
  const activeRole = routeRole || currentRole;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, router]);

  // Validate the requested dashboard route before rendering
  useEffect(() => {
    if (!isRoleLoaded || !roleFromURL || !user?.id) return;

    if (user.id !== userIdFromURL) {
      router.push(`/dashboard/${currentRole || 'spectator'}/${user.id}`);
      return;
    }

    if (roleFromURL !== 'member' && currentRole !== roleFromURL) {
      const membership = availableMemberships.find((m: { role: UserRole }) => m.role === roleFromURL);
      const isUserRoleMatch = user?.role === roleFromURL;

      if (membership) {
        setCurrentRole(roleFromURL as UserRole, membership.orgId, membership.orgName);
        return;
      }

      if (isUserRoleMatch) {
        setCurrentRole(roleFromURL as UserRole);
        return;
      }

      if (currentRole) {
        router.push(`/dashboard/${currentRole}/${user.id}`);
      }
    }
  }, [availableMemberships, currentRole, isRoleLoaded, roleFromURL, router, setCurrentRole, user?.id, user?.role, userIdFromURL]);

  useEffect(() => {
    if (routeRole && routeRole !== 'member' && currentRole && currentRole !== routeRole && user?.id) {
      router.push(`/dashboard/${currentRole}/${user.id}`);
      return;
    }

    if (!routeRole && currentRole && user?.id) {
      router.push(`/dashboard/${currentRole}/${user.id}`);
      return;
    }
  }, [currentRole, routeRole, userIdFromURL, isRoleLoaded, router, user?.id]);

  const canRenderDashboard = isRoleLoaded && user?.id && userIdFromURL === user.id && (!routeRole || routeRole === 'member' || currentRole === routeRole);

  if (!canRenderDashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block">
            <svg className="animate-spin h-12 w-12 text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <p className="mt-4 text-gray-600">Verifying dashboard access...</p>
        </div>
      </div>
    );
  }

  // If profile view is requested, it will be handled by the dashboard component
  // via the useSearchParams() hook checking for ?profile=true
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Role-Specific Dashboard */}
      {activeRole === 'player' && <PlayerDashboard />}
      {activeRole === 'coach' && <CoachDashboard />}
      {activeRole === 'admin' && <AdminDashboard />}
      {activeRole === 'finance_officer' && <FinanceDashboard />}
      {activeRole === 'referee' && <RefereeDashboard />}
      {activeRole === 'org' && <OrganizationDashboard />}
      {activeRole === 'member' && <MemberDashboard />}
      {activeRole === 'spectator' && <SpectatorDashboard />}
      {activeRole === 'developer' && <DeveloperDashboard />}

      {/* Fallback for unknown roles */}
      {!['player', 'coach', 'admin', 'finance_officer', 'referee', 'org', 'member', 'spectator', 'developer'].includes(activeRole || '') && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
            <h2 className="text-xl font-bold text-yellow-800 mb-2">Role Not Configured</h2>
            <p className="text-yellow-700">Your role is not recognized by the system. Please contact support.</p>
          </div>
        </div>
      )}
    </div>
  );
}
