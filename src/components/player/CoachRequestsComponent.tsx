'use client';

import React, { useEffect, useState } from 'react';
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
  coachPhone?: string;
  coachBio?: string;
  coachRole: string;
  coachExpertise?: string;
  yearsOfExperience?: number;
  organization?: { id: string; name: string };
  status: 'pending' | 'accepted' | 'declined';
  initialMessage?: string;
  requestedAt: string;
  respondedAt?: string;
  history: Array<{
    id: string;
    action: string;
    actionBy: string;
    message?: string;
    createdAt: string;
  }>;
}

interface CoachRequestsComponentProps {
  playerId: string;
}

export const CoachRequestsComponent: React.FC<CoachRequestsComponentProps> = ({ playerId }) => {
  const [requests, setRequests] = useState<CoachRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [reachOutMessage, setReachOutMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [respondingRequest, setRespondingRequest] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0, declined: 0 });

  useEffect(() => {
    loadRequests();
  }, [playerId]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch(`/api/players/${playerId}/coach-requests`);
      if (!res.ok) throw new Error('Failed to load coach requests');
      
      const data = await res.json();
      setRequests(data.requests || []);
      setStats(data.stats || { total: 0, pending: 0, accepted: 0, declined: 0 });
    } catch (error) {
      console.error('Error loading coach requests:', error);
      toast.error('Failed to load coach requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      setRespondingRequest(requestId);
      const res = await authenticatedFetch(
        `/api/players/${playerId}/coach-requests/${requestId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'accept' }),
        }
      );

      if (!res.ok) throw new Error('Failed to accept request');
      
      toast.success('Coach request accepted!');
      await loadRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    } finally {
      setRespondingRequest(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    if (!confirm('Are you sure you want to decline this coach request?')) return;
    
    try {
      setRespondingRequest(requestId);
      const res = await authenticatedFetch(
        `/api/players/${playerId}/coach-requests/${requestId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'decline' }),
        }
      );

      if (!res.ok) throw new Error('Failed to decline request');
      
      toast.success('Coach request declined');
      await loadRequests();
    } catch (error) {
      console.error('Error declining request:', error);
      toast.error('Failed to decline request');
    } finally {
      setRespondingRequest(null);
    }
  };

  const handleReachOut = async (requestId: string) => {
    if (!reachOutMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      setSendingMessage(true);
      const res = await authenticatedFetch(
        `/api/players/${playerId}/coach-requests/${requestId}/reach-out`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: reachOutMessage }),
        }
      );

      if (!res.ok) throw new Error('Failed to send message');
      
      toast.success('Message sent to coach!');
      setReachOutMessage('');
      setSelectedRequest(null);
      await loadRequests();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', color: G.muted, padding: '40px 20px' }}>
        ⏳ Loading coach requests...
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          color: G.muted,
          padding: '40px 20px',
          background: G.card,
          border: `1px solid ${G.cardBorder}`,
          borderRadius: 8,
        }}
      >
        <div style={{ fontSize: 18, marginBottom: 10 }}>No coach requests yet</div>
        <div style={{ fontSize: 13 }}>
          Coaches in the platform will reach out to you to offer coaching services.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            background: G.card,
            border: `1px solid ${G.cardBorder}`,
            borderRadius: 8,
            padding: '15px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Total Requests</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: G.accent }}>{stats.total}</div>
        </div>
        <div
          style={{
            background: G.card,
            border: `1px solid ${G.cardBorder}`,
            borderRadius: 8,
            padding: '15px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Pending</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: G.yellow }}>{stats.pending}</div>
        </div>
        <div
          style={{
            background: G.card,
            border: `1px solid ${G.cardBorder}`,
            borderRadius: 8,
            padding: '15px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Accepted</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: G.lime }}>{stats.accepted}</div>
        </div>
        <div
          style={{
            background: G.card,
            border: `1px solid ${G.cardBorder}`,
            borderRadius: 8,
            padding: '15px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Declined</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: G.red }}>{stats.declined}</div>
        </div>
      </div>

      {/* Requests List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {requests.map((request) => (
          <div key={request.id} style={{ display: 'flex', gap: 16 }}>
            {/* Coach Card */}
            <div
              style={{
                flex: 1,
                background: G.card,
                border: `2px solid ${
                  request.status === 'pending'
                    ? G.yellow
                    : request.status === 'accepted'
                    ? G.lime
                    : G.red
                }`,
                borderRadius: 8,
                padding: '16px',
              }}
            >
              {/* Header with Coach Info */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                {request.coachPhoto && (
                  <img
                    src={request.coachPhoto}
                    alt={request.coachName}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: `2px solid ${G.lime}`,
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: G.accent, marginBottom: 4 }}>
                    {request.coachName}
                  </div>
                  {request.coachExpertise && (
                    <div style={{ fontSize: 12, color: G.muted, marginBottom: 4 }}>
                      {request.coachExpertise}
                    </div>
                  )}
                  {request.yearsOfExperience && (
                    <div style={{ fontSize: 11, color: G.muted }}>
                      {request.yearsOfExperience} years experience
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: G.muted, marginTop: 4 }}>
                    {request.coachRole}
                    {request.organization && ` • ${request.organization.name}`}
                  </div>
                </div>
                <div
                  style={{
                    background:
                      request.status === 'pending'
                        ? G.yellow
                        : request.status === 'accepted'
                        ? G.lime
                        : G.red,
                    color: G.dark,
                    borderRadius: 4,
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    height: 'fit-content',
                  }}
                >
                  {request.status}
                </div>
              </div>

              {/* Coach Bio */}
              {request.coachBio && (
                <div style={{ fontSize: 12, color: G.text, marginBottom: 12, fontStyle: 'italic' }}>
                  "{request.coachBio}"
                </div>
              )}

              {/* Initial Message */}
              {request.initialMessage && (
                <div
                  style={{
                    background: G.mid,
                    border: `1px solid ${G.cardBorder}`,
                    borderRadius: 6,
                    padding: '10px',
                    marginBottom: 12,
                    fontSize: 12,
                    color: G.text,
                  }}
                >
                  <div style={{ color: G.muted, marginBottom: 4, fontSize: 10 }}>Initial Message:</div>
                  {request.initialMessage}
                </div>
              )}

              {/* Request Timeline */}
              {request.history.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: G.muted, marginBottom: 8 }}>
                    📋 Activity Timeline
                  </div>
                  <div
                    style={{
                      background: G.mid,
                      border: `1px solid ${G.cardBorder}`,
                      borderRadius: 6,
                      padding: '10px',
                      maxHeight: 150,
                      overflowY: 'auto',
                    }}
                  >
                    {request.history.map((entry, index) => (
                      <div key={entry.id} style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ color: G.lime }}>•</span>
                          <span>
                            <strong>{entry.actionBy}</strong> {entry.action.replace(/_/g, ' ')}{' '}
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {entry.message && (
                          <div style={{ marginLeft: 16, marginTop: 4, color: G.text, fontSize: 10 }}>
                            "{entry.message}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {request.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAccept(request.id)}
                      disabled={respondingRequest === request.id}
                      style={{
                        flex: 1,
                        minWidth: 100,
                        background: G.lime,
                        color: G.dark,
                        border: 'none',
                        borderRadius: 6,
                        padding: '10px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: respondingRequest === request.id ? 'not-allowed' : 'pointer',
                        opacity: respondingRequest === request.id ? 0.6 : 1,
                      }}
                    >
                      ✓ Accept
                    </button>
                    <button
                      onClick={() => handleDecline(request.id)}
                      disabled={respondingRequest === request.id}
                      style={{
                        flex: 1,
                        minWidth: 100,
                        background: G.red,
                        color: G.text,
                        border: 'none',
                        borderRadius: 6,
                        padding: '10px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: respondingRequest === request.id ? 'not-allowed' : 'pointer',
                        opacity: respondingRequest === request.id ? 0.6 : 1,
                      }}
                    >
                      ✗ Decline
                    </button>
                    <button
                      onClick={() => setSelectedRequest(selectedRequest === request.id ? null : request.id)}
                      style={{
                        flex: 1,
                        minWidth: 100,
                        background: G.blue,
                        color: G.text,
                        border: 'none',
                        borderRadius: 6,
                        padding: '10px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      💬 Reach Out
                    </button>
                  </>
                )}
                {request.status === 'accepted' && (
                  <button
                    onClick={() => setSelectedRequest(selectedRequest === request.id ? null : request.id)}
                    style={{
                      flex: 1,
                      background: G.blue,
                      color: G.text,
                      border: 'none',
                      borderRadius: 6,
                      padding: '10px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    💬 Send Message
                  </button>
                )}
              </div>

              {/* Reach Out Form */}
              {selectedRequest === request.id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${G.cardBorder}` }}>
                  <textarea
                    value={reachOutMessage}
                    onChange={(e) => setReachOutMessage(e.target.value)}
                    placeholder="Type your message..."
                    style={{
                      width: '100%',
                      background: G.dark,
                      border: `1px solid ${G.cardBorder}`,
                      borderRadius: 6,
                      padding: '10px',
                      color: G.text,
                      fontSize: 12,
                      minHeight: 80,
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      marginBottom: 8,
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleReachOut(request.id)}
                      disabled={sendingMessage || !reachOutMessage.trim()}
                      style={{
                        flex: 1,
                        background: G.lime,
                        color: G.dark,
                        border: 'none',
                        borderRadius: 6,
                        padding: '10px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: sendingMessage || !reachOutMessage.trim() ? 'not-allowed' : 'pointer',
                        opacity: sendingMessage || !reachOutMessage.trim() ? 0.6 : 1,
                      }}
                    >
                      {sendingMessage ? '📤 Sending...' : '📤 Send'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRequest(null);
                        setReachOutMessage('');
                      }}
                      style={{
                        flex: 1,
                        background: G.mid,
                        color: G.text,
                        border: `1px solid ${G.cardBorder}`,
                        borderRadius: 6,
                        padding: '10px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
