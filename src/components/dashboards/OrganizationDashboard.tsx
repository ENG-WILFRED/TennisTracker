'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import OrganizationOverviewSection from '@/components/organization/dashboard-sections/OrganizationOverviewSection';
import OrganizationMembersSection from '@/components/organization/dashboard-sections/OrganizationMembersSection';
import OrganizationScheduleSection from '@/components/organization/dashboard-sections/OrganizationScheduleSection';
import OrganizationStaffSection from '@/components/organization/dashboard-sections/OrganizationStaffSection';
import OrganizationEventsSection from '@/components/organization/dashboard-sections/OrganizationEventsSection';
import OrganizationTournamentsSection from '@/components/organization/dashboard-sections/OrganizationTournamentsSection';
import OrganizationTasksSection from '@/components/organization/dashboard-sections/OrganizationTasksSection';
import OrganizationReportsSection from '@/components/organization/dashboard-sections/OrganizationReportsSection';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

export const OrganizationDashboard: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [activeNav, setActiveNav] = useState('Overview');
  const [activeTab, setActiveTab] = useState('Overview');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/dashboard/role?role=organization&userId=${user.id}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || 'Failed to load dashboard');
        }

        setDashboardData(json);

        // Set members from dashboard data
        if (json.members) {
          const normalized = json.members.map((cm: any) => {
            const role = cm.role === 'member' ? 'player' : cm.role === 'officer' ? 'admin' : cm.role || 'member';
            return {
              id: cm.id,
              firstName: cm.player?.user?.firstName || cm.player?.user?.email?.split('@')[0] || 'Unknown',
              lastName: cm.player?.user?.lastName || '',
              email: cm.player?.user?.email || '',
              role,
              tier: cm.membershipTier?.name || cm.tier || 'Basic',
              status: cm.paymentStatus === 'active' ? 'active' : 'inactive',
              joinDate: cm.joinDate || undefined,
              visits: cm.attendanceCount || 0,
              player: cm.player ? { userId: cm.player.userId, user: cm.player.user } : undefined,
              coach: cm.coach || '',
              nationality: cm.player?.user?.nationality || '',
              age: cm.player?.user?.dateOfBirth ? new Date(cm.player.user.dateOfBirth).getFullYear() : undefined,
            };
          });
          setMembers(normalized);
          setMembersLoading(false);
        }
      } catch (err: any) {
        setError(err?.message || 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, [user?.id]);


  useEffect(() => {
    const section = new URLSearchParams(window.location.search).get('section');
    if (section) {
      const label = section.split('_').map((p) => p[0]?.toUpperCase() + p.slice(1)).join(' ');
      setActiveNav(label);
      setActiveTab(label === 'Overview' ? 'Overview' : activeTab);
    }
  }, []);

  const navigateToSidebar = (item: { label: string; section: string }) => {
    setActiveNav(item.label);
    router.replace(`${window.location.pathname}?section=${item.section}`);
  };

  const navItems = [
    { label: 'Overview', icon: '🏢', section: 'overview' },
    { label: 'Schedule', icon: '📅', section: 'schedule' },
    { label: 'Staff', icon: '👥', section: 'staff' },
    { label: 'Events', icon: '🎾', section: 'events' },
    { label: 'Tournaments', icon: '🏆', section: 'tournaments' },
    { label: 'Tasks', icon: '✓', section: 'tasks' },
    { label: 'Members', icon: '🎖️', section: 'members' },
    { label: 'Reports', icon: '📊', section: 'reports' },
  ];

  const tabs = ['Overview', 'Team', 'Roadmap', 'Resources', 'Chat 💬'];

  const kpiData = dashboardData?.kpi ?? [
    { label: 'Team Members', value: 0, max: 30, color: G.lime },
    { label: 'Events This Month', value: 0, max: 8, color: G.accent },
    { label: 'Courts Available', value: 0, max: 8, color: G.bright },
    { label: 'Avg Rating', value: 0, max: 5, color: G.yellow },
  ];

  const revenueTrend = dashboardData?.revenueTrend ?? [2100, 2400, 2200, 2800, 2600, 2950, 3100, 3200, 3400, 3600, 3500, 3750];

  const scheduleItems = dashboardData?.schedule ?? [
    { day: 'Mon', time: '10:00 AM', event: 'Open Tournament', status: 'Active' },
    { day: 'Tue', time: '6:00 PM', event: 'Coaching Group', status: 'Scheduled' },
    { day: 'Wed', time: '7:00 AM', event: 'Morning Drills', status: 'Scheduled' },
    { day: 'Fri', time: '3:00 PM', event: 'Friendly Match', status: 'Scheduled' },
    { day: 'Sat', time: '9:00 AM', event: 'BBQ Social', status: 'Scheduled' },
  ];

  const staffRoles = dashboardData?.staff ?? [
    { name: 'Elena Rodriguez', role: 'Head Coach', status: 'Active', sessions: 12 },
    { name: 'James Kipchoge', role: 'Court Manager', status: 'Active', sessions: 24 },
    { name: 'Maria Santos', role: 'Referee', status: 'Available', sessions: 18 },
    { name: 'Ibrahim Hassan', role: 'Instructor', status: 'Active', sessions: 8 },
  ];

  const announcements = dashboardData?.announcements ?? [
    { title: 'Court Maintenance Completed', date: 'Mar 20', priority: 'info', msg: 'Courts 1-3 maintenance finished' },
    { title: 'New Membership Tier Available', date: 'Mar 19', priority: 'success', msg: 'Platinum tier with exclusive benefits' },
    { title: 'Tournament Registrations Open', date: 'Mar 18', priority: 'info', msg: 'Spring Tournament · Deadline Apr 15' },
    { title: 'Staff Appreciation Event', date: 'Mar 17', priority: 'info', msg: 'Friday 6 PM at the pavilion' },
  ];

  const pendingTasks = [
    { task: 'Approve 3 membership requests', owner: 'Admin', due: 'Today', priority: 'High' },
    { task: 'Update event schedule', owner: 'Elena', due: 'Tomorrow', priority: 'High' },
    { task: 'Court booking system audit', owner: 'James', due: 'Mar 25', priority: 'Medium' },
    { task: 'Tournament prize distribution', owner: 'Finance', due: 'Mar 27', priority: 'Low' },
  ];

  const systemStatus = [
    { name: 'Web Platform', status: 'OK', uptime: '99.8%', color: G.lime },
    { name: 'Mobile App', status: 'OK', uptime: '99.5%', color: G.lime },
    { name: 'Booking System', status: 'Degraded', uptime: '95.2%', color: G.yellow },
    { name: 'Analytics', status: 'OK', uptime: '98.9%', color: G.lime },
    { name: 'Chat', status: 'OK', uptime: '99.9%', color: G.lime },
    { name: 'API Gateway', status: 'OK', uptime: '99.6%', color: G.lime },
  ];

  const priorityColor = (p: string) => p === 'High' ? '#ff6b6b' : p === 'Medium' ? G.yellow : G.muted;
  const priorityBg = (p: string) => p === 'High' ? '#ff6b6b33' : p === 'Medium' ? G.yellow + '33' : G.muted + '33';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div>Loading organization dashboard...</div>
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
      <aside style={{ width: 180, background: G.sidebar, borderRight: `1px solid ${G.cardBorder}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '15px 14px 10px', borderBottom: `1px solid ${G.cardBorder}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🎾</span>
          <div style={{ color: G.lime, fontWeight: 900, fontSize: 14 }}>Vico Sports</div>
        </div>
        <nav style={{ flex: 1, paddingTop: 8 }}>
          {navItems.map(item => (
            <button key={item.label} onClick={() => navigateToSidebar(item)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 13px',
              background: activeNav === item.label ? G.mid : 'transparent',
              color: activeNav === item.label ? '#fff' : G.muted,
              border: 'none', cursor: 'pointer', fontSize: 12, textAlign: 'left',
              borderLeft: activeNav === item.label ? `3px solid ${G.lime}` : '3px solid transparent',
            }}><span>{item.icon}</span>{item.label}</button>
          ))}
        </nav>
        <div style={{ padding: '10px 12px 14px' }}>
          <button style={{ width: '100%', background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 8, padding: '9px 0', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
            ✓ Complete Task
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>

        {/* Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: G.text }}>📍 {activeNav}</span>
          <span style={{ fontSize: 11, color: G.muted }}>Click a sidebar item to navigate</span>
        </div>

        {/* Conditional Content Rendering */}
        {activeNav === 'Overview' && (
          <OrganizationOverviewSection
            kpiData={kpiData}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            tabs={tabs}
            revenueTrend={revenueTrend}
            scheduleItems={scheduleItems}
            staffRoles={staffRoles}
            announcements={announcements}
            pendingTasks={pendingTasks}
            systemStatus={systemStatus}
          />
        )}

        {activeNav === 'Members' && (
          <OrganizationMembersSection
            organizationId={dashboardData?.organizationId}
            members={members}
            membersLoading={membersLoading}
          />
        )}

        {activeNav === 'Schedule' && (
          <OrganizationScheduleSection scheduleItems={scheduleItems} />
        )}

        {activeNav === 'Staff' && (
          <OrganizationStaffSection staffRoles={staffRoles} />
        )}

        {activeNav === 'Events' && (
          <OrganizationEventsSection />
        )}

        {activeNav === 'Tournaments' && (
          <OrganizationTournamentsSection organizationId={dashboardData?.organizationId} />
        )}

        {activeNav === 'Tasks' && (
          <OrganizationTasksSection pendingTasks={pendingTasks} />
        )}

        {activeNav === 'Reports' && (
          <OrganizationReportsSection />
        )}
      </main>

      {/* RIGHT SIDEBAR */}
      <aside style={{ width: 188, background: G.sidebar, borderLeft: `1px solid ${G.cardBorder}`, padding: '14px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, flexShrink: 0 }}>
        <div style={{ background: G.mid, borderRadius: 10, padding: 12, textAlign: 'center' }}>
          {user?.photo
            ? <img src={user.photo} alt={user.firstName} style={{ width: 52, height: 52, borderRadius: '50%', border: `2.5px solid ${G.lime}`, objectFit: 'cover', marginBottom: 6 }} />
            : <div style={{ width: 52, height: 52, borderRadius: '50%', background: G.bright, margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🏢</div>}
          <div style={{ fontWeight: 800, fontSize: 13 }}>{user?.firstName ?? 'Organization'}</div>
          <div style={{ color: G.muted, fontSize: 10, marginTop: 2 }}>Manager</div>
          <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
            <button style={{ flex: 1, background: G.dark, color: G.lime, border: `1px solid ${G.lime}`, borderRadius: 6, padding: '4px 0', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
              Edit
            </button>
            <button style={{ flex: 1, background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 6, padding: '4px 0', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
              Settings
            </button>
          </div>
        </div>

        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 9, padding: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 8 }}>📊 Stats</div>
          {[
            { label: 'Members Active', value: '142' },
            { label: 'Events Created', value: '24' },
            { label: 'Revenue Y-T-D', value: '$87.2k' },
            { label: 'Avg Rating', value: '4.8★' },
          ].map((s: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 3 ? `1px solid ${G.cardBorder}33` : 'none' }}>
              <span style={{ fontSize: 10, color: G.muted }}>{s.label}</span>
              <span style={{ fontWeight: 800, color: G.accent }}>{s.value}</span>
            </div>
          ))}
        </div>

        <div>
          <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 8 }}>⚡ Quick Links</div>
          {[
            { l: 'Members', i: '👥' }, { l: 'Events', i: '🎾' },
            { l: 'Analytics', i: '📊' }, { l: 'Documents', i: '📄' },
            { l: 'Support', i: '💬' }, { l: 'Settings', i: '⚙️' },
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