'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRole } from '@/context/RoleContext';
import { useAuth } from '@/context/AuthContext';
import { LoadingState } from '@/components/LoadingState';
import { PlayerDashboard } from '@/components/dashboards/PlayerDashboard';
import { CoachDashboard } from '@/components/dashboards/CoachDashboard';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';
import { StaffDashboard } from '@/components/dashboards/StaffDashboard';
import { RefereeDashboard } from '@/components/dashboards/referee/RefereeDashboard';
import { OrganizationDashboard } from '@/components/dashboards/OrganizationDashboard';
import { SpectatorDashboard } from '@/components/dashboards/spectator';
import { DeveloperDashboard } from '@/components/dashboards/DeveloperDashboard';
import { colors } from '@vico/design-system';

export default function DashboardPage() {
  const { currentRole, isRoleLoaded } = useRole();
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, router]);

  if (!isRoleLoaded) {
    return <LoadingState icon="📊" message="Loading your dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-vico-surface" style={{ background: colors.surface }}>
      <div className="max-w-full mx-auto px-0">
        <div className={`min-h-screen py-8 ${currentRole === 'coach' ? 'bg-[#0f1e0f]' : 'bg-gradient-to-br from-green-50 to-green-100'}`}>
          <div className={`${currentRole === 'spectator' ? 'w-full mx-auto px-0' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
            {user?.profileComplete === false && (
              <div className="mb-6 rounded-2xl border border-amber-300/80 bg-amber-50 p-4 text-amber-900 shadow-sm">
                <p className="font-semibold">Complete your profile</p>
                <p className="mt-1 text-sm text-amber-800">
                  Your profile is still marked incomplete. Please update your details in <Link href="/profile" className="underline">Profile Settings</Link>.
                </p>
              </div>
            )}

            {currentRole === 'player' && <PlayerDashboard />}
            {currentRole === 'coach' && <CoachDashboard />}
            {currentRole === 'admin' && <AdminDashboard />}
            {currentRole === 'staff' && <StaffDashboard />}
            {currentRole === 'referee' && <RefereeDashboard />}
            {currentRole === 'org' && <OrganizationDashboard />}
            {currentRole === 'spectator' && <SpectatorDashboard />}
            {currentRole === 'developer' && <DeveloperDashboard />}

            {!['player', 'coach', 'admin', 'staff', 'referee', 'org', 'spectator', 'developer'].includes(currentRole || '') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-yellow-800">Dashboard Not Available</h2>
                <p className="text-yellow-700">Your role does not have access to a dashboard.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
