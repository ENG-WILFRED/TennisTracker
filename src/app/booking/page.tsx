'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';

export default function BookingPage() {
  const { user, isLoggedIn } = useAuth();
  const { currentRole } = useRole();
  const router = useRouter();

  // Redirect to booking page with role and id
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    } else if (user?.id && currentRole) {
      router.push(`/booking/${currentRole}/${user.id}?booking=true`);
    }
  }, [isLoggedIn, user?.id, currentRole, router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 20 }}>⏳</div>
        <div>Redirecting to booking...</div>
      </div>
    </div>
  );
}
