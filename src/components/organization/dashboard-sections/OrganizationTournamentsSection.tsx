'use client';

import React, { useState, useEffect } from 'react';
import { getAccessToken, refreshAccessToken } from '@/lib/tokenManager';
import Link from 'next/link';

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
  textSoft: '#b8d8a8',
  muted: '#7aaa6a',
  yellow: '#f0c040',
  red: '#e05050',
  orange: '#e08030',
};

interface Tournament {
  id: string;
  name: string;
  eventType: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  registrationCap: number;
  status: 'draft' | 'open' | 'closed' | 'ongoing' | 'completed';
  prizePool: number;
  entryFee: number;
  registrations?: any[];
}

interface OrganizationTournamentsSectionProps {
  organizationId?: string;
}

export default function OrganizationTournamentsSection({ organizationId }: OrganizationTournamentsSectionProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notify, setNotify] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    eventType: 'single_elimination',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    registrationCap: 32,
    entryFee: 50,
    prizePool: 5000,
    description: '',
  });


  useEffect(() => {
    if (!organizationId) return;
    fetchTournaments();
  }, [organizationId]);

  // Auto-hide notifications
  useEffect(() => {
    if (notify) {
      const timer = setTimeout(() => setNotify(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notify]);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/organization/${organizationId}/events?type=tournament`);
      if (!res.ok) throw new Error('Failed to fetch tournaments');

      let data = await res.json();
      
      // If no tournaments exist, seed them
      if (!data || data.length === 0) {
        console.log('No tournaments found, seeding...');
        let token = getAccessToken();
        if (!token) {
          const refreshed = await refreshAccessToken();
          if (refreshed) token = getAccessToken();
        }

        if (token) {
          try {
            const seedRes = await fetch(`/api/organization/${organizationId}/events/seed`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
            });

            if (seedRes.ok) {
              const seedData = await seedRes.json();
              console.log(`Seeded ${seedData.count} tournaments`);
              // Refetch tournaments after seeding
              const refetchRes = await fetch(`/api/organization/${organizationId}/events?type=tournament`);
              if (refetchRes.ok) {
                data = await refetchRes.json();
              }
            }
          } catch (seedErr) {
            console.error('Error seeding tournaments:', seedErr);
          }
        }
      }

      setTournaments(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load tournaments');
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  const createTournament = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!organizationId) {
      setNotify('❌ Organization not found');
      return;
    }

    if (!formData.name.trim()) {
      setNotify('❌ Tournament name is required');
      return;
    }

    let token = getAccessToken();
    if (!token) {
      const refreshed = await refreshAccessToken();
      if (refreshed) token = getAccessToken();
    }

    if (!token) {
      setNotify('❌ Authentication required. Please log in again.');
      return;
    }

    setActionLoading(true);
    setNotify(null);

    try {
      const res = await fetch(`/api/organization/${organizationId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          eventType: 'tournament',
        }),
      });

      const payload = await res.json().catch(() => ({ error: 'Invalid response' }));

      if (!res.ok) {
        throw new Error(payload?.error || `Failed to create tournament (${res.status})`);
      }

      setNotify(`✅ Tournament "${formData.name}" created successfully`);
      setFormData({
        name: '',
        eventType: 'single_elimination',
        startDate: '',
        endDate: '',
        registrationDeadline: '',
        registrationCap: 32,
        entryFee: 50,
        prizePool: 5000,
        description: '',
      });
      setShowCreateModal(false);
      await fetchTournaments();
    } catch (err: any) {
      setNotify(`❌ ${err.message || 'Failed to create tournament'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'open': return { bg: G.lime + '22', color: G.lime };
      case 'ongoing': return { bg: G.yellow + '22', color: G.yellow };
      case 'closed': return { bg: G.muted + '22', color: G.muted };
      case 'completed': return { bg: G.bright + '22', color: G.bright };
      default: return { bg: G.mid, color: G.text };
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: G.muted }}>
        <div style={{ fontSize: 16, marginBottom: 10 }}>Loading tournaments...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontFamily: "'Raleway', sans-serif" }}>
      {/* Google Font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: G.text, letterSpacing: '-0.02em' }}>
            <span style={{ color: G.lime }}>🏆 Tournaments</span>
          </div>
          <div style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>Create and manage tennis tournaments</div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 700,
            background: G.lime,
            color: G.dark,
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '0.02em',
          }}
        >
          + Create Tournament
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 10, color: G.muted, marginBottom: 6, textTransform: 'uppercase' }}>Total Tournaments</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: G.lime }}>{tournaments.length}</div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 10, color: G.muted, marginBottom: 6, textTransform: 'uppercase' }}>Active</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: G.yellow }}>{tournaments.filter(t => t.status === 'open' || t.status === 'ongoing').length}</div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 10, color: G.muted, marginBottom: 6, textTransform: 'uppercase' }}>Total Players</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: G.accent }}>{tournaments.reduce((sum, t) => sum + (t.registrations?.length || 0), 0)}</div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 10, color: G.muted, marginBottom: 6, textTransform: 'uppercase' }}>Prize Pool</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: G.bright }}>${tournaments.reduce((sum, t) => sum + (t.prizePool || 0), 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Notifications */}
      {notify && (
        <div style={{
          background: notify.includes('❌') ? '#2d1212' : '#153015',
          border: `1px solid ${notify.includes('❌') ? G.red : G.lime}`,
          color: notify.includes('❌') ? G.red : G.lime,
          borderRadius: 8,
          padding: '8px 10px',
          fontSize: 11,
        }}>
          {notify}
        </div>
      )}

      {/* Tournaments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tournaments.length === 0 ? (
          <div style={{
            padding: 40,
            textAlign: 'center',
            color: G.muted,
            background: G.card,
            borderRadius: 10,
            border: `1px dashed ${G.cardBorder}`,
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
            <div>No tournaments yet. Create one to get started!</div>
          </div>
        ) : (
          tournaments.map((tournament) => {
            const pendingPlayers = tournament.registrations?.filter((r: any) => r.status === 'pending') || [];
            const approvedPlayers = tournament.registrations?.filter((r: any) => r.status === 'approved') || [];
            const statusColors = getStatusBadgeColor(tournament.status);
            const spotsAvailable = tournament.registrationCap - approvedPlayers.length;

            return (
              <Link
                key={tournament.id}
                href={`/organization/${organizationId}/tournaments/${tournament.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    padding: '16px 14px',
                    background: G.card,
                    border: `1px solid ${G.cardBorder}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = G.lime;
                    (e.currentTarget as HTMLDivElement).style.background = '#1d4020';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = G.cardBorder;
                    (e.currentTarget as HTMLDivElement).style.background = G.card;
                  }}
                >
                  {/* Tournament Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: G.text, marginBottom: 4 }}>
                        {tournament.name}
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: G.muted, marginBottom: 6 }}>
                        <span>📅 {new Date(tournament.startDate).toLocaleDateString()}</span>
                        <span>-</span>
                        <span>{new Date(tournament.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div
                      style={{
                        padding: '4px 12px',
                        background: statusColors.bg,
                        color: statusColors.color,
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 4,
                        textTransform: 'capitalize',
                      }}
                    >
                      {tournament.status}
                    </div>
                  </div>

                  {/* Tournament Stats Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
                    <div style={{ background: G.dark, borderRadius: 6, padding: '8px 10px' }}>
                      <div style={{ fontSize: 10, color: G.muted, marginBottom: 2 }}>Registered</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: G.accent }}>
                        {approvedPlayers.length}/{tournament.registrationCap}
                      </div>
                    </div>
                    <div style={{ background: G.dark, borderRadius: 6, padding: '8px 10px' }}>
                      <div style={{ fontSize: 10, color: G.muted, marginBottom: 2 }}>Pending</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: G.yellow }}>
                        {pendingPlayers.length}
                      </div>
                    </div>
                    <div style={{ background: G.dark, borderRadius: 6, padding: '8px 10px' }}>
                      <div style={{ fontSize: 10, color: G.muted, marginBottom: 2 }}>Prize Pool</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: G.lime }}>
                        ${tournament.prizePool?.toLocaleString() || 0}
                      </div>
                    </div>
                    <div style={{ background: G.dark, borderRadius: 6, padding: '8px 10px' }}>
                      <div style={{ fontSize: 10, color: G.muted, marginBottom: 2 }}>Available</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: spotsAvailable > 0 ? G.lime : G.red }}>
                        {spotsAvailable}
                      </div>
                    </div>
                  </div>

                  {/* Entry Fee Display */}
                  <div style={{ fontSize: 11, color: G.muted, padding: '8px 12px', background: G.dark, borderRadius: 6 }}>
                    💳 Entry Fee: <span style={{ color: G.accent, fontWeight: 600 }}>${tournament.entryFee}</span>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>

      {/* Create Tournament Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }} onClick={() => setShowCreateModal(false)}>
          <div style={{
            background: G.sidebar,
            border: `1px solid ${G.cardBorder}`,
            borderRadius: 14,
            padding: 28,
            width: 500,
            maxWidth: '90vw',
            maxHeight: '85vh',
            overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 800, color: G.text, marginBottom: 4 }}>
              Create New Tournament
            </div>
            <div style={{ fontSize: 11, color: G.muted, marginBottom: 20 }}>
              Set up a new tournament with specific rules and details
            </div>

            <form onSubmit={createTournament} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Tournament Name */}
              <div>
                <div style={{ fontSize: 10, color: G.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Tournament Name
                </div>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Spring Championship"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: G.dark,
                    border: `1px solid ${G.cardBorder}`,
                    borderRadius: 7,
                    color: G.text,
                    fontSize: 11,
                    fontFamily: "'Raleway', sans-serif",
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Tournament Type */}
              <div>
                <div style={{ fontSize: 10, color: G.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Tournament Type
                </div>
                <select
                  value={formData.eventType}
                  onChange={(e) => setFormData(prev => ({ ...prev, eventType: e.target.value as any }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: G.dark,
                    border: `1px solid ${G.cardBorder}`,
                    borderRadius: 7,
                    color: G.text,
                    fontSize: 11,
                    fontFamily: "'Raleway', sans-serif",
                  }}
                >
                  <option value="single_elimination">Single Elimination</option>
                  <option value="round_robin">Round Robin</option>
                  <option value="knockout">Knockout</option>
                </select>
              </div>

              {/* Dates Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: G.muted, marginBottom: 5, textTransform: 'uppercase' }}>Start Date</div>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: G.dark,
                      border: `1px solid ${G.cardBorder}`,
                      borderRadius: 7,
                      color: G.text,
                      fontSize: 11,
                      fontFamily: "'Raleway', sans-serif",
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: G.muted, marginBottom: 5, textTransform: 'uppercase' }}>End Date</div>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: G.dark,
                      border: `1px solid ${G.cardBorder}`,
                      borderRadius: 7,
                      color: G.text,
                      fontSize: 11,
                      fontFamily: "'Raleway', sans-serif",
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Registration Deadline */}
              <div>
                <div style={{ fontSize: 10, color: G.muted, marginBottom: 5, textTransform: 'uppercase' }}>
                  Registration Deadline
                </div>
                <input
                  type="date"
                  value={formData.registrationDeadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, registrationDeadline: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: G.dark,
                    border: `1px solid ${G.cardBorder}`,
                    borderRadius: 7,
                    color: G.text,
                    fontSize: 11,
                    fontFamily: "'Raleway', sans-serif",
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: G.muted, marginBottom: 5, textTransform: 'uppercase' }}>Registration Cap</div>
                  <input
                    type="number"
                    value={formData.registrationCap}
                    onChange={(e) => setFormData(prev => ({ ...prev, registrationCap: parseInt(e.target.value) }))}
                    min="2"
                    max="512"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: G.dark,
                      border: `1px solid ${G.cardBorder}`,
                      borderRadius: 7,
                      color: G.text,
                      fontSize: 11,
                      fontFamily: "'Raleway', sans-serif",
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: G.muted, marginBottom: 5, textTransform: 'uppercase' }}>Entry Fee</div>
                  <input
                    type="number"
                    value={formData.entryFee}
                    onChange={(e) => setFormData(prev => ({ ...prev, entryFee: parseFloat(e.target.value) }))}
                    min="0"
                    step="5"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: G.dark,
                      border: `1px solid ${G.cardBorder}`,
                      borderRadius: 7,
                      color: G.text,
                      fontSize: 11,
                      fontFamily: "'Raleway', sans-serif",
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Prize Pool */}
              <div>
                <div style={{ fontSize: 10, color: G.muted, marginBottom: 5, textTransform: 'uppercase' }}>Prize Pool</div>
                <input
                  type="number"
                  value={formData.prizePool}
                  onChange={(e) => setFormData(prev => ({ ...prev, prizePool: parseFloat(e.target.value) }))}
                  min="0"
                  step="100"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: G.dark,
                    border: `1px solid ${G.cardBorder}`,
                    borderRadius: 7,
                    color: G.text,
                    fontSize: 11,
                    fontFamily: "'Raleway', sans-serif",
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <div style={{ fontSize: 10, color: G.muted, marginBottom: 5, textTransform: 'uppercase' }}>Description</div>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tournament details and rules..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: G.dark,
                    border: `1px solid ${G.cardBorder}`,
                    borderRadius: 7,
                    color: G.text,
                    fontSize: 11,
                    fontFamily: "'Raleway', sans-serif",
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 8,
                    border: `1px solid ${G.cardBorder}`,
                    background: 'transparent',
                    color: G.muted,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontFamily: "'Raleway', sans-serif",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    flex: 2,
                    padding: '10px',
                    borderRadius: 8,
                    border: 'none',
                    background: G.lime,
                    color: G.dark,
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    fontSize: 12,
                    fontWeight: 800,
                    fontFamily: "'Raleway', sans-serif",
                    opacity: actionLoading ? 0.7 : 1,
                  }}
                >
                  {actionLoading ? 'Creating...' : 'Create Tournament'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
