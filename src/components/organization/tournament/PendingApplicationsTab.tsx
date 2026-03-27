'use client';

import React, { useState } from 'react';

interface Registration {
  id: string;
  member: {
    id: string;
    player: {
      user: {
        firstName: string;
        lastName: string;
        email: string;
      };
    };
  };
  status: 'pending' | 'approved' | 'rejected';
  signupOrder: number;
  createdAt: string;
}

interface PendingApplicationsTabProps {
  pendingRegistrations: Registration[];
  onApprove: (registrationId: string) => Promise<void>;
  onReject: (registrationId: string) => Promise<void>;
  loading: boolean;
}

export function PendingApplicationsTab({
  pendingRegistrations,
  onApprove,
  onReject,
  loading,
}: PendingApplicationsTabProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleApprove = async (registrationId: string) => {
    setActionLoading(registrationId);
    try {
      await onApprove(registrationId);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (registrationId: string) => {
    setActionLoading(registrationId);
    try {
      await onReject(registrationId);
    } finally {
      setActionLoading(null);
    }
  };

  if (pendingRegistrations.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '48px 24px',
          color: '#8fa878',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>✓</div>
        <p style={{ fontSize: '16px', margin: 0 }}>No pending applications</p>
        <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>All applications have been reviewed</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gap: '12px',
      }}
    >
      {pendingRegistrations.map((registration) => (
        <div
          key={registration.id}
          style={{
            background: 'rgba(18, 38, 18, 0.72)',
            border: '1px solid rgba(125,193,66,0.16)',
            borderRadius: '12px',
            padding: '16px',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            alignItems: 'start',
            gap: '16px',
          }}
        >
          {/* Player Info */}
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '12px',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '.08em',
                    color: '#6a9058',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}
                >
                  Player Name
                </div>
                <div style={{ fontSize: '14px', color: '#dff0d0', fontWeight: 500 }}>
                  {registration.member.player.user.firstName}{' '}
                  {registration.member.player.user.lastName}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '.08em',
                    color: '#6a9058',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}
                >
                  Email
                </div>
                <div style={{ fontSize: '13px', color: '#a8d84e' }}>
                  {registration.member.player.user.email}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '.08em',
                    color: '#6a9058',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}
                >
                  Applied On
                </div>
                <div style={{ fontSize: '13px', color: '#dff0d0' }}>
                  {new Date(registration.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '.08em',
                    color: '#6a9058',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}
                >
                  Status
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: 'rgba(240, 192, 64, 0.15)',
                    color: '#f0c040',
                    display: 'inline-block',
                  }}
                >
                  Pending Review
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexDirection: 'column',
              minWidth: '160px',
            }}
          >
            <button
              onClick={() => handleApprove(registration.id)}
              disabled={loading || actionLoading !== null}
              style={{
                padding: '10px 16px',
                background: 'linear-gradient(135deg,#5aa820,#7dc142)',
                color: '#0a160a',
                border: 'none',
                borderRadius: '8px',
                cursor: loading || actionLoading !== null ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                opacity: loading || actionLoading !== null ? 0.6 : 1,
              }}
            >
              {actionLoading === registration.id ? 'Processing...' : 'Approve'}
            </button>
            <button
              onClick={() => handleReject(registration.id)}
              disabled={loading || actionLoading !== null}
              style={{
                padding: '10px 16px',
                background: 'transparent',
                color: '#ff6b6b',
                border: '1px solid rgba(255, 107, 107, 0.3)',
                borderRadius: '8px',
                cursor: loading || actionLoading !== null ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                opacity: loading || actionLoading !== null ? 0.6 : 1,
              }}
            >
              {actionLoading === registration.id ? 'Processing...' : 'Reject'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
