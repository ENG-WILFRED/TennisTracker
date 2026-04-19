'use client';

import React, { useState, useEffect } from 'react';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
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

interface ProgressData {
  player: {
    id: string;
    name: string;
    level: string;
    joinedAt: string;
  };
  stats: {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
    coachSessions: number;
    attendanceRate: number;
    badgesEarned: number;
  };
  progress: {
    monthly: Array<{
      month: string;
      matches: number;
      wins: number;
      losses: number;
      winRate: number;
    }>;
    recentWinRate: number;
    overallWinRate: number;
    improvement: number;
  };
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: string;
  }>;
  attendance: Array<{
    date: string;
    present: boolean;
  }>;
  coaches: Array<{
    id: string;
    name: string;
    status: string;
    joinedAt: string;
  }>;
}

interface ProgressViewProps {
  isEmbedded?: boolean;
  playerId?: string;
}

export function ProgressView({ isEmbedded = false, playerId }: ProgressViewProps) {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'season' | 'month' | 'week'>('season');
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!playerId) return;
      try {
        const res = await fetch(`/api/player/progress?playerId=${playerId}`);
        if (res.ok) {
          const data = await res.json();
          setProgressData(data);
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [playerId]);

  const generateReport = async () => {
    if (!playerId) return;
    setGeneratingReport(true);
    try {
      const res = await fetch('/api/player/progress/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, timeframe }),
      });

      if (res.ok) {
        const { html, filename } = await res.json();

        // Create a blob and download
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('Progress report downloaded successfully!');
      } else {
        alert('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report');
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div style={{ width: '100%', background: isEmbedded ? 'linear-gradient(to bottom right, #0f2710, #0f1f0f, #0d1f0d)' : undefined, padding: isEmbedded ? 20 : 0, borderRadius: isEmbedded ? 8 : 0, textAlign: 'center', paddingTop: 40 }}>
        <div style={{ fontSize: 16, color: G.muted }}>Loading your progress...</div>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div style={{ width: '100%', background: isEmbedded ? 'linear-gradient(to bottom right, #0f2710, #0f1f0f, #0d1f0d)' : undefined, padding: isEmbedded ? 20 : 0, borderRadius: isEmbedded ? 8 : 0, textAlign: 'center', paddingTop: 40 }}>
        <div style={{ fontSize: 16, color: G.muted }}>No progress data available</div>
      </div>
    );
  }

  const { player, stats, progress, badges, attendance } = progressData;

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
            {generatingReport ? 'Generating...' : '📄 Download Report'}
          </button>
        </div>
        <p style={{ fontSize: 13, color: G.muted }}>
          Track your tennis journey and achievements
        </p>
      </div>

      {/* Timeframe Selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['season', 'month', 'week'] as const).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            style={{
              padding: '8px 16px',
              background: timeframe === tf ? G.lime : G.mid,
              color: timeframe === tf ? '#0f1f0f' : G.text,
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            This {tf.charAt(0).toUpperCase() + tf.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard title="Total Matches" value={stats.totalMatches} />
        <StatCard title="Win Rate" value={`${stats.winRate}%`} />
        <StatCard title="Coach Sessions" value={stats.coachSessions} />
        <StatCard title="Badges Earned" value={stats.badgesEarned} />
      </div>

      {/* Performance Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {/* Win/Loss Breakdown */}
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: '16px 14px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 12 }}>
            🎯 Performance Breakdown
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: G.mid, borderRadius: 6, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: G.lime }}>{stats.wins}</div>
              <div style={{ fontSize: 10, color: G.muted }}>Wins</div>
            </div>
            <div style={{ background: G.mid, borderRadius: 6, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: G.yellow }}>{stats.losses}</div>
              <div style={{ fontSize: 10, color: G.muted }}>Losses</div>
            </div>
          </div>
        </div>

        {/* Improvement Trend */}
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: '16px 14px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 12 }}>
            📈 Improvement Trend
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: progress.improvement >= 0 ? G.lime : G.yellow, marginBottom: 4 }}>
              {progress.improvement > 0 ? '+' : ''}{progress.improvement}%
            </div>
            <div style={{ fontSize: 10, color: G.muted }}>vs overall average</div>
            <ProgressBar value={Math.max(0, progress.recentWinRate)} height={6} />
          </div>
        </div>
      </div>

      {/* Monthly Progress */}
      {progress.monthly.length > 0 && (
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: '16px 14px', marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 12 }}>
            📅 Monthly Performance
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {progress.monthly.slice(-6).map((month, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: G.mid, borderRadius: 6, padding: '8px 12px' }}>
                <div style={{ fontSize: 12, color: G.text, fontWeight: 600 }}>{month.month}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 10, color: G.muted }}>{month.matches} matches</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: month.winRate >= 50 ? G.lime : G.yellow }}>
                    {month.winRate}%
                  </div>
                  <ProgressBar value={month.winRate} height={4} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges Section */}
      {badges.length > 0 && (
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: '16px 14px', marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 12 }}>
            🏆 Achievements ({badges.length})
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {badges.map((badge, i) => (
              <div key={i} style={{ background: G.mid, border: `1px solid ${G.lime}`, borderRadius: 20, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14 }}>{badge.icon}</span>
                <span style={{ fontSize: 11, color: G.text, fontWeight: 600 }}>{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance Summary */}
      <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: '16px 14px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 12 }}>
          📊 Attendance & Consistency
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: G.accent, marginBottom: 4 }}>{stats.attendanceRate}%</div>
            <div style={{ fontSize: 10, color: G.muted }}>Attendance Rate</div>
            <ProgressBar value={stats.attendanceRate} height={6} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: G.lime, marginBottom: 4 }}>{player.level}</div>
            <div style={{ fontSize: 10, color: G.muted }}>Current Level</div>
          </div>
        </div>
      </div>
    </div>
  );
}