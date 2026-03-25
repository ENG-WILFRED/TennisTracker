"use client";

import React from 'react';

interface TournamentRegistrationsSectionProps {
  tournament: any;
  pendingRegistrations: any[];
  approvedRegistrations: any[];
  onRegistrationAction: (registrationId: string, action: 'approve' | 'reject') => void;
  managementLoading: boolean;
}

export function TournamentRegistrationsSection({
  tournament,
  pendingRegistrations,
  approvedRegistrations,
  onRegistrationAction,
  managementLoading,
}: TournamentRegistrationsSectionProps) {
  const fillRate = tournament?.registrationCap
    ? Math.round((approvedRegistrations.length / tournament.registrationCap) * 100)
    : 0;

  return (
    <div>
      <h2 style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: 24,
        fontWeight: 700,
        color: '#a8d84e',
        marginBottom: 24,
      }}>
        Player Registrations
      </h2>

      {/* Pending */}
      {pendingRegistrations.length > 0 && (
        <div style={{
          background: 'rgba(18, 38, 18, 0.72)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(240,192,64,0.25)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 16,
            fontWeight: 700,
            color: '#f0c040',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            ⏰ Pending Approvals
            <span style={{
              marginLeft: 8,
              background: '#f0c040',
              color: '#0a160a',
              borderRadius: 99,
              padding: '2px 10px',
              fontSize: 12,
              fontWeight: 800,
            }}>
              {pendingRegistrations.length}
            </span>
          </div>

          <div>
            {pendingRegistrations.map((reg: any) => (
              <div
                key={reg.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  background: 'rgba(12,24,12,0.6)',
                  border: '1px solid rgba(240,192,64,0.2)',
                  marginBottom: '8px',
                  transition: 'border-color .2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg,#4a7a1a,#7dc142)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 800,
                    color: '#0a160a',
                    fontSize: 16,
                    flexShrink: 0,
                  }}>
                    {(reg.user?.name || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#dff0d0', fontSize: 14 }}>
                      {reg.user?.name || 'Unknown Player'}
                    </div>
                    <div style={{ fontSize: 11, color: '#6a9058', marginTop: 2 }}>
                      Applied {new Date(reg.createdAt).toLocaleDateString()}
                    </div>
                    {reg.user?.email && (
                      <div style={{ fontSize: 11, color: '#4a6a3a' }}>{reg.user.email}</div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => onRegistrationAction(reg.id, 'approve')}
                    disabled={managementLoading}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(125,193,66,0.15)',
                      color: '#7dc142',
                      border: '1px solid rgba(125,193,66,0.3)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: 'DM Sans, sans-serif',
                      transition: 'background .2s',
                      opacity: managementLoading ? 0.5 : 1,
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => onRegistrationAction(reg.id, 'reject')}
                    disabled={managementLoading}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(224,80,80,0.15)',
                      color: '#e05050',
                      border: '1px solid rgba(224,80,80,0.3)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: 'DM Sans, sans-serif',
                      transition: 'background .2s',
                      opacity: managementLoading ? 0.5 : 1,
                    }}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved */}
      <div style={{
        background: 'rgba(18, 38, 18, 0.72)',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(125,193,66,0.16)',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 16,
          fontWeight: 700,
          color: '#a8d84e',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          ✅ Approved Players
          <span style={{ marginLeft: 8, color: '#6a9058', fontWeight: 400, fontSize: 14 }}>
            ({approvedRegistrations.length}/{tournament.registrationCap})
          </span>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            color: '#6a9058',
            marginBottom: 6,
          }}>
            <span>Capacity fill</span>
            <span>{fillRate}%</span>
          </div>
          <div style={{
            height: 8,
            background: 'rgba(125,193,66,0.1)',
            borderRadius: '99px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              borderRadius: '99px',
              background: 'linear-gradient(90deg,#4a9a1a,#7dc142,#c8f07a)',
              width: `${fillRate}%`,
              transition: 'width .8s ease',
            }} />
          </div>
        </div>

        {approvedRegistrations.length === 0 ? (
          <p style={{ color: '#4a6a3a', fontSize: 13 }}>No approved players yet.</p>
        ) : (
          approvedRegistrations.map((reg: any) => (
            <div
              key={reg.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 18px',
                borderRadius: '10px',
                background: 'rgba(12,24,12,0.6)',
                border: '1px solid rgba(125,193,66,0.12)',
                marginBottom: '8px',
                transition: 'border-color .2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg,#2a5a12,#4a8a22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  color: '#a8d84e',
                  fontSize: 15,
                  flexShrink: 0,
                }}>
                  {(reg.user?.name || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 500, color: '#dff0d0', fontSize: 14 }}>
                    {reg.user?.name || 'Unknown Player'}
                  </div>
                  <div style={{ fontSize: 11, color: '#4a6a3a', marginTop: 2 }}>
                    Approved {new Date(reg.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <span style={{ color: '#7dc142', fontSize: 18 }}>✓</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
