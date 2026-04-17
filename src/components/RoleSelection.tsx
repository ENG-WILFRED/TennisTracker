'use client';

import React, { useState } from 'react';

// Dashboard green color palette
const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};
import { UserRole, ROLES } from '@/config/roles';
import Button from './Button';

export interface RoleSelectionProps {
  availableMemberships: { role: UserRole; orgId: string; orgName: string; status?: string }[];
  userName: string;
  userPhoto?: string | null;
  onRoleSelect: (membership: { role: UserRole; orgId: string; orgName: string }) => void;
  isLoading?: boolean;
}

export const RoleSelection: React.FC<RoleSelectionProps> = ({
  availableMemberships,
  userName,
  userPhoto,
  onRoleSelect,
  isLoading = false,
}) => {
  // Only show accepted memberships (or memberships without explicit status) and always offer spectator as an extra option.
  const rolesFiltered = availableMemberships.filter(
    (membership) => (!membership.status || membership.status === 'accepted') && membership.role in ROLES
  );
  if (!rolesFiltered.some((membership) => membership.role === 'spectator')) {
    rolesFiltered.push({ role: 'spectator', orgId: '', orgName: 'All Platform', status: 'accepted' });
  }

  const [selectedMembership, setSelectedMembership] = useState(rolesFiltered[0]);

  const handleContinue = () => {
    if (selectedMembership) onRoleSelect(selectedMembership);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(15,31,15,0.92)' }}>
      <div
        className="rounded-lg shadow-2xl max-w-md w-full mx-4 p-8"
        style={{ background: G.card, border: `1.5px solid ${G.cardBorder}`, color: G.text }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          {userPhoto && (
            <img src={userPhoto} alt={userName} className="w-20 h-20 rounded-full mx-auto mb-4 border-2" style={{ borderColor: G.lime }} />
          )}
          <h2 className="text-2xl font-bold mb-2" style={{ color: G.lime }}>Welcome, {userName}!</h2>
          <p className="" style={{ color: G.muted }}>Select your role to continue</p>
        </div>

        {/* Role Selection */}
        <div className="space-y-3 mb-8">
          {rolesFiltered.map((membership) => {
            const config = ROLES[membership.role];
            if (!config) return null;

            const isSelected = selectedMembership?.role === membership.role && selectedMembership?.orgId === membership.orgId;

            return (
              <button
                key={`${membership.role}-${membership.orgId}`}
                onClick={() => setSelectedMembership(membership)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? ''
                    : ''
                }`}
                style={{
                  background: isSelected ? G.lime : G.card,
                  borderColor: isSelected ? G.lime : G.cardBorder,
                  color: isSelected ? G.dark : G.text,
                  boxShadow: isSelected ? `0 0 0 2px ${G.lime}55` : undefined,
                }}
                disabled={isLoading}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl mt-1">{config.icon}</span>
                  <div className="flex-1">
                    <h3 className={`font-semibold text-lg`} style={{ color: isSelected ? G.dark : config.color.text }}>{config.displayName}</h3>
                    <p className={`text-sm`} style={{ color: isSelected ? G.dark : G.muted }}>{membership.orgName}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1`}
                    style={{
                      background: isSelected ? G.lime : G.card,
                      borderColor: isSelected ? G.dark : G.cardBorder,
                    }}
                  >
                    {isSelected && <span className="text-white text-sm font-bold">✓</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Features of selected role */}
        {selectedMembership && ROLES[selectedMembership.role] && (
          <div className="mb-8 p-4 rounded-lg" style={{ background: G.mid }}>
            <h4 className="font-semibold mb-2 text-sm" style={{ color: G.lime }}>Features:</h4>
            <ul className="space-y-1">
              {ROLES[selectedMembership.role].features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm" style={{ color: G.text }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: G.lime }}></span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={isLoading}
          className={`w-full py-3 font-semibold text-white rounded-lg transition-all bg-green-600 hover:bg-green-700 disabled:opacity-50`}
        >
          {isLoading ? 'Navigating...' : `Continue as ${selectedMembership ? ROLES[selectedMembership.role]?.displayName : ''}`}
        </Button>
      </div>
    </div>
  );
};
