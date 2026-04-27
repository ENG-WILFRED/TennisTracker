'use client';

import React, { useState, useEffect } from 'react';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040', red: '#e05050', blue: '#4ab0d0',
};

const ProgressBar: React.FC<{ value: number; color?: string; height?: number }> = ({ value, color = G.lime, height = 4 }) => (
  <div style={{ height, background: G.dark, borderRadius: 2, overflow: 'hidden', marginTop: 3 }}>
    <div style={{ height: '100%', width: `${Math.min(value, 100)}%`, background: color, borderRadius: 2 }} />
  </div>
);

const StatCard: React.FC<{ title: string; value: string | number; subtitle?: string; color?: string }> = ({ title, value, subtitle, color = G.accent }) => (
  <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: '16px 14px', textAlign: 'center' }}>
    <div style={{ fontSize: 10, color: G.muted, textTransform: 'uppercase', marginBottom: 4 }}>{title}</div>
    <div style={{ fontSize: 24, fontWeight: 900, color, marginBottom: subtitle ? 4 : 0 }}>{value}</div>
    {subtitle && <div style={{ fontSize: 9, color: G.muted }}>{subtitle}</div>}
  </div>
);

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
  };
  monthly: Array<{
    month: string;
    matches: number;
    wins: number;
    losses: number;
  }>;
  performance: {
    serviceAccuracy: number;
    firstServeWinRate: number;
    breakPointConversion: number;
    aces: number;
    doubleFaults: number;
  };
  recentMatches: Array<{
    date: string;
    opponent: string;
    result: 'WIN' | 'LOSS';
    score: string;
  }>;
  goals: Array<{
    name: string;
    progress: number;
    target: string;
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

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!playerId) return;
      try {
        const res = await fetch(`/api/players/${playerId}/analytics?timeframe=${timeframe}`);
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data.analytics);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [playerId, timeframe]);

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

  if (loading) {
    return (
      <div style={{ width: '100%', background: isEmbedded ? 'linear-gradient(to bottom right, #0f2710, #0f1f0f, #0d1f0d)' : undefined, padding: isEmbedded ? 20 : 0, borderRadius: isEmbedded ? 8 : 0, textAlign: 'center', paddingTop: 40 }}>
        <div style={{ fontSize: 16, color: G.muted }}>Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div style={{ width: '100%', background: isEmbedded ? 'linear-gradient(to bottom right, #0f2710, #0f1f0f, #0d1f0d)' : undefined, padding: isEmbedded ? 20 : 0, borderRadius: isEmbedded ? 8 : 0, textAlign: 'center', paddingTop: 40 }}>
        <div style={{ fontSize: 16, color: G.muted }}>No analytics data available</div>
      </div>
    );
  }

  const { stats, monthly, performance, recentMatches, goals } = analytics;
  const recentFormResults = recentMatches.slice(0, 5).map(m => m.result);

  return (
    <div style={{ width: '100%', background: isEmbedded ? 'linear-gradient(to bottom right, #0f2710, #0f1f0f, #0d1f0d)' : undefined, padding: isEmbedded ? 20 : 0, borderRadius: isEmbedded ? 8 : 0 }}>
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
              color: '#0f1f0f',
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
        {(['all', '3months', '6months', 'year'] as const).map((tf) => {
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
                background: timeframe === tf ? G.lime : G.mid,
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
        })}
      </div>

      {/* Main Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard title="Matches" value={stats.totalMatches} />
        <StatCard title="Win Rate" value={`${stats.winRate.toFixed(1)}%`} color={G.lime} />
        <StatCard title="Rank" value={`#${stats.currentRank}`} color={G.blue} />
        <StatCard title="Streak" value={stats.streak} color={G.yellow} />
      </div>

      {/* Performance Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {/* Win/Loss Breakdown */}
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: '16px 14px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 12 }}>
            🎯 Performance
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: G.mid, borderRadius: 6, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: G.lime }}>{stats.matchesWon}</div>
              <div style={{ fontSize: 10, color: G.muted }}>Wins</div>
            </div>
            <div style={{ background: G.mid, borderRadius: 6, padding: '10px 12px', textAlign: 'center' }}>
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
                  color: '#0f1f0f',
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
            <div style={{ fontSize: 16, fontWeight: 700, color: G.accent, marginBottom: 4 }}>{performance.serviceAccuracy.toFixed(0)}%</div>
            <ProgressBar value={performance.serviceAccuracy} color={G.accent} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: G.muted, marginBottom: 6 }}>1st Serve Win Rate</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: G.blue, marginBottom: 4 }}>{performance.firstServeWinRate.toFixed(0)}%</div>
            <ProgressBar value={performance.firstServeWinRate} color={G.blue} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: G.muted, marginBottom: 6 }}>Break Point Conversion</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: G.yellow, marginBottom: 4 }}>{performance.breakPointConversion.toFixed(0)}%</div>
            <ProgressBar value={performance.breakPointConversion} color={G.yellow} />
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
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: G.mid, borderRadius: 6, padding: '8px 12px' }}>
                  <div style={{ fontSize: 12, color: G.text, fontWeight: 600 }}>{month.month}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 10, color: G.muted }}>{month.matches} matches</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: monthWinRate >= 50 ? G.lime : G.yellow }}>
                      {monthWinRate.toFixed(0)}%
                    </div>
                    <ProgressBar value={monthWinRate} height={4} color={monthWinRate >= 50 ? G.lime : G.yellow} />
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
                  color={typeof goal.progress === 'number' && goal.progress >= 70 ? G.lime : G.accent}
                  height={6}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Matches */}
      {recentMatches.length > 0 && (
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: '16px 14px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 12 }}>
            🎾 Recent Matches
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {recentMatches.slice(0, 5).map((match, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: G.mid, borderRadius: 6, padding: '8px 12px' }}>
                <div>
                  <div style={{ fontSize: 12, color: G.text, fontWeight: 600 }}>{match.opponent}</div>
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
                      color: '#0f1f0f',
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
    </div>
  );
}