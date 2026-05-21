'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { RoleSelection } from '@/components/RoleSelection';

export default function OAuthRoleSelectPage() {
  const router = useRouter();
  const search = useSearchParams();
  const { addToast } = useToast();
  const { login } = useAuth();
  const { setUserMemberships, setCurrentRole } = useRole();

  const [loading, setLoading] = useState(true);
  const [availableMemberships, setAvailableMemberships] = useState<any[]>([]);
  const [user, setUser] = useState<any | null>(null);

  const userId = search.get('userId');
  const accessToken = search.get('accessToken');
  const refreshToken = search.get('refreshToken');
  const firstName = search.get('firstName');
  const lastName = search.get('lastName');
  const email = search.get('email');
  const username = search.get('username');
  const photo = search.get('photo');

  useEffect(() => {
    if (!userId || !accessToken || !refreshToken) {
      addToast('Invalid OAuth session. Please try logging in again.', 'error');
      router.push('/login');
      return;
    }

    const fetchRoles = async () => {
      try {
        const res = await fetch(`/api/auth/oauth-roles?userId=${encodeURIComponent(userId)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to fetch roles');

        setAvailableMemberships(data.availableRoles || []);
        setUser(data.user || { id: userId, firstName: firstName || '', lastName: lastName || '', email, username, photo });

        // Decide whether to show role selector
        const memberships = data.availableRoles || [];
        const shouldShowRoleSelection = memberships.length > 1 || (memberships.length === 1 && memberships[0].role !== 'spectator' && memberships[0].role !== 'developer');

        if (!shouldShowRoleSelection) {
          // Auto-select first (or spectator/developer) and login
          const selected = memberships[0] || { role: 'spectator', orgId: '', orgName: 'Platform' };

          // Set local role state
          setUserMemberships(memberships.length ? memberships : [{ role: 'spectator', orgId: '', orgName: 'Platform' }]);
          setCurrentRole(selected.role, selected.orgId || null, selected.orgName || 'Platform');

          // Perform client login (store tokens + user)
          login({ accessToken: accessToken!, refreshToken: refreshToken! }, { id: userId, username: username || '', email: email || '', firstName: firstName || '', lastName: lastName || '', photo: photo || null, profileComplete: data.user?.profileComplete ?? true });

          if (selected.role === 'spectator') {
            router.push(`/dashboard/spectator/${userId}`);
          } else {
            router.push('/dashboard');
          }
        }
      } catch (err: any) {
        addToast(err.message || 'Failed to fetch roles', 'error');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [userId, accessToken, refreshToken, addToast, router, setUserMemberships, setCurrentRole, login, firstName, lastName, email, username, photo]);

  const handleRoleSelect = (membership: any) => {
    if (!userId || !accessToken || !refreshToken) return;

    setUserMemberships(availableMemberships);
    setCurrentRole(membership.role, membership.orgId || null, membership.orgName || 'Platform');

    login({ accessToken: accessToken!, refreshToken: refreshToken! }, { id: userId, username: username || '', email: email || '', firstName: firstName || '', lastName: lastName || '', photo: photo || null, profileComplete: user?.profileComplete ?? true });

    if (membership.role === 'spectator') router.push(`/dashboard/spectator/${userId}`);
    else router.push('/dashboard');
  };

  return (
    <>
      {!loading && availableMemberships.length > 0 && user && (
        <RoleSelection availableMemberships={availableMemberships} userName={`${user.firstName} ${user.lastName}`} userPhoto={user.photo} onRoleSelect={handleRoleSelect} />
      )}
    </>
  );
}
