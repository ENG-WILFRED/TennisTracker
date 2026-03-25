'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

interface TournamentsViewProps {
  isEmbedded?: boolean;
}

export function TournamentsView({ isEmbedded = false }: TournamentsViewProps) {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>('all');

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await fetch('/api/tournaments');
        const data = await response.json();
        setTournaments(data);
      } catch (error) {
        console.error('Failed to fetch tournaments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 24, marginBottom: 16 }}>⏳</div>
        <div style={{ color: G.muted }}>Loading tournaments...</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', background: isEmbedded ? 'linear-gradient(to bottom right, #0f2710, #0f1f0f, #0d1f0d)' : undefined, padding: isEmbedded ? 20 : 0, borderRadius: isEmbedded ? 8 : 0 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: G.text, marginBottom: 6 }}>
          🏆 Tournaments
        </h2>
        <p style={{ fontSize: 13, color: G.muted }}>
          Discover and join tournaments near you
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: `1px solid ${G.cardBorder}` }}>
        {(['all', 'upcoming', 'ongoing', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              background: 'transparent',
              border: 'none',
              color: filter === tab ? G.lime : G.muted,
              fontSize: 13,
              fontWeight: 700,
              paddingBottom: 12,
              borderBottom: filter === tab ? `2px solid ${G.lime}` : 'none',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'all' ? 'All Tournaments' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tournaments List */}
      <div style={{ maxHeight: isEmbedded ? 'calc(100vh - 200px)' : 'none', overflowY: isEmbedded ? 'auto' : 'visible' }}>
        <div style={{ display: 'grid', gap: 12 }}>
          {(() => {
            // Filter tournaments based on selected filter
            const filteredTournaments = filter === 'all' 
              ? tournaments 
              : tournaments.filter(tournament => tournament.status === filter);

            return filteredTournaments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: G.muted }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🎾</div>
                <div>No {filter === 'all' ? '' : filter + ' '}tournaments available at the moment</div>
              </div>
            ) : (
              filteredTournaments.map((tournament) => {
                const status = tournament.status || 'upcoming';
                const statusColor = status === 'upcoming' ? G.lime : status === 'ongoing' ? G.yellow : G.muted;

                return (
                  <div
                    key={tournament.id}
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
                        <div style={{ fontSize: 12, color: G.accent, marginBottom: 6, fontWeight: 600 }}>
                          🏢 {tournament.organization?.name || 'Unknown Organization'}
                        </div>
                        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: G.muted }}>
                          <span>📅 {new Date(tournament.startDate).toLocaleDateString()}</span>
                          <span>📍 {tournament.location || 'TBA'}</span>
                        </div>
                      </div>
                      <div
                        style={{
                          padding: '4px 12px',
                          background: statusColor + '30',
                          color: statusColor,
                          fontSize: 11,
                          fontWeight: 700,
                          borderRadius: 4,
                          textTransform: 'capitalize',
                        }}
                      >
                        {status}
                      </div>
                    </div>

                    {/* Tournament Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
                      <div style={{ background: G.dark, borderRadius: 6, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: G.muted, marginBottom: 2 }}>Participants</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: G.accent }}>
                          {tournament.participantsCount || 0}
                        </div>
                      </div>
                      <div style={{ background: G.dark, borderRadius: 6, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: G.muted, marginBottom: 2 }}>Format</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: G.accent }}>
                          {tournament.format || 'Singles'}
                        </div>
                      </div>
                      <div style={{ background: G.dark, borderRadius: 6, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: G.muted, marginBottom: 2 }}>Prize Pool</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: G.accent }}>
                          ${tournament.prizePool || 0}
                        </div>
                      </div>
                      <div style={{ background: G.dark, borderRadius: 6, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: G.muted, marginBottom: 2 }}>Spots Available</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: G.accent }}>
                          {tournament.maxParticipants - (tournament.participantsCount || 0) || 0}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {tournament.description && (
                      <div style={{ fontSize: 12, color: G.text, lineHeight: 1.5, marginBottom: 12 }}>
                        {tournament.description}
                      </div>
                    )}

                    {/* Facilities Preview */}
                    {(tournament.eatingAreas || tournament.sleepingAreas || tournament.amenities?.length > 0) && (
                      <div style={{ fontSize: 11, color: G.muted, marginBottom: 12, padding: '8px 12px', background: G.dark, borderRadius: 6 }}>
                        <div style={{ fontWeight: 600, color: G.accent, marginBottom: 4 }}>🏨 Facilities Available</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {tournament.eatingAreas && <span style={{ background: 'rgba(99,153,34,.2)', color: G.lime, padding: '2px 6px', borderRadius: 4, fontSize: 10 }}>🍽️ Dining</span>}
                          {tournament.sleepingAreas && <span style={{ background: 'rgba(99,153,34,.2)', color: G.lime, padding: '2px 6px', borderRadius: 4, fontSize: 10 }}>🛏️ Accommodation</span>}
                          {tournament.amenities?.length > 0 && <span style={{ background: 'rgba(99,153,34,.2)', color: G.lime, padding: '2px 6px', borderRadius: 4, fontSize: 10 }}>📅 {tournament.amenities.length} Amenities</span>}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <Link href={`/tournaments/${tournament.id}`}>
                      <button
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          background: `linear-gradient(135deg, ${G.lime}, ${G.bright})`,
                          color: '#0f1f0f',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        View Details & Register →
                      </button>
                    </Link>
                  </div>
                );
              })
            );
          })()}
        </div>
      </div>
    </div>
  );
}
