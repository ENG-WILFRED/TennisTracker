'use client';

import React, { useState, useEffect } from 'react';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

const BarChart: React.FC<{ data: number[]; color?: string }> = ({ data, color = G.lime }) => {
  const max = Math.max(...data);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 48 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, background: i === data.length - 1 ? color : G.bright, borderRadius: '2px 2px 0 0', height: `${(v / max) * 100}%`, minHeight: 4 }} />
      ))}
    </div>
  );
};

const LineChart: React.FC<{ data: number[] }> = ({ data }) => {
  const max = Math.max(...data); const min = Math.min(...data);
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 120},${40 - ((v - min) / (max - min)) * 36}`).join(' ');
  return (
    <svg width="100%" height="40" viewBox="0 0 120 40">
      <polygon points={`0,40 ${points} 120,40`} fill={`${G.lime}25`} />
      <polyline points={points} fill="none" stroke={G.lime} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

interface StatsViewProps {
  isEmbedded?: boolean;
  playerData?: any;
}

export function StatsView({ isEmbedded = false, playerData }: StatsViewProps) {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'season'>('season');

  return (
    <div style={{ width: '100%', background: isEmbedded ? 'linear-gradient(to bottom right, #0f2710, #0f1f0f, #0d1f0d)' : undefined, padding: isEmbedded ? 20 : 0, borderRadius: isEmbedded ? 8 : 0 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: G.text, marginBottom: 6 }}>
          📊 Your Stats
        </h2>
        <p style={{ fontSize: 13, color: G.muted }}>
          Track your performance and progress
        </p>
      </div>

      {/* Timeframe Selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['week', 'month', 'season'] as const).map((tf) => (
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
        {[
          { label: 'Matches Played', value: playerData?.matchesPlayed || 23, icon: '🎾' },
          { label: 'Matches Won', value: playerData?.matchesWon || 18, icon: '✅' },
          { label: 'Win Rate', value: `${playerData?.winRate || 78}%`, icon: '📈' },
          { label: 'Current Rank', value: `#${playerData?.rank || 5}`, icon: '🏅' },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              padding: '16px 14px',
              background: G.card,
              border: `1px solid ${G.cardBorder}`,
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
            <div style={{ color: G.muted, fontSize: 10.5, marginBottom: 4 }}>{stat.label}</div>
            <div style={{ color: G.accent, fontSize: 22, fontWeight: 900 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Detailed Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {/* Performance Breakdown */}
        <div
          style={{
            padding: '16px 14px',
            background: G.card,
            border: `1px solid ${G.cardBorder}`,
            borderRadius: 8,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 12 }}>
            📊 Performance Breakdown
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Wins', value: playerData?.matchesWon || 18, color: G.lime },
              { label: 'Losses', value: playerData?.matchesLost || 5, color: G.yellow },
              { label: 'Sets Won', value: playerData?.setsWon || 38, color: G.lime },
              { label: 'Sets Lost', value: playerData?.setsLost || 21, color: G.yellow },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  background: G.mid,
                  borderRadius: 6,
                  padding: '10px 12px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 10, color: G.muted, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Head to Head */}
        <div
          style={{
            padding: '16px 14px',
            background: G.card,
            border: `1px solid ${G.cardBorder}`,
            borderRadius: 8,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 12 }}>
            👥 Head to Head Records
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {[
              { opponent: 'Top 10 Players', record: '3 - 7' },
              { opponent: 'Ranked Players', record: '8 - 4' },
              { opponent: 'Club Members', record: '7 - 1' },
              { opponent: 'Overall', record: `${playerData?.matchesWon || 18} - ${playerData?.matchesLost || 5}` },
            ].map((h2h, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  background: G.mid,
                  borderRadius: 6,
                  fontSize: 12,
                }}
              >
                <span style={{ color: G.text }}>{h2h.opponent}</span>
                <span style={{ color: G.lime, fontWeight: 700 }}>{h2h.record}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {/* Matches Played Chart */}
        <div
          style={{
            padding: '16px 14px',
            background: G.card,
            border: `1px solid ${G.cardBorder}`,
            borderRadius: 8,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: G.text,
              marginBottom: 12,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>📈 Matches Played Trend</span>
            <span style={{ color: G.lime, fontSize: 10 }}>↗ Up 20%</span>
          </div>
          <BarChart data={[12, 18, 14, 22, 16, 25, 20, 18, 24, 21, 19, 23]} />
        </div>

        {/* Win Rate Trend */}
        <div
          style={{
            padding: '16px 14px',
            background: G.card,
            border: `1px solid ${G.cardBorder}`,
            borderRadius: 8,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: G.text,
              marginBottom: 12,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>📉 Win Rate Trend</span>
            <span style={{ color: G.lime, fontSize: 10 }}>↗ Up 15%</span>
          </div>
          <LineChart data={[40, 55, 48, 62, 58, 70, 65, 72, 68, 78, 74, 80]} />
        </div>
      </div>

      {/* Ranking Information */}
      <div
        style={{
          padding: '16px 14px',
          background: G.card,
          border: `1px solid ${G.cardBorder}`,
          borderRadius: 8,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 12 }}>
          🏆 Ranking Information
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { label: 'Current Rank', value: `#${playerData?.rank || 5}` },
            { label: 'Points', value: playerData?.points || 1050 },
            { label: 'Points to Next Rank', value: 120 },
            { label: 'Rank Change', value: '⬆ +2 (This Season)' },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                background: G.mid,
                borderRadius: 6,
                padding: '12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 10, color: G.muted, marginBottom: 4 }}>{item.label}</div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: item.label === 'Rank Change' ? G.lime : G.accent,
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
