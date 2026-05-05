'use client';

import React, { useState, useEffect } from 'react';
import { LoadingState } from '@/components/LoadingState';

interface Session {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  sessionType: string;
  status: string;
  coach: {
    id: string;
    name: string;
    photo?: string;
  };
  court?: {
    id: string;
    name: string;
    courtNumber?: number;
    surface?: string;
  };
  organization?: {
    id: string;
    name: string;
  };
  price?: number;
  maxParticipants?: number;
  isDirectAssignment: boolean;
  booking?: any;
}

interface SessionsViewProps {
  isEmbedded?: boolean;
  playerId?: string;
}

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
};

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  scheduled: { bg: '#1e5f3f', text: '#7dc142', border: '#7dc142' },
  confirmed: { bg: '#1e4f7f', text: '#7dbaff', border: '#7dbaff' },
  'in-progress': { bg: '#5f4f1f', text: '#f0c040', border: '#f0c040' },
  completed: { bg: '#1e5f2f', text: '#7dc142', border: '#7dc142' },
  cancelled: { bg: '#5f1f1f', text: '#ff7d7d', border: '#ff7d7d' },
  'no-show': { bg: '#5f3f1f', text: '#ffb366', border: '#ffb366' },
};

export const SessionsView: React.FC<SessionsViewProps> = ({ isEmbedded = false, playerId = '' }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!playerId) {
        setError('Player ID is required');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/players/sessions?playerId=${playerId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch sessions');
        }

        const data = await response.json();
        setSessions(data.sessions || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load sessions');
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [playerId]);

  if (loading) {
    return <LoadingState icon="📅" message="Loading your sessions..." />;
  }

  if (error) {
    return (
      <div
        className="rounded-xl p-6 border"
        style={{ background: G.card, borderColor: G.cardBorder, color: G.text }}
      >
        <div className="text-red-400 text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  // Group sessions by status
  const groupedSessions = sessions.reduce(
    (acc, session) => {
      if (!acc[session.status]) {
        acc[session.status] = [];
      }
      acc[session.status].push(session);
      return acc;
    },
    {} as Record<string, Session[]>
  );

  // Sort statuses: upcoming first, then completed/cancelled
  const sortedStatuses = Object.keys(groupedSessions).sort((a, b) => {
    const order = ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'];
    return order.indexOf(a) - order.indexOf(b);
  });

  if (sessions.length === 0) {
    return (
      <div
        className="rounded-xl p-8 border text-center"
        style={{ background: G.card, borderColor: G.cardBorder, color: G.text }}
      >
        <div className="text-4xl mb-3">🎾</div>
        <h3 className="text-lg font-semibold mb-2">No Sessions Scheduled</h3>
        <p style={{ color: G.muted }}>
          You don't have any coaching sessions scheduled yet. Ask your coach to schedule one with you!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-4" style={{ color: G.text }}>
          📅 My Coaching Sessions
        </h2>

        {/* Status filter tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setSelectedStatus(null)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex-shrink-0 ${
              selectedStatus === null
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            style={{
              backgroundColor: selectedStatus === null ? G.bright : G.card,
              borderColor: G.cardBorder,
              border: '1px solid',
            }}
          >
            All ({sessions.length})
          </button>
          {sortedStatuses.map(status => {
            const count = groupedSessions[status].length;
            const colors = statusColors[status];
            return (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className="px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex-shrink-0"
                style={{
                  backgroundColor:
                    selectedStatus === status
                      ? colors.bg
                      : G.card,
                  color: selectedStatus === status ? colors.text : G.muted,
                  border: `1px solid ${colors.border}`,
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
              </button>
            );
          })}
        </div>

        {/* Sessions list */}
        <div className="space-y-3">
          {sortedStatuses.map(status => {
            const statusSessions = groupedSessions[status];
            if (selectedStatus && selectedStatus !== status) {
              return null;
            }

            return (
              <div key={status}>
                {selectedStatus === null && (
                  <h3
                    className="text-sm font-bold mb-2 uppercase tracking-wide"
                    style={{ color: G.lime }}
                  >
                    {status.replace('-', ' ')}
                  </h3>
                )}
                <div className="space-y-2">
                  {statusSessions.map(session => {
                    const colors = statusColors[session.status];
                    const startDate = new Date(session.startTime);
                    const endDate = new Date(session.endTime);
                    const dateStr = startDate.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    });
                    const timeStr = `${startDate.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })} - ${endDate.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`;

                    return (
                      <div
                        key={session.id}
                        className="rounded-lg p-4 border transition-all hover:shadow-lg"
                        style={{
                          background: G.card,
                          borderColor: colors.border,
                          borderWidth: '2px',
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="text-lg font-bold" style={{ color: G.text }}>
                              {session.title}
                            </h4>
                            {session.description && (
                              <p
                                className="text-sm mt-1"
                                style={{ color: G.muted }}
                              >
                                {session.description}
                              </p>
                            )}
                          </div>
                          <span
                            className="px-3 py-1 rounded-full text-xs font-bold ml-3 flex-shrink-0"
                            style={{
                              backgroundColor: colors.bg,
                              color: colors.text,
                              border: `1px solid ${colors.border}`,
                            }}
                          >
                            {session.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          {/* Date and Time */}
                          <div className="flex items-center gap-2">
                            <span className="text-xl">📅</span>
                            <div>
                              <div
                                className="text-xs"
                                style={{ color: G.muted }}
                              >
                                Date
                              </div>
                              <div className="text-sm font-semibold" style={{ color: G.text }}>
                                {dateStr}
                              </div>
                            </div>
                          </div>

                          {/* Time */}
                          <div className="flex items-center gap-2">
                            <span className="text-xl">⏰</span>
                            <div>
                              <div
                                className="text-xs"
                                style={{ color: G.muted }}
                              >
                                Time
                              </div>
                              <div className="text-sm font-semibold" style={{ color: G.text }}>
                                {timeStr}
                              </div>
                            </div>
                          </div>

                          {/* Coach */}
                          <div className="flex items-center gap-2">
                            <span className="text-xl">👨‍🏫</span>
                            <div>
                              <div
                                className="text-xs"
                                style={{ color: G.muted }}
                              >
                                Coach
                              </div>
                              <div className="text-sm font-semibold" style={{ color: G.text }}>
                                {session.coach.name}
                              </div>
                            </div>
                          </div>

                          {/* Court */}
                          {session.court && (
                            <div className="flex items-center gap-2">
                              <span className="text-xl">🎾</span>
                              <div>
                                <div
                                  className="text-xs"
                                  style={{ color: G.muted }}
                                >
                                  Court
                                </div>
                                <div className="text-sm font-semibold" style={{ color: G.text }}>
                                  {session.court.name}
                                  {session.court.courtNumber && ` #${session.court.courtNumber}`}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Session Type */}
                          <div className="flex items-center gap-2">
                            <span className="text-xl">📋</span>
                            <div>
                              <div
                                className="text-xs"
                                style={{ color: G.muted }}
                              >
                                Type
                              </div>
                              <div className="text-sm font-semibold" style={{ color: G.text }}>
                                {session.sessionType.replace(/-/g, ' ').toUpperCase()}
                              </div>
                            </div>
                          </div>

                          {/* Price */}
                          {session.price && (
                            <div className="flex items-center gap-2">
                              <span className="text-xl">💰</span>
                              <div>
                                <div
                                  className="text-xs"
                                  style={{ color: G.muted }}
                                >
                                  Price
                                </div>
                                <div className="text-sm font-semibold" style={{ color: G.lime }}>
                                  KSh {session.price.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Booking Status if available */}
                        {session.booking && (
                          <div
                            className="text-xs p-2 rounded border mt-3"
                            style={{
                              background: G.dark,
                              borderColor: G.cardBorder,
                              color: G.muted,
                            }}
                          >
                            <div className="font-semibold mb-1">Booking Details:</div>
                            <div>Status: {session.booking.status}</div>
                            {session.booking.attendanceStatus && (
                              <div>Attendance: {session.booking.attendanceStatus}</div>
                            )}
                            {session.booking.feedbackRating && (
                              <div>Rating: {session.booking.feedbackRating}/5 ⭐</div>
                            )}
                          </div>
                        )}

                        {/* Direct Assignment indicator */}
                        {session.isDirectAssignment && (
                          <div
                            className="text-xs p-2 rounded border mt-3 flex items-center gap-2"
                            style={{
                              background: G.dark,
                              borderColor: G.lime,
                              color: G.lime,
                            }}
                          >
                            <span>✓</span>
                            <span>Directly assigned by your coach</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
