"use client";

import React, { useState, useEffect } from 'react';

interface TournamentSettingsSectionProps {
  tournament: any;
  onSaveTournament: (updates: any) => Promise<void>;
  updateLoading: boolean;
}

const inputStyle = {
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid rgba(125,193,66,0.22)',
  background: 'rgba(10,18,10,0.8)',
  color: '#dff0d0',
  fontSize: '14px',
  width: '100%' as const,
  fontFamily: 'inherit',
  boxSizing: 'border-box' as const,
  transition: 'border-color .2s',
};

export function TournamentSettingsSection({
  tournament,
  onSaveTournament,
  updateLoading,
}: TournamentSettingsSectionProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<any>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (tournament) {
      setDraft({
        name: tournament.name || '',
        description: tournament.description || '',
        startDate: tournament.startDate ? new Date(tournament.startDate).toISOString().slice(0, 10) : '',
        endDate: tournament.endDate ? new Date(tournament.endDate).toISOString().slice(0, 10) : '',
        registrationDeadline: tournament.registrationDeadline ? new Date(tournament.registrationDeadline).toISOString().slice(0, 10) : '',
        location: tournament.location || '',
        prizePool: tournament.prizePool || 0,
        entryFee: tournament.entryFee || 0,
        registrationCap: tournament.registrationCap || 0,
        rules: tournament.rules || '',
        instructions: tournament.instructions || '',
        eatingAreas: tournament.eatingAreas || '',
        sleepingAreas: tournament.sleepingAreas || '',
        courtInfo: tournament.courtInfo || '',
      });
    }
  }, [tournament]);

  const handleSave = async () => {
    if (!draft) return;
    await onSaveTournament({
      name: draft.name,
      description: draft.description,
      startDate: draft.startDate,
      endDate: draft.endDate || null,
      registrationDeadline: draft.registrationDeadline,
      location: draft.location,
      registrationCap: draft.registrationCap,
      entryFee: draft.entryFee,
      prizePool: draft.prizePool,
      rules: draft.rules,
      instructions: draft.instructions,
      eatingAreas: draft.eatingAreas,
      sleepingAreas: draft.sleepingAreas,
      courtInfo: draft.courtInfo,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft({
      name: tournament.name || '',
      description: tournament.description || '',
      startDate: tournament.startDate ? new Date(tournament.startDate).toISOString().slice(0, 10) : '',
      endDate: tournament.endDate ? new Date(tournament.endDate).toISOString().slice(0, 10) : '',
      registrationDeadline: tournament.registrationDeadline ? new Date(tournament.registrationDeadline).toISOString().slice(0, 10) : '',
      location: tournament.location || '',
      prizePool: tournament.prizePool || 0,
      entryFee: tournament.entryFee || 0,
      registrationCap: tournament.registrationCap || 0,
      rules: tournament.rules || '',
      instructions: tournament.instructions || '',
      eatingAreas: tournament.eatingAreas || '',
      sleepingAreas: tournament.sleepingAreas || '',
      courtInfo: tournament.courtInfo || '',
    });
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!tournament) {
    return (
      <div style={{
        background: 'rgba(18, 38, 18, 0.72)',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(125,193,66,0.16)',
        borderRadius: '16px',
        padding: isMobile ? '16px' : '24px',
        color: '#6a9058',
        textAlign: 'center',
      }}>
        Loading tournament details…
      </div>
    );
  }

  if (isEditing) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{
            fontFamily: 'Clash Display, sans-serif',
            fontSize: isMobile ? 20 : 24,
            fontWeight: 700,
            color: '#a8d84e',
          }}>
            Edit Tournament Settings
          </h2>
          <button
            onClick={handleCancel}
            style={{
              padding: '8px 16px',
              background: 'rgba(125,193,66,0.12)',
              color: '#7dc142',
              border: '1px solid rgba(125,193,66,0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            Cancel
          </button>
        </div>

        {!draft ? (
          <div style={{
            background: 'rgba(18, 38, 18, 0.72)',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(125,193,66,0.16)',
            borderRadius: '16px',
            padding: isMobile ? '16px' : '24px',
            color: '#6a9058',
            textAlign: 'center',
          }}>
            Loading settings…
          </div>
        ) : (
          <>
            {/* Basic info */}
            <div style={{
              background: 'rgba(18, 38, 18, 0.72)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(125,193,66,0.16)',
              borderRadius: '16px',
              padding: isMobile ? '16px' : '24px',
              marginBottom: '18px',
            }}>
              <h3 style={{
                fontFamily: 'Clash Display, sans-serif',
                fontSize: 16,
                fontWeight: 700,
                color: '#a8d84e',
                marginBottom: 16,
              }}>
                📝 Basic Information
              </h3>
              <div style={{ display: 'grid', gap: '14px' }}>
                <label style={{ display: 'grid', gap: '6px', fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058' }}>
                  Tournament Name
                  <input
                    value={draft.name}
                    onChange={e => setDraft((p: any) => ({ ...p, name: e.target.value }))}
                    style={inputStyle}
                  />
                </label>
                <label style={{ display: 'grid', gap: '6px', fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058' }}>
                  Description
                  <textarea
                    value={draft.description}
                    rows={3}
                    onChange={e => setDraft((p: any) => ({ ...p, description: e.target.value }))}
                    style={{ ...inputStyle, resize: 'vertical' as const }}
                  />
                </label>
                <label style={{ display: 'grid', gap: '6px', fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058' }}>
                  Location
                  <input
                    value={draft.location}
                    onChange={e => setDraft((p: any) => ({ ...p, location: e.target.value }))}
                    style={inputStyle}
                  />
                </label>
              </div>
            </div>

            {/* Dates */}
            <div style={{
              background: 'rgba(18, 38, 18, 0.72)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(125,193,66,0.16)',
              borderRadius: '16px',
              padding: isMobile ? '16px' : '24px',
              marginBottom: '18px',
            }}>
              <h3 style={{
                fontFamily: 'Clash Display, sans-serif',
                fontSize: 16,
                fontWeight: 700,
                color: '#a8d84e',
                marginBottom: 16,
              }}>
                📅 Dates
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '14px' }}>
                <label style={{ display: 'grid', gap: '6px', fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058' }}>
                  Start Date
                  <input
                    type="date"
                    value={draft.startDate}
                    onChange={e => setDraft((p: any) => ({ ...p, startDate: e.target.value }))}
                    style={inputStyle}
                  />
                </label>
                <label style={{ display: 'grid', gap: '6px', fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058' }}>
                  End Date
                  <input
                    type="date"
                    value={draft.endDate}
                    onChange={e => setDraft((p: any) => ({ ...p, endDate: e.target.value }))}
                    style={inputStyle}
                  />
                </label>
                <label style={{ display: 'grid', gap: '6px', fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058' }}>
                  Registration Deadline
                  <input
                    type="date"
                    value={draft.registrationDeadline}
                    onChange={e => setDraft((p: any) => ({ ...p, registrationDeadline: e.target.value }))}
                    style={inputStyle}
                  />
                </label>
              </div>
            </div>

            {/* Pricing */}
            <div style={{
              background: 'rgba(18, 38, 18, 0.72)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(125,193,66,0.16)',
              borderRadius: '16px',
              padding: isMobile ? '16px' : '24px',
              marginBottom: '18px',
            }}>
              <h3 style={{
                fontFamily: 'Clash Display, sans-serif',
                fontSize: 16,
                fontWeight: 700,
                color: '#a8d84e',
                marginBottom: 16,
              }}>
                💰 Pricing & Capacity
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '14px' }}>
                <label style={{ display: 'grid', gap: '6px', fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058' }}>
                  Registration Cap
                  <input
                    type="number"
                    min={1}
                    value={draft.registrationCap}
                    onChange={e => setDraft((p: any) => ({ ...p, registrationCap: parseInt(e.target.value || '0') }))}
                    style={inputStyle}
                  />
                </label>
                <label style={{ display: 'grid', gap: '6px', fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058' }}>
                  Entry Fee ($)
                  <input
                    type="number"
                    min={0}
                    value={draft.entryFee}
                    onChange={e => setDraft((p: any) => ({ ...p, entryFee: parseFloat(e.target.value || '0') }))}
                    style={inputStyle}
                  />
                </label>
                <label style={{ display: 'grid', gap: '6px', fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058' }}>
                  Prize Pool ($)
                  <input
                    type="number"
                    min={0}
                    value={draft.prizePool}
                    onChange={e => setDraft((p: any) => ({ ...p, prizePool: parseFloat(e.target.value || '0') }))}
                    style={inputStyle}
                  />
                </label>
              </div>
            </div>

            {/* Facility Details */}
            <div style={{
              background: 'rgba(18, 38, 18, 0.72)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(125,193,66,0.16)',
              borderRadius: '16px',
              padding: isMobile ? '16px' : '24px',
              marginBottom: '18px',
            }}>
              <h3 style={{
                fontFamily: 'Clash Display, sans-serif',
                fontSize: 16,
                fontWeight: 700,
                color: '#a8d84e',
                marginBottom: 16,
              }}>
                🏢 Facility Details
              </h3>
              <div style={{ display: 'grid', gap: '14px' }}>
                <label style={{ display: 'grid', gap: '6px', fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058' }}>
                  Court Information
                  <textarea
                    rows={3}
                    value={draft.courtInfo}
                    onChange={e => setDraft((p: any) => ({ ...p, courtInfo: e.target.value }))}
                    style={{ ...inputStyle, resize: 'vertical' as const }}
                  />
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
                  <label style={{ display: 'grid', gap: '6px', fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058' }}>
                    Eating Areas
                    <textarea
                      rows={3}
                      value={draft.eatingAreas}
                      onChange={e => setDraft((p: any) => ({ ...p, eatingAreas: e.target.value }))}
                      style={{ ...inputStyle, resize: 'vertical' as const }}
                    />
                  </label>
                  <label style={{ display: 'grid', gap: '6px', fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058' }}>
                    Sleeping Areas
                    <textarea
                      rows={3}
                      value={draft.sleepingAreas}
                      onChange={e => setDraft((p: any) => ({ ...p, sleepingAreas: e.target.value }))}
                      style={{ ...inputStyle, resize: 'vertical' as const }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Rules & Instructions */}
            <div style={{
              background: 'rgba(18, 38, 18, 0.72)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(125,193,66,0.16)',
              borderRadius: '16px',
              padding: isMobile ? '16px' : '24px',
              marginBottom: '18px',
            }}>
              <h3 style={{
                fontFamily: 'Clash Display, sans-serif',
                fontSize: 16,
                fontWeight: 700,
                color: '#a8d84e',
                marginBottom: 16,
              }}>
                📋 Rules & Instructions
              </h3>
              <div style={{ display: 'grid', gap: '14px' }}>
                <label style={{ display: 'grid', gap: '6px', fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058' }}>
                  Tournament Rules
                  <textarea
                    rows={5}
                    value={draft.rules}
                    onChange={e => setDraft((p: any) => ({ ...p, rules: e.target.value }))}
                    style={{ ...inputStyle, resize: 'vertical' as const }}
                  />
                </label>
                <label style={{ display: 'grid', gap: '6px', fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058' }}>
                  Additional Instructions
                  <textarea
                    rows={3}
                    value={draft.instructions}
                    onChange={e => setDraft((p: any) => ({ ...p, instructions: e.target.value }))}
                    style={{ ...inputStyle, resize: 'vertical' as const }}
                  />
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={handleCancel}
                style={{
                  padding: '10px 24px',
                  background: 'rgba(125,193,66,0.12)',
                  color: '#7dc142',
                  border: '1px solid rgba(125,193,66,0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateLoading}
                style={{
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg,#5aa820,#7dc142,#a8d84e)',
                  color: '#0a160a',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: updateLoading ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: 'DM Sans, sans-serif',
                  opacity: updateLoading ? 0.5 : 1,
                }}
              >
                {updateLoading ? 'Saving…' : '✓ Save Tournament'}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Read-only view
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{
          fontFamily: 'Clash Display, sans-serif',
          fontSize: isMobile ? 20 : 24,
          fontWeight: 700,
          color: '#a8d84e',
        }}>
          Tournament Settings
        </h2>
        <button
          onClick={() => setIsEditing(true)}
          style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg,#5aa820,#7dc142,#a8d84e)',
            color: '#0a160a',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 700,
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          ✏️ Edit
        </button>
      </div>

      {/* Basic info */}
      <div style={{
        background: 'rgba(18, 38, 18, 0.72)',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(125,193,66,0.16)',
        borderRadius: '16px',
        padding: isMobile ? '16px' : '24px',
        marginBottom: '18px',
      }}>
        <h3 style={{
          fontFamily: 'Clash Display, sans-serif',
          fontSize: 16,
          fontWeight: 700,
          color: '#a8d84e',
          marginBottom: 16,
        }}>
          📝 Basic Information
        </h3>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058', marginBottom: '4px' }}>
              Tournament Name
            </div>
            <div style={{ fontSize: 16, color: '#dff0d0', fontFamily: 'Epilogue, sans-serif' }}>
              {tournament.name || 'Not set'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058', marginBottom: '4px' }}>
              Description
            </div>
            <div style={{ fontSize: 14, color: '#dff0d0', fontFamily: 'Epilogue, sans-serif', whiteSpace: 'pre-wrap' }}>
              {tournament.description || 'No description provided'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058', marginBottom: '4px' }}>
              Location
            </div>
            <div style={{ fontSize: 16, color: '#dff0d0', fontFamily: 'Epilogue, sans-serif' }}>
              {tournament.location || 'Not set'}
            </div>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div style={{
        background: 'rgba(18, 38, 18, 0.72)',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(125,193,66,0.16)',
        borderRadius: '16px',
        padding: isMobile ? '16px' : '24px',
        marginBottom: '18px',
      }}>
        <h3 style={{
          fontFamily: 'Clash Display, sans-serif',
          fontSize: 16,
          fontWeight: 700,
          color: '#a8d84e',
          marginBottom: 16,
        }}>
          📅 Dates
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058', marginBottom: '4px' }}>
              Start Date
            </div>
            <div style={{ fontSize: 16, color: '#dff0d0', fontFamily: 'Epilogue, sans-serif' }}>
              {formatDate(tournament.startDate)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058', marginBottom: '4px' }}>
              End Date
            </div>
            <div style={{ fontSize: 16, color: '#dff0d0', fontFamily: 'Epilogue, sans-serif' }}>
              {formatDate(tournament.endDate)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058', marginBottom: '4px' }}>
              Registration Deadline
            </div>
            <div style={{ fontSize: 16, color: '#dff0d0', fontFamily: 'Epilogue, sans-serif' }}>
              {formatDate(tournament.registrationDeadline)}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div style={{
        background: 'rgba(18, 38, 18, 0.72)',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(125,193,66,0.16)',
        borderRadius: '16px',
        padding: isMobile ? '16px' : '24px',
        marginBottom: '18px',
      }}>
        <h3 style={{
          fontFamily: 'Clash Display, sans-serif',
          fontSize: 16,
          fontWeight: 700,
          color: '#a8d84e',
          marginBottom: 16,
        }}>
          💰 Pricing & Capacity
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058', marginBottom: '4px' }}>
              Registration Cap
            </div>
            <div style={{ fontSize: 16, color: '#dff0d0', fontFamily: 'Epilogue, sans-serif' }}>
              {tournament.registrationCap || 'Unlimited'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058', marginBottom: '4px' }}>
              Entry Fee
            </div>
            <div style={{ fontSize: 16, color: '#dff0d0', fontFamily: 'Epilogue, sans-serif' }}>
              {formatCurrency(tournament.entryFee || 0)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058', marginBottom: '4px' }}>
              Prize Pool
            </div>
            <div style={{ fontSize: 16, color: '#dff0d0', fontFamily: 'Epilogue, sans-serif' }}>
              {formatCurrency(tournament.prizePool || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Facility Details */}
      <div style={{
        background: 'rgba(18, 38, 18, 0.72)',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(125,193,66,0.16)',
        borderRadius: '16px',
        padding: isMobile ? '16px' : '24px',
        marginBottom: '18px',
      }}>
        <h3 style={{
          fontFamily: 'Clash Display, sans-serif',
          fontSize: 16,
          fontWeight: 700,
          color: '#a8d84e',
          marginBottom: 16,
        }}>
          🏢 Facility Details
        </h3>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058', marginBottom: '4px' }}>
              Court Information
            </div>
            <div style={{ fontSize: 14, color: '#dff0d0', fontFamily: 'Epilogue, sans-serif', whiteSpace: 'pre-wrap' }}>
              {tournament.courtInfo || 'No court information provided'}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058', marginBottom: '4px' }}>
                Eating Areas
              </div>
              <div style={{ fontSize: 14, color: '#dff0d0', fontFamily: 'Epilogue, sans-serif', whiteSpace: 'pre-wrap' }}>
                {tournament.eatingAreas || 'No eating areas specified'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058', marginBottom: '4px' }}>
                Sleeping Areas
              </div>
              <div style={{ fontSize: 14, color: '#dff0d0', fontFamily: 'Epilogue, sans-serif', whiteSpace: 'pre-wrap' }}>
                {tournament.sleepingAreas || 'No sleeping areas specified'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rules & Instructions */}
      <div style={{
        background: 'rgba(18, 38, 18, 0.72)',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(125,193,66,0.16)',
        borderRadius: '16px',
        padding: isMobile ? '16px' : '24px',
        marginBottom: '18px',
      }}>
        <h3 style={{
          fontFamily: 'Clash Display, sans-serif',
          fontSize: 16,
          fontWeight: 700,
          color: '#a8d84e',
          marginBottom: 16,
        }}>
          📋 Rules & Instructions
        </h3>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058', marginBottom: '4px' }}>
              Tournament Rules
            </div>
            <div style={{ fontSize: 14, color: '#dff0d0', fontFamily: 'Epilogue, sans-serif', whiteSpace: 'pre-wrap' }}>
              {tournament.rules || 'No rules specified'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6a9058', marginBottom: '4px' }}>
              Additional Instructions
            </div>
            <div style={{ fontSize: 14, color: '#dff0d0', fontFamily: 'Epilogue, sans-serif', whiteSpace: 'pre-wrap' }}>
              {tournament.instructions || 'No additional instructions'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
