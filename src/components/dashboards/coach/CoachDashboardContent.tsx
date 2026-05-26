'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { chatUrlForUser } from '@/lib/nearby';
import type { ProfileTab } from './CoachProfileSection';

const SessionManagement = dynamic(() => import('./SessionManagement').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="p-8 text-sm text-[#c2dbb0]">Loading sessions...</div>,
});
const PlayerManagement = dynamic(() => import('./PlayerManagement').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="p-8 text-sm text-[#c2dbb0]">Loading players...</div>,
});
const CoachTournamentsSection = dynamic(() => import('./CoachTournamentsSection').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="p-8 text-sm text-[#c2dbb0]">Loading tournaments...</div>,
});
import AnalyticsSection from '@/components/dashboards/coach/AnalyticsSection';
const CalendarView = dynamic(() => import('./CalendarView').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="p-8 text-sm text-[#c2dbb0]">Loading calendar...</div>,
});
const CoachProfileSection = dynamic(() => import('./CoachProfileSection').then(mod => mod.CoachProfileSection), {
  ssr: false,
  loading: () => <div className="p-8 text-sm text-[#c2dbb0]">Loading profile...</div>,
});
const MessagingPanel = dynamic(() => import('@/components/dashboards/MessagingPanel').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="p-8 text-sm text-[#c2dbb0]">Loading messaging...</div>,
});
const CommunityPanel = dynamic(() => import('./CommunityPanel').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="p-8 text-sm text-[#c2dbb0]">Loading community...</div>,
});
const AssignedTasksWidget = dynamic(() => import('@/components/AssignedTasksWidget').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="p-8 text-sm text-[#c2dbb0]">Loading tasks...</div>,
});
const FindNearbyPeople = dynamic(() => import('@/components/FindNearbyPeople').then(mod => mod.FindNearbyPeople), {
  ssr: false,
  loading: () => <div className="p-8 text-sm text-[#c2dbb0]">Loading nearby people...</div>,
});
const FindNearbyCourts = dynamic(() => import('@/components/FindNearbyCourts').then(mod => mod.FindNearbyCourts), {
  ssr: false,
  loading: () => <div className="p-8 text-sm text-[#c2dbb0]">Loading nearby courts...</div>,
});

const G = {
  dark: '#0a180a',
  sidebar: '#0f1e0f',
  card: '#162616',
  card2: '#1b2f1b',
  border: '#243e24',
  lime: '#79bf3e',
  lime2: '#a8d84e',
  text: '#e4f2da',
  text2: '#c2dbb0',
  muted: '#5e8e50',
  muted2: '#7aaa68',
  yellow: '#efc040',
  blue: '#4a9eff',
};

interface CoachProfileSectionProps {
  user?: any;
  profileTab: ProfileTab;
  editingProfile: boolean;
  setEditingProfile: (value: boolean) => void;
  profileData: any;
  personalForm: any;
  setPersonalForm: React.Dispatch<React.SetStateAction<any>>;
  savingProfile: boolean;
  handleSaveProfile: () => Promise<void>;
  editingBio: boolean;
  setEditingBio: (value: boolean) => void;
  bioForm: string;
  setBioForm: React.Dispatch<React.SetStateAction<string>>;
  savingBio: boolean;
  handleSaveBio: () => Promise<void>;
  coachData: any;
  editingCertificates: boolean;
  setEditingCertificates: (value: boolean) => void;
  certForm: any;
  setCertForm: React.Dispatch<React.SetStateAction<any>>;
  handleAddCertificate: () => Promise<void>;
  savingCertificate: boolean;
  deletingCertificateIds: string[];
  handleDeleteCertificate: (certId: string, index: number) => Promise<void>;
  editingAvailability: boolean;
  setEditingAvailability: (value: boolean) => void;
  availForm: any;
  setAvailForm: React.Dispatch<React.SetStateAction<any>>;
  handleAddAvailability: () => Promise<void>;
  savingAvailability: boolean;
  deletingAvailabilityIds: string[];
  handleDeleteAvailability: (availId: string, index: number) => Promise<void>;
  availability: any[];
  loading: boolean;
  handleProfileTab: (tab: ProfileTab) => void;
}

interface CoachDashboardContentProps {
  activeNav: string;
  statusMessage: string | null;
  dashboardData: any;
  earnings: any;
  players: any[];
  stats: any;
  activities: any[];
  user?: any;
  coachId: string;
  handleNavigation: (section: string) => void;
  handleMessageClick: (personId: string, personName: string) => void;
  handleNearbyPlayerChallenge: (personId: string, personName: string) => Promise<void>;
  openSidebar: () => void;
  profileSectionProps: CoachProfileSectionProps;
  loading: boolean;
  loadError: string | null;
}

export default function CoachDashboardContent({
  activeNav,
  statusMessage,
  dashboardData,
  earnings,
  players,
  stats,
  activities,
  user,
  coachId,
  handleNavigation,
  handleMessageClick,
  handleNearbyPlayerChallenge,
  openSidebar,
  profileSectionProps,
  loading,
  loadError,
}: CoachDashboardContentProps) {
  const card = { background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, padding: 13 } as const;
  const card2 = { background: G.card2, border: `1px solid ${G.border}`, borderRadius: 12, padding: 13 } as const;

  const finalDashboardData = useMemo(
    () => dashboardData || {
      coach: { id: coachId || user?.id || '', name: 'Coach', photo: null, role: 'Coach', bio: '' },
      students: [],
      nextSession: null,
      earnings: { thisMonth: 0, pending: 0, perSession: 0, balance: 0, students: 0 },
      activities: [],
      stats: { studentCount: 0, rating: 0, totalSessions: 0 },
    },
    [dashboardData, coachId, user?.id]
  );

  const dashboardStats = useMemo(
    () => [
      { label: 'This Month', value: `$${earnings.thisMonth.toLocaleString()}`, delta: '↑ 12% vs last mo' },
      { label: 'Per Session', value: `$${earnings.perSession}`, delta: `${players.length} players` },
      { label: 'Pending Payout', value: `$${earnings.pending}`, delta: 'Available', yellow: true },
      { label: 'Active Students', value: stats.studentCount.toString(), delta: `${stats.studentCount} managed` },
    ],
    [earnings.thisMonth, earnings.perSession, earnings.pending, players.length, stats.studentCount]
  );

  const activityCards = useMemo(
    () => activities.map(activity => {
      const typeEmoji: Record<string, string> = {
        session: '🎾',
        tournament: '🏆',
        restocking: '📦',
        'player-reachout': '📞',
        email: '✉️',
      };
      const typeColors: Record<string, string> = {
        session: G.lime,
        tournament: G.yellow,
        restocking: G.blue,
        'player-reachout': G.lime2,
        email: G.muted2,
      };
      const emoji = typeEmoji[activity.type] || '📌';
      const color = typeColors[activity.type] || G.lime;
      const actDate = new Date(`${activity.date}T${activity.startTime}:00Z`);
      const dateStr = actDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      return { activity, emoji, color, dateStr };
    }),
    [activities]
  );

  const isProfile = activeNav === 'My Profile';

  return (
    <main
      className="flex-1 overflow-y-auto"
      style={{
        height: '100vh',
        padding: activeNav === 'Calendar' ? 0 : '12px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: activeNav === 'Calendar' ? 0 : 11,
        minWidth: 0,
      }}
    >
      <div className="md:hidden sticky top-0 z-20 bg-[#0f1e0f] border-b border-[#243e24] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#79bf3e] flex items-center justify-center text-sm">🎾</div>
            <div>
              <div className="text-[11px] font-semibold text-[#e4f2da]">Vico Sports</div>
              <div className="text-[9px] uppercase tracking-[.3em] text-[#7aaa6a]">Coach Platform</div>
            </div>
          </div>
          <button
            type="button"
            onClick={openSidebar}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[#243e24] text-[#7aaa6a] hover:bg-[#1e3a20] transition"
            aria-label="Open navigation"
          >
            ☰
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#79bf3e] mx-auto mb-4"></div>
            <p className="text-[#c2dbb0]">Loading dashboard data...</p>
          </div>
        </div>
      )}

      {loadError && !loading && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mx-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-red-400 font-semibold mb-1">Failed to Load Dashboard</h3>
              <p className="text-red-300 text-sm">{loadError}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#79bf3e] text-[#0a180a] rounded-lg hover:bg-[#a8d84e] transition-colors text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !loadError && isProfile ? (
        <CoachProfileSection {...profileSectionProps} />
      ) : !loading && !loadError && activeNav === 'Dashboard' ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-9 mb-4 md:mb-16">
            {dashboardStats.map((s, i) => (
              <div key={i} className="rounded-xl p-3 md:p-4" style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 10, padding: '11px 12px' }}>
                <div style={{ fontSize: 8.5, color: G.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: s.yellow ? G.yellow : G.lime2, marginTop: 5, lineHeight: 1 }}>{s.value}</div>
                <span style={{ fontSize: 8.5, fontWeight: 700, borderRadius: 4, padding: '2px 7px', background: `${s.yellow ? G.yellow : G.lime}22`, border: `1px solid ${s.yellow ? G.yellow : G.lime}44`, color: s.yellow ? G.yellow : G.lime, display: 'inline-block' }}>
                  {s.delta}
                </span>
              </div>
            ))}
          </div>

          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
              <div style={{ fontSize: 12, fontWeight: 800 }}>📌 Today&apos;s Activities</div>
              <span style={{ fontSize: 8.5, fontWeight: 700, borderRadius: 4, padding: '2px 7px', background: `${G.lime}22`, border: `1px solid ${G.lime}44`, color: G.lime, display: 'inline-block' }}>
                {activities.length}
              </span>
            </div>

            {activityCards.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activityCards.map(({ activity, emoji, color, dateStr }) => (
                  <div key={activity.id} style={{ background: G.card2, border: `1px solid ${G.border}`, borderRadius: 8, padding: 10, borderLeft: `3px solid ${color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1 }}>
                        <div style={{ fontSize: 16 }}>{emoji}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: G.text }}>{activity.title}</div>
                          <div style={{ fontSize: 9.5, color: G.muted, marginTop: 2 }}>{dateStr}</div>
                          {activity.description && <div style={{ fontSize: 9, color: G.muted2, marginTop: 3, lineHeight: 1.4 }}>{activity.description}</div>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                        <span style={{ fontSize: 8.5, fontWeight: 700, borderRadius: 4, padding: '2px 7px', background: `${color}22`, border: `1px solid ${color}44`, color, display: 'inline-block' }}>
                          {activity.type}
                        </span>
                      </div>
                    </div>

                    {activity.type === 'session' && activity.metadata && (
                      <div style={{ fontSize: 9, color: G.muted2, marginTop: 6, paddingTop: 6, borderTop: `1px solid ${G.border}`, display: 'flex', gap: 12 }}>
                        {activity.metadata.sessionType && <span>Type: {activity.metadata.sessionType}</span>}
                        {activity.metadata.price && <span>Rate: ${activity.metadata.price}</span>}
                        {activity.metadata.maxParticipants && <span>Max: {activity.metadata.maxParticipants}</span>}
                      </div>
                    )}
                    {activity.type === 'tournament' && activity.metadata && (
                      <div style={{ fontSize: 9, color: G.muted2, marginTop: 6, paddingTop: 6, borderTop: `1px solid ${G.border}` }}>
                        Level: {activity.metadata.level} · Location: {activity.metadata.location}
                      </div>
                    )}
                    {activity.type === 'restocking' && activity.metadata && (
                      <div style={{ fontSize: 9, color: G.muted2, marginTop: 6, paddingTop: 6, borderTop: `1px solid ${G.border}` }}>
                        {activity.metadata.quantity} × {activity.metadata.itemName} · ${activity.metadata.cost}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: G.muted, fontSize: 11, textAlign: 'center', padding: '20px 0' }}>No activities scheduled for today</div>
            )}

            <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => handleNavigation('Calendar')}
                style={{ flex: 1, background: G.lime, color: '#0a180a', border: 'none', borderRadius: 7, padding: '12px 0', fontWeight: 800, fontSize: 11.5, cursor: 'pointer' }}
              >
                📆 View Calendar
              </button>
              <button
                type="button"
                onClick={() => handleNavigation('Sessions')}
                style={{ flex: 1, background: 'transparent', color: G.text2, border: `1px solid ${G.border}`, borderRadius: 7, padding: '12px 0', fontWeight: 600, fontSize: 11.5, cursor: 'pointer' }}
              >
                ➕ Add Activity
              </button>
            </div>
          </div>

          {statusMessage && (
            <div style={{ background: '#122212', border: `1px solid ${G.lime}`, borderRadius: 10, padding: 12, marginBottom: 16, color: G.lime2 }}>
              {statusMessage}
            </div>
          )}

          <AnalyticsSection coachId={coachId} initialStats={stats} initialWallet={finalDashboardData.coach?.wallet} />
        </>
      ) : !loading && !loadError && activeNav === 'Sessions' ? (
        <SessionManagement coachId={coachId} />
      ) : !loading && !loadError && activeNav === 'Players' ? (
        <PlayerManagement coachId={coachId} />
      ) : !loading && !loadError && activeNav === 'Tournaments' ? (
        <CoachTournamentsSection />
      ) : !loading && !loadError && activeNav === 'Calendar' ? (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 13px' }}>
            <CalendarView coachId={coachId} />
          </div>
        </div>
      ) : !loading && !loadError && activeNav === 'Tasks' ? (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <AssignedTasksWidget userId={coachId} limit={20} />
        </div>
      ) : !loading && !loadError && activeNav === 'Messaging' ? (
        <MessagingPanel userId={coachId} userType="coach" />
      ) : !loading && !loadError && activeNav === 'Community' ? (
        <CommunityPanel userId={coachId} />
      ) : !loading && !loadError && activeNav === 'Find People' ? (
        <div className="w-full min-h-screen overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6" style={{ color: G.lime }}>
            Find Nearby People
          </h2>
          <FindNearbyPeople onMessageClick={handleMessageClick} onChallengeClick={handleNearbyPlayerChallenge} />
        </div>
      ) : !loading && !loadError && activeNav === 'Find Courts' ? (
        <div className="w-full min-h-screen overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6" style={{ color: G.lime }}>
            Find Nearby Courts
          </h2>
          <FindNearbyCourts />
        </div>
      ) : (
        <div style={card}>
          <div style={{ color: G.muted, fontSize: 12 }}>This section is coming soon.</div>
        </div>
      )}
    </main>
  );
}
