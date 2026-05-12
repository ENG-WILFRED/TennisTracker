'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Calendar, Dumbbell, TrendingUp, Star, Trophy } from 'lucide-react';

interface CompletedSession {
  id: string;
  title: string;
  sessionType?: string;
  startTime: string;
  coachName: string;
  rating?: {
    overallRating: number;
    strengths?: string;
    areasForImprovement?: string;
  };
  status: string;
  durationMinutes?: number;
}

interface CompletedSessionsViewProps {
  playerId: string;
  isEmbedded?: boolean;
}

const G = {
  page: '#081107',
  card: '#0f1f0f',
  cardSoft: '#152515',
  cardBorder: '#243e24',
  panel: '#162616',
  text: '#e8f5e0',
  muted: '#7aaa6a',
  accent: '#79bf3e',
  accentSoft: '#79bf3e22',
  accentStrong: '#3a7230',
  warning: '#f0c040',
  danger: '#d94f4f',
  success: '#7dc142',
};

export const CompletedSessionsView: React.FC<CompletedSessionsViewProps> = ({
  playerId,
  isEmbedded = false,
}) => {
  const [sessions, setSessions] = useState<CompletedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'rated' | 'pending'>('all');

  useEffect(() => {
    const fetchSessions = async () => {
      if (!playerId) {
        setError('Player ID is required');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/players/${playerId}/completed-sessions`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch completed sessions');
        }

        const data = await response.json();
        setSessions(data.sessions || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load completed sessions'
        );
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [playerId]);

  const filteredSessions = sessions.filter((session) => {
    if (filter === 'rated') return session.rating;
    if (filter === 'pending') return !session.rating;
    return true;
  });

  const avgRating =
    sessions.length > 0
      ? (
          sessions.reduce((sum, s) => sum + (s.rating?.overallRating || 0), 0) /
          sessions.filter((s) => s.rating).length
        ).toFixed(1)
      : '0';

  const stats = {
    total: sessions.length,
    rated: sessions.filter((s) => s.rating).length,
    pending: sessions.filter((s) => !s.rating).length,
  };

  if (loading) {
    return (
      <div className="p-6 bg-[#081107]">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-[#243e24] rounded-lg" />
          <div className="h-40 bg-[#243e24] rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: isEmbedded ? 'transparent' : G.page,
        padding: isEmbedded ? '0' : '20px',
        borderRadius: isEmbedded ? '0' : '12px',
      }}
    >
      {/* Header with Stats */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="h-6 w-6" style={{ color: G.accent }} />
              Completed Sessions
            </h2>
            <p className="text-sm text-[#a8d84e] mt-1">
              Track your training progress with coach feedback
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div
            style={{
              background: G.cardSoft,
              border: `1px solid ${G.cardBorder}`,
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div
              style={{ fontSize: '24px', fontWeight: 'bold', color: G.accent }}
            >
              {stats.total}
            </div>
            <div style={{ fontSize: '12px', color: G.muted, marginTop: '4px' }}>
              Total Sessions
            </div>
          </div>
          <div
            style={{
              background: G.cardSoft,
              border: `1px solid ${G.cardBorder}`,
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: G.warning,
              }}
            >
              {stats.rated}
            </div>
            <div style={{ fontSize: '12px', color: G.muted, marginTop: '4px' }}>
              Rated
            </div>
          </div>
          <div
            style={{
              background: G.cardSoft,
              border: `1px solid ${G.cardBorder}`,
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: G.success,
              }}
            >
              {avgRating}
            </div>
            <div style={{ fontSize: '12px', color: G.muted, marginTop: '4px' }}>
              Avg Rating
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {(['all', 'rated', 'pending'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: `1px solid ${filter === tab ? G.accent : G.cardBorder}`,
                background:
                  filter === tab ? G.accentSoft : 'transparent',
                color: filter === tab ? G.accent : G.muted,
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'all' && ` (${stats.total})`}
              {tab === 'rated' && ` (${stats.rated})`}
              {tab === 'pending' && ` (${stats.pending})`}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: G.cardSoft,
            borderRadius: '12px',
            border: `1px solid ${G.cardBorder}`,
          }}
        >
          <Dumbbell
            className="mx-auto mb-4 h-10 w-10"
            style={{ color: G.muted }}
          />
          <p style={{ color: G.muted, fontSize: '14px' }}>
            {filter === 'pending'
              ? 'No sessions awaiting coach feedback yet'
              : filter === 'rated'
              ? 'No rated sessions yet'
              : 'No completed sessions yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              style={{
                background: G.card,
                border: `1px solid ${G.cardBorder}`,
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              {/* Session Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white text-base">
                    {session.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="h-4 w-4" style={{ color: G.muted }} />
                    <span style={{ color: G.muted, fontSize: '12px' }}>
                      {new Date(session.startTime).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {session.durationMinutes && (
                      <>
                        <span style={{ color: G.muted }}>•</span>
                        <span style={{ color: G.muted, fontSize: '12px' }}>
                          {session.durationMinutes} min
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {session.rating ? (
                  <div className="flex items-center gap-1">
                    <Star
                      className="h-5 w-5 fill-current"
                      style={{ color: G.warning }}
                    />
                    <span
                      style={{ color: G.warning, fontWeight: 'bold', fontSize: '14px' }}
                    >
                      {session.rating.overallRating.toFixed(1)}
                    </span>
                  </div>
                ) : (
                  <span
                    style={{
                      fontSize: '11px',
                      color: G.muted,
                      background: G.cardSoft,
                      padding: '4px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    Awaiting rating
                  </span>
                )}
              </div>

              {/* Coach and Type */}
              <div className="flex items-center gap-4 mb-3 text-sm">
                <span style={{ color: G.text }}>
                  Coach: <span style={{ color: G.accent }}>{session.coachName}</span>
                </span>
                {session.sessionType && (
                  <>
                    <span style={{ color: G.muted }}>•</span>
                    <span style={{ color: G.text }}>
                      Type: <span style={{ color: G.accent }}>{session.sessionType}</span>
                    </span>
                  </>
                )}
              </div>

              {/* Rating Details */}
              {session.rating && (
                <div
                  style={{
                    background: G.accentSoft,
                    border: `1px solid ${G.accent}40`,
                    borderRadius: '8px',
                    padding: '12px',
                    marginTop: '12px',
                  }}
                >
                  {session.rating.strengths && (
                    <div className="mb-2">
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: G.accent,
                          textTransform: 'uppercase',
                        }}
                      >
                        Strengths:
                      </span>
                      <p style={{ fontSize: '12px', color: G.text, marginTop: '4px' }}>
                        {session.rating.strengths}
                      </p>
                    </div>
                  )}
                  {session.rating.areasForImprovement && (
                    <div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: G.warning,
                          textTransform: 'uppercase',
                        }}
                      >
                        Areas to Improve:
                      </span>
                      <p style={{ fontSize: '12px', color: G.text, marginTop: '4px' }}>
                        {session.rating.areasForImprovement}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompletedSessionsView;
