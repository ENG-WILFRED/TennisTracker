'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@/components/LoadingState';
import { Card, Button, colors } from '@vico/design-system';

const G = {
  dark: colors.inverse || colors.background,
  sidebar: colors.surface,
  surface: colors.surface,
  card: colors.surfaceSecondary,
  cardBorder: colors.border,
  cardHover: colors.surface,
  mid: colors.info || colors.primary,
  bright: colors.primaryHover || colors.primary,
  lime: colors.primary,
  accent: colors.primary,
  text: colors.textPrimary,
  muted: colors.textMuted,
  yellow: colors.warning,
};

interface TournamentsViewProps {
  isEmbedded?: boolean;
  playerId?: string;
}

export function TournamentsView({ isEmbedded = false, playerId }: TournamentsViewProps) {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>('all');
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await fetch('/api/tournaments');
        const data = await response.json();
        // Normalize API response to an array of tournaments
        const normalized: any[] = Array.isArray(data)
          ? data
          : (data && typeof data === 'object'
            ? (Array.isArray(data.tournaments) ? data.tournaments : Array.isArray(data.items) ? data.items : [])
            : []);
        setTournaments(normalized);
      } catch (error) {
        console.error('Failed to fetch tournaments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  if (loading) {
    return <LoadingState icon="🏆" message="Loading tournaments..." fullPage={false} />;
  }

  return (
    <>
      <style jsx>{`
        .player-tournaments-root {
          width: 100%;
        }

        .player-tournaments-inner {
          width: 100%;
        }

        .player-tournaments-filter {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 24px;
          padding: 10px;
          border: 1px solid ${G.cardBorder};
          border-radius: 14px;
          background: ${G.card};
        }

        .player-tournaments-filter button {
          border: 1px solid transparent;
          border-radius: 999px;
          background: ${G.surface};
          color: ${G.muted};
          font-size: 13px;
          font-weight: 700;
          padding: 10px 16px;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
        }

        .player-tournaments-filter button:hover {
          background: ${G.cardHover};
        }

        .player-tournaments-filter button.active {
          background: ${G.lime};
          color: ${colors.background};
        }

        .player-tournaments-list {
          max-height: ${isEmbedded ? 'calc(100vh - 200px)' : 'none'};
          overflow-y: ${isEmbedded ? 'auto' : 'visible'};
        }

        .player-tournaments-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: 1fr;
        }

        .player-tournament-card {
          padding: 16px 14px;
          background: ${G.card};
          border: 1px solid ${G.cardBorder};
          border-radius: 8px;
          cursor: default;
          transition: none;
        }

        /* removed hover styles to avoid attention-grabbing hover effects */

        .player-tournament-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          gap: 12px;
        }

        .player-tournament-meta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          font-size: 12px;
          color: ${G.muted};
        }

        .player-tournament-stats {
          display: grid;
          gap: 10px;
          margin-bottom: 12px;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        }

        .player-tournament-action {
          width: 100%;
          padding: 10px 16px;
          background: linear-gradient(135deg, ${G.lime}, ${G.bright});
          color: ${colors.background};
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.12s ease;
        }

        .player-tournament-action .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: rgba(255,255,255,0.95);
          border-radius: 50%;
          display: inline-block;
          vertical-align: middle;
          margin-right: 8px;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .player-tournament-action:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .player-tournament-header {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
      <div className="player-tournaments-root" style={{ background: isEmbedded ? `linear-gradient(to bottom right, ${colors.surface}, ${colors.background})` : undefined, padding: isEmbedded ? 20 : 0, borderRadius: isEmbedded ? 8 : 0 }}>
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
      <div className="player-tournaments-filter">
        {(['all', 'upcoming', 'ongoing', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={filter === tab ? 'active' : ''}
            onClick={() => setFilter(tab)}
          >
            {tab === 'all' ? 'All Tournaments' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tournaments List */}
      <div className="player-tournaments-list">
        <div className="player-tournaments-grid">
          {(() => {
            // Ensure we have an array of tournaments (API may return an object)
            const allTournaments: any[] = Array.isArray(tournaments)
              ? tournaments
              : (tournaments && typeof tournaments === 'object'
                ? (Array.isArray((tournaments as any).tournaments) ? (tournaments as any).tournaments
                  : Array.isArray((tournaments as any).items) ? (tournaments as any).items
                  : [])
                : []);

            // Filter tournaments based on selected filter with a safe fallback
            const filteredTournaments = filter === 'all'
              ? allTournaments
              : allTournaments.filter(tournament => tournament && tournament.status === filter);

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
                  <div key={tournament.id} className="player-tournament-card">
                    {/* Tournament Header */}
                    <div className="player-tournament-header">
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: G.text, marginBottom: 4 }}>
                          {tournament.name}
                        </div>
                        <div style={{ fontSize: 12, color: G.lime, marginBottom: 6, fontWeight: 600 }}>
                          🏢 {tournament.organization?.name || 'Unknown Organization'}
                        </div>
                        <div className="player-tournament-meta">
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
                    <div className="player-tournament-stats">
                      <div style={{ background: G.dark, borderRadius: 6, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: G.muted, marginBottom: 2 }}>Participants</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: G.lime }}>
                          {tournament.participantsCount || 0}
                        </div>
                      </div>
                      <div style={{ background: G.dark, borderRadius: 6, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: G.muted, marginBottom: 2 }}>Format</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: G.lime }}>
                          {tournament.format || 'Singles'}
                        </div>
                      </div>
                      <div style={{ background: G.dark, borderRadius: 6, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: G.muted, marginBottom: 2 }}>Prize Pool</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: G.lime }}>
                          ${tournament.prizePool || 0}
                        </div>
                      </div>
                      <div style={{ background: G.dark, borderRadius: 6, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: G.muted, marginBottom: 2 }}>Spots Available</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: G.lime }}>
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
                        <div style={{ fontWeight: 600, color: G.lime, marginBottom: 4 }}>🏨 Facilities Available</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {tournament.eatingAreas && <span style={{ background: 'rgba(99,153,34,.2)', color: G.lime, padding: '2px 6px', borderRadius: 4, fontSize: 10 }}>🍽️ Dining</span>}
                          {tournament.sleepingAreas && <span style={{ background: 'rgba(99,153,34,.2)', color: G.lime, padding: '2px 6px', borderRadius: 4, fontSize: 10 }}>🛏️ Accommodation</span>}
                          {tournament.amenities?.length > 0 && <span style={{ background: 'rgba(99,153,34,.2)', color: G.lime, padding: '2px 6px', borderRadius: 4, fontSize: 10 }}>📅 {tournament.amenities.length} Amenities</span>}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      className="player-tournament-action"
                      type="button"
                      disabled={activeTournamentId === tournament.id}
                      onClick={() => {
                        setActiveTournamentId(tournament.id);
                        router.push(`/dashboard/player/${playerId}/tournaments/${tournament.id}`);
                      }}
                    >
                      {activeTournamentId === tournament.id ? (
                        <>
                          <span className="spinner" aria-hidden />
                          <span>Loading…</span>
                        </>
                      ) : (
                        'View Details & Register →'
                      )}
                    </button>
                  </div>
                );
              })
            );
          })()}
        </div>
      </div>
    </div>
    </>
  );
}
