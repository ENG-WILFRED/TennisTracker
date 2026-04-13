'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/context/RoleContext';
import { useAuth } from '@/context/AuthContext';
import { PlayerDashboard } from '@/components/dashboards/PlayerDashboard';
import { CoachDashboard } from '@/components/dashboards/CoachDashboard';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';
import { FinanceDashboard } from '@/components/dashboards/FinanceDashboard';
import { RefereeDashboard } from '@/components/dashboards/referee/RefereeDashboard';
import { OrganizationDashboard } from '@/components/dashboards/OrganizationDashboard';
import { SpectatorDashboard } from '@/components/dashboards/SpectatorDashboard';

export default function DashboardPage() {
  const { currentRole, isRoleLoaded } = useRole();
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, router]);

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
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Render role-specific dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Role and Role-Specific Dashboard */}
        {currentRole === 'player' && <PlayerDashboard />}
        {currentRole === 'coach' && <CoachDashboard />}
        {currentRole === 'admin' && <AdminDashboard />}
        {currentRole === 'finance_officer' && <FinanceDashboard />}
        {currentRole === 'referee' && <RefereeDashboard />}
        {currentRole === 'org' && <OrganizationDashboard />}
        {currentRole === 'spectator' && <SpectatorDashboard />}

        {/* Fallback for unknown roles */}
        {!['player', 'coach', 'admin', 'finance_officer', 'referee', 'org', 'spectator'].includes(currentRole || '') && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-yellow-800">Role Not Configured</h2>
            <p className="text-yellow-700">Your role is not recognized by the system.</p>
          </div>
        )}
      </div>
    </div>
  );
}