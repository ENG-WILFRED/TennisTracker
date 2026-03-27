import React, { useState } from 'react';

interface RejectionReasonModalProps {
  playerName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function RejectionReasonModal({
  playerName,
  onConfirm,
  onCancel,
  loading = false,
}: RejectionReasonModalProps) {
  const [reason, setReason] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const rejectionTemplates = [
    { id: 'rating', label: '⚡ Below Rating Requirement', text: 'Your current rating does not meet the tournament minimum requirement.' },
    { id: 'rank', label: '🏆 Rank Not Eligible', text: 'Your rank is not within the eligible range for this tournament.' },
    { id: 'capacity', label: '👥 Tournament Full', text: 'The tournament has reached maximum capacity.' },
    { id: 'incomplete', label: '📋 Incomplete Profile', text: 'Your player profile is incomplete. Please complete your profile details.' },
    { id: 'fees', label: '💳 Outstanding Fees', text: 'You have outstanding fees from previous tournaments.' },
    { id: 'conduct', label: '⚠️ Conduct Violation', text: 'You have previous code of conduct violations on record.' },
    { id: 'custom', label: '✏️ Custom Reason', text: '' },
  ];

  const handleConfirm = () => {
    const finalReason = selectedTemplate && selectedTemplate !== 'custom' 
      ? rejectionTemplates.find(t => t.id === selectedTemplate)?.text || reason
      : reason;

    if (!finalReason.trim()) {
      alert('Please select or enter a rejection reason');
      return;
    }

    onConfirm(finalReason);
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
        zIndex: 1001,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#0a160a',
          border: '1px solid rgba(220,76,100,0.3)',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ff6b6b', margin: '0 0 8px 0' }}>
            Reject Application
          </h2>
          <p style={{ fontSize: '14px', color: '#5a7242', margin: 0 }}>
            Let {playerName} know why their application was rejected
          </p>
        </div>

        {/* Template Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#8dc843', display: 'block', marginBottom: '8px' }}>
            Select a Reason
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            {rejectionTemplates.slice(0, -1).map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  setSelectedTemplate(template.id);
                  setReason('');
                }}
                style={{
                  padding: '10px 12px',
                  background: selectedTemplate === template.id ? '#1a3a1a' : 'transparent',
                  border: selectedTemplate === template.id ? '1px solid #8dc843' : '1px solid rgba(99,153,34,0.2)',
                  borderRadius: '8px',
                  color: selectedTemplate === template.id ? '#a3d45e' : '#5a7242',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: selectedTemplate === template.id ? 600 : 500,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.background = 'rgba(99,153,34,0.08)';
                }}
                onMouseLeave={(e) => {
                  if (selectedTemplate !== template.id) {
                    (e.target as HTMLButtonElement).style.background = 'transparent';
                  }
                }}
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Reason or Preview */}
        <div style={{ marginBottom: '24px' }}>
          {selectedTemplate === 'custom' ? (
            <>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#8dc843', display: 'block', marginBottom: '8px' }}>
                Enter Custom Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this application is being rejected..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#050d08',
                  border: '1px solid rgba(99,153,34,0.2)',
                  borderRadius: '8px',
                  color: '#c8e0a8',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  minHeight: '80px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </>
          ) : selectedTemplate && reason === '' ? (
            <>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#8dc843', display: 'block', marginBottom: '8px' }}>
                Preview Message
              </label>
              <div
                style={{
                  padding: '12px',
                  background: '#050d08',
                  border: '1px solid rgba(99,153,34,0.2)',
                  borderRadius: '8px',
                  color: '#c8e0a8',
                  fontSize: '13px',
                  lineHeight: '1.6',
                }}
              >
                {rejectionTemplates.find(t => t.id === selectedTemplate)?.text}
              </div>
            </>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              background: 'transparent',
              border: '1px solid rgba(99,153,34,0.2)',
              borderRadius: '8px',
              color: '#5a7242',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '14px',
              opacity: loading ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              background: loading ? '#cc3333' : '#e05050',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Rejecting...' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
}
