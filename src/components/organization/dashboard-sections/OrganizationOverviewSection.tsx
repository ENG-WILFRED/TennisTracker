'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

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
  organizationId?: string;
  kpiData: any[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  revenueTrend: number[];
  revenueSummary?: {
    total: number;
    low: number;
    changeRate: number;
  };
  revenueBreakdown?: Array<{ label: string; value: number; pct?: number }>;
  scheduleItems: any[];
  staffRoles: any[];
  announcements: any[];
  pendingTasks: any[];
  systemStatus: any[];
}

export default function OrganizationOverviewSection({
  organizationId, kpiData, activeTab, setActiveTab,  revenueTrend,
  revenueSummary, revenueBreakdown = [], scheduleItems, staffRoles, announcements, pendingTasks, systemStatus
}: OverviewSectionProps) {
  const router = useRouter();
  const priorityColor = (p: string) => p === 'High' ? '#ff6b6b' : p === 'Medium' ? G.yellow : G.muted;
  const priorityBg = (p: string) => p === 'High' ? '#ff6b6b33' : p === 'Medium' ? G.yellow + '33' : G.muted + '33';
  const totalRevenue = revenueSummary?.total ?? (revenueTrend.length ? revenueTrend[revenueTrend.length - 1] : 0);
  const lowestRevenue = revenueSummary?.low ?? (revenueTrend.length ? Math.min(...revenueTrend) : 0);
  const changeRate = revenueSummary?.changeRate ?? 0;
  const changeLabel = revenueTrend.length > 1 ? `${changeRate >= 0 ? '↑' : '↓'} ${Math.abs(changeRate)}% YoY` : 'No change data';

  const openSection = (section: string) => router.push(`?section=${section}`);
  const openOrganizationPage = () => organizationId ? router.push(`/organization/${organizationId}`) : null;
  const openEvent = (eventId?: string) => eventId ? router.push(`/organization/${organizationId}/events/${eventId}`) : openSection('Events');
  const openStaff = () => openSection('Staff');
  const openTasks = () => openSection('Tasks');
  const hasAnnouncements = announcements.length > 0;

  return (
    <>
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
          <div style={{ fontSize: 20, fontWeight: 900, color: G.accent, marginBottom: 2 }}>${totalRevenue.toLocaleString()}</div>
          <div style={{ fontSize: 9, color: G.muted, marginBottom: 10 }}>{revenueTrend.length ? `Last ${revenueTrend.length} months` : 'No finance data available'}</div>
          <LineChart data={revenueTrend} color={G.accent} height={45} />
          {revenueBreakdown.length > 0 && (
            <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
              {revenueBreakdown.map((item: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, background: '#142b18', borderRadius: 6, padding: '8px 10px' }}>
                  <span style={{ fontSize: 10, color: G.muted }}>{item.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: G.accent }}>${item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 9 }}>
            <span style={{ color: G.muted }}>Lowest: ${lowestRevenue.toLocaleString()}</span>
            <span style={{ color: changeRate >= 0 ? G.lime : '#ff6b6b', fontWeight: 700 }}>{changeLabel}</span>
          </div>
        </div>

        {/* Schedule */}
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>📅 This Week</div>
          {scheduleItems.map((s: any, i: number) => (
            <button
              key={i}
              onClick={() => openEvent(s.eventId)}
              style={{
                display: 'flex',
                gap: 8,
                padding: '6px 0',
                borderBottom: i < scheduleItems.length - 1 ? `1px solid ${G.cardBorder}33` : 'none',
                alignItems: 'center',
                background: 'transparent',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
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
            </button>
          ))}
          <button onClick={() => openSection('Events')} style={{ width: '100%', marginTop: 8, padding: '6px', background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
            + New Event
          </button>
        </div>

        {/* Staff */}
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>👥 Team Roles</div>
          {staffRoles.map((s: any, i: number) => (
            <button
              key={i}
              onClick={() => openStaff()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 0',
                borderBottom: i < staffRoles.length - 1 ? `1px solid ${G.cardBorder}33` : 'none',
                background: 'transparent',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
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
            </button>
          ))}
          <button onClick={() => openStaff()} style={{ width: '100%', marginTop: 8, padding: '6px', background: G.bright, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
            + Add Staff
          </button>
        </div>
      </div>

      {/* Announcements + Tasks + System - Each in its own row on mobile, 3 columns on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Announcements */}
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>📢 Announcements</div>
          {hasAnnouncements ? (
            announcements.map((a: any, i: number) => (
              <button
                key={i}
                onClick={openOrganizationPage}
                style={{
                  background: '#0f1f0f',
                  borderRadius: 8,
                  padding: '8px 10px',
                  marginBottom: 6,
                  border: 'none',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: 11.5 }}>{a.title}</span>
                  <span style={{ fontSize: 8, color: G.muted }}>{a.date}</span>
                </div>
                <div style={{ fontSize: 10, color: G.muted }}>{a.msg}</div>
              </button>
            ))
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 11,fontStyle: 'italic',marginBottom: 2, color: G.muted }}>No announcements</div>
              <button
                onClick={openOrganizationPage}
                style={{ width: '100%', marginTop: 0, padding: '8px 10px', background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
              >
                View past announcements
              </button>
            </div>
          )}
          {hasAnnouncements && (
            <button
              onClick={openOrganizationPage}
              style={{ width: '100%', marginTop: 8, padding: '8px 10px', background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
            >
              View all announcements
            </button>
          )}
        </div>

        {/* Pending Tasks */}
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>✓ Pending Tasks</div>
          {pendingTasks.map((t: any, i: number) => (
            <button
              key={i}
              onClick={openTasks}
              style={{
                background: '#0f1f0f',
                borderRadius: 8,
                padding: '8px 10px',
                marginBottom: 6,
                border: 'none',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
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
            </button>
          ))}
        </div>

        {/* System Status */}
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>⚙️ System Status</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6 }}>
            {systemStatus.map((s: any, i: number) => (
              <div key={i} style={{ background: '#0f1f0f', borderRadius: 8, padding: '10px 8px', textAlign: 'center', border: `1px solid ${G.cardBorder}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: G.muted }}>{s.status}</span>
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 2 }}>{s.name}</div>
                <div style={{ fontSize: 8, color: G.muted }}>Uptime {s.uptime}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
