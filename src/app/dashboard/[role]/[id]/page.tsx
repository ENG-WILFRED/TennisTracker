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
import { UserRole } from '@/config/roles';

export default function DashboardRoleIdPage() {
  const { currentRole, currentOrgId, availableMemberships, isRoleLoaded, setCurrentRole } = useRole();
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const roleFromURL = params?.role as string;
  const userIdFromURL = params?.id as string;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, router]);

  // Validate and set role from URL
  useEffect(() => {
    if (isRoleLoaded && currentRole && roleFromURL && user?.id) {
      // Check if the role in URL matches the current role
      if (currentRole !== roleFromURL) {
        // If roles don't match, redirect to correct role URL with user ID
        router.push(`/dashboard/${currentRole}/${user.id}`);
      }
      
      // Check if the user ID in URL matches the current user
      if (user.id !== userIdFromURL) {
        // If user ID doesn't match, redirect to correct user's dashboard
        router.push(`/dashboard/${currentRole}/${user.id}`);
      }
    }
  }, [currentRole, roleFromURL, userIdFromURL, isRoleLoaded, router, user?.id]);

  // Show loading while role is being loaded
  if (!isRoleLoaded) {
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
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If profile view is requested, it will be handled by the dashboard component
  // via the useSearchParams() hook checking for ?profile=true
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Role-Specific Dashboard */}
      {currentRole === 'player' && <PlayerDashboard />}
      {currentRole === 'coach' && <CoachDashboard />}
      {currentRole === 'admin' && <AdminDashboard />}
      {currentRole === 'finance_officer' && <FinanceDashboard />}
      {currentRole === 'referee' && <RefereeDashboard />}
      {currentRole === 'org' && <OrganizationDashboard />}
      {currentRole === 'spectator' && <SpectatorDashboard />}

      {/* Fallback for unknown roles */}
      {!['player', 'coach', 'admin', 'finance_officer', 'referee', 'org', 'spectator'].includes(currentRole || '') && (
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
