'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useRole } from '@/context/RoleContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface SwitchConfirmModalProps {
  isOpen: boolean;
  membership: any;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const SwitchConfirmModal: React.FC<SwitchConfirmModalProps> = ({
  isOpen,
  membership,
  onConfirm,
  onCancel,
  isLoading,
}) => {
  if (!isOpen) return null;

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#1a3020',
          border: '1px solid #2d5a35',
          borderRadius: 12,
          padding: 24,
          maxWidth: 400,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, color: '#e8f5e0' }}>
          Switch Account?
        </h2>
        <p style={{ fontSize: 14, color: '#7aaa6a', marginBottom: 8, lineHeight: 1.5 }}>
          You're about to switch to:
        </p>
        <div
          style={{
            background: '#0f1f0f',
            border: '1px solid #2d5a3566',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#7dc142', textTransform: 'capitalize' }}>
            {membership.role}
          </div>
          <div style={{ fontSize: 12, color: '#7aaa6a', marginTop: 4 }}>
            {membership.orgName || 'Platform'}
          </div>
        </div>
        <p style={{ fontSize: 12, color: '#7aaa6a', marginBottom: 16, lineHeight: 1.5 }}>
          You'll be logged out from your current dashboard and a new session will be created. This action cannot be undone immediately.
        </p>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onCancel}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: '#2d5a27',
              color: '#7dc142',
              border: '1px solid #2d5a35',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
              transition: 'all .15s',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = '#3d7a32';
                e.currentTarget.style.borderColor = '#7dc142';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = '#2d5a27';
                e.currentTarget.style.borderColor = '#2d5a35';
              }
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: '#7dc142',
              color: '#0f1f0f',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
              transition: 'all .15s',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = '#a8d84e';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = '#7dc142';
              }
            }}
          >
            {isLoading ? 'Switching...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
