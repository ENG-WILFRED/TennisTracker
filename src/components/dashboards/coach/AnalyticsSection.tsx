'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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

interface CoachStats {
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  totalPlayers: number;
  activePlayers: number;
  totalRevenue: number;
  avgRating: number;
  reviewCount: number;
  completionRate: number;
  monthlyRevenue: { month: string; revenue: number }[];
  sessionsByType: { type: string; count: number }[];
  topPlayers: { name: string; sessions: number; revenue: number }[];
  recentReviews: { player: string; rating: number; comment: string; date: string }[];
  weeklyStats: { day: string; sessions: number; revenue: number }[];
  retentionRate: number;
  avgSessionDuration: number;
  newPlayersThisMonth: number;
}

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 8.5, color: G.lime2, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 7 }}>
    {children}
  </div>
);

const Tag: React.FC<{ children: React.ReactNode; yellow?: boolean; red?: boolean; blue?: boolean }> = ({ children, yellow, red, blue }) => {
  const color = yellow ? G.yellow : red ? G.red : blue ? G.blue : G.lime;
  const bg = yellow ? 'rgba(239,192,64,.1)' : red ? 'rgba(217,79,79,.1)' : blue ? 'rgba(74,158,255,.1)' : 'rgba(121,191,62,.12)';
  const border = yellow ? 'rgba(239,192,64,.3)' : red ? 'rgba(217,79,79,.3)' : blue ? 'rgba(74,158,255,.3)' : 'rgba(121,191,62,.28)';
  return (
    <span style={{ fontSize: 8.5, fontWeight: 700, borderRadius: 4, padding: '2px 7px', background: bg, border: `1px solid ${border}`, color, display: 'inline-block' }}>
      {children}
    </span>
  );
};

const ProgressBar: React.FC<{ value: number; color?: string; height?: number }> = ({ value, color = G.lime, height = 4 }) => (
  <div style={{ height, background: G.dark, borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
    <div style={{ height: '100%', width: `${Math.min(value, 100)}%`, background: color, borderRadius: 3, transition: 'width 0.7s cubic-bezier(.4,0,.2,1)' }} />
  </div>
);

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div style={{ display: 'flex', gap: 1 }}>
    {[1, 2, 3, 4, 5].map(i => (
      <span key={i} style={{ color: i <= Math.round(rating) ? G.yellow : G.border2, fontSize: 9 }}>★</span>
    ))}
  </div>
);

const MiniBarChart: React.FC<{ data: { label: string; value: number }[]; color?: string }> = ({ data, color = G.lime }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 40 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{
            width: '100%', background: color, borderRadius: '2px 2px 0 0', opacity: 0.85,
            height: `${(d.value / max) * 36}px`, minHeight: 2, transition: 'height 0.5s ease',
          }} />
          <span style={{ fontSize: 7, color: G.muted, whiteSpace: 'nowrap' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsSection({ coachId }: { coachId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeChart = (searchParams.get('analyticsTab') as 'revenue' | 'sessions') || 'revenue';
  
  const setActiveChart = (tab: 'revenue' | 'sessions') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('analyticsTab', tab);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const [stats, setStats] = useState<CoachStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/coaches/stats?coachId=${coachId}`);
        if (res.ok) {
          const data = await res.json();
          const completionRate = data.totalSessions > 0
            ? (data.completedSessions / data.totalSessions) * 100 : 0;
          setStats({ ...data, completionRate });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [coachId]);

  const card = { background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, padding: 14 } as const;
  const card2 = { background: G.card2, border: `1px solid ${G.border}`, borderRadius: 10, padding: 12 } as const;

  if (loading) return (
    <div style={{ ...card, textAlign: 'center', padding: 40, color: G.muted }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
      <div style={{ fontSize: 12 }}>Loading analytics...</div>
    </div>
  );

  if (!stats) return <div style={card}><div style={{ color: G.muted }}>No data available</div></div>;

  const chartData = activeChart === 'revenue'
    ? (stats.monthlyRevenue || []).map(d => ({ label: d.month, value: d.revenue }))
    : (stats.weeklyStats || []).map(d => ({ label: d.day, value: d.sessions }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color: G.text }}>📊 Analytics & Performance</div>
          <div style={{ fontSize: 10, color: G.muted2, marginTop: 2 }}>Your coaching insights at a glance</div>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          <Tag>Last 30 days</Tag>
          <Tag yellow>↑ 12% growth</Tag>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 9 }}>
        {[
          { icon: '🎾', label: 'Total Sessions', value: stats.totalSessions, sub: `${stats.completedSessions} completed`, color: G.lime2 },
          { icon: '💰', label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, sub: `$${(stats.totalRevenue / Math.max(stats.completedSessions, 1)).toFixed(0)} avg/session`, color: G.lime2 },
          { icon: '👥', label: 'Active Players', value: stats.activePlayers, sub: `${stats.newPlayersThisMonth} new this month`, color: G.lime2 },
          { icon: '⭐', label: 'Avg Rating', value: `${stats.avgRating.toFixed(1)}★`, sub: `${stats.reviewCount} reviews`, color: G.yellow },
        ].map((kpi, i) => (
          <div key={i} style={card}>
            <div style={{ fontSize: 18, marginBottom: 5 }}>{kpi.icon}</div>
            <div style={{ fontSize: 8, color: G.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>{kpi.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ fontSize: 9, color: G.muted2, marginTop: 5 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart + Session Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 11 }}>

        {/* Revenue / Sessions Chart */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <SectionLabel>{activeChart === 'revenue' ? 'Monthly Revenue' : 'Weekly Sessions'}</SectionLabel>
            <div style={{ display: 'flex', gap: 4, background: G.dark, borderRadius: 6, padding: 3 }}>
              {(['revenue', 'sessions'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveChart(tab)} style={{
                  padding: '3px 10px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 9, fontWeight: 700,
                  background: activeChart === tab ? G.lime : 'transparent',
                  color: activeChart === tab ? '#0a180a' : G.muted,
                }}>
                  {tab === 'revenue' ? '💰 Revenue' : '📅 Sessions'}
                </button>
              ))}
            </div>
          </div>
          <MiniBarChart data={chartData} color={activeChart === 'revenue' ? G.lime : G.blue} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: `1px solid ${G.border}` }}>
            <div>
              <div style={{ fontSize: 8, color: G.muted }}>PEAK</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: G.lime2 }}>
                {activeChart === 'revenue'
                  ? `$${((stats.monthlyRevenue || []).length ? Math.max(...stats.monthlyRevenue.map(d => d.revenue)).toLocaleString() : '0')}`
                  : `${((stats.weeklyStats || []).length ? Math.max(...stats.weeklyStats.map(d => d.sessions)) : 0)} sessions`}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 8, color: G.muted }}>AVG</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: G.lime2 }}>
                {activeChart === 'revenue'
                  ? `$${Math.round(((stats.monthlyRevenue || []).reduce((a, d) => a + d.revenue, 0) / Math.max((stats.monthlyRevenue || []).length, 1))).toLocaleString()}`
                  : `${(((stats.weeklyStats || []).reduce((a, d) => a + d.sessions, 0) / Math.max((stats.weeklyStats || []).length, 1))).toFixed(1)}/day`}
              </div>
            </div>
          </div>
        </div>

        {/* Session Type Breakdown */}
        <div style={card}>
          <SectionLabel>Sessions by Type</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 4 }}>
            {(stats.sessionsByType || []).length === 0 ? (
              <div style={{ color: G.muted, fontSize: 11, textAlign: 'center', padding: '14px 0' }}>No session type data available.</div>
            ) : (
              (stats.sessionsByType || []).map((s, i) => {
                const colors = [G.lime, G.blue, G.yellow];
                const pct = stats.totalSessions > 0 ? Math.round((s.count / stats.totalSessions) * 100) : 0;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700 }}>{s.type}</span>
                      <span style={{ fontSize: 10, color: colors[i] || G.lime, fontWeight: 700 }}>{s.count} <span style={{ color: G.muted, fontWeight: 400 }}>({pct}%)</span></span>
                    </div>
                    <ProgressBar value={pct} color={colors[i] || G.lime} height={5} />
                  </div>
                );
              })
            )}
          </div>

          <div style={{ borderTop: `1px solid ${G.border}`, marginTop: 14, paddingTop: 12 }}>
            <SectionLabel>Performance Metrics</SectionLabel>
            {[
              { label: 'Completion Rate', value: stats.completionRate ?? 0, suffix: '%', color: G.lime },
              { label: 'Player Retention', value: stats.retentionRate ?? 0, suffix: '%', color: G.blue },
            ].map((m, i) => {
              const value = Number.isFinite(m.value) ? m.value : 0;
              return (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 10.5, color: G.text2 }}>{m.label}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: m.color }}>{value.toFixed(1)}{m.suffix}</span>
                  </div>
                  <ProgressBar value={value} color={m.color} height={4} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Players + Recent Reviews */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>

        {/* Top Players by Revenue */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
            <SectionLabel>Top Players by Revenue</SectionLabel>
            <Tag>This month</Tag>
          </div>
          {(stats.topPlayers || []).length === 0 ? (
            <div style={{ color: G.muted, fontSize: 11, textAlign: 'center', padding: '14px 0' }}>No top players data available.</div>
          ) : (
            (stats.topPlayers || []).map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: i < (stats.topPlayers || []).length - 1 ? `1px solid ${G.border}` : 'none' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: i === 0 ? G.lime : G.mid, border: `1px solid ${G.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: i === 0 ? '#0a180a' : G.lime, flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: 9, color: G.muted }}>{p.sessions || 0} sessions</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: G.lime2 }}>${(p.revenue || 0).toLocaleString()}</div>
                  <div style={{ fontSize: 8.5, color: G.muted }}>${((p.revenue || 0) / Math.max(p.sessions || 1, 1)).toFixed(0)}/session</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent Reviews */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
            <SectionLabel>Recent Reviews</SectionLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: G.yellow }}>{stats.avgRating.toFixed(1)}</span>
              <StarRating rating={stats.avgRating} />
            </div>
          </div>
          {(stats.recentReviews || []).length === 0 ? (
            <div style={{ color: G.muted, fontSize: 11, textAlign: 'center', padding: '14px 0' }}>No recent reviews available.</div>
          ) : (
            (stats.recentReviews || []).map((r, i) => (
              <div key={i} style={{ padding: '9px 0', borderBottom: i < (stats.recentReviews || []).length - 1 ? `1px solid ${G.border}` : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: G.mid, border: `1px solid ${G.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: G.lime }}>
                      {r.player?.[0] || 'P'}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{r.player || 'Unknown'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <StarRating rating={Number.isFinite(r.rating) ? r.rating : 0} />
                    <span style={{ fontSize: 8.5, color: G.muted }}>{r.date || 'N/A'}</span>
                  </div>
                </div>
                <p style={{ fontSize: 10.5, color: G.text2, lineHeight: 1.55, margin: 0 }}>
                  "{r.comment || 'No comment yet'}"
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Insights Panel */}
      <div style={{ ...card, background: 'rgba(121,191,62,0.06)', border: `1px solid rgba(121,191,62,0.2)` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: G.lime }}>💡 AI-Powered Coaching Insights</div>
          <Tag>Personalized</Tag>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 9 }}>
          {[
            { icon: '📈', title: 'Revenue Opportunity', body: 'Adding 2 group sessions/week could boost monthly revenue by ~$480 with your current player base.' },
            { icon: '🎯', title: 'Retention Alert', body: `${stats.totalPlayers - stats.activePlayers} players haven't booked in 30+ days. A follow-up message could recover them.` },
            { icon: '⏰', title: 'Peak Demand', body: 'Saturday bookings fill 3× faster. Consider adding a morning slot to capture that demand.' },
          ].map((ins, i) => (
            <div key={i} style={{ background: G.card2, border: `1px solid ${G.border}`, borderRadius: 9, padding: 11 }}>
              <div style={{ fontSize: 16, marginBottom: 5 }}>{ins.icon}</div>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: G.lime2, marginBottom: 4 }}>{ins.title}</div>
              <p style={{ fontSize: 10, color: G.text2, lineHeight: 1.55, margin: 0 }}>{ins.body}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}