'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

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
  red: '#e05050',
  blue: '#4ab0d0',
};

interface PlayerAnalyticsQuick {
  playerId: string;
  playerName: string;
  totalMatches: number;
  matchesWon: number;
  matchesLost: number;
  winRate: number;
  recentForm: string; // e.g., "WWLWW"
}

interface MembershipAnalyticsProps {
  playerId: string;
  playerName?: string;
  role?: 'player' | 'coach' | 'parent';
}

export default function MembershipAnalytics({ playerId, playerName, role = 'player' }: MembershipAnalyticsProps) {
  const [analytics, setAnalytics] = useState<PlayerAnalyticsQuick | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuickAnalytics();
  }, [playerId]);

  async function loadQuickAnalytics() {
    try {
      setLoading(true);
      const res = await fetch(`/api/players/${playerId}/analytics`);
      if (!res.ok) throw new Error('Failed to load analytics');

      const data = await res.json();
      const stats = data.analytics.stats;

      setAnalytics({
        playerId,
        playerName: playerName || data.analytics.playerName,
        totalMatches: stats.totalMatches,
        matchesWon: stats.matchesWon,
        matchesLost: stats.matchesLost,
        winRate: stats.winRate,
        recentForm: 'WWLWW', // Could be fetched from API
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Don't show error for quick analytics
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 16 }}>
        <div style={{ color: G.muted, fontSize: 12, textAlign: 'center' }}>⏳ Loading...</div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: G.lime, margin: 0 }}>
          📊 Performance Overview
        </h3>
        <Link
          href={`/players/analytics/${playerId}`}
          style={{
            fontSize: 11,
            color: G.blue,
            textDecoration: 'none',
            fontWeight: 600,
            padding: '4px 8px',
            background: G.dark,
            borderRadius: 4,
          }}
        >
          View Full →
        </Link>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
        <div style={{ background: G.dark, padding: 10, borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: G.muted, marginBottom: 4 }}>Matches</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: G.accent }}>{analytics.totalMatches}</div>
        </div>
        <div style={{ background: G.dark, padding: 10, borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: G.muted, marginBottom: 4 }}>Won</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: G.lime }}>{analytics.matchesWon}</div>
        </div>
        <div style={{ background: G.dark, padding: 10, borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: G.muted, marginBottom: 4 }}>Lost</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: G.red }}>{analytics.matchesLost}</div>
        </div>
        <div style={{ background: G.dark, padding: 10, borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: G.muted, marginBottom: 4 }}>Win %</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: G.blue }}>
            {analytics.winRate.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Recent Form */}
      <div style={{ background: G.dark, padding: 10, borderRadius: 6, marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: G.muted, marginBottom: 6 }}>Recent Form</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {analytics.recentForm.split('').map((result, idx) => (
            <div
              key={idx}
              style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                background: result === 'W' ? G.lime : G.red,
                color: G.dark,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {result}
            </div>
          ))}
        </div>
      </div>

      {/* Role-based Actions */}
      <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
        {role === 'player' && (
          <Link
            href={`/players/analytics/${playerId}?download=true`}
            style={{
              flex: 1,
              background: G.yellow,
              color: G.dark,
              border: 'none',
              borderRadius: 6,
              padding: '8px',
              textAlign: 'center',
              textDecoration: 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📥 Download PDF
          </Link>
        )}
        {role === 'coach' && (
          <Link
            href={`/players/analytics/${playerId}`}
            style={{
              flex: 1,
              background: G.blue,
              color: G.text,
              border: 'none',
              borderRadius: 6,
              padding: '8px',
              textAlign: 'center',
              textDecoration: 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            👁️ Review Progress
          </Link>
        )}
        {role === 'parent' && (
          <Link
            href={`/players/analytics/${playerId}`}
            style={{
              flex: 1,
              background: G.bright,
              color: G.text,
              border: 'none',
              borderRadius: 6,
              padding: '8px',
              textAlign: 'center',
              textDecoration: 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📈 View Progress
          </Link>
        )}
      </div>
    </div>
  );
}
