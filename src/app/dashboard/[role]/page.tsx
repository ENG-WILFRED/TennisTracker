'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useRole } from '@/context/RoleContext';
import { useAuth } from '@/context/AuthContext';

export default function DashboardRolePage() {
  const { currentRole, isRoleLoaded } = useRole();
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const roleFromURL = params?.role as string;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, router]);

  // Redirect to the new route with role and id
  useEffect(() => {
    if (isRoleLoaded && currentRole && user?.id) {
      if (currentRole === roleFromURL) {
        router.push(`/dashboard/${currentRole}/${user.id}`);
      } else {
        router.push(`/dashboard/${currentRole}/${user.id}`);
      }
    }
  }, [currentRole, roleFromURL, isRoleLoaded, router, user?.id]);

  // Show loading while role is being loaded
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
        <p className="mt-4 text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
