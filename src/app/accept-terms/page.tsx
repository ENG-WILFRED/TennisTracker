"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";
import { useToast } from "@/components/ui/ToastContext";
import { UserRole } from "@/config/roles";
import { TermsAcceptanceModal } from "@/components/TermsAcceptanceModal";

const G = {
  dark: "#0a180a",
  sidebar: "#152515",
  card: "#1a3020",
  card2: "#1b2f1b",
  cardBorder: "#2d5a35",
  border: "#243e24",
  mid: "#2d5a27",
  lime: "#7dc142",
  accent: "#a8d84e",
  text: "#e8f5e0",
  text2: "#c2dbb0",
  muted: "#7aaa6a",
  muted2: "#5e8e50",
  red: "#d94f4f",
};

export default function AcceptTermsPage() {
  const { login } = useAuth();
  const { setCurrentRole, setUserMemberships } = useRole();
  const { addToast } = useToast();
  const router = useRouter();

  const [pendingLoginData, setPendingLoginData] = useState<any>(null);
  const [tokens, setTokens] = useState<{ accessToken: string; refreshToken: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pendingLoginDataStr = sessionStorage.getItem('pendingLoginData');
    const pendingTokensStr = sessionStorage.getItem('pendingTokens');
    if (pendingLoginDataStr && pendingTokensStr) {
      setPendingLoginData(JSON.parse(pendingLoginDataStr));
      setTokens(JSON.parse(pendingTokensStr));
    } else {
      router.push('/login');
    }
    setLoading(false);
  }, [router]);

  const completeLogin = async (data: any, selectedRole: UserRole) => {
    const memberships = data.user?.memberships?.filter((m: any) => m.status === 'accepted') || data.availableRoles || [];
    const membership = memberships.find((m: any) => m.role === selectedRole);
    const finalUser = {
      ...data.user,
      role: selectedRole,
      memberships,
    };

    setCurrentRole(selectedRole, membership?.orgId, membership?.orgName);
    setUserMemberships(memberships.length ? memberships : [{ role: selectedRole, orgId: membership?.orgId || '', orgName: membership?.orgName || 'Platform' }]);

    login(
      {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      },
      finalUser
    );

    addToast('Login successful! Redirecting…', 'success');
    setLoading(false);

    setTimeout(() => {
      if (finalUser.id && selectedRole) {
        router.push(`/dashboard/${selectedRole}/${finalUser.id}`);
      } else {
        router.push('/dashboard');
      }
    }, 500);
  };

  const handleAccepted = async () => {
    if (!tokens || !pendingLoginData) return;

    try {
      const response = await fetch('/api/auth/accept-terms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.status === 401) {
        // Unauthorized - redirect to login
        addToast('Session expired. Please log in again.', 'error');
        sessionStorage.removeItem('pendingLoginData');
        sessionStorage.removeItem('pendingTokens');
        router.push('/login');
        return;
      }

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Unable to accept terms.');
      }

      addToast('You have accepted the terms.', 'success');

      sessionStorage.removeItem('pendingLoginData');
      sessionStorage.removeItem('pendingTokens');

      const roles: UserRole[] = pendingLoginData.user?.availableRoles || [];
      const selectedRole = (pendingLoginData.user?.role as UserRole) || roles[0] || 'player';
      await completeLogin(pendingLoginData, selectedRole);
    } catch (error: any) {
      addToast(error.message || 'Unable to accept terms.', 'error');
    }
  };

  const handleDecline = async () => {
    if (confirm('Are you sure you want to decline the terms? This will cancel your login.')) {
      if (!tokens) return;

      try {
        const response = await fetch('/api/auth/decline-terms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        if (response.status === 401) {
          // Unauthorized - redirect to login
          addToast('Session expired. Please log in again.', 'error');
          sessionStorage.removeItem('pendingLoginData');
          sessionStorage.removeItem('pendingTokens');
          router.push('/login');
          return;
        }

        const data = await response.json();

        // Check if account should be deleted (5 consecutive declines)
        if (data.accountDeleted) {
          addToast('Your account has been deleted due to repeated term declines.', 'error');
          sessionStorage.removeItem('pendingLoginData');
          sessionStorage.removeItem('pendingTokens');
          router.push('/login');
          return;
        }

        // Check if this is the 4th decline (warning)
        if (data.declineCount === 4) {
          addToast('⚠️ Warning: One more decline will result in account deletion.', 'error');
        }

        if (!response.ok || data.error) {
          throw new Error(data.error || 'Unable to decline terms.');
        }

        sessionStorage.removeItem('pendingLoginData');
        sessionStorage.removeItem('pendingTokens');
        router.push('/login');
      } catch (error: any) {
        addToast(error.message || 'Unable to decline terms.', 'error');
      }
    }
  };

  const handleError = (error: string) => {
    addToast(error, 'error');
    sessionStorage.removeItem('pendingLoginData');
    sessionStorage.removeItem('pendingTokens');
    router.push('/login');
  };

  if (loading) {
    return <div style={{ color: G.text, background: G.dark, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!pendingLoginData || !tokens) {
    return <div style={{ color: G.text, background: G.dark, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Session expired. Please log in again.</div>;
  }

  return (
    <TermsAcceptanceModal
      pendingLoginData={pendingLoginData}
      tokens={tokens}
      onAccepted={handleAccepted}
      onDecline={handleDecline}
      onError={handleError}
    />
  );
}