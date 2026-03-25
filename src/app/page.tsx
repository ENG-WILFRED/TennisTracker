'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import LandingPage from '@/components/LandingPage';

export default function Home() {
  const { isLoggedIn, user, isLoading } = useAuth();
  const { currentRole, isRoleLoaded } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isLoggedIn && user && isRoleLoaded && currentRole) {
      // Redirect authenticated users to their role-based dashboard
      router.push(`/dashboard/${currentRole}/${user.id}`);
    }
  }, [isLoggedIn, user, isLoading, router, isRoleLoaded, currentRole]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  return <LandingPage />;
}
