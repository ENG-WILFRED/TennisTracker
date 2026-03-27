'use client';

import React, { useState } from 'react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

interface CancelApplicationModalProps {
  tournament: any;
  registration: any;
  onClose: () => void;
  onSuccess: () => void;
  isPaid: boolean;
}

export function CancelApplicationModal({
  tournament,
  registration,
  onClose,
  onSuccess,
  isPaid,
}: CancelApplicationModalProps) {
  const [reason, setReason] = useState('');
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reasonOptions = [
    { id: 'schedule-conflict', label: '📅 Schedule Conflict', description: 'I have another commitment' },
    { id: 'injury', label: '🤕 Injury/Health Issue', description: 'I cannot participate due to injury' },
    { id: 'personal', label: '🏠 Personal Reasons', description: 'Personal emergency or family matter' },
    { id: 'other', label: '❓ Other', description: 'Please specify below' },
  ];

  const handleCancel = async () => {
    if (!selectedReason || (selectedReason === 'other' && !reason.trim())) {
      setError('Please select a reason');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const finalReason = selectedReason === 'other' ? reason : selectedReason;
      
      const response = await authenticatedFetch(
        `/api/tournaments/${tournament.id}/registrations/${registration.id}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: finalReason }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel application');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred while canceling');
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
              color: '#ff6b6b',
              margin: '0 0 8px 0',
              fontFamily: 'Syne, sans-serif',
            }}
          >
            Cancel Application
          </h2>
          <p
            style={{
              fontSize: '13px',
              color: '#8fa878',
              margin: 0,
            }}
          >
            We'll be sorry to see you go. Please let us know why you're canceling.
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
          <div style={{ fontSize: '14px', color: '#dff0d0', fontWeight: 500 }}>
            {tournament.name}
          </div>
          <div style={{ fontSize: '12px', color: '#8fa878', marginTop: '4px' }}>
            Application Status: <span style={{ color: '#f0c040', fontWeight: 600 }}>
              {registration.status === 'pending' ? 'Pending Review' : 
               registration.status === 'approved' ? 'Approved' : 
               'Registered'}
            </span>
          </div>
        </div>

        {/* Paid Warning */}
        {isPaid && (
          <div
            style={{
              background: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '24px',
              fontSize: '13px',
              color: '#ff8787',
            }}
          >
            <strong>⚠️ Payment Refund Required</strong>
            <p style={{ margin: '8px 0 0 0' }}>
              You've already paid for this tournament. If you cancel, you'll need to{' '}
              <strong>contact the organizer for a refund</strong>. Please provide a clear reason below.
            </p>
          </div>
        )}

        {/* Reason Selection */}
        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '.08em',
              color: '#6a9058',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '12px',
            }}
          >
            Cancellation Reason
          </label>

          <div style={{ display: 'grid', gap: '8px' }}>
            {reasonOptions.map((option) => (
              <label
                key={option.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '12px',
                  backgroundColor:
                    selectedReason === option.id ? 'rgba(125,193,66,0.15)' : 'rgba(125,193,66,0.05)',
                  border:
                    selectedReason === option.id
                      ? '1px solid rgba(125,193,66,0.3)'
                      : '1px solid rgba(125,193,66,0.1)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="reason"
                  value={option.id}
                  checked={selectedReason === option.id}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  style={{ marginTop: '2px', marginRight: '12px', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#dff0d0', fontWeight: 500 }}>
                    {option.label}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8fa878', marginTop: '2px' }}>
                    {option.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Custom Reason Input */}
        {selectedReason === 'other' && (
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '.08em',
                color: '#6a9058',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Please Explain
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a clear reason for cancellation..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '10px 12px',
                background: 'rgba(125,193,66,0.05)',
                border: '1px solid rgba(125,193,66,0.2)',
                borderRadius: '8px',
                color: '#dff0d0',
                fontSize: '13px',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>
        )}

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
            onClick={onClose}
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
            Keep Application
          </button>
          <button
            onClick={handleCancel}
            disabled={loading || !selectedReason || (selectedReason === 'other' && !reason.trim())}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'rgba(255, 107, 107, 0.2)',
              color: '#ff6b6b',
              border: '1px solid rgba(255, 107, 107, 0.4)',
              borderRadius: '8px',
              cursor: loading || !selectedReason ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              opacity:
                loading || !selectedReason || (selectedReason === 'other' && !reason.trim())
                  ? 0.6
                  : 1,
            }}
          >
            {loading ? 'Canceling...' : 'Cancel Application'}
          </button>
        </div>
      </div>
    </div>
  );
}
