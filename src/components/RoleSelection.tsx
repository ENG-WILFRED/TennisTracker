'use client';

import React, { useState } from 'react';
import { UserRole, ROLES } from '@/config/roles';
import Button from './Button';

export interface RoleSelectionProps {
  availableRoles: UserRole[];
  userName: string;
  userPhoto?: string | null;
  onRoleSelect: (role: UserRole) => void;
  isLoading?: boolean;
}

export const RoleSelection: React.FC<RoleSelectionProps> = ({
  availableRoles,
  userName,
  userPhoto,
  onRoleSelect,
  isLoading = false,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(availableRoles[0]);

  const handleContinue = () => {
    onRoleSelect(selectedRole);
  };

  const rolesFiltered = availableRoles.filter((role) => role in ROLES);
  if (rolesFiltered.length === 0) rolesFiltered.push('player');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          {userPhoto && (
            <img src={userPhoto} alt={userName} className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-gray-300" />
          )}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {userName}!</h2>
          <p className="text-gray-600">Select your role to continue</p>
        </div>

        {/* Role Selection */}
        <div className="space-y-3 mb-8">
          {rolesFiltered.map((role) => {
            const config = ROLES[role];
            if (!config) return null;

            const isSelected = selectedRole === role;

            return (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? `${config.color.primary.replace('bg-', 'bg-opacity-90 border-')} text-white`
                    : `border-gray-300 hover:border-gray-400 bg-gray-50`
                }`}
                disabled={isLoading}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl mt-1">{config.icon}</span>
                  <div className="flex-1">
                    <h3 className={`font-semibold text-lg ${isSelected ? 'text-white' : config.color.text}`}>
                      {config.displayName}
                    </h3>
                    <p className={`text-sm ${isSelected ? 'text-white text-opacity-90' : 'text-gray-600'}`}>
                      {config.description}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                      isSelected
                        ? `${config.color.primary.replace('bg-', 'bg-')} border-white`
                        : 'border-gray-400'
                    }`}
                  >
                    {isSelected && <span className="text-white text-sm font-bold">✓</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Features of selected role */}
        {ROLES[selectedRole] && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">Features:</h4>
            <ul className="space-y-1">
              {ROLES[selectedRole].features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
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
          className={`w-full py-3 font-semibold text-white rounded-lg transition-all ${
            ROLES[selectedRole]?.color.primary || 'bg-blue-600'
          } hover:opacity-90 disabled:opacity-50`}
        >
          {isLoading ? 'Continuing...' : 'Continue as ' + ROLES[selectedRole]?.name}
        </Button>
      </div>
    </div>
  );
};
