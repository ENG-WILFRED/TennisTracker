'use client';

import React, { useState, useEffect, useMemo, memo } from 'react';
import { Card, Button, colors } from '@vico/design-system';

const G = {
  dark: '#0b180f',
  sidebar: '#152915',
  card: '#19331e',
  cardBorder: '#2f5e33',
  mid: '#234b28',
  bright: '#2f6e34',
  lime: '#7dc142',
  accent: '#7dc142',
  text: '#e0f0d8',
  muted: '#91b174',
  yellow: '#d1b943',
  red: '#d84c4c',
  blue: '#4ab0d0',
};

// Style constants to avoid recreating on each render
const createContainerStyle = (isEmbedded: boolean, hasPaddingTop?: boolean) => ({
  width: '100%',
  background: isEmbedded ? G.dark : undefined,
  paddingTop: hasPaddingTop ? 40 : (isEmbedded ? 20 : 0),
  paddingRight: isEmbedded ? 20 : 0,
  paddingBottom: isEmbedded ? 20 : 0,
  paddingLeft: isEmbedded ? 20 : 0,
  borderRadius: isEmbedded ? 8 : 0,
  textAlign: 'center' as const,
});

const ProgressBar = memo<{ value: number; color?: string; height?: number }>(({ value, color = G.lime, height = 4 }) => (
  <div style={{ height, background: G.dark, borderRadius: 2, overflow: 'hidden', marginTop: 3 }}>
    <div style={{ height: '100%', width: `${Math.min(value, 100)}%`, background: color, borderRadius: 2 }} />
  </div>
));
ProgressBar.displayName = 'ProgressBar';

const StatCard = memo<{ title: string; value: string | number; subtitle?: string; color?: string }>(({ title, value, subtitle, color = G.lime }) => (
  <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: '16px 14px', textAlign: 'center' }}>
    <div style={{ fontSize: 10, color: G.muted, textTransform: 'uppercase', marginBottom: 4 }}>{title}</div>
    <div style={{ fontSize: 24, fontWeight: 900, color, marginBottom: subtitle ? 4 : 0 }}>{value}</div>
    {subtitle && <div style={{ fontSize: 9, color: G.muted }}>{subtitle}</div>}
  </div>
));
StatCard.displayName = 'StatCard';

interface Analytics {
  playerId: string;
  playerName: string;
  profilePhoto?: string;
  stats: {
    totalMatches: number;
    matchesWon: number;
    matchesLost: number;
    winRate: number;
    currentRank: number;
    streak: number;
    coachRatingsCount?: number;
    averageCoachRating?: number;
  };
  monthly: Array<{ month: string; matches: number; wins: number; losses: number }>;
  performance: {
    serviceAccuracy: number;
    firstServeWinRate: number;
    breakPointConversion: number;
    aces: number;
    doubleFaults: number;
  };
  recentMatches: Array<{ date: string; opponent: string; result: 'WIN' | 'LOSS'; score: string }>;
  goals: Array<{ name: string; progress: number; target: string }>;
  coachRatings?: Array<{
    id: string;
    coachName: string;
    overallRating: number;
    techniquRating?: number;
    mentalRating?: number;
    fitnessRating?: number;
    teamworkRating?: number;
    strengths?: string;
    areasForImprovement?: string;
    notes?: string;
    createdAt: string;
  }>;
}

interface ProgressViewProps {
  isEmbedded?: boolean;
  playerId?: string;
}

export function ProgressView({ isEmbedded = false, playerId }: ProgressViewProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'all' | '3months' | '6months' | 'year'>('all');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reminderState, setReminderState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [reminderMessage, setReminderMessage] = useState<string>('');
  const cacheRef = React.useRef<Record<string, Analytics>>({});

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const fetchAnalytics = async () => {
      if (!playerId) return;
      
      const cacheKey = `${playerId}-${timeframe}`;
      if (cacheRef.current[cacheKey]) {
        if (isMounted) {
          setAnalytics(cacheRef.current[cacheKey]);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch(`/api/players/${playerId}/analytics?timeframe=${timeframe}`, {
          signal: controller.signal,
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          cacheRef.current[cacheKey] = data.analytics;
          setAnalytics(data.analytics);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error fetching analytics:', error);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    setLoading(true);
    fetchAnalytics();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [playerId, timeframe]);

  // Precompute timeframe selector buttons as a hook so hooks order stays stable
  const timeframeButtons = useMemo(() => (['all', '3months', '6months', 'year'] as const).map((tf) => {
    const labels: Record<typeof tf, string> = {
      'all': 'All Time',
      '3months': 'Last 3 Months',
      '6months': 'Last 6 Months',
      'year': 'Last Year',
    };
    return (
      <button
        key={tf}
        onClick={() => setTimeframe(tf)}
        style={{
          padding: '8px 12px',
          background: timeframe === tf ? G.lime : G.bright,
          color: timeframe === tf ? '#0f1f0f' : G.text,
          border: 'none',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {labels[tf]}
      </button>
    );
  }), [timeframe]);

  const generateReport = async () => {
    if (!playerId || !analytics) return;
    setGeneratingReport(true);
    try {
      const res = await fetch(`/api/players/${playerId}/analytics/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeframe, analytics }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${playerId}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGeneratingReport(false);
    }
  };

  const timeframeOptions = useMemo(() => {
    const tfs = (['all', '3months', '6months', 'year'] as const);
    const labels: Record<typeof tfs[number], string> = {
      all: 'All Time',
      '3months': 'Last 3 Months',
      '6months': 'Last 6 Months',
      year: 'Last Year',
    } as any;
    return tfs.map((tf) => ({ key: tf, label: labels[tf] }));
  }, []);

  if (loading) {
    return (
      <div style={createContainerStyle(isEmbedded, true)}>
        <div style={{ fontSize: 16, color: G.muted }}>Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div style={createContainerStyle(isEmbedded, true)}>
        <div style={{ fontSize: 16, color: G.muted }}>No analytics data available</div>
      </div>
    );
  }

  const { stats, monthly, performance, recentMatches, goals } = analytics;
  const recentFormResults = recentMatches.slice(0, 5).map(m => m.result);

  const remindCoach = async () => {
    if (!playerId) return;
    setReminderState('sending');
    setReminderMessage('');

    try {
      const res = await fetch(`/api/players/${playerId}/remind-coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: analytics.playerName }),
      });

      const data = await res.json();
      if (res.ok) {
        setReminderState('sent');
        setReminderMessage(data.message || 'Coach reminder sent');
      } else {
        setReminderState('error');
        setReminderMessage(data.error || 'Unable to send reminder');
      }
    } catch (error) {
      console.error('Error sending coach reminder:', error);
      setReminderState('error');
      setReminderMessage('Unable to send reminder');
    }
  };

  return (
    <div style={{ width: '100%', background: isEmbedded ? G.dark : undefined, padding: isEmbedded ? 20 : 0, borderRadius: isEmbedded ? 8 : 0 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: G.text, margin: 0 }}>
            📈 My Progress
          </h2>
          <button
            onClick={generateReport}
            disabled={generatingReport}
            style={{
              background: G.lime,
              color: G.dark,
              border: 'none',
              borderRadius: 6,
              padding: '8px 16px',
              fontSize: 12,
              fontWeight: 700,
              cursor: generatingReport ? 'not-allowed' : 'pointer',
              opacity: generatingReport ? 0.6 : 1,
            }}
          >
            {generatingReport ? 'Generating...' : '📥 Download PDF'}
          </button>
        </div>
        <p style={{ fontSize: 13, color: G.muted }}>
          Track your performance and progress
        </p>
      </div>

      {/* Timeframe Selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {timeframeOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setTimeframe(opt.key as any)}
            style={{
              padding: '8px 12px',
              background: timeframe === opt.key ? G.lime : G.mid,
              color: timeframe === opt.key ? G.dark : G.text,
              border: 'none',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Main Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard title="Matches" value={stats.totalMatches} />
        <StatCard title="Win Rate" value={`${stats.winRate.toFixed(1)}%`} color={G.lime} />
        <StatCard title={`Rank (${stats.coachRatingsCount || 0} ratings)`} value={`#${stats.currentRank}`} color={G.lime} subtitle={stats.averageCoachRating ? `Avg: ${stats.averageCoachRating}⭐` : undefined} />
        <StatCard title="Streak" value={stats.streak} color={G.lime} />
      </div>

      {/* Performance Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {/* Win/Loss Breakdown */}
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: '16px 14px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 12 }}>
            🎯 Performance
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: G.bright, borderRadius: 6, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: G.dark }}>{stats.matchesWon}</div>
              <div style={{ fontSize: 10, color: G.muted }}>Wins</div>
            </div>
            <div style={{ background: G.bright, borderRadius: 6, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: G.red }}>{stats.matchesLost}</div>
              <div style={{ fontSize: 10, color: G.muted }}>Losses</div>
            </div>
          </div>
        </div>

        {/* Recent Form */}
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: '16px 14px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 12 }}>
            📊 Recent Form
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {recentFormResults.map((result, i) => (
              <div
                key={i}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 4,
                  background: result === 'WIN' ? G.lime : G.red,
                  color: G.dark,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {result === 'WIN' ? 'W' : 'L'}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: '16px 14px', marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 12 }}>
          💪 Performance Metrics
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: G.muted, marginBottom: 6 }}>Service Accuracy</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: G.lime, marginBottom: 4 }}>{performance.serviceAccuracy.toFixed(0)}%</div>
            <ProgressBar value={performance.serviceAccuracy} color={G.lime} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: G.muted, marginBottom: 6 }}>1st Serve Win Rate</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: G.lime, marginBottom: 4 }}>{performance.firstServeWinRate.toFixed(0)}%</div>
            <ProgressBar value={performance.firstServeWinRate} color={G.lime} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: G.muted, marginBottom: 6 }}>Break Point Conversion</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: G.lime, marginBottom: 4 }}>{performance.breakPointConversion.toFixed(0)}%</div>
            <ProgressBar value={performance.breakPointConversion} color={G.lime} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: G.muted, marginBottom: 6 }}>Aces</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: G.lime }}>{performance.aces}</div>
          </div>
        </div>
      </div>

      {/* Monthly Progress */}
      {monthly.length > 0 && (
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: '16px 14px', marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 12 }}>
            📅 Monthly Performance
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {monthly.map((month, i) => {
              const monthWinRate = month.matches > 0 ? (month.wins / month.matches) * 100 : 0;
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: G.bright, borderRadius: 6, padding: '8px 12px' }}>
                  <div style={{ fontSize: 12, color: G.dark, fontWeight: 600 }}>{month.month}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 10, color: G.dark }}>{month.matches} matches</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: G.dark }}>
                      {monthWinRate.toFixed(0)}%
                    </div>
                    <ProgressBar value={monthWinRate} height={4} color={G.lime} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Goals Section */}
      {goals.length > 0 && (
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: '16px 14px', marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 12 }}>
            🎯 Goals
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {goals.map((goal, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: G.text, fontWeight: 600 }}>{goal.name}</span>
                  <span style={{ fontSize: 11, color: G.muted }}>{typeof goal.progress === 'number' ? goal.progress.toFixed(0) : goal.progress} / {goal.target}</span>
                </div>
                <ProgressBar 
                  value={typeof goal.progress === 'number' ? goal.progress : 0} 
                  color={G.lime}
                  height={6}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Matches */}
      {recentMatches.length > 0 && (
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: '16px 14px', marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 12 }}>
            🎾 Recent Matches
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {recentMatches.slice(0, 5).map((match, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: G.bright, borderRadius: 6, padding: '8px 12px' }}>
                <div>
                  <div style={{ fontSize: 12, color: G.dark, fontWeight: 600 }}>{match.opponent}</div>
                  <div style={{ fontSize: 10, color: G.muted }}>{match.date}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11, color: G.muted }}>{match.score}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: 4,
                      background: match.result === 'WIN' ? G.lime : G.red,
                      color: G.dark,
                    }}
                  >
                    {match.result}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coach Ratings Section - Real data from coaches */}
      {analytics?.coachRatings && analytics.coachRatings.length > 0 ? (
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: '16px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: G.text }}>
              👨‍🏫 Coach Ratings ({analytics.coachRatings.length})
            </div>
            <button
              onClick={remindCoach}
              disabled={reminderState === 'sending'}
              style={{
                background: reminderState === 'sent' ? G.lime : G.mid,
                color: G.dark,
                border: 'none',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: 11,
                fontWeight: 700,
                cursor: reminderState === 'sending' ? 'not-allowed' : 'pointer',
              }}
            >
              {reminderState === 'sending' ? 'Sending...' : 'Remind Coach'}
            </button>
          </div>
          {reminderMessage ? (
            <div style={{ marginBottom: 12, fontSize: 11, color: reminderState === 'error' ? G.red : G.lime }}>
              {reminderMessage}
            </div>
          ) : null}
          <div style={{ display: 'grid', gap: 12 }}>
            {analytics.coachRatings.map((rating, i) => (
              <div key={rating.id} style={{ background: G.bright, borderRadius: 6, padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: G.dark }}>{rating.coachName}</div>
                    <div style={{ fontSize: 9, color: G.muted }}>{new Date(rating.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: G.lime }}>{rating.overallRating.toFixed(1)} ⭐</div>
                </div>

                {/* Rating Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
                  {[
                    { label: 'Technique', value: rating.techniquRating },
                    { label: 'Mental', value: rating.mentalRating },
                    { label: 'Fitness', value: rating.fitnessRating },
                    { label: 'Teamwork', value: rating.teamworkRating },
                  ].map((metric, idx) => (
                    metric.value && (
                      <div key={idx} style={{ background: G.bright, borderRadius: 4, padding: '6px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 8, color: G.muted, marginBottom: 2 }}>{metric.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: G.lime }}>{metric.value}</div>
                      </div>
                    )
                  ))}
                </div>

                {/* Feedback */}
                {rating.strengths && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: G.lime, marginBottom: 3 }}>Strengths:</div>
                    <div style={{ fontSize: 10, color: G.text, lineHeight: 1.4 }}>{rating.strengths}</div>
                  </div>
                )}
                {rating.areasForImprovement && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: G.lime, marginBottom: 3 }}>Areas for Improvement:</div>
                    <div style={{ fontSize: 10, color: G.text, lineHeight: 1.4 }}>{rating.areasForImprovement}</div>
                  </div>
                )}
                {rating.notes && (
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: G.lime, marginBottom: 3 }}>Notes:</div>
                    <div style={{ fontSize: 10, color: G.muted, lineHeight: 1.4, fontStyle: 'italic' }}>{rating.notes}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: '16px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: G.text }}>
              👨‍🏫 Coach Ratings
            </div>
            <button
              onClick={remindCoach}
              disabled={reminderState === 'sending'}
              style={{
                background: reminderState === 'sent' ? G.lime : G.mid,
                color: G.dark,
                border: 'none',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: 11,
                fontWeight: 700,
                cursor: reminderState === 'sending' ? 'not-allowed' : 'pointer',
              }}
            >
              {reminderState === 'sending' ? 'Sending...' : 'Remind Coach'}
            </button>
          </div>
          {reminderMessage ? (
            <div style={{ marginBottom: 12, fontSize: 11, color: reminderState === 'error' ? G.red : G.lime }}>
              {reminderMessage}
            </div>
          ) : null}
          <div style={{ color: G.muted, fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
            📋 No coach ratings yet. Your coaches will rate you as they work with you to help track your progress!
          </div>
        </div>
      )}
    </div>
  );
}