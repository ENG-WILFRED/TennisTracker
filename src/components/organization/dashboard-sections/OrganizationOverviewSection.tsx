'use client';

import React from 'react';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

const LineChart: React.FC<{ data: number[]; color?: string; height?: number }> = ({ data, color = G.lime, height = 50 }) => {
  const max = Math.max(...data); const min = Math.min(...data); const range = max - min || 1;
  const w = 200; const h = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 6)}`).join(' ');
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`${color}22`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

interface OverviewSectionProps {
  kpiData: any[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: string[];
  revenueTrend: number[];
  scheduleItems: any[];
  staffRoles: any[];
  announcements: any[];
  pendingTasks: any[];
}

export default function OrganizationOverviewSection({
  kpiData, activeTab, setActiveTab, tabs, revenueTrend,
  scheduleItems, staffRoles, announcements, pendingTasks
}: OverviewSectionProps) {
  const priorityColor = (p: string) => p === 'High' ? '#ff6b6b' : p === 'Medium' ? G.yellow : G.muted;
  const priorityBg = (p: string) => p === 'High' ? '#ff6b6b33' : p === 'Medium' ? G.yellow + '33' : G.muted + '33';

  return (
    <>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, background: G.card, borderRadius: 8, padding: 4, border: `1px solid ${G.cardBorder}` }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            flex: 1, padding: '7px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
            background: activeTab === t ? G.lime : 'transparent',
            color: activeTab === t ? '#0f1f0f' : G.muted,
          }}>{t}</button>
        ))}
      </div>

      {/* KPI Bars - Responsive: 2 rows of 2 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
        {kpiData.map((kpi: any, i: number) => (
          <div key={i} className="bg-[#1a3020] border" style={{ borderColor: G.cardBorder, borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: kpi.color, marginBottom: 6 }}>{kpi.value}</div>
            <div style={{ height: 6, background: G.dark, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(kpi.value / kpi.max) * 100}%`, background: kpi.color, borderRadius: 3 }} />
            </div>
            <div style={{ fontSize: 9, color: G.muted, marginTop: 4 }}>{kpi.max} total</div>
          </div>
        ))}
      </div>

      {/* Revenue + Schedule + Staff - Each in its own row on mobile, 3 columns on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Revenue Trend */}
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14, gridColumn: 'span 1' }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 2 }}>💰 Revenue Trend</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: G.accent, marginBottom: 2 }}>$3,750</div>
          <div style={{ fontSize: 9, color: G.muted, marginBottom: 10 }}>Mar 20 · 12 months</div>
          <LineChart data={revenueTrend} color={G.accent} height={45} />
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 9 }}>
            <span style={{ color: G.muted }}>Lowest: $2,100</span>
            <span style={{ color: G.lime, fontWeight: 700 }}>↑ +78% YoY</span>
          </div>
        </div>

        {/* Schedule */}
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>📅 This Week</div>
          {scheduleItems.map((s: any, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: i < scheduleItems.length - 1 ? `1px solid ${G.cardBorder}33` : 'none', alignItems: 'center' }}>
              <div style={{ background: G.dark, borderRadius: 5, padding: '4px 8px', minWidth: 40, textAlign: 'center', fontSize: 10, fontWeight: 700 }}>
                {s.day}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{s.event}</div>
                <div style={{ fontSize: 9, color: G.muted }}>{s.time}</div>
              </div>
              <span style={{ fontSize: 8, padding: '2px 5px', background: s.status === 'Active' ? G.lime + '33' : G.bright + '33', color: s.status === 'Active' ? G.lime : G.bright, borderRadius: 3, fontWeight: 700 }}>
                {s.status === 'Active' ? '◆' : '○'} {s.status.split(' ')[0]}
              </span>
            </div>
          ))}
          <button style={{ width: '100%', marginTop: 8, padding: '6px', background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
            + New Event
          </button>
        </div>

        {/* Staff */}
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>👥 Team Roles</div>
          {staffRoles.map((s: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < staffRoles.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: G.dark, border: `2px solid ${G.mid}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                {s.name.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 9, color: G.muted }}>{s.role}</div>
              </div>
              <span style={{ fontSize: 8, padding: '1px 4px', background: G.bright + '33', color: G.bright, borderRadius: 3, fontWeight: 700 }}>
                {s.sessions}h
              </span>
            </div>
          ))}
          <button style={{ width: '100%', marginTop: 8, padding: '6px', background: G.bright, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
            + Add Staff
          </button>
        </div>
      </div>

      {/* Announcements + Tasks + System - Each in its own row on mobile, 3 columns on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Announcements */}
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>📢 Announcements</div>
          {announcements.map((a: any, i: number) => (
            <div key={i} style={{ background: '#0f1f0f', borderRadius: 8, padding: '8px 10px', marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 3 }}>
                <span style={{ fontWeight: 700, fontSize: 11.5 }}>{a.title}</span>
                <span style={{ fontSize: 8, color: G.muted }}>{a.date}</span>
              </div>
              <div style={{ fontSize: 10, color: G.muted }}>{a.msg}</div>
            </div>
          ))}
        </div>

        {/* Pending Tasks */}
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>✓ Pending Tasks</div>
          {pendingTasks.map((t: any, i: number) => (
            <div key={i} style={{ background: '#0f1f0f', borderRadius: 8, padding: '8px 10px', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: 6 }}>
                <input type="checkbox" style={{ marginTop: 4, cursor: 'pointer', accentColor: G.lime }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 11.5 }}>{t.task}</div>
                  <div style={{ fontSize: 9, color: G.muted, marginTop: 2 }}>
                    {t.owner} · {t.due}
                  </div>
                </div>
                <span style={{ fontSize: 8, padding: '2px 5px', borderRadius: 3, background: priorityBg(t.priority), color: priorityColor(t.priority), fontWeight: 700, flexShrink: 0 }}>
                  {t.priority}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}
