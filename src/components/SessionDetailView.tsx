'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { LoadingState } from '@/components/LoadingState';

const G = {
  dark: '#0a180a',
  sidebar: '#0f1e0f',
  card: '#162616',
  card2: '#1b2f1b',
  card3: '#203520',
  border: '#243e24',
  border2: '#326832',
  mid: '#2a5224',
  bright: '#3a7230',
  lime: '#79bf3e',
  lime2: '#a8d84e',
  text: '#e4f2da',
  text2: '#c2dbb0',
  muted: '#5e8e50',
  muted2: '#7aaa68',
  yellow: '#efc040',
  red: '#d94f4f',
  blue: '#4a9eff',
};

interface Session {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  sessionType: string;
  status: string;
  maxParticipants: number;
  price?: number;
  bookings: any[];
  court?: { id: string; name: string } | string;
  coachId: string;
  playerIds?: string[];
  players?: { id: string; name: string; email: string }[];
}

interface SessionDetailViewProps {
  sessionId: string;
  redirectBasePath?: string;
}

export default function SessionDetailView({ sessionId, redirectBasePath }: SessionDetailViewProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [showRemindModal, setShowRemindModal] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({
    newDate: '',
    newStartTime: '',
    newEndTime: '',
  });

  const fallbackPath = redirectBasePath || (user?.role && user?.id ? `/dashboard/${user.role}/${user.id}` : '/dashboard');

  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) {
          addToast('Session not found', 'error');
          router.push(fallbackPath);
          return;
        }

        const data = await res.json();
        setSession(data.session);

        const startDT = new Date(data.session.startTime);
        const endDT = new Date(data.session.endTime);
        setRescheduleData({
          newDate: startDT.toISOString().split('T')[0],
          newStartTime: startDT.toTimeString().slice(0, 5),
          newEndTime: endDT.toTimeString().slice(0, 5),
        });
      } catch (error) {
        console.error('Error loading session:', error);
        addToast('Failed to load session', 'error');
        router.push(fallbackPath);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      loadSession();
    }
  }, [sessionId, router, addToast, fallbackPath]);

  const handleReschedule = async () => {
    if (!rescheduleData.newDate || !rescheduleData.newStartTime || !rescheduleData.newEndTime) {
      addToast('Please fill in all fields', 'error');
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newDate: rescheduleData.newDate,
          newStartTime: rescheduleData.newStartTime,
          newEndTime: rescheduleData.newEndTime,
        }),
      });

      if (res.ok) {
        addToast('Session rescheduled successfully! 📅', 'success');
        setShowRescheduleForm(false);
        const updated = await res.json();
        setSession(updated.session);
      } else {
        const error = await res.json();
        addToast(error.error || 'Failed to reschedule', 'error');
      }
    } catch (error) {
      console.error('Error rescheduling:', error);
      addToast('Error rescheduling session', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this session?')) return;

    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/cancel`, { method: 'POST' });
      if (res.ok) {
        addToast('Session cancelled successfully ✓', 'success');
        setTimeout(() => router.push(fallbackPath), 1500);
      } else {
        const error = await res.json();
        addToast(error.error || 'Failed to cancel', 'error');
      }
    } catch (error) {
      console.error('Error cancelling:', error);
      addToast('Error cancelling session', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemindPlayers = async () => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/remind`, { method: 'POST' });
      if (res.ok) {
        addToast('Reminder sent to all players! 📢', 'success');
        setShowRemindModal(false);
      } else {
        const error = await res.json();
        addToast(error.error || 'Failed to send reminders', 'error');
      }
    } catch (error) {
      console.error('Error sending reminders:', error);
      addToast('Error sending reminders', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateSession = async () => {
    router.push(`${fallbackPath}?editSessionId=${sessionId}`);
  };

  if (loading) {
    return <LoadingState icon="⏳" message="Loading session details..." fullPage={true} />;
  }

  if (!session) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>❌</div>
          <div style={{ color: G.text, fontSize: 18 }}>Session not found</div>
        </div>
      </div>
    );
  }

  const startDT = new Date(session.startTime);
  const endDT = new Date(session.endTime);
  const isPast = startDT < new Date();
  const isToday = startDT.toDateString() === new Date().toDateString();

  return (
    <div style={{ minHeight: '100vh', background: G.dark, color: G.text }}>
      <div style={{
        background: G.card,
        borderBottom: `1px solid ${G.border}`,
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: 'none',
            color: G.lime2,
            fontSize: 24,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          ← Back
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: G.lime2 }}>
            📅 {session.title}
          </h1>
        </div>
        <div style={{ fontSize: 12, color: G.muted }}>
          {isPast ? '✓ Completed' : isToday ? '🔴 Today' : '📌 Upcoming'}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 20 }}>
        <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: G.lime2, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
            📋 Session Details
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: G.muted2, marginBottom: 6, fontWeight: 700 }}>SESSION TYPE</div>
              <div style={{ fontSize: 14, color: G.text, fontWeight: 600 }}>{session.sessionType}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: G.muted2, marginBottom: 6, fontWeight: 700 }}>DATE & TIME</div>
              <div style={{ fontSize: 14, color: G.text, fontWeight: 600 }}>
                {startDT.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <div style={{ fontSize: 12, color: G.muted }}>
                {startDT.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {endDT.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {session.court && (
              <div>
                <div style={{ fontSize: 10, color: G.muted2, marginBottom: 6, fontWeight: 700 }}>📍 LOCATION</div>
                <div style={{ fontSize: 14, color: G.text, fontWeight: 600 }}>
                  {typeof session.court === 'string' ? session.court : session.court.name}
                </div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 10, color: G.muted2, marginBottom: 6, fontWeight: 700 }}>CAPACITY</div>
              <div style={{ fontSize: 14, color: G.text, fontWeight: 600 }}>
                {session.bookings?.length || 0} / {session.maxParticipants} players
              </div>
              <div style={{
                width: '100%',
                height: 8,
                background: G.dark,
                borderRadius: 4,
                overflow: 'hidden',
                marginTop: 8,
              }}>
                <div style={{
                  height: '100%',
                  width: `${((session.bookings?.length || 0) / session.maxParticipants) * 100}%`,
                  background: (session.bookings?.length || 0) >= session.maxParticipants ? G.red : G.lime,
                }} />
              </div>
            </div>
            {session.price && (
              <div>
                <div style={{ fontSize: 10, color: G.muted2, marginBottom: 6, fontWeight: 700 }}>PRICE</div>
                <div style={{ fontSize: 14, color: G.lime2, fontWeight: 700 }}>${session.price.toFixed(2)}</div>
              </div>
            )}
            {session.description && (
              <div>
                <div style={{ fontSize: 10, color: G.muted2, marginBottom: 6, fontWeight: 700 }}>DESCRIPTION</div>
                <div style={{ fontSize: 12, color: G.text2, lineHeight: 1.5 }}>{session.description}</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: G.lime2, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
            👥 Players Enrolled
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {session.players && session.players.length > 0 ? (
              session.players.map((player) => (
                <div key={player.id} style={{
                  background: G.card2,
                  border: `1px solid ${G.border}`,
                  borderRadius: 8,
                  padding: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: G.text }}>{player.name}</div>
                    <div style={{ fontSize: 10, color: G.muted }}>{player.email}</div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: G.muted, textAlign: 'center', padding: '20px', fontSize: 12 }}>
                No players enrolled yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
