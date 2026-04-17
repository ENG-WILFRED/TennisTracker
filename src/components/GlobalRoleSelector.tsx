"use client";

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { RoleSelection } from './RoleSelection';

export default function GlobalRoleSelector() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { availableMemberships, setCurrentMembership } = useRole();
  const [showSelector, setShowSelector] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const roleOptions = useMemo(
    () => availableMemberships.filter((membership) => membership.role),
    [availableMemberships]
  );

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith('/login') || pathname.startsWith('/accept-terms') || pathname.startsWith('/register')) {
      setShowSelector(false);
      return;
    }

    if (isDismissed) return;

    if (roleOptions.length > 1) {
      setShowSelector(true);
    }
  }, [pathname, roleOptions.length, isDismissed]);

  const handleRoleSelect = (membership: { role: any; orgId: string; orgName: string }) => {
    setCurrentMembership({ role: membership.role, orgId: membership.orgId, orgName: membership.orgName });
    setShowSelector(false);
    setIsDismissed(true);
  };

  if (!showSelector || roleOptions.length <= 1) {
    return null;
  }

  return (
    <RoleSelection
      availableMemberships={availableMemberships}
      userName={user ? `${user.firstName} ${user.lastName}` : 'Guest'}
      userPhoto={user?.photo || undefined}
      onRoleSelect={handleRoleSelect}
    />
  );
}
