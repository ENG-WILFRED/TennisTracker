'use client';

import React, { useState } from 'react';
import { useRole } from '@/context/RoleContext';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { SwitchConfirmModal } from './SwitchConfirmModal';
import { Card, Button, colors } from '@/lib/vico-design-fallback';

interface MembershipSwitcherProps {
  style?: React.CSSProperties;
}

const G = {
  surface: colors.surface,
  surfaceSecondary: colors.surfaceSecondary,
  border: colors.border,
  primary: colors.primary,
  primaryHover: colors.primaryHover || colors.primary,
  text: colors.textPrimary,
  muted: colors.textMuted,
};

export const MembershipSwitcher: React.FC<MembershipSwitcherProps> = ({ style }) => {
  const { availableMemberships, currentRole, currentOrgName, setCurrentRole } = useRole();
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<any>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  // Only show if there are multiple memberships
  if (!availableMemberships || availableMemberships.length <= 1) {
    return null;
  }

  const handleSwitchClick = (membership: any) => {
    // Don't switch if it's the same as current
    const isSameMembership =
      currentRole === membership.role &&
      currentOrgName === (membership.orgName || 'Platform');
    
    if (isSameMembership) {
      setIsOpen(false);
      return;
    }

    setSelectedMembership(membership);
    setShowModal(true);
  };

  const handleConfirmSwitch = async () => {
    if (!selectedMembership) return;

    setIsSwitching(true);

    try {
      // Call switch role API to set server-side cookies
      const response = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: selectedMembership.role,
          orgId: selectedMembership.orgId,
          orgName: selectedMembership.orgName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to switch role');
      }

      // IMPORTANT: Update localStorage FIRST before any navigation
      // This ensures RoleContext reads fresh values on the new page load
      localStorage.setItem('userRole', selectedMembership.role);
      localStorage.setItem('userOrgId', selectedMembership.orgId || '');
      localStorage.setItem('userOrgName', selectedMembership.orgName || 'Organization');

      // Close modal and dropdown before navigation
      setShowModal(false);
      setIsOpen(false);

      // Hard navigation to new dashboard (forces page reload with new localStorage values)
      const dashboardUrl = `/dashboard/${selectedMembership.role}/${user?.id}`;
      window.location.href = dashboardUrl;
    } catch (error) {
      console.error('Failed to switch role:', error);
      alert('Failed to switch account. Please try again.');
      setIsSwitching(false);
    }
  };

  const handleCancelSwitch = () => {
    setShowModal(false);
    setSelectedMembership(null);
  };

  return (
    <>
      <div style={style}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={isSwitching}
            style={{
              width: '100%',
              background: G.surfaceSecondary,
              border: `1px solid ${G.border}`,
              color: G.primary,
              borderRadius: 6,
              padding: '6px 8px',
              fontSize: 9,
              fontWeight: 700,
              cursor: isSwitching ? 'not-allowed' : 'pointer',
              transition: 'all .15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              opacity: isSwitching ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isSwitching) {
                e.currentTarget.style.background = 'rgba(121, 191, 62, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(121, 191, 62, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isOpen && !isSwitching) {
                e.currentTarget.style.background = 'rgba(121, 191, 62, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(121, 191, 62, 0.3)';
              }
            }}
          >
            <span style={{ maxWidth: '85%', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              🔀 {isSwitching ? 'Switching...' : 'Switch Account'}
            </span>
            <span style={{ marginLeft: 4 }}>{isOpen ? '▲' : '▼'}</span>
          </button>

          {isOpen && !isSwitching && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                right: 0,
                background: G.surfaceSecondary,
                border: `1px solid ${G.border}`,
                borderRadius: 6,
                marginBottom: 4,
                zIndex: 1000,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                maxHeight: '240px',
                overflowY: 'auto',
              }}
            >
              {availableMemberships.map((membership, index) => {
                const isActive =
                  currentRole === membership.role &&
                  (membership.orgId === '' || currentOrgName === membership.orgName);
                return (
                  <button
                    key={`${membership.role}-${membership.orgId}-${index}`}
                    onClick={() => handleSwitchClick(membership)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: isActive ? G.surface : 'transparent',
                      border: 'none',
                      borderBottom:
                        index < availableMemberships.length - 1 ? `1px solid ${G.border}33` : 'none',
                      color: isActive ? G.primary : colors.textPrimary,
                      textAlign: 'left',
                      cursor: isActive ? 'default' : 'pointer',
                      fontSize: 10,
                      fontWeight: isActive ? 700 : 500,
                      transition: 'all .1s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = G.surface;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <span style={{ fontSize: 12 }}>{isActive ? '✓' : ' '}</span>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'capitalize',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {membership.role}
                      </div>
                      <div
                        style={{
                          fontSize: 8,
                          color: isActive ? G.primary : G.muted,
                          marginTop: 1,
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {membership.orgName || 'Platform'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <SwitchConfirmModal
        isOpen={showModal}
        membership={selectedMembership}
        onConfirm={handleConfirmSwitch}
        onCancel={handleCancelSwitch}
        isLoading={isSwitching}
      />
    </>
  );
};
