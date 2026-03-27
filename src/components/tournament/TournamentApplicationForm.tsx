'use client';

import React, { useState } from 'react';
import { applyForTournament } from '@/actions/tournaments';

interface TournamentApplicationFormProps {
  tournament: any;
  userId: string;
  onSuccess: () => void | Promise<void>;
  onCancel: () => void;
}

export function TournamentApplicationForm({
  tournament,
  userId,
  onSuccess,
  onCancel,
}: TournamentApplicationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  const handleApply = async () => {
    if (!agreed) {
      setError('Please agree to the tournament rules and terms');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await applyForTournament(tournament.id, userId, {
        skipPayment: true,
      });

      if (result.success) {
        await onSuccess();
      } else {
        setError(result.message || 'Failed to apply for tournament');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while applying for the tournament');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: '#0a160a',
          border: '1px solid rgba(125,193,66,0.3)',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#c8f07a',
              margin: '0 0 8px 0',
              fontFamily: 'Syne, sans-serif',
            }}
          >
            Apply for {tournament.name}
          </h2>
          <p
            style={{
              fontSize: '13px',
              color: '#8fa878',
              margin: 0,
            }}
          >
            Submit your application for this tournament
          </p>
        </div>

        {/* Tournament Info */}
        <div
          style={{
            background: 'rgba(125,193,66,0.08)',
            border: '1px solid rgba(125,193,66,0.16)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            <label
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '.08em',
                color: '#6a9058',
                textTransform: 'uppercase',
                display: 'block',
              }}
            >
              Tournament Details
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#8fa878', marginBottom: '4px' }}>
                Start Date
              </div>
              <div style={{ fontSize: '14px', color: '#dff0d0', fontWeight: 500 }}>
                {tournament.startDate
                  ? new Date(tournament.startDate).toLocaleDateString()
                  : 'TBD'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#8fa878', marginBottom: '4px' }}>
                Entry Fee
              </div>
              <div style={{ fontSize: '14px', color: '#a8d84e', fontWeight: 600 }}>
                ${tournament.entryFee || 0}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#8fa878', marginBottom: '4px' }}>
                Available Spots
              </div>
              <div style={{ fontSize: '14px', color: '#dff0d0', fontWeight: 500 }}>
                {Math.max(
                  0,
                  tournament.registrationCap - (tournament.registrations?.length || 0)
                )}{' '}
                / {tournament.registrationCap}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#8fa878', marginBottom: '4px' }}>
                Prize Pool
              </div>
              <div style={{ fontSize: '14px', color: '#c8f07a', fontWeight: 600 }}>
                ${tournament.prizePool?.toLocaleString() || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Process Info */}
        <div
          style={{
            background: 'rgba(125,193,66,0.05)',
            border: '1px solid rgba(125,193,66,0.1)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              color: '#dff0d0',
              lineHeight: '1.6',
            }}
          >
            <strong>Next Steps:</strong>
            <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>Submit your application</li>
              <li>We'll review your application</li>
              <li>You'll be notified of approval or rejection</li>
              <li>If approved, complete payment to confirm your spot</li>
            </ol>
          </div>
        </div>

        {/* Agreement Checkbox */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{
              marginTop: '4px',
              width: '18px',
              height: '18px',
              cursor: 'pointer',
            }}
          />
          <label
            style={{
              fontSize: '13px',
              color: '#dff0d0',
              cursor: 'pointer',
              flex: 1,
            }}
          >
            I agree to the tournament rules and terms. I understand that payment is required only
            after my application is approved.
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: 'rgba(255, 60, 60, 0.1)',
              border: '1px solid rgba(255, 60, 60, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#ff6b6b',
            }}
          >
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'rgba(125,193,66,0.08)',
              color: '#c8f07a',
              border: '1px solid rgba(125,193,66,0.3)',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              opacity: loading ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={loading || !agreed}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'linear-gradient(135deg,#5aa820,#7dc142,#a8d84e)',
              color: '#0a160a',
              border: 'none',
              borderRadius: '8px',
              cursor: loading || !agreed ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              opacity: loading || !agreed ? 0.6 : 1,
            }}
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
}
