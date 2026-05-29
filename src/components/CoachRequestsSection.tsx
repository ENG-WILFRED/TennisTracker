'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

const G = {
  dark: '#0f1f0f',
  sidebar: '#152515',
  card: '#1a3020',
  cardBorder: '#2d5a35',
  mid: '#2d5a27',
  bright: '#3d7a32',
  lime: '#7dc142',
  accent: '#a8d84e',
  text: '#e8f5e0',
  muted: '#7aaa6a',
  yellow: '#f0c040',
  red: '#e05050',
  blue: '#4ab0d0',
};

interface CoachRequest {
  id: string;
  coachId: string;
  coachName: string;
  coachPhoto?: string;
  coachEmail: string;
  coachRole: string;
  coachBio?: string;
  organizationName?: string;
  organizationId?: string;
  status: 'pending' | 'active' | 'declined' | 'inactive';
  requestDate: string;
  requestNote: string;
  requestTitle: string;
  isSameOrganization: boolean;
}

interface CoachRequestsProps {
  playerId: string;
}

export const CoachRequestsSection: React.FC<CoachRequestsProps> = ({ playerId }) => {
  const [coachRequests, setCoachRequests] = useState<CoachRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'declined' | 'all'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState<Record<string, string>>({});
  const [showDeclineForm, setShowDeclineForm] = useState<string | null>(null);
  const [stats, setStats] = useState({ pending: 0, accepted: 0, declined: 0, total: 0 });

  useEffect(() => {
    loadCoachRequests();
  }, [playerId]);

  async function loadCoachRequests() {
    setLoading(true);
    try {
      const res = await authenticatedFetch(`/api/players/${encodeURIComponent(playerId)}/coach-requests`);
      if (!res.ok) throw new Error('Failed to load coach requests');

      const data = await res.json();
      setCoachRequests(data.requests || []);
      setStats({
        pending: data.pending || 0,
        accepted: data.accepted || 0,
        declined: data.declined || 0,
        total: data.total || 0,
      });
    } catch (error) {
      console.error('Error loading coach requests:', error);
      toast.error('Failed to load coach requests');
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(relationshipId: string) {
    setActionLoading(relationshipId);
    try {
      const res = await authenticatedFetch(
        `/api/players/${encodeURIComponent(playerId)}/coach-requests/accept`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ relationshipId }),
        }
      );

      if (!res.ok) throw new Error('Failed to accept request');

      toast.success('Coach request accepted!');
      await loadCoachRequests();
      setExpandedId(null);
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDecline(relationshipId: string) {
    const reason = declineReason[relationshipId] || '';
    setActionLoading(relationshipId);
    try {
      const res = await authenticatedFetch(
        `/api/players/${encodeURIComponent(playerId)}/coach-requests/decline`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ relationshipId, reason }),
        }
      );

      if (!res.ok) throw new Error('Failed to decline request');

      toast.success('Coach request declined');
      await loadCoachRequests();
      setShowDeclineForm(null);
      setDeclineReason({});
      setExpandedId(null);
    } catch (error) {
      console.error('Error declining request:', error);
      toast.error('Failed to decline request');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReachOut(coachEmail: string) {
    try {
      // Open email client or messaging interface
      window.location.href = `mailto:${coachEmail}?subject=Re: Your coaching request`;
    } catch (error) {
      console.error('Error reaching out:', error);
      toast.error('Failed to open messaging');
    }
  }

  const filteredRequests = coachRequests.filter((req) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return req.status === 'pending';
    if (activeTab === 'accepted') return req.status === 'active';
    if (activeTab === 'declined') return req.status === 'declined' || req.status === 'inactive';
    return true;
  });

  const statusBadgeStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: '#f0c04018', color: G.yellow, border: `1px solid ${G.yellow}40` };
      case 'active':
        return { bg: '#7dc14218', color: G.lime, border: `1px solid ${G.lime}40` };
      case 'declined':
      case 'inactive':
        return { bg: '#e0505018', color: G.red, border: `1px solid ${G.red}40` };
      default:
        return { bg: '#2d5a3518', color: G.accent, border: `1px solid ${G.accent}40` };
    }
  };

  if (loading) {
    return (
      <div
        style={{
          background: G.card,
          border: `1px solid ${G.cardBorder}`,
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <div style={{ color: G.muted, fontSize: 14 }}>⏳ Loading coach requests...</div>
      </div>
    );
  }

  if (stats.total === 0) {
    return (
      <div
        style={{
          background: G.card,
          border: `1px solid ${G.cardBorder}`,
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 12 }}>🤝</div>
        <div style={{ color: G.text, fontSize: 14, fontWeight: 600 }}>No coach requests yet</div>
        <div style={{ color: G.muted, fontSize: 12, marginTop: 8 }}>
          When coaches invite you to train with them, their requests will appear here.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: G.card,
        border: `1px solid ${G.cardBorder}`,
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ color: G.text, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>🤝 Coach Requests</div>
          <div style={{ color: G.muted, fontSize: 12 }}>
            {stats.pending} pending · {stats.accepted} accepted · {stats.declined} declined
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: `1px solid ${G.cardBorder}`, paddingBottom: 16 }}>
        {[
          { id: 'pending', label: `Pending (${stats.pending})`, icon: '⏳' },
          { id: 'accepted', label: `Accepted (${stats.accepted})`, icon: '✓' },
          { id: 'declined', label: `Declined (${stats.declined})`, icon: '✗' },
          { id: 'all', label: `All (${stats.total})`, icon: '📋' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderBottom: activeTab === tab.id ? `2px solid ${G.accent}` : 'none',
              background: 'transparent',
              color: activeTab === tab.id ? G.accent : G.muted,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: activeTab === tab.id ? 600 : 400,
              transition: 'all 0.2s',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredRequests.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '24px 16px',
              borderRadius: 8,
              background: G.sidebar,
              border: `1px dashed ${G.cardBorder}`,
            }}
          >
            <div style={{ color: G.muted, fontSize: 12 }}>No {activeTab} requests to display</div>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.id}
              style={{
                background: G.sidebar,
                border: `1px solid ${G.cardBorder}`,
                borderRadius: 8,
                overflow: 'hidden',
                transition: 'all 0.2s',
              }}
            >
              {/* Card Header */}
              <div
                onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: expandedId === request.id ? G.card : G.sidebar,
                  transition: 'all 0.2s',
                }}
              >
                {/* Coach Photo */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    background: G.dark,
                    border: `1px solid ${G.cardBorder}`,
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {request.coachPhoto ? (
                    <img
                      src={request.coachPhoto}
                      alt={request.coachName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      👤
                    </div>
                  )}
                </div>

                {/* Coach Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ color: G.text, fontSize: 13, fontWeight: 600 }}>{request.coachName}</div>
                  <div style={{ color: G.muted, fontSize: 11, marginTop: 2 }}>
                    {request.organizationName ? `${request.organizationName}` : 'Independent coach'} · {request.coachRole}
                  </div>
                </div>

                {/* Status Badge */}
                <div
                  style={{
                    ...statusBadgeStyle(request.status),
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                  }}
                >
                  {request.status === 'active' ? 'Accepted' : request.status === 'declined' || request.status === 'inactive' ? 'Declined' : request.status}
                </div>

                {/* Expand Arrow */}
                <div style={{ color: G.muted, fontSize: 12 }}>
                  {expandedId === request.id ? '▼' : '▶'}
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === request.id && (
                <div style={{ borderTop: `1px solid ${G.cardBorder}`, padding: '16px', background: G.dark }}>
                  {/* Request Details */}
                  {request.requestNote && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ color: G.muted, fontSize: 11, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
                        📝 Request Details
                      </div>
                      <div style={{ color: G.text, fontSize: 12, lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                        {request.requestNote}
                      </div>
                    </div>
                  )}

                  {/* Coach Bio */}
                  {request.coachBio && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ color: G.muted, fontSize: 11, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
                        👤 About Coach
                      </div>
                      <div style={{ color: G.text, fontSize: 12, lineHeight: '1.4' }}>
                        {request.coachBio}
                      </div>
                    </div>
                  )}

                  {/* Request Date */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ color: G.muted, fontSize: 11, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
                      📅 Request Date
                    </div>
                    <div style={{ color: G.text, fontSize: 12 }}>
                      {new Date(request.requestDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  {request.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                      <button
                        onClick={() => handleAccept(request.id)}
                        disabled={actionLoading === request.id}
                        style={{
                          flex: 1,
                          background: G.lime,
                          color: G.dark,
                          border: 'none',
                          borderRadius: 6,
                          padding: '10px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: actionLoading === request.id ? 'not-allowed' : 'pointer',
                          opacity: actionLoading === request.id ? 0.6 : 1,
                        }}
                      >
                        {actionLoading === request.id ? '⏳ Accepting...' : '✓ Accept'}
                      </button>
                      <button
                        onClick={() => setShowDeclineForm(showDeclineForm === request.id ? null : request.id)}
                        style={{
                          flex: 1,
                          background: 'transparent',
                          color: G.red,
                          border: `1px solid ${G.red}`,
                          borderRadius: 6,
                          padding: '10px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        ✗ Decline
                      </button>
                      <button
                        onClick={() => handleReachOut(request.coachEmail)}
                        style={{
                          flex: 1,
                          background: 'transparent',
                          color: G.blue,
                          border: `1px solid ${G.blue}`,
                          borderRadius: 6,
                          padding: '10px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        💬 Reach Out
                      </button>
                    </div>
                  )}

                  {/* Decline Form */}
                  {showDeclineForm === request.id && request.status === 'pending' && (
                    <div style={{ marginTop: 12, padding: 12, background: G.sidebar, borderRadius: 6, border: `1px solid ${G.cardBorder}` }}>
                      <div style={{ marginBottom: 8 }}>
                        <label style={{ color: G.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
                          Reason (optional):
                        </label>
                        <textarea
                          value={declineReason[request.id] || ''}
                          onChange={(e) => setDeclineReason({ ...declineReason, [request.id]: e.target.value })}
                          placeholder="Let them know why you're declining..."
                          style={{
                            width: '100%',
                            marginTop: 6,
                            padding: 8,
                            background: G.dark,
                            border: `1px solid ${G.cardBorder}`,
                            borderRadius: 4,
                            color: G.text,
                            fontSize: 12,
                            fontFamily: 'inherit',
                            minHeight: 60,
                            resize: 'vertical',
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleDecline(request.id)}
                          disabled={actionLoading === request.id}
                          style={{
                            flex: 1,
                            background: G.red,
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            padding: '8px 12px',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: actionLoading === request.id ? 'not-allowed' : 'pointer',
                            opacity: actionLoading === request.id ? 0.6 : 1,
                          }}
                        >
                          {actionLoading === request.id ? '⏳ Declining...' : 'Confirm Decline'}
                        </button>
                        <button
                          onClick={() => {
                            setShowDeclineForm(null);
                            setDeclineReason({});
                          }}
                          style={{
                            flex: 1,
                            background: 'transparent',
                            color: G.muted,
                            border: `1px solid ${G.cardBorder}`,
                            borderRadius: 4,
                            padding: '8px 12px',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* For Accepted/Declined Requests */}
                  {(request.status === 'active' || request.status === 'declined' || request.status === 'inactive') && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleReachOut(request.coachEmail)}
                        style={{
                          flex: 1,
                          background: 'transparent',
                          color: G.blue,
                          border: `1px solid ${G.blue}`,
                          borderRadius: 6,
                          padding: '8px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        💬 Contact Coach
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CoachRequestsSection;
