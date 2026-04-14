'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadingState } from '@/components/LoadingState';
import MessagingPanel from '@/components/dashboards/MessagingPanel';
import CommunityPanel from '../coach/CommunityPanel';
import AssignedTasksWidget from '@/components/AssignedTasksWidget';
import TaskDetailsPanel from '@/components/referee/TaskDetailsPanel';

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
  { label: 'My Profile', icon: '👤' },
  { label: 'Matches', icon: '🎾' },
  { label: 'Tasks', icon: '✓' },
  { label: 'Messaging', icon: '💬' },
  { label: 'Community', icon: '🌐' },
];

const profileTabs = ['personal', 'bio', 'certifications'] as const;
type ProfileTab = typeof profileTabs[number];
const profileTabLabels: Record<ProfileTab, string> = { personal: 'Personal Info', bio: 'Biography', certifications: 'Certifications' };

/* ── component ── */

export const RefereeDashboard: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read active section from URL, default to 'My Profile'
  const activeNav = (searchParams.get('section') as string) || 'My Profile';

  // Handle navigation to a new section
  const handleNavigation = (section: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', section);
    if (section !== 'My Profile') {
      params.delete('tab');
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Read profile tab from URL, default to 'personal'
  const profileTab = (searchParams.get('tab') as ProfileTab) || 'personal';

  const handleProfileTab = (tab: ProfileTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', 'My Profile');
    params.set('tab', tab);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // State for real data
  const [refereeData, setRefereeData] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [incomingMatches, setIncomingMatches] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Task details state
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Read selected task from URL
  useEffect(() => {
    const taskId = searchParams.get('taskId');
    setSelectedTaskId(taskId);
  }, [searchParams]);

  const handleTaskSelect = (taskId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', 'Tasks');
    params.set('taskId', taskId);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleTaskClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('taskId');
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const isProfile = activeNav === 'My Profile';

  if (loading && !dashboardData) {
    return <LoadingState icon="🧑‍⚖️" message="Loading referee dashboard..." />;
  }

  // Fetch real data on mount
  useEffect(() => {
    const fetchRefereeDashboard = async () => {
      try {
        if (!user?.id) return;
        const refereeId = user.id;

        const userRes = await authenticatedFetch(`/api/user/profile/${refereeId}`);
        if (userRes.ok) {
          const fullUserData = await userRes.json();
          setProfileData(fullUserData);
          setPersonalForm({
            firstName: fullUserData.firstName || '',
            lastName: fullUserData.lastName || '',
            email: fullUserData.email || '',
            phone: fullUserData.phone || '',
            gender: fullUserData.gender || '',
            dateOfBirth: fullUserData.dateOfBirth ? new Date(fullUserData.dateOfBirth).toISOString().split('T')[0] : '',
            nationality: fullUserData.nationality || '',
            bio: fullUserData.bio || '',
            photo: fullUserData.photo || '',
          });
        }

        const dashboardRes = await authenticatedFetch(`/api/dashboard/role?role=referee&userId=${refereeId}`);
        if (dashboardRes.ok) {
          const data = await dashboardRes.json();
          setDashboardData(data);
          setRefereeData(data.referee);
          setMatches(data.recentMatches || []);
          setIncomingMatches(data.incomingMatches || []);
          setPerformance(data.stats || null);
          setCertificates(data.referee?.certifications || []);
        }
      } catch (error) {
        console.error('Error fetching referee dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRefereeDashboard();
  }, [user?.id]);

  // Auto-follow players and organizations on mount
  useEffect(() => {
    const autoFollowContacts = async () => {
      if (!user?.id) return;
      try {
        console.log('🏌️ Referee Dashboard: Triggering auto-follow for', user.id);
        const res = await fetch(`/api/referees/${user.id}/auto-follow-contacts`, {
          method: 'POST',
        });
        
        if (res.ok) {
          const result = await res.json();
          console.log('✅ Auto-follow result:', result);
        } else {
          console.warn('⚠️ Auto-follow failed:', res.status);
        }
      } catch (error) {
        console.warn('⚠️ Auto-follow error:', error instanceof Error ? error.message : error);
      }
    };

    autoFollowContacts();
  }, [user?.id]);

  // Fetch assigned tasks
  useEffect(() => {
    const fetchAssignedTasks = async () => {
      if (!user?.id) return;
      try {
        setTasksLoading(true);
        const res = await authenticatedFetch(`/api/referee/assigned-tasks?limit=20`);
        if (res.ok) {
          const data = await res.json();
          setAssignedTasks(Array.isArray(data.tasks) ? data.tasks : []);
        }
      } catch (error) {
        console.error('Error fetching assigned tasks:', error);
      } finally {
        setTasksLoading(false);
      }
    };

    fetchAssignedTasks();
  }, [user?.id]);

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

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: G.dark, color: G.text, minHeight: '100vh', overflow: 'hidden', fontSize: 13 }}>

      {/* ═══════════════ LEFT NAV ═══════════════ */}
      <aside className="hidden md:flex md:w-56" style={{ background: G.sidebar, borderRight: `1px solid ${G.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

        {/* Brand */}
        <div style={{ padding: '14px 15px 13px', borderBottom: `1px solid ${G.border}`, display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 28, height: 28, background: G.lime, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>🎾</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 13.5, color: G.lime, letterSpacing: -0.4, lineHeight: 1.1 }}>Vico Sports</div>
            <div style={{ fontSize: 8.5, color: G.muted, letterSpacing: 1.1, textTransform: 'uppercase' }}>Referee Platform</div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '6px 7px 0', overflowY: 'auto' }}>
          <div style={{ fontSize: 8.5, color: G.muted, letterSpacing: '1.2px', textTransform: 'uppercase', padding: '8px 5px 3px' }}>Main</div>
          {navItems.map(item => {
            const on = activeNav === item.label;
            return (
              <div
                key={item.label}
                onClick={() => handleNavigation(item.label)}
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
              </div>
            );
          })}
        </nav>

        {/* Profile Card at Bottom */}
        <div style={{ padding: '9px' }}>
          <div style={{ background: G.card2, border: `1px solid ${G.border}`, borderRadius: 11, padding: '12px 11px', textAlign: 'center' }}>
            {user?.photo
              ? <img src={user.photo} alt={user.firstName} style={{ width: 44, height: 44, borderRadius: '50%', border: `2px solid ${G.lime}`, objectFit: 'cover', marginBottom: 6 }} />
              : <div style={{ width: 44, height: 44, borderRadius: '50%', background: G.mid, border: `2px solid ${G.lime}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 6 }}>🧑‍⚖️</div>
            }
            <div style={{ fontWeight: 800, fontSize: 12.5, letterSpacing: -0.2 }}>Referee {user?.firstName ?? 'John'}</div>
            <div style={{ fontSize: 9.5, color: G.muted2, marginTop: 1 }}>Professional Referee</div>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 6, flexWrap: 'wrap' }}>
              {['ITF L3', 'Active'].map(c => (
                <span key={c} style={{ fontSize: 8.5, background: 'rgba(121,191,62,.12)', border: '1px solid rgba(121,191,62,.3)', color: G.lime, borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>{c}</span>
              ))}
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
      <main style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 11, minWidth: 0 }}>

        <div className="md:hidden sticky top-0 z-20 bg-[#0f1e0f] border-b border-[#243e24] px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => {
              const isActive = activeNav === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavigation(item.label)}
                  className={`whitespace-nowrap rounded-2xl border px-3 py-2 text-xs font-semibold transition ${isActive ? 'bg-[#1f3b1f] border-[#326832] text-[#d1e6c3]' : 'bg-transparent border-[#243e24] text-[#8aa274]'}`}
                >
                  {item.icon} {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {isProfile ? (
          /* ── PROFILE VIEW ── */
          <div style={card}>
            {/* Profile tab bar */}
            <div style={{ display: 'flex', gap: 3, background: G.dark, borderRadius: 8, padding: 3, marginBottom: 16 }}>
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

            {profileTab === 'personal' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ fontSize: 13.5, fontWeight: 800 }}>Personal Information</h3>
                  <BtnSecondary style={{ fontSize: 10, padding: '5px 12px' }} onClick={() => setEditingProfile(!editingProfile)}>
                    {editingProfile ? '✕ Cancel' : '✎ Edit'}
                  </BtnSecondary>
                </div>
                {editingProfile ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
                <h3 style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 10 }}>About the Referee</h3>
                {loading ? (
                  <p style={{ fontSize: 12.5, lineHeight: 1.65, color: G.muted }}>Loading...</p>
                ) : (
                  <>
                    <p style={{ fontSize: 12.5, lineHeight: 1.65, color: G.text2, marginBottom: 16 }}>
                      {refereeData?.bio || 'No biography added yet.'}
                    </p>
                    <div style={{ background: G.dark, borderRadius: 8, padding: 12 }}>
                      <SectionLabel>Experience & Stats</SectionLabel>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 9.5, color: G.muted, fontWeight: 600 }}>Matches Refereed</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: G.lime2, marginTop: 4 }}>{refereeData?.matchesRefereed || 0}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9.5, color: G.muted, fontWeight: 600 }}>Years Experience</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: G.lime2, marginTop: 4 }}>{refereeData?.yearsExperience || 0}</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {profileTab === 'certifications' && (
              <div>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 12 }}>Certifications & Credentials</h3>
                {loading ? (
                  <p style={{ fontSize: 12.5, color: G.muted }}>Loading...</p>
                ) : certificates.length > 0 ? (
                  certificates.map((cert: any, i: number) => (
                    <div key={i} style={{ background: G.dark, borderRadius: 8, padding: 12, marginBottom: 9, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 12.5 }}>{cert.name}</div>
                        <div style={{ color: G.muted, fontSize: 11, marginTop: 3 }}>Issued: {new Date(cert.issued).toLocaleDateString()}</div>
                        {cert.expires && <div style={{ color: G.muted, fontSize: 11 }}>Expires: {new Date(cert.expires).toLocaleDateString()}</div>}
                      </div>
                      <Tag color={cert.status === 'Expired' ? G.red : cert.status === 'Expiring Soon' ? G.yellow : G.lime}>{cert.status || 'Active'}</Tag>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: 12.5, color: G.muted }}>No certifications added yet.</p>
                )}
              </div>
            )}
          </div>

        ) : activeNav === 'Matches' ? (
          <div>
            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 9, marginBottom: 16 }}>
              {[
                { label: 'Total Matches', value: refereeData?.matchesRefereed || 0, delta: 'All-time' },
                { label: 'Ball Crew Matches', value: refereeData?.ballCrewMatches || 0, delta: 'Line duty' },
                { label: 'Accuracy Rate', value: performance?.accuracy ? `${performance.accuracy}%` : 'N/A', delta: 'This season' },
                { label: 'Years Experience', value: refereeData?.yearsExperience || 0, delta: 'On the job' },
              ].map((s, i) => (
                <div key={i} style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 10, padding: '11px 12px' }}>
                  <div style={{ fontSize: 8.5, color: G.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: G.lime2, marginTop: 5, lineHeight: 1 }}>{s.value}</div>
                  <Tag>{s.delta}</Tag>
                </div>
              ))}
            </div>

            {/* Incoming Matches */}
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
                <div style={{ fontSize: 12, fontWeight: 800 }}>📥 Incoming Matches</div>
                <Tag>{incomingMatches.length}</Tag>
              </div>
              {incomingMatches.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {incomingMatches.map((match: any, i: number) => (
                    <div key={i} style={{ background: G.card2, border: `1px solid ${G.border}`, borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: G.text }}>{match.playerA} vs {match.playerB}</div>
                        <div style={{ fontSize: 9.5, color: G.muted2, marginTop: 4 }}>{match.eventName}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <button
                          onClick={() => router.push(`/matches?matchId=${match.id}`)}
                          style={{ background: G.lime, color: '#0a180a', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Play Match
                        </button>
                        <Tag color={match.status === 'completed' ? G.lime : G.yellow}>{match.status || 'pending'}</Tag>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: G.muted, fontSize: 11, textAlign: 'center', padding: '18px 0' }}>No incoming matches yet. Generate group stage matches from your task detail page to populate this list.</div>
              )}
            </div>

            {/* Matches list */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
                <div style={{ fontSize: 12, fontWeight: 800 }}>🎾 Recent Matches</div>
                <Tag>{matches.length}</Tag>
              </div>

              {loading ? (
                <div style={{ color: G.muted, fontSize: 11, textAlign: 'center', padding: '20px 0' }}>Loading matches...</div>
              ) : matches.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {matches.slice(0, 10).map((match: any, i: number) => (
                    <div key={i} style={{ background: G.card2, border: `1px solid ${G.border}`, borderRadius: 8, padding: 10, borderLeft: `3px solid ${G.lime}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                          <div style={{ fontSize: 16 }}>🎾</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11.5, fontWeight: 700, color: G.text }}>
                              {match.player1} vs {match.player2}
                            </div>
                            <div style={{ fontSize: 9.5, color: G.muted, marginTop: 2 }}>
                              {match.date ? new Date(match.date).toLocaleDateString() : 'N/A'} at {match.court}
                            </div>
                            <div style={{ fontSize: 9, color: G.muted2, marginTop: 3 }}>
                              Score: {match.score || 'TBD'}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <Tag color={match.status === 'Completed' ? G.lime : G.yellow}>{match.status || 'In Progress'}</Tag>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: G.muted, fontSize: 11, textAlign: 'center', padding: '20px 0' }}>No matches yet</div>
              )}
            </div>
          </div>

        ) : activeNav === 'Tasks' ? (
          selectedTaskId ? (
            <div style={{ width: '100%' }}>
              <button
                onClick={handleTaskClose}
                style={{
                  marginBottom: 16,
                  background: 'transparent',
                  color: G.lime,
                  border: `1px solid ${G.border}`,
                  borderRadius: 7,
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                ← Back to Tasks
              </button>
              <TaskDetailsPanel taskId={selectedTaskId} refereeId={user?.id || ''} />
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Assigned Tasks</h3>
              
              {tasksLoading ? (
                <div style={{ ...card, color: G.muted, fontSize: 12, textAlign: 'center', padding: '20px' }}>
                  Loading tasks...
                </div>
              ) : assignedTasks.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {assignedTasks.map((task: any, i: number) => {
                    const statusColors: Record<string, { bg: string; border: string; text: string }> = {
                      'ASSIGNED': { bg: '#bfdbfe', border: '#3b82f6', text: '#1e40af' },
                      'ACCEPTED': { bg: '#e9d5ff', border: '#a855f7', text: '#6b21a8' },
                      'IN_PROGRESS': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
                      'COMPLETED': { bg: '#bbf7d0', border: '#10b981', text: '#065f46' },
                      'FAILED': { bg: '#fecaca', border: '#ef4444', text: '#7f1d1d' },
                      'CANCELLED': { bg: '#e5e7eb', border: '#6b7280', text: '#374151' },
                    };
                    const statusColor = statusColors[task.status] || statusColors['ASSIGNED'];
                    
                    return (
                      <div
                        key={i}
                        onClick={() => handleTaskSelect(task.id)}
                        style={{
                          ...card2,
                          borderLeft: `4px solid ${G.lime}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          if (e.currentTarget) {
                            (e.currentTarget as HTMLDivElement).style.background = G.card3;
                            (e.currentTarget as HTMLDivElement).style.transform = 'translateX(4px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (e.currentTarget) {
                            (e.currentTarget as HTMLDivElement).style.background = G.card2;
                            (e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)';
                          }
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: G.text }}>
                              {task.title}
                            </div>
                            {task.description && (
                              <div style={{ fontSize: 10, color: G.text2, marginTop: 3, lineHeight: 1.4 }}>
                                {task.description.substring(0, 80)}...
                              </div>
                            )}
                          </div>
                          <span style={{
                            fontSize: 9,
                            fontWeight: 700,
                            borderRadius: 4,
                            padding: '2px 8px',
                            background: statusColor.bg,
                            border: `1px solid ${statusColor.border}`,
                            color: statusColor.text,
                            whiteSpace: 'nowrap',
                            marginLeft: 8,
                          }}>
                            {task.status}
                          </span>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 9, color: G.muted }}>
                          <div>
                            <span style={{ color: G.muted2 }}>Type:</span> {task.role || 'General'}
                          </div>
                          <div>
                            <span style={{ color: G.muted2 }}>Due:</span> {
                              task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString()
                                : 'No due date'
                            }
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ ...card, color: G.muted, fontSize: 12, textAlign: 'center', padding: '20px' }}>
                  No assigned tasks yet.
                </div>
              )}
            </div>
          )
        ) : activeNav === 'Messaging' ? (
          <MessagingPanel userId={user?.id || ''} userType="referee" />

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
