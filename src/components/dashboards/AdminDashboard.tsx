'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Define nav items
  const navItems = [
    { label: 'Home', icon: '🏠', section: 'home' },
    { label: 'Platform', icon: '🛠️', section: 'platform' },
    { label: 'Logs', icon: '📑', section: 'logs' },
    { label: 'System', icon: '🖥️', section: 'system' },
    { label: 'Settings', icon: '⚙️', section: 'settings' },
  ];

  // Map section URL param to label
  const sectionParam = searchParams.get('section') || 'home';
  const activeNav = navItems.find(item => item.section === sectionParam)?.label || 'Home';

  // Handle navigation to a new section
  const handleNavigation = (section: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', section);
    params.delete('tab');
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Read active tab from URL, default to 'Overview'
  const activeTab = (searchParams.get('tab') as string) || 'Overview';
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/dashboard/role?role=admin&userId=${user.id}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || 'Failed to load dashboard');
        }

        setDashboardData(json);
      } catch (err: any) {
        setError(err?.message || 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, [user?.id]);

  const tabs = ['Overview', 'Services', 'Alerts', 'Incidents'];

  const stats = dashboardData?.stats ?? { totalOrganizations: 0, totalUsers: 0, activeSessions: 0, uptime: 0, incidentCount: 0 };

  const systemModules = dashboardData?.systemModules ?? [
    { name: 'Auth API', status: 'Healthy', uptime: '99.99%' },
    { name: 'Payments', status: 'Healthy', uptime: '99.87%' },
    { name: 'Match API', status: 'Healthy', uptime: '99.73%' },
    { name: 'Notifications', status: 'Degraded', uptime: '98.60%' },
    { name: 'Realtime Sync', status: 'Healthy', uptime: '99.91%' },
  ];

  const recentDeployments = dashboardData?.recentDeployments ?? [
    { id: 'd-321f', status: 'Success', env: 'production', updated: '14m ago' },
    { id: 'd-984a', status: 'Success', env: 'staging', updated: '2h ago' },
    { id: 'd-565e', status: 'Failed', env: 'production', updated: '8h ago' },
  ];

  const openIssues = dashboardData?.openIssues ?? 0;

  const platformStatus = dashboardData?.systemModules ?? [
    { name: 'Auth API', status: 'Healthy', uptime: '99.99%' },
    { name: 'Payments', status: 'Healthy', uptime: '99.87%' },
    { name: 'Match API', status: 'Healthy', uptime: '99.73%' },
    { name: 'Notifications', status: 'Degraded', uptime: '98.60%' },
    { name: 'Realtime Sync', status: 'Healthy', uptime: '99.91%' },
  ];

  const recentDeploys = dashboardData?.recentDeployments ?? [
    { id: 'd-321f', status: 'Success', env: 'production', updated: '14m ago' },
    { id: 'd-984a', status: 'Success', env: 'staging', updated: '2h ago' },
    { id: 'd-565e', status: 'Failed', env: 'production', updated: '8h ago' },
  ];

  const statusColor = (status: string) => status === 'Healthy' ? '#5fc45f' : status === 'Degraded' ? '#f0c040' : '#e57373';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div>Loading admin dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 text-red-700">
        <div>Error loading dashboard: {error}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif", background: G.dark, color: G.text, overflow: 'hidden' }}>

      {/* LEFT SIDEBAR */}
      <aside style={{ width: 188, background: G.sidebar, borderRight: `1px solid ${G.cardBorder}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '15px 14px 10px', borderBottom: `1px solid ${G.cardBorder}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🎾</span>
          <div style={{ color: G.lime, fontWeight: 900, fontSize: 14 }}>Vico Tennis</div>
        </div>
        <nav style={{ flex: 1, paddingTop: 8 }}>
          {navItems.map(item => (
            <button key={item.label} onClick={() => handleNavigation(item.section)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 13px',
              background: activeNav === item.label ? G.mid : 'transparent',
              color: activeNav === item.label ? '#fff' : G.muted,
              border: 'none', cursor: 'pointer', fontSize: 12, textAlign: 'left',
              borderLeft: activeNav === item.label ? `3px solid ${G.lime}` : '3px solid transparent',
            }}><span>{item.icon}</span>{item.label}</button>
          ))}
        </nav>

        {/* Profile Card at Bottom */}
        <div style={{ margin: '0 10px 14px', background: G.mid, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
          {user?.photo
            ? <img src={user.photo} alt={user.firstName} style={{ width: 40, height: 40, borderRadius: '50%', border: `2px solid ${G.lime}`, objectFit: 'cover', marginBottom: 6 }} />
            : <div style={{ width: 40, height: 40, borderRadius: '50%', background: G.bright, margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🛡️</div>}
          <div style={{ fontWeight: 800, fontSize: 11, marginTop: 4 }}>{user?.firstName ?? 'Admin'} {user?.lastName || ''}</div>
          <div style={{ fontSize: 9, color: G.muted, marginTop: 2 }}>Platform Admin</div>
          {user?.email && <div style={{ fontSize: 8, color: G.muted, marginTop: 2, wordBreak: 'break-word' }}>📧 {user.email}</div>}
          <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
            <button 
              onClick={() => router.push('/admin/profile')}
              style={{ flex: 1, background: G.dark, color: G.lime, border: `1px solid ${G.lime}`, borderRadius: 6, padding: '4px 0', fontSize: 8, fontWeight: 700, cursor: 'pointer' }}
            >
              Edit
            </button>
            <button 
              onClick={handleLogout}
              style={{ flex: 1, background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 0', fontSize: 8, fontWeight: 700, cursor: 'pointer' }}
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Platform Admin Dashboard</h1>
            <p style={{ margin: '4px 0 0', color: G.muted, fontSize: 11 }}>Role: {dashboardData?.admin?.role || 'Platform Admin'}</p>
          </div>
          <div style={{ color: G.muted, fontSize: 11 }}>Active section: {activeNav}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {[
            { label: 'Organizations', value: stats.totalOrganizations, icon: '🏢' },
            { label: 'Users', value: stats.totalUsers, icon: '👤' },
            { label: 'Active Sessions', value: stats.activeSessions, icon: '🔌' },
            { label: 'System Uptime', value: `${stats.uptime.toFixed(2)}%`, icon: '⏱️' },
            { label: 'Open Incidents', value: openIssues, icon: '🚨' },
          ].map((card, i) => (
            <div key={i} style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 10, color: G.muted, marginBottom: 6 }}>{card.label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: G.accent }}>{card.icon} {card.value}</div>
            </div>
          ))}
        </div>

        {activeNav === 'Platform' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>🔧 Service Health</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {platformStatus.map((item: any, i: number) => (
                  <div key={i} style={{ background: '#0f1f0f', border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 11, fontWeight: 700 }}>{item.name}</div>
                      <span style={{ color: statusColor(item.status), fontWeight: 700 }}>{item.status}</span>
                    </div>
                    <div style={{ fontSize: 10, color: G.muted, marginTop: 4 }}>Uptime {item.uptime}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>🚀 Recent Deployments</div>
              {recentDeploys.map((d: any, i: number) => (
                <div key={i} style={{ marginBottom: 8, padding: 8, background: '#0f1f0f', borderRadius: 8, border: `1px solid ${G.cardBorder}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>{d.env}</div>
                  <div style={{ fontSize: 10, color: G.muted }}>{d.id} · {d.updated}</div>
                  <div style={{ fontSize: 10, color: d.status === 'Success' ? G.lime : '#e57373', fontWeight: 700 }}>{d.status}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeNav === 'Logs' && (
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14, minHeight: 240 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>📑 Audit Logs (example)</div>
            <div style={{ fontSize: 10, color: G.muted }}>
              • [12:24] System backup completed.
              <br />• [11:52] Permission change applied to user id: 98761.
              <br />• [10:41] Service restart triggered: API Gateway.
              <br />• [09:05] New organization created: Apollo Club.
            </div>
          </div>
        )}

        {activeNav === 'System' && (
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14, minHeight: 240 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>🖥️ System Controls</div>
            <button style={{ marginBottom: 10, background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 7, padding: '8px 12px', cursor: 'pointer', fontWeight: 800 }}>Trigger Health Check</button>
            <div style={{ fontSize: 10, color: G.muted }}>Use these controls for platform administraton and debugging. Actual integrations (alerting, incident management) should hook into your infra.</div>
          </div>
        )}

        {activeNav === 'Settings' && (
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14, minHeight: 240 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>⚙️ Platform Settings</div>
            <div style={{ fontSize: 10, color: G.muted }}>API Keys, environment configuration, data retention, and entitlements belong here.</div>
          </div>
        )}
      </main>

      {/* RIGHT SIDEBAR */}
      <aside style={{ width: 188, background: G.sidebar, borderLeft: `1px solid ${G.cardBorder}`, padding: '14px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, flexShrink: 0 }}>
        <div style={{ background: G.mid, borderRadius: 10, padding: 12, textAlign: 'center' }}>
          {user?.photo
            ? <img src={user.photo} alt={user.firstName} style={{ width: 52, height: 52, borderRadius: '50%', border: `2.5px solid ${G.lime}`, objectFit: 'cover', marginBottom: 6 }} />
            : <div style={{ width: 52, height: 52, borderRadius: '50%', background: G.bright, margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>⚙️</div>}
          <div style={{ fontWeight: 800, fontSize: 13 }}>{user?.firstName ?? 'VicoAdmin'}</div>
          <div style={{ color: G.muted, fontSize: 10, marginTop: 2 }}>Administrator</div>
          <div style={{ display: 'flex', gap: 5, marginTop: 8, justifyContent: 'center' }}>
            <span style={{ background: G.lime, color: '#0f1f0f', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>Admin</span>
          </div>
        </div>

        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 9, padding: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 8 }}>🔔 Alerts</div>
          {[
            { msg: '3 pending approvals', color: G.yellow },
            { msg: 'Court 6 in maintenance', color: '#e57373' },
            { msg: 'SMS service degraded', color: G.yellow },
          ].map((alert, i) => (
            <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'center', padding: '6px 0', borderBottom: i < 2 ? `1px solid ${G.cardBorder}33` : 'none' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: alert.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: alert.color }}>{alert.msg}</span>
            </div>
          ))}
        </div>

        <div>
          <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 8 }}>⚡ Quick Actions</div>
          {[
            { l: 'Check Health', i: '🩺' },
            { l: 'Deploy Update', i: '🚀' },
            { l: 'Open Incidents', i: '🚨' },
            { l: 'Platform Logs', i: '📑' },
          ].map((item: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', background: G.card, borderRadius: 7, border: `1px solid ${G.cardBorder}`, marginBottom: 5, cursor: 'pointer' }}>
              <span>{item.i}</span>
              <span style={{ fontSize: 11.5 }}>{item.l}</span>
              <span style={{ marginLeft: 'auto', color: G.muted, fontSize: 10 }}>›</span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
};
