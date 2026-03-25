'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';

export default function CommunityPage() {
  const { user, isLoggedIn } = useAuth();
  const { currentRole } = useRole();
  const router = useRouter();

  // Redirect to community page with role and id
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    } else if (user?.id && currentRole) {
      router.push(`/community/${currentRole}/${user.id}`);
    }
  }, [isLoggedIn, user?.id, currentRole, router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 20 }}>⏳</div>
        <div>Redirecting to community...</div>
      </div>
    </div>
  );
}
