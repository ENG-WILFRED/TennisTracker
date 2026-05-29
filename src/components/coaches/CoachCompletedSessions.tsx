'use client';

import React, { useEffect, useState } from 'react';
import { toast } from '@vico/design-system';
import { toastOptions } from '@vico/design-system';
import { Calendar, Star, Plus, CheckCircle } from 'lucide-react';
import { CoachRatingForm } from '@/components/coaches/CoachRatingForm';

interface CompletedSession {
  id: string;
  title: string;
  playerName: string;
  playerId: string;
  endTime: string;
  durationMinutes?: number;
  status: string;
  hasRating?: boolean;
}

interface CoachCompletedSessionsProps {
  coachId: string;
  organizationId?: string;
}

const G = {
  card: '#0f1f0f',
  cardSoft: '#152515',
  cardBorder: '#243e24',
  text: '#e8f5e0',
  muted: '#7aaa6a',
  accent: '#79bf3e',
  accentSoft: '#79bf3e22',
  warning: '#f0c040',
  success: '#7dc142',
};

export const CoachCompletedSessions: React.FC<CoachCompletedSessionsProps> = ({
  coachId,
  organizationId,
}) => {
  const [sessions, setSessions] = useState<CompletedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<CompletedSession | null>(null);
  const [showRatingForm, setShowRatingForm] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const params = new URLSearchParams();
        if (coachId) params.append('coachId', coachId);
        if (organizationId) params.append('organizationId', organizationId);

        const response = await fetch(
          `/api/coaches/completed-sessions?${params.toString()}`
        );

        if (response.ok) {
          const data = await response.json();
          setSessions(data.sessions || []);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
        toast.error('Failed to load completed sessions');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [coachId, organizationId]);

  const unratedSessions = sessions.filter((s) => !s.hasRating);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-8 w-32 bg-[#243e24] rounded-lg" />
        <div className="h-40 bg-[#243e24] rounded-lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
          <CheckCircle className="h-5 w-5" style={{ color: G.accent }} />
          Completed Sessions
        </h3>
        <p className="text-xs text-[#a8d84e]">
          Rate your players on their performance
        </p>
      </div>

      {/* Unrated Sessions Alert */}
      {unratedSessions.length > 0 && (
        <div
          style={{
            background: `${G.warning}22`,
            border: `1px solid ${G.warning}44`,
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
          }}
        >
          <p style={{ fontSize: '12px', color: G.warning, fontWeight: '600' }}>
            ⚠️ {unratedSessions.length} session{unratedSessions.length !== 1 ? 's' : ''} awaiting your rating
          </p>
        </div>
      )}

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '30px 15px',
            background: G.cardSoft,
            borderRadius: '8px',
            border: `1px solid ${G.cardBorder}`,
          }}
        >
          <Calendar className="mx-auto mb-2 h-8 w-8" style={{ color: G.muted }} />
          <p style={{ color: G.muted, fontSize: '12px' }}>
            No completed sessions yet
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              style={{
                background: G.card,
                border: `1px solid ${G.cardBorder}`,
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <p className="text-sm font-semibold text-white">
                  {session.title}
                </p>
                <p style={{ fontSize: '11px', color: G.muted, marginTop: '4px' }}>
                  {session.playerName} • {new Date(session.endTime).toLocaleDateString()}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {session.hasRating ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: G.success,
                      fontSize: '12px',
                    }}
                  >
                    <Star className="h-4 w-4 fill-current" />
                    Rated
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedSession(session);
                      setShowRatingForm(true);
                    }}
                    style={{
                      padding: '6px 12px',
                      background: G.accent,
                      border: 'none',
                      borderRadius: '6px',
                      color: '#081107',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    Rate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rating Form Modal */}
      {showRatingForm && selectedSession && (
        <CoachRatingForm
          coachId={coachId}
          playerId={selectedSession.playerId}
          sessionId={selectedSession.id}
          sessionTitle={selectedSession.title}
          onClose={() => {
            setShowRatingForm(false);
            setSelectedSession(null);
          }}
          onSuccess={() => {
            setSessions((prev) =>
              prev.map((s) =>
                s.id === selectedSession.id
                  ? { ...s, hasRating: true }
                  : s
              )
            );
          }}
        />
      )}
    </div>
  );
};

export default CoachCompletedSessions;
