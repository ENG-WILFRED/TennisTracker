'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { MembershipSwitcher } from '@/components/MembershipSwitcher';

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

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Read active section from URL, default to 'Overview'
  const activeNav = (searchParams.get('section') as string) || 'Overview';
  
  // Handle navigation to a new section
  const handleNavigation = (section: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', section);
    params.delete('tab');
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Read active tab from URL, default to 'Overview'
  const activeTab = (searchParams.get('tab') as string) || 'Overview';
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const navItems = [
    { label: 'Overview', icon: '📊' }, { label: 'Revenue', icon: '💵' },
    { label: 'Expenses', icon: '💸' }, { label: 'Players', icon: '👥' },
    { label: 'Bookings', icon: '📅' }, { label: 'Reports', icon: '📄' },
    { label: 'Training', icon: '📋' },
  ];

  const tabs = ['Overview', 'Financial Overview', 'Progress', 'Expenses', 'Chat 💬'];

  const stats = {
    totalRevenue: 142300, monthlyExpenses: 6256, activeMembers: 320,
    monthlyRevenue: 8420, netProfit: 5210, collectionRate: 94,
  };

  const revenueData = [5200, 6100, 5800, 7200, 6900, 8400, 7800, 8200, 7600, 8900, 8100, 8420];
  const expenseData = [3100, 3400, 3200, 3800, 3600, 4100, 3900, 4200, 3800, 4500, 4100, 6256];

  const revenueBreakdown = [
    { label: 'Membership Fees', value: 5240, pct: 62, color: G.lime },
    { label: 'Court Bookings', value: 1980, pct: 24, color: G.accent },
    { label: 'Events', value: 840, pct: 10, color: G.bright },
    { label: 'Coaching', value: 360, pct: 4, color: G.mid },
  ];

  const membershipTiers = [
    { name: 'Gold', count: 42, fee: 120, revenue: 5040, color: G.yellow, now: '42/60', trend: '+4' },
    { name: 'Silver', count: 65, fee: 80, revenue: 5200, color: '#aaaaaa', now: '65/80', trend: '+7' },
    { name: 'Bronze', count: 35, fee: 45, revenue: 1575, color: '#cd7f32', now: '35/50', trend: '+2' },
  ];

  const recentTransactions = [
    { member: 'Ali Hassan', type: 'Membership – Gold', amount: 120, status: 'Paid', date: 'Mar 19' },
    { member: 'Grace Wanjiru', type: 'Court Booking ×3', amount: 90, status: 'Paid', date: 'Mar 18' },
    { member: 'James Omondi', type: 'Tournament Entry', amount: 50, status: 'Paid', date: 'Mar 18' },
    { member: 'Sarah Kimani', type: 'Membership – Silver', amount: 80, status: 'Pending', date: 'Mar 17' },
    { member: 'Fatuma Atieno', type: 'Coaching Session', amount: 60, status: 'Overdue', date: 'Mar 14' },
  ];

  const teamProgress = [
    { name: 'Open Tennis Cup', pct: 75, detail: 'Entries 32/40', color: G.lime },
    { name: 'Junior Tournament', pct: 55, detail: 'Entries 18/30', color: G.accent },
    { name: 'BBQ Social Night', pct: 90, detail: '54 RSVPs', color: G.bright },
  ];

  const statusColor = (s: string) => s === 'Paid' ? G.lime : s === 'Pending' ? G.yellow : '#e57373';

  return (
    <div className="flex flex-col md:flex-row" style={{ height: '100vh', background: G.dark, color: G.text, overflow: 'hidden' }}>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* LEFT SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 max-w-[80vw] transform border-r transition-transform duration-300 md:relative md:sticky md:top-0 md:translate-x-0 md:flex md:w-56 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ background: G.sidebar, borderRight: `1px solid ${G.cardBorder}`, flexDirection: 'column', flexShrink: 0, height: '100vh', overflow: 'hidden' }}>
        <div style={{ padding: '15px 14px 10px', borderBottom: `1px solid ${G.cardBorder}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🎾</span>
          <div style={{ color: G.lime, fontWeight: 900, fontSize: 14 }}>Vico Sports</div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-[#2d5a35] text-[#7aaa6a] hover:bg-[#1e3a20] transition md:hidden ml-auto"
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>
        <nav style={{ flex: 1, paddingTop: 8, overflowY: 'auto', paddingBottom: 12 }}>
          {navItems.map(item => (
            <button key={item.label} onClick={() => handleNavigation(item.label)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 13px',
              background: activeNav === item.label ? G.mid : 'transparent',
              color: activeNav === item.label ? '#fff' : G.muted,
              border: 'none', cursor: 'pointer', fontSize: 12, textAlign: 'left',
              borderLeft: activeNav === item.label ? `3px solid ${G.lime}` : '3px solid transparent',
            }}><span>{item.icon}</span>{item.label}</button>
          ))}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1, minHeight: 12 }} />

        {/* Profile Card at Bottom */}
        <div style={{ padding: '10px 12px 14px', flexShrink: 0 }}>
          <div style={{ background: G.mid, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
            {user?.photo
              ? <img src={user.photo} alt={user.firstName} style={{ width: 40, height: 40, borderRadius: '50%', border: `2px solid ${G.lime}`, objectFit: 'cover', marginBottom: 6, marginLeft: 'auto', marginRight: 'auto', display: 'block' }} />
              : <div style={{ width: 40, height: 40, borderRadius: '50%', background: G.bright, margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👤</div>}
            <div style={{ fontWeight: 800, fontSize: 11, marginTop: 4 }}>{user?.firstName ?? 'Staff'} {user?.lastName || ''}</div>
            <div style={{ fontSize: 9, color: G.muted, marginTop: 2 }}>Finance Officer</div>
            {user?.email && <div style={{ fontSize: 8, color: G.muted, marginTop: 2, wordBreak: 'break-word' }}>📧 {user.email}</div>}
            <div style={{ marginTop: 8 }}>
              <MembershipSwitcher />
            </div>
            <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
              <button 
                onClick={handleLogout}
                style={{ flex: 1, background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 0', fontSize: 8, fontWeight: 700, cursor: 'pointer' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>

        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-20 bg-[#0f1f0f] border-b border-[#2d5a35] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#7dc142] flex items-center justify-center text-sm">🎾</div>
              <div>
                <div className="text-[11px] font-semibold text-[#e8f5e0]">Vico Sports</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[#2d5a35] text-[#7aaa6a] hover:bg-[#1e3a20] transition"
              aria-label="Open navigation"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-10" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {[
            { label: 'Total Revenue', value: `$${(stats.totalRevenue / 1000).toFixed(1)}k`, icon: '💵' },
            { label: 'Monthly Expenses', value: `$${stats.monthlyExpenses.toLocaleString()}`, icon: '💸' },
            { label: 'Active Members', value: stats.activeMembers, icon: '👥' },
            { label: 'Net Profit', value: `$${stats.netProfit.toLocaleString()}`, icon: '📈' },
          ].map((s, i) => (
            <div key={i} style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: '11px 14px' }}>
              <div style={{ color: G.muted, fontSize: 10 }}>{s.label}</div>
              <div style={{ color: G.accent, fontSize: 22, fontWeight: 900, marginTop: 4 }}>{s.icon} {s.value}</div>
              <div style={{ height: 2, background: G.mid, borderRadius: 1, marginTop: 8 }}>
                <div style={{ height: 2, width: '75%', background: G.lime, borderRadius: 1 }} />
              </div>
            </div>
          ))}
        </div>

        {statusMessage && (
          <div style={{ background: '#122212', border: `1px solid ${G.lime}`, borderRadius: 10, padding: 12, marginBottom: 16, color: G.lime }}>
            {statusMessage}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-12" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          {/* Revenue Chart */}
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 800, fontSize: 13 }}>📈 Revenue Overview</div>
              <span style={{ fontSize: 10, color: G.muted }}>12 months</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: G.accent, marginBottom: 4 }}>$142,300</div>
            <div style={{ fontSize: 10, color: G.muted, marginBottom: 10 }}>Total Revenue · All Time</div>
            <LineChart data={revenueData} color={G.lime} height={60} />
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              {[{ l: 'Membership', v: '$5,240' }, { l: 'Bookings', v: '$1,980' }, { l: 'Events', v: '$840' }].map((r, i) => (
                <div key={i} style={{ flex: 1, background: '#0f1f0f', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9.5, color: G.muted }}>{r.l}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: G.accent }}>{r.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Expenses + Breakdown */}
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>💸 Expense Breakdown</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#e57373', marginBottom: 4 }}>$6,256</div>
            <div style={{ fontSize: 10, color: G.muted, marginBottom: 10 }}>This Month</div>
            <LineChart data={expenseData} color="#e57373" height={50} />
            <div style={{ marginTop: 10 }}>
              {[
                { l: 'Court Maintenance', v: 1200, pct: 37 },
                { l: 'Staff', v: 950, pct: 30 },
                { l: 'Utilities', v: 620, pct: 19 },
                { l: 'Equipment', v: 440, pct: 14 },
              ].map((e, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                    <span style={{ color: G.muted }}>{e.l}</span>
                    <span style={{ fontWeight: 700 }}>${e.v.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 4, background: G.dark, borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${e.pct}%`, background: '#e5737388', borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Memberships + Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-12" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          {/* Membership Tiers */}
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 10 }}>💳 Membership Tiers</div>
            {membershipTiers.map((t, i) => (
              <div key={i} style={{ background: '#0f1f0f', borderRadius: 9, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, fontSize: 13, color: t.color }}>{t.name}</span>
                  <span style={{ fontSize: 10, color: G.lime, fontWeight: 700 }}>{t.trend} this month</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: 10, color: G.muted }}>Members</div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: G.accent }}>{t.count}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: G.muted }}>Fee/mo</div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: G.accent }}>${t.fee}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: G.muted }}>Revenue</div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: G.accent }}>${(t.revenue / 1000).toFixed(1)}k</div>
                  </div>
                </div>
                <div style={{ marginTop: 6, height: 4, background: G.dark, borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${(t.count / 80) * 100}%`, background: t.color, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Transactions + Team Progress */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Recent Transactions */}
            <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14, flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>📝 Recent Transactions</div>
              {recentTransactions.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < recentTransactions.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600 }}>{t.member}</div>
                    <div style={{ fontSize: 10, color: G.muted }}>{t.type} · {t.date}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 800 }}>${t.amount}</div>
                    <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: statusColor(t.status) + '25', color: statusColor(t.status), fontWeight: 700 }}>{t.status}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Team Progress */}
            <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>🏆 Tournament Summary</div>
              {teamProgress.map((t, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 3 }}>
                    <span style={{ fontWeight: 600 }}>{t.name}</span>
                    <span style={{ color: G.muted, fontSize: 10 }}>{t.detail}</span>
                  </div>
                  <div style={{ height: 5, background: G.dark, borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${t.pct}%`, background: t.color, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
