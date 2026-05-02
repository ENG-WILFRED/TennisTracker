'use client';

import React, { useState, useRef, Suspense, lazy, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import Link from 'next/link';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { LoadingState } from '@/components/LoadingState';
import SessionManagement from './coach/SessionManagement';
import PlayerManagement from './coach/PlayerManagement';
import AnalyticsSection from './coach/AnalyticsSection';
import CalendarView from './coach/CalendarView';
import MessagingPanel from '@/components/dashboards/MessagingPanel';
import CommunityPanel from './coach/CommunityPanel';
import AssignedTasksWidget from '@/components/AssignedTasksWidget';
import { FindNearbyPeople } from '@/components/FindNearbyPeople';
import { FindNearbyCourts } from '@/components/FindNearbyCourts';
import { chatUrlForUser, sendChallengeRequest } from '@/lib/nearby';
import { MembershipSwitcher } from '@/components/MembershipSwitcher';

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

/* ── tiny shared components ── */

const ProgressBar: React.FC<{ value: number; color?: string }> = ({ value, color = G.lime }) => (
  <div style={{ height: 4, background: G.dark, borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
    <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 3, transition: 'width 0.7s cubic-bezier(.4,0,.2,1)' }} />
  </div>
);

const Tag: React.FC<{ children: React.ReactNode; yellow?: boolean; color?: string }> = ({ children, yellow, color }) => {
  const c = color || (yellow ? G.yellow : G.lime);
  return (
    <span style={{
      fontSize: 8.5, fontWeight: 700, borderRadius: 4, padding: '2px 7px',
      background: `${c}22`,
      border: `1px solid ${c}44`,
      color: c,
      display: 'inline-block',
    }}>{children}</span>
  );
};

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 8.5, color: G.lime2, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 7 }}>
    {children}
  </div>
);

const BtnPrimary: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ style, ...props }) => (
  <button {...props} style={{
    background: G.lime, color: '#0a180a', border: 'none', borderRadius: 7,
    padding: '8px 0', fontWeight: 800, fontSize: 10.5, cursor: 'pointer',
    transition: 'filter .15s', ...style,
  }} />
);

const BtnSecondary: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ style, ...props }) => (
  <button {...props} style={{
    background: 'transparent', color: G.text2, border: `1px solid ${G.border}`,
    borderRadius: 7, padding: '8px 0', fontWeight: 600, fontSize: 10.5, cursor: 'pointer',
    transition: 'all .15s', ...style,
  }} />
);

/* ── data ── */

const navItems = [
  { label: 'Dashboard', icon: '🏠', pill: 0 },
  { label: 'My Profile', icon: '👤' },
  { label: 'Sessions', icon: '📅' },
  { label: 'Players', icon: '👥' },
  { label: 'Calendar', icon: '📆' },
  { label: 'Find People', icon: '👥' },
  { label: 'Find Courts', icon: '🎾' },
  { label: 'Tasks', icon: '📋' },
  { label: 'Messaging', icon: '💬' },
  { label: 'Community', icon: '🌐' },
];

const profileTabs = ['personal', 'bio', 'certifications', 'availability'] as const;
type ProfileTab = typeof profileTabs[number];
const profileTabLabels: Record<ProfileTab, string> = { personal: 'Personal Info', bio: 'Biography', certifications: 'Certifications', availability: 'Availability' };

/* ── component ── */

export const CoachDashboard: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();

  // Get coach ID from URL params first, then fall back to user context
  const coachIdFromURL = (params?.userId as string) || '';
  const coachId = user?.id || coachIdFromURL;

  // State for real data
  const [players, setPlayers] = useState<any[]>([]);
  const [coachData, setCoachData] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [earnings, setEarnings] = useState({ thisMonth: 0, pending: 0, perSession: 0, balance: 0, students: 0 });
  const [stats, setStats] = useState({ studentCount: 0, rating: 0, totalSessions: 0 });
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [personalForm, setPersonalForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    nationality: '',
    bio: '',
    photo: '',
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Bio, Certifications, and Availability editing state
  const [editingBio, setEditingBio] = useState(false);
  const [bioForm, setBioForm] = useState('');
  const [editingCertificates, setEditingCertificates] = useState(false);
  const [certForm, setCertForm] = useState({ name: '', url: '', year: new Date().getFullYear() });
  const [certificates, setCertificates] = useState<any[]>([]);
  const [editingAvailability, setEditingAvailability] = useState(false);
  const [availForm, setAvailForm] = useState({ day: 'Monday', startTime: '09:00', endTime: '17:00' });
  const [availability, setAvailability] = useState<any[]>([]);



  // Read active section from URL, default to 'Dashboard'
  const activeNav = (searchParams.get('section') as string) || 'Dashboard';

  // Handle navigation to a new section
  const handleNavigation = (section: string) => {
    if (section === 'Find People') {
      router.push('/dashboard/find-people');
      return;
    }
    if (section === 'Find Courts') {
      router.push('/dashboard/find-courts');
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', section);
    // Remove 'tab' param when switching sections (unless it's Profile)
    if (section !== 'My Profile') {
      params.delete('tab');
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // ===== SET UP ALL HOOKS FIRST - BEFORE ANY EARLY RETURNS =====

  // Fetch real data on mount
  useEffect(() => {
    console.log('[CoachDashboard] useEffect triggered with coachId:', coachId);

    let isMounted = true;
    let dataFetched = false;  // Track if we actually got data
    let timeoutId: NodeJS.Timeout | null = null;

    // Set 15 second timeout as a safety net
    timeoutId = setTimeout(() => {
      // Only log error if we still haven't fetched any data after 15 seconds
      if (isMounted && !dataFetched) {
        console.error('[CoachDashboard] Timeout: Dashboard data not fetched after 15 seconds');
        setLoading(false);
      }
    }, 15000);

    const doFetch = async () => {
      try {
        if (!coachId) {
          console.log('[CoachDashboard] Skipping fetch - no coachId');
          if (isMounted) setLoading(false);
          return;
        }

        console.log('[CoachDashboard] Starting fetch with coachId:', coachId);

        const res = await authenticatedFetch(`/api/dashboard/role?role=coach&userId=${coachId}`);

        if (!isMounted) return;

        console.log('[CoachDashboard] Response received:', res.status, res.ok);
        if (res.ok) {
          const data = await res.json();
          console.log('[CoachDashboard] JSON parsed successfully, students:', data.students?.length);

          if (data.coach) {
            console.log('[CoachDashboard] Setting profile data for:', data.coach.name);
            setProfileData({
              firstName: data.coach.firstName || '',
              lastName: data.coach.lastName || '',
              email: data.coach.email || '',
              phone: data.coach.phone || '',
              gender: data.coach.gender || '',
              dateOfBirth: data.coach.dateOfBirth ? new Date(data.coach.dateOfBirth).toISOString().split('T')[0] : '',
              nationality: data.coach.nationality || '',
              bio: data.coach.bio || '',
              photo: data.coach.photo || '',
            });
            setPersonalForm({
              firstName: data.coach.firstName || '',
              lastName: data.coach.lastName || '',
              email: data.coach.email || '',
              phone: data.coach.phone || '',
              gender: data.coach.gender || '',
              dateOfBirth: data.coach.dateOfBirth ? new Date(data.coach.dateOfBirth).toISOString().split('T')[0] : '',
              nationality: data.coach.nationality || '',
              bio: data.coach.bio || '',
              photo: data.coach.photo || '',
            });
          }

          console.log('[CoachDashboard] About to set dashboard data');
          // Mark that we successfully fetched data
          dataFetched = true;

          setDashboardData(data);
          setCoachData(data.coach);
          setPlayers(data.students || []);
          setEarnings(data.earnings || { thisMonth: 0, pending: 0, perSession: 0, balance: 0, students: 0 });
          setStats(data.stats || { studentCount: 0, rating: 0, totalSessions: 0 });
          setActivities(data.activities || []);
          console.log('[CoachDashboard] About to set loading false');
          if (isMounted) setLoading(false);

          // Clear the timeout since we got the data
          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          console.log('[CoachDashboard] Fetch completed successfully');
        } else {
          console.error('[CoachDashboard] API failed with status:', res.status);
          if (isMounted) setLoading(false);
        }
      } catch (error) {
        console.error('[CoachDashboard] Fetch exception:', error instanceof Error ? error.message : String(error));
        if (typeof window !== 'undefined') {
          (window as any).__dashboardDebug?.push(`[doFetch] Exception: ${error instanceof Error ? error.message : String(error)}`);
        }
        if (isMounted) setLoading(false);
      }
    };

    if (coachId) {
      doFetch();
    } else {
      if (isMounted) setLoading(false);
    }

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [coachId, user?.id]);

  // ===== END OF HOOKS SETUP =====

  const handleMessageClick = (personId: string, personName: string) => {
    router.push(chatUrlForUser(personId, personName));
  };

  const handleNearbyPlayerChallenge = async (personId: string, personName: string) => {
    if (!user?.id) {
      setStatusMessage('Please sign in to send a challenge.');
      return;
    }

    try {
      await sendChallengeRequest(user.id, personId);
      setStatusMessage(`Challenge request sent to ${personName}.`);
    } catch (error: any) {
      setStatusMessage(error?.message || 'Failed to send challenge request.');
    }
  };

  // Read profile tab from URL, default to 'personal'
  const profileTab = (searchParams.get('tab') as ProfileTab) || 'personal';

  const handleProfileTab = (tab: ProfileTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', 'My Profile');
    params.set('tab', tab);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const isProfile = activeNav === 'My Profile';

  // If still loading, show loading state (but not forever - there's a timeout)
  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: G.sidebar, color: G.text }}>
        <div className="text-center">
          <div className="text-6xl mb-4">🎾</div>
          <p className="text-xl font-semibold text-white mb-2">Loading coach dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error if loading failed
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-700 mb-4">{loadError}</p>
          <button
            onClick={() => {
              setLoadError(null);
              setLoading(true);
              setDashboardData(null);
              window.location.reload();
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If we have no dashboard data, use empty/fallback data so we don't get stuck
  const finalDashboardData = dashboardData || {
    coach: { id: coachId || user?.id || '', name: 'Coach', photo: null, role: 'Coach', bio: '' },
    students: [],
    nextSession: null,
    earnings: { thisMonth: 0, pending: 0, perSession: 0, balance: 0, students: 0 },
    activities: [],
    stats: { studentCount: 0, rating: 0, totalSessions: 0 },
  };

  const handleSaveProfile = async () => {
    try {
      const res = await authenticatedFetch(`/api/user/profile/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          ...personalForm,
        }),
      });
      if (res.ok) {
        setEditingProfile(false);
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    }
  };

  const handleSaveBio = async () => {
    try {
      const res = await authenticatedFetch(`/api/user/profile/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, bio: bioForm }),
      });
      if (res.ok) {
        setCoachData({ ...coachData, bio: bioForm });
        setEditingBio(false);
        alert('Biography updated!');
      } else {
        alert('Failed to update biography');
      }
    } catch (error) {
      console.error('Error updating bio:', error);
      alert('Error updating biography');
    }
  };

  const handleAddCertificate = async () => {
    if (!certForm.name || !certForm.url) {
      alert('Please fill in all fields');
      return;
    }
    try {
      const res = await authenticatedFetch(`/api/user/certificates/${user?.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(certForm),
      });
      if (res.ok) {
        const newCert = await res.json();
        setCertificates([...certificates, newCert]);
        setCoachData({ ...coachData, certifications: [...(coachData?.certifications || []), newCert] });
        setCertForm({ name: '', url: '', year: new Date().getFullYear() });
        alert('Certificate added!');
      } else {
        alert('Failed to add certificate');
      }
    } catch (error) {
      console.error('Error adding certificate:', error);
      alert('Error adding certificate');
    }
  };

  const handleDeleteCertificate = async (certId: string, index: number) => {
    try {
      const res = await authenticatedFetch(`/api/user/certificates/${user?.id}/${certId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const updated = certificates.filter((_, i) => i !== index);
        setCertificates(updated);
        setCoachData({ ...coachData, certifications: updated });
        alert('Certificate deleted!');
      }
    } catch (error) {
      console.error('Error deleting certificate:', error);
      alert('Error deleting certificate');
    }
  };

  const handleAddAvailability = async () => {
    if (!availForm.day || !availForm.startTime || !availForm.endTime) {
      alert('Please fill in all fields');
      return;
    }
    try {
      const res = await authenticatedFetch(`/api/user/availability/${user?.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(availForm),
      });
      if (res.ok) {
        const newAvail = await res.json();
        setAvailability([...availability, newAvail]);
        setCoachData({ ...coachData, availability: [...(coachData?.availability || []), newAvail] });
        setAvailForm({ day: 'Monday', startTime: '09:00', endTime: '17:00' });
        alert('Availability added!');
      } else {
        alert('Failed to add availability');
      }
    } catch (error) {
      console.error('Error adding availability:', error);
      alert('Error adding availability');
    }
  };

  const handleDeleteAvailability = async (availId: string, index: number) => {
    try {
      const res = await authenticatedFetch(`/api/user/availability/${user?.id}/${availId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const updated = availability.filter((_, i) => i !== index);
        setAvailability(updated);
        setCoachData({ ...coachData, availability: updated });
        alert('Availability deleted!');
      }
    } catch (error) {
      console.error('Error deleting availability:', error);
      alert('Error deleting availability');
    }
  };

  const handleLogout = async () => {
    try {
      await authenticatedFetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  /* ── shared inline styles ── */
  const card = { background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, padding: 13 } as const;
  const card2 = { background: G.card2, border: `1px solid ${G.border}`, borderRadius: 12, padding: 13 } as const;
  const miniSt = { background: G.card, border: `1px solid ${G.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 5 } as const;

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: G.sidebar, color: G.text, height: '100vh', overflow: 'hidden', fontSize: 13 }}>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ═══════════════ LEFT NAV ═══════════════ */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 max-w-[80vw] transform border-r transition-transform duration-300 md:relative md:sticky md:top-0 md:translate-x-0 md:flex md:w-56 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ background: G.sidebar, borderColor: G.border, display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh', overflow: 'hidden' }}>

        {/* Brand */}
        <div className="hidden md:flex" style={{ padding: '14px 15px 13px', borderBottom: `1px solid ${G.border}`, display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 28, height: 28, background: G.lime, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>🎾</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 13.5, color: G.lime, letterSpacing: -0.4, lineHeight: 1.1 }}>Vico Sports</div>
            <div style={{ fontSize: 8.5, color: G.muted, letterSpacing: 1.1, textTransform: 'uppercase' }}>Coach Platform</div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-[#243e24] text-[#7aaa6a] hover:bg-[#1e3a20] transition lg:hidden"
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '6px 7px 0', overflowY: 'auto' }}>
          {(['Main', 'Content'] as const).map(section => {
            const sectionItems = section === 'Main'
              ? navItems.slice(0, 4)
              : navItems.slice(4);
            return (
              <React.Fragment key={section}>
                <div style={{ fontSize: 8.5, color: G.muted, letterSpacing: '1.2px', textTransform: 'uppercase', padding: '8px 5px 3px' }}>{section}</div>
                {sectionItems.map(item => {
                  const on = activeNav === item.label;
                  return (
                    <div
                      key={item.label}
                      onClick={() => { handleNavigation(item.label); if (item.label === 'Stats') router.push('/leaderboard'); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 8,
                        cursor: 'pointer', marginBottom: 1, border: `1px solid ${on ? G.border : 'transparent'}`,
                        background: on ? G.card2 : 'transparent', color: on ? G.text : G.muted,
                        transition: 'all .15s',
                      }}
                      onMouseEnter={e => { if (!on) { (e.currentTarget as HTMLDivElement).style.background = G.card; (e.currentTarget as HTMLDivElement).style.color = G.text2; } }}
                      onMouseLeave={e => { if (!on) { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; (e.currentTarget as HTMLDivElement).style.color = G.muted; } }}
                    >
                      <span style={{ fontSize: 13, width: 16, textAlign: 'center', color: on ? G.lime : 'inherit' }}>{item.icon}</span>
                      <span style={{ fontSize: 11.5, fontWeight: 600 }}>{item.label}</span>
                      {item.pill && <span style={{ marginLeft: 'auto', background: G.lime, color: '#0a180a', fontSize: 8.5, fontWeight: 800, borderRadius: 9, padding: '1px 6px' }}>{item.pill}</span>}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Coach Profile Card at Bottom */}
        <div style={{ padding: 9 }}>
          <div style={{ background: G.card2, border: `1px solid ${G.border}`, borderRadius: 11, padding: '12px 11px', textAlign: 'center', cursor: 'pointer', transition: 'border-color .2s, background .2s' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 7 }}>
              {user?.photo
                ? <img src={user.photo} alt={user.firstName} style={{ width: 44, height: 44, borderRadius: '50%', border: `2px solid ${G.lime}`, objectFit: 'cover' }} />
                : <div style={{ width: 44, height: 44, borderRadius: '50%', background: G.mid, border: `2px solid ${G.lime}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👨‍🏫</div>
              }
            </div>
            <div style={{ fontWeight: 800, fontSize: 12.5, letterSpacing: -0.2 }}>Coach {user?.firstName ?? 'Maria'}</div>
            <div style={{ fontSize: 9.5, color: G.muted2, marginTop: 1 }}>Head Tennis Coach</div>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 6, flexWrap: 'wrap' }}>
              {['ITF L2', 'ATP', 'Active'].map(c => (
                <span key={c} style={{ fontSize: 8.5, background: 'rgba(121,191,62,.12)', border: '1px solid rgba(121,191,62,.3)', color: G.lime, borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>{c}</span>
              ))}
            </div>
            <div style={{ marginTop: 8 }}>
              <MembershipSwitcher />
            </div>
            <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
              <button
                onClick={() => setEditingProfile(true)}
                style={{ flex: 1, background: G.dark, color: G.lime, border: `1px solid ${G.lime}`, borderRadius: 6, padding: '4px 0', fontSize: 9, fontWeight: 700, cursor: 'pointer' }}
              >
                Edit
              </button>
              <button
                onClick={handleLogout}
                style={{ flex: 1, background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 0', fontSize: 9, fontWeight: 700, cursor: 'pointer' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══════════════ MAIN ═══════════════ */}
      <main className="flex-1 overflow-y-auto" style={{ height: '100vh', padding: activeNav === 'Calendar' ? 0 : '12px 12px', display: 'flex', flexDirection: 'column', gap: activeNav === 'Calendar' ? 0 : 11, minWidth: 0 }}>

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
              onClick={() => setSidebarOpen(true)}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[#243e24] text-[#7aaa6a] hover:bg-[#1e3a20] transition"
              aria-label="Open navigation"
            >
              ☰
            </button>
          </div>
        </div>

        {isProfile ? (
          /* ── PROFILE VIEW ── */
          <div style={card}>
            {/* Profile tab bar */}
            <div style={{ marginBottom: 16 }}>
              <div className="md:hidden">
                <select
                  value={profileTab}
                  onChange={e => handleProfileTab(e.target.value as ProfileTab)}
                  style={{
                    width: '100%', padding: '10px 12px', background: G.dark, border: `1px solid ${G.border}`,
                    borderRadius: 8, color: G.text, fontSize: 12, fontWeight: 700, appearance: 'none',
                  }}
                >
                  {profileTabs.map(tab => (
                    <option key={tab} value={tab}>{profileTabLabels[tab]}</option>
                  ))}
                </select>
              </div>
              <div className="hidden md:flex" style={{ display: 'flex', gap: 3, background: G.dark, borderRadius: 8, padding: 3 }}>
                {profileTabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => handleProfileTab(tab)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                      fontSize: 11.5, fontWeight: 700,
                      background: profileTab === tab ? G.lime : 'transparent',
                      color: profileTab === tab ? '#0a180a' : G.muted,
                      transition: 'all .15s',
                    }}
                  >
                    {profileTabLabels[tab]}
                  </button>
                ))}
              </div>
            </div>

            {profileTab === 'personal' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ fontSize: 13.5, fontWeight: 800 }}>Personal Information</h3>
                  <BtnSecondary style={{ fontSize: 10, padding: '5px 12px' }} onClick={() => setEditingProfile(!editingProfile)}>
                    {editingProfile ? '✕ Cancel' : '✎ Edit'}
                  </BtnSecondary>
                </div>
                {editingProfile ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 4, fontWeight: 600 }}>FIRST NAME</label>
                      <input
                        style={{ width: '100%', padding: '7px 9px', background: G.dark, border: `1px solid ${G.border}`, color: G.text, borderRadius: 6, fontSize: 11 }}
                        value={personalForm.firstName}
                        onChange={e => setPersonalForm({ ...personalForm, firstName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 4, fontWeight: 600 }}>LAST NAME</label>
                      <input
                        style={{ width: '100%', padding: '7px 9px', background: G.dark, border: `1px solid ${G.border}`, color: G.text, borderRadius: 6, fontSize: 11 }}
                        value={personalForm.lastName}
                        onChange={e => setPersonalForm({ ...personalForm, lastName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 4, fontWeight: 600 }}>EMAIL</label>
                      <input
                        style={{ width: '100%', padding: '7px 9px', background: G.dark, border: `1px solid ${G.border}`, color: G.text, borderRadius: 6, fontSize: 11 }}
                        type="email"
                        value={personalForm.email}
                        onChange={e => setPersonalForm({ ...personalForm, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 4, fontWeight: 600 }}>PHONE</label>
                      <input
                        style={{ width: '100%', padding: '7px 9px', background: G.dark, border: `1px solid ${G.border}`, color: G.text, borderRadius: 6, fontSize: 11 }}
                        value={personalForm.phone}
                        onChange={e => setPersonalForm({ ...personalForm, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 4, fontWeight: 600 }}>GENDER</label>
                      <input
                        style={{ width: '100%', padding: '7px 9px', background: G.dark, border: `1px solid ${G.border}`, color: G.text, borderRadius: 6, fontSize: 11 }}
                        value={personalForm.gender}
                        onChange={e => setPersonalForm({ ...personalForm, gender: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 4, fontWeight: 600 }}>DATE OF BIRTH</label>
                      <input
                        style={{ width: '100%', padding: '7px 9px', background: G.dark, border: `1px solid ${G.border}`, color: G.text, borderRadius: 6, fontSize: 11 }}
                        type="date"
                        value={personalForm.dateOfBirth}
                        onChange={e => setPersonalForm({ ...personalForm, dateOfBirth: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 4, fontWeight: 600 }}>NATIONALITY</label>
                      <input
                        style={{ width: '100%', padding: '7px 9px', background: G.dark, border: `1px solid ${G.border}`, color: G.text, borderRadius: 6, fontSize: 11 }}
                        value={personalForm.nationality}
                        onChange={e => setPersonalForm({ ...personalForm, nationality: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 4, fontWeight: 600 }}>PHOTO URL</label>
                      <input
                        style={{ width: '100%', padding: '7px 9px', background: G.dark, border: `1px solid ${G.border}`, color: G.text, borderRadius: 6, fontSize: 11 }}
                        value={personalForm.photo}
                        onChange={e => setPersonalForm({ ...personalForm, photo: e.target.value })}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 4, fontWeight: 600 }}>BIOGRAPHY</label>
                      <textarea
                        style={{ width: '100%', padding: '7px 9px', background: G.dark, border: `1px solid ${G.border}`, color: G.text, borderRadius: 6, fontSize: 11, fontFamily: 'inherit', resize: 'none' }}
                        rows={3}
                        value={personalForm.bio}
                        onChange={e => setPersonalForm({ ...personalForm, bio: e.target.value })}
                      />
                    </div>
                    <button
                      onClick={handleSaveProfile}
                      style={{ gridColumn: '1 / -1', background: G.lime, color: '#0a180a', border: 'none', borderRadius: 7, padding: '9px 0', fontWeight: 800, fontSize: 11.5, cursor: 'pointer', marginTop: 8 }}
                    >
                      ✓ Save Changes
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { label: 'First Name', value: profileData?.firstName || user?.firstName },
                      { label: 'Last Name', value: profileData?.lastName || user?.lastName },
                      { label: 'Email', value: profileData?.email || user?.email },
                      { label: 'Phone', value: profileData?.phone || 'N/A' },
                      { label: 'Gender', value: profileData?.gender || 'N/A' },
                      { label: 'Date of Birth', value: profileData?.dateOfBirth ? new Date(profileData.dateOfBirth).toLocaleDateString() : 'N/A' },
                      { label: 'Nationality', value: profileData?.nationality || 'N/A' },
                    ].map((item, i) => (
                      <div key={i} style={{ background: G.dark, borderRadius: 7, padding: 10 }}>
                        <div style={{ fontSize: 9.5, color: G.muted, fontWeight: 600, marginBottom: 3 }}>{item.label}</div>
                        <div style={{ fontSize: 11.5, color: G.text }}>{item.value}</div>
                      </div>
                    ))}
                    <div style={{ gridColumn: '1 / -1', background: G.dark, borderRadius: 7, padding: 10 }}>
                      <div style={{ fontSize: 9.5, color: G.muted, fontWeight: 600, marginBottom: 3 }}>Biography</div>
                      <div style={{ fontSize: 11.5, color: G.text, lineHeight: 1.5 }}>{profileData?.bio || 'No biography added yet.'}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {profileTab === 'bio' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ fontSize: 13.5, fontWeight: 800 }}>About the Coach</h3>
                  <BtnSecondary style={{ fontSize: 10, padding: '5px 12px' }} onClick={() => { setEditingBio(!editingBio); setBioForm(coachData?.bio || ''); }}>
                    {editingBio ? '✕ Cancel' : '✎ Edit'}
                  </BtnSecondary>
                </div>
                {editingBio ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <textarea
                      style={{ width: '100%', padding: '10px', background: G.dark, border: `1px solid ${G.border}`, color: G.text, borderRadius: 8, fontSize: 12, fontFamily: 'inherit', minHeight: 100, resize: 'vertical' }}
                      value={bioForm}
                      onChange={e => setBioForm(e.target.value)}
                      placeholder="Write your biography..."
                    />
                    <BtnPrimary onClick={handleSaveBio}>💾 Save Biography</BtnPrimary>
                  </div>
                ) : (
                  <p style={{ fontSize: 12.5, lineHeight: 1.65, color: G.text2, marginBottom: 16 }}>
                    {coachData?.bio || 'No biography added yet.'}
                  </p>
                )}
              </div>
            )}

            {profileTab === 'certifications' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ fontSize: 13.5, fontWeight: 800 }}>Certifications & Credentials</h3>
                  <BtnSecondary style={{ fontSize: 10, padding: '5px 12px' }} onClick={() => setEditingCertificates(!editingCertificates)}>
                    {editingCertificates ? '✕ Done' : '➕ Add'}
                  </BtnSecondary>
                </div>
                
                {editingCertificates && (
                  <div style={{ background: G.card2, border: `1px solid ${G.border}`, borderRadius: 10, padding: 14, marginBottom: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                      <div>
                        <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 4, fontWeight: 600 }}>CERTIFICATE NAME</label>
                        <input
                          style={{ width: '100%', padding: '8px 10px', background: G.dark, border: `1px solid ${G.border}`, color: G.text, borderRadius: 6, fontSize: 11 }}
                          value={certForm.name}
                          onChange={e => setCertForm({ ...certForm, name: e.target.value })}
                          placeholder="e.g., ITF Level 2"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 4, fontWeight: 600 }}>YEAR</label>
                        <input
                          type="number"
                          style={{ width: '100%', padding: '8px 10px', background: G.dark, border: `1px solid ${G.border}`, color: G.text, borderRadius: 6, fontSize: 11 }}
                          value={certForm.year}
                          onChange={e => setCertForm({ ...certForm, year: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 4, fontWeight: 600 }}>CERTIFICATE URL</label>
                      <input
                        style={{ width: '100%', padding: '8px 10px', background: G.dark, border: `1px solid ${G.border}`, color: G.text, borderRadius: 6, fontSize: 11 }}
                        value={certForm.url}
                        onChange={e => setCertForm({ ...certForm, url: e.target.value })}
                        placeholder="https://example.com/certificate"
                      />
                    </div>
                    <BtnPrimary onClick={handleAddCertificate}>Add Certificate</BtnPrimary>
                  </div>
                )}

                {loading ? (
                  <p style={{ fontSize: 12.5, color: G.muted }}>Loading...</p>
                ) : (coachData?.certifications || []).length > 0 ? (
                  (coachData.certifications as any[]).map((cert, i) => (
                    <div key={i} style={{ background: G.dark, borderRadius: 8, padding: 12, marginBottom: 9, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 12.5 }}>{cert.name}</div>
                        <div style={{ color: G.muted, fontSize: 11, marginTop: 3 }}>Year: {cert.year || 'N/A'} · <a href={cert.url} target="_blank" rel="noopener noreferrer" style={{ color: G.lime, textDecoration: 'none' }}>View</a></div>
                      </div>
                      <button
                        onClick={() => handleDeleteCertificate(cert.id, i)}
                        style={{ background: 'none', border: 'none', color: G.red, cursor: 'pointer', fontSize: 16 }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: 12.5, color: G.muted }}>No certifications added yet.</p>
                )}
              </div>
            )}

            {profileTab === 'availability' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ fontSize: 13.5, fontWeight: 800 }}>Coaching Availability</h3>
                  <BtnSecondary style={{ fontSize: 10, padding: '5px 12px' }} onClick={() => setEditingAvailability(!editingAvailability)}>
                    {editingAvailability ? '✕ Done' : '➕ Add'}
                  </BtnSecondary>
                </div>

                {editingAvailability && (
                  <div style={{ background: G.card2, border: `1px solid ${G.border}`, borderRadius: 10, padding: 14, marginBottom: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                      <div>
                        <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 4, fontWeight: 600 }}>DAY</label>
                        <select
                          style={{ width: '100%', padding: '8px 10px', background: G.dark, border: `1px solid ${G.border}`, color: G.text, borderRadius: 6, fontSize: 11 }}
                          value={availForm.day}
                          onChange={e => setAvailForm({ ...availForm, day: e.target.value })}
                        >
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 4, fontWeight: 600 }}>START TIME</label>
                        <input
                          type="time"
                          style={{ width: '100%', padding: '8px 10px', background: G.dark, border: `1px solid ${G.border}`, color: G.text, borderRadius: 6, fontSize: 11 }}
                          value={availForm.startTime}
                          onChange={e => setAvailForm({ ...availForm, startTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 4, fontWeight: 600 }}>END TIME</label>
                        <input
                          type="time"
                          style={{ width: '100%', padding: '8px 10px', background: G.dark, border: `1px solid ${G.border}`, color: G.text, borderRadius: 6, fontSize: 11 }}
                          value={availForm.endTime}
                          onChange={e => setAvailForm({ ...availForm, endTime: e.target.value })}
                        />
                      </div>
                    </div>
                    <BtnPrimary onClick={handleAddAvailability}>Add Time Slot</BtnPrimary>
                  </div>
                )}

                {loading ? (
                  <p style={{ fontSize: 12.5, color: G.muted }}>Loading...</p>
                ) : (coachData?.availability || []).length > 0 ? (
                  (coachData.availability as any[]).map((avail, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: G.dark, borderRadius: 8, marginBottom: 8, border: `1px solid ${G.border}` }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 12 }}>{avail.day}</div>
                        <div style={{ color: G.lime2, fontSize: 11, marginTop: 2 }}>{avail.startTime} - {avail.endTime}</div>
                      </div>
                      <button
                        onClick={() => handleDeleteAvailability(avail.id, i)}
                        style={{ background: 'none', border: 'none', color: G.red, cursor: 'pointer', fontSize: 16 }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: 12.5, color: G.muted }}>No availability schedule set yet.</p>
                )}
              </div>
            )}
          </div>

        ) : activeNav === 'Dashboard' ? (
          <>
            {/* ── STAT CARDS AT TOP ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-9 mb-4 md:mb-16">
              {[
                { label: 'This Month', value: `$${earnings.thisMonth.toLocaleString()}`, delta: '↑ 12% vs last mo' },
                { label: 'Per Session', value: `$${earnings.perSession}`, delta: `${players.length} players` },
                { label: 'Pending Payout', value: `$${earnings.pending}`, delta: 'Available', yellow: true },
                { label: 'Active Students', value: stats.studentCount.toString(), delta: `${stats.studentCount} managed` },
              ].map((s, i) => (
                <div key={i} className="rounded-xl p-3 md:p-4" style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 10, padding: '11px 12px' }}>
                  <div style={{ fontSize: 8.5, color: G.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: s.yellow ? G.yellow : G.lime2, marginTop: 5, lineHeight: 1 }}>{s.value}</div>
                  <Tag yellow={s.yellow}>{s.delta}</Tag>
                </div>
              ))}
            </div>

            {/* ── INCOMING ACTIVITIES FROM DB ── */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
                <div style={{ fontSize: 12, fontWeight: 800 }}>📌 Today's Activities</div>
                <Tag>{activities.length}</Tag>
              </div>

              {loading ? (
                <div style={{ color: G.muted, fontSize: 11, textAlign: 'center', padding: '20px 0' }}>Loading activities...</div>
              ) : activities.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activities.map((activity, i) => {
                    const typeEmoji: Record<string, string> = {
                      'session': '🎾',
                      'tournament': '🏆',
                      'restocking': '📦',
                      'player-reachout': '📞',
                      'email': '✉️',
                    };
                    const typeColors: Record<string, string> = {
                      'session': G.lime,
                      'tournament': G.yellow,
                      'restocking': G.blue,
                      'player-reachout': G.lime2,
                      'email': G.muted2,
                    };
                    const emoji = typeEmoji[activity.type] || '📌';
                    const color = typeColors[activity.type] || G.lime;
                    const actDate = new Date(`${activity.date}T${activity.startTime}:00Z`);
                    const dateStr = actDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                    return (
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
                            <Tag color={color}>{activity.type}</Tag>
                          </div>
                        </div>

                        {/* Show type-specific info */}
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
                    );
                  })}
                </div>
              ) : (
                <div style={{ color: G.muted, fontSize: 11, textAlign: 'center', padding: '20px 0' }}>No activities scheduled for today</div>
              )}

              <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
                <BtnPrimary style={{ flex: 1 }} onClick={() => handleNavigation('Calendar')}>📆 View Calendar</BtnPrimary>
                <BtnSecondary style={{ flex: 1 }} onClick={() => handleNavigation('Sessions')}>➕ Add Activity</BtnSecondary>
              </div>
            </div>

            {statusMessage && (
              <div style={{ background: '#122212', border: `1px solid ${G.lime}`, borderRadius: 10, padding: 12, marginBottom: 16, color: G.lime2 }}>
                {statusMessage}
              </div>
            )}

            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800 }}>Explore Nearby</div>
                  <div style={{ fontSize: 11, color: G.muted2, marginTop: 3 }}>Search for players or courts on separate pages.</div>
                </div>
                <Tag>New</Tag>
              </div>
              <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
                <BtnPrimary onClick={() => router.push('/dashboard/find-people')}>Find People</BtnPrimary>
                <BtnPrimary onClick={() => router.push('/dashboard/find-courts')}>Find Courts</BtnPrimary>
              </div>
            </div>

            {/* ── ANALYTICS SECTION ── */}
            <AnalyticsSection coachId={user?.id || ''} />
          </>

        ) : activeNav === 'Sessions' ? (
          <SessionManagement coachId={user?.id || ''} />

        ) : activeNav === 'Players' ? (
          <PlayerManagement coachId={user?.id || ''} />

        ) : activeNav === 'Calendar' ? (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 13px' }}>
              <CalendarView coachId={user?.id || ''} />
            </div>
          </div>

        ) : activeNav === 'Tasks' ? (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <AssignedTasksWidget userId={user?.id || ''} limit={20} />
          </div>

        ) : activeNav === 'Messaging' ? (
          <MessagingPanel userId={user?.id || ''} userType="coach" />

        ) : activeNav === 'Community' ? (
          <CommunityPanel userId={user?.id || ''} />

        ) : (
          <div style={card}>
            <div style={{ color: G.muted, fontSize: 12 }}>This section is coming soon.</div>
          </div>
        )}
      </main>

      {/* Blink keyframe injected via style tag */}
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }`}</style>
    </div>
  );
};