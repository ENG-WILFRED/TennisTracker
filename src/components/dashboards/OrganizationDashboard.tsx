'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { LoadingState } from '@/components/LoadingState';
import EditProfileModal from '@/app/dashboard/components/EditProfileModal';
import OrganizationOverviewSection from '@/components/organization/dashboard-sections/OrganizationOverviewSection';
import OrganizationMembersSection from '@/components/organization/dashboard-sections/OrganizationMembersSection';
import OrganizationStaffSection from '@/components/organization/dashboard-sections/OrganizationStaffSection';
import OrganizationTasksSection from '@/components/organization/dashboard-sections/OrganizationTasksSection';
import OrganizationCourtsSection from '@/components/organization/dashboard-sections/OrganizationCourtsSection';
import OrganizationEventsSection from '@/components/organization/dashboard-sections/OrganizationEventsSection';
import OrganizationTournamentsSection from '@/components/organization/dashboard-sections/OrganizationTournamentsSection';
import OrganizationReportsSection from '@/components/organization/dashboard-sections/OrganizationReportsSection';
import OrganizationBookingsSection from '@/components/organization/dashboard-sections/OrganizationBookingsSection';
import OrganizationPlayersSection from '@/components/organization/dashboard-sections/OrganizationPlayersSection';
import MessagingPanel from '@/components/dashboards/MessagingPanel';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { clearTokens, getStoredTokens } from '@/lib/tokenManager';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

export const OrganizationDashboard: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Define nav items at the top for easy access
  const navItems = [
    { label: 'Overview', icon: '🏢', section: 'overview' },
    { label: 'My Players', icon: '👨‍🏫', section: 'players' },
    { label: 'Staff', icon: '👥', section: 'staff' },
    { label: 'Tasks', icon: '📋', section: 'tasks' },
    { label: 'Courts', icon: '🎾', section: 'courts' },
    { label: 'Bookings', icon: '📅', section: 'bookings' },
    { label: 'Events', icon: '🎾', section: 'events' },
    { label: 'Tournaments', icon: '🏆', section: 'tournaments' },
    { label: 'Members', icon: '🎖️', section: 'members' },
    { label: 'Messages', icon: '💬', section: 'messages' },
    { label: 'Reports', icon: '📊', section: 'reports' },
  ];

  // Map section URL param to label
  const sectionParam = searchParams.get('section') || 'overview';
  const activeNav = navItems.find(item => item.section === sectionParam)?.label || 'Overview';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mobileNavItems = navItems.filter((item) => !['Reports', 'Messages'].includes(item.label));
  const displayedNav = sidebarOpen ? mobileNavItems : navItems;

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
  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const userData = user as any;
  const [editForm, setEditForm] = useState<any>({
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

  useEffect(() => {
    if (!user?.id) return;

    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const res = await authenticatedFetch(`/api/dashboard/role?role=organization&userId=${user.id}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || 'Failed to load dashboard');
        }

        setDashboardData(json);

        // Sync manager data with user in auth context
        if (json.manager && user) {
          Object.assign(user, {
            firstName: json.manager.firstName,
            lastName: json.manager.lastName,
            email: json.manager.email,
            phone: json.manager.phone,
            photo: json.manager.photo,
            nationality: json.manager.nationality,
            gender: json.manager.gender,
            bio: json.manager.bio,
            dateOfBirth: json.manager.dateOfBirth,
          });
        }

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

        // Fetch activities
        if (json && user?.id) {
          try {
            const actRes = await authenticatedFetch(`/api/organization/activities?userId=${user.id}`);
            if (actRes.ok) {
              const actData = await actRes.json();
              setActivities(Array.isArray(actData.activities) ? actData.activities.slice(0, 5) : []);
            }
          } catch (err) {
            console.error('Failed to fetch activities:', err);
          }
        }

        // Initialize edit form with user data (including synced data)
        const userData = user as any;
        setEditForm({
          firstName: userData?.firstName || '',
          lastName: userData?.lastName || '',
          email: userData?.email || '',
          phone: userData?.phone || '',
          gender: userData?.gender || '',
          dateOfBirth: userData?.dateOfBirth || '',
          nationality: userData?.nationality || '',
          bio: userData?.bio || '',
          photo: userData?.photo || '',
        });
      } catch (err: any) {
        setError(err?.message || 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, [user?.id]);

  const fetchActivities = async () => {
    try {
      const res = await authenticatedFetch(`/api/organization/activities?userId=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(Array.isArray(data.activities) ? data.activities.slice(0, 5) : []);
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    }
  };

  const handleEditFormChange = (e: any) => {
    const { name, value } = e.target;
    setEditForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e: any) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await authenticatedFetch(`/api/user/profile/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          ...editForm,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUserData = await res.json();

      // Update the auth context with the new user data (including phone, nationality, etc.)
      if (user) {
        Object.assign(user, updatedUserData);
      }

      // Log the activity
      await authenticatedFetch(`/api/organization/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          type: 'profile_updated',
          description: `Updated organization profile`,
          metadata: { fields: Object.keys(editForm) },
        }),
      });

      setShowEditModal(false);
      fetchActivities();
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const storedTokens = getStoredTokens();
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(storedTokens?.accessToken ? { Authorization: `Bearer ${storedTokens.accessToken}` } : {}),
        },
        body: JSON.stringify({ refreshToken: storedTokens?.refreshToken }),
      });

      if (response.ok) {
        clearTokens();
        router.push('/');
      } else {
        console.error('Logout failed', await response.text());
        clearTokens();
        router.push('/');
      }
    } catch (err) {
      console.error('Logout error:', err);
      clearTokens();
      router.push('/');
    }
  };

  // Rest of component body below

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
    return <LoadingState icon="🏢" message="Loading organization dashboard..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 text-red-700">
        <div>Error loading dashboard: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: G.dark, color: G.text, overflow: 'hidden' }}>

      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b" style={{ background: G.sidebar, borderColor: G.cardBorder }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">🎾</span>
          <span className="text-sm font-semibold" style={{ color: G.lime }}>Org dashboard</span>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-xl px-3 py-2 text-xs font-semibold"
          style={{ background: G.lime, color: G.dark }}
        >
          Menu
        </button>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r lg:relative lg:translate-x-0 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        style={{ background: G.sidebar, borderColor: G.cardBorder, display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto', paddingBottom: 14 }}
      >
        <div style={{ padding: '15px 14px 10px', borderBottom: `1px solid ${G.cardBorder}`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 20 }}>🎾</span>
          <div style={{ color: G.lime, fontWeight: 900, fontSize: 14 }}>Vico Sports</div>
          <button
            className="lg:hidden ml-auto rounded-md px-2 py-1 text-xs font-semibold"
            style={{ background: G.card, color: G.text, border: `1px solid ${G.cardBorder}` }}
            onClick={() => setSidebarOpen(false)}
          >
            Close
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ paddingTop: 8, flexShrink: 0 }}>
          {displayedNav.map(item => (
            <button key={item.label} onClick={() => { handleNavigation(item.section); setSidebarOpen(false); }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px',
              background: activeNav === item.label ? G.mid : 'transparent',
              color: activeNav === item.label ? '#fff' : G.muted,
              border: 'none', cursor: 'pointer', fontSize: 11, textAlign: 'left',
              borderLeft: activeNav === item.label ? `3px solid ${G.lime}` : '3px solid transparent',
            }}>
              <span>{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1, minHeight: 12, flexShrink: 0 }} />

        {/* Stats Card */}
        <div className="hidden lg:block" style={{ padding: '0 10px 14px', flexShrink: 0 }}>
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 9, padding: 11 }}>
            <div style={{ fontWeight: 800, fontSize: 11, marginBottom: 8 }}>📊 Stats</div>
            {[
              { label: 'Members', value: dashboardData?.kpi?.[0]?.value || members.length || '0' },
              { label: 'Events', value: dashboardData?.kpi?.[1]?.value || '0' },
              { label: 'Courts', value: dashboardData?.kpi?.[2]?.value || '0' },
              { label: 'Rating', value: (dashboardData?.kpi?.[3]?.value || 4.8) + '★' },
            ].map((s: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < 3 ? `1px solid ${G.cardBorder}33` : 'none' }}>
                <span style={{ fontSize: 9, color: G.muted }}>{s.label}</span>
                <span style={{ fontWeight: 800, color: G.accent, fontSize: 9 }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Card */}
        {activities.length > 0 && (
          <div className="hidden lg:block" style={{ padding: '0 10px 14px', flexShrink: 0 }}>
            <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 9, padding: 11 }}>
              <div style={{ fontWeight: 800, fontSize: 11, marginBottom: 8 }}>📝 Activity</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 100, overflowY: 'auto' }}>
                {activities.slice(0, 5).map((activity: any, i: number) => (
                  <div key={i} style={{ fontSize: 8, color: G.muted, paddingBottom: 5, borderBottom: i < 4 ? `1px solid ${G.cardBorder}33` : 'none' }}>
                    <div style={{ color: G.accent, fontWeight: 600, marginBottom: 1, fontSize: 8 }}>{activity.type?.replace(/_/g, ' ').toUpperCase()}</div>
                    <div style={{ fontSize: 8, lineHeight: 1.3 }}>{activity.description}</div>
                    <div style={{ fontSize: 7, marginTop: 1 }}>{new Date(activity.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Profile Card at Bottom */}
        <div style={{ padding: '0 10px 14px', flexShrink: 0 }}>
          <div style={{ background: G.mid, borderRadius: 10, padding: 12, textAlign: 'center' }}>
            {user?.photo
              ? <img src={user.photo} alt={user.firstName} style={{ width: 48, height: 48, borderRadius: '50%', border: `2.5px solid ${G.lime}`, objectFit: 'cover', marginBottom: 6 }} />
              : <div style={{ width: 48, height: 48, borderRadius: '50%', background: G.bright, margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏢</div>}
            <div style={{ fontWeight: 800, fontSize: 12 }}>{user?.firstName ?? 'Organization'} {user?.lastName || ''}</div>
            <div style={{ color: G.muted, fontSize: 9, marginTop: 2 }}>Manager</div>
            <div className="hidden sm:block" style={{ color: G.muted, fontSize: 8, marginTop: 1, wordBreak: 'break-word' }}>📧 {user?.email}</div>
            <div className="hidden sm:block" style={{ color: G.muted, fontSize: 8 }}>{(user as any)?.phone ? `📱 ${(user as any).phone}` : ''}</div>
            <div className="hidden sm:block" style={{ color: G.muted, fontSize: 8 }}>{(user as any)?.nationality ? `🌍 ${(user as any).nationality}` : ''}</div>
            <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
              <button 
                onClick={() => {
                  const userData = user as any;
                  setEditForm({
                    firstName: user?.firstName || '',
                    lastName: user?.lastName || '',
                    email: user?.email || '',
                    phone: userData?.phone || '',
                    gender: userData?.gender || '',
                    dateOfBirth: userData?.dateOfBirth || '',
                    nationality: userData?.nationality || '',
                    bio: userData?.bio || '',
                    photo: user?.photo || '',
                  });
                  setShowEditModal(true);
                }}
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

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6" style={{ minWidth: 0 }}>


        {/* Conditional Content Rendering */}
        {activeNav === 'Overview' && (
          <OrganizationOverviewSection
            kpiData={kpiData}
            activeTab={activeTab}
            setActiveTab={handleTabChange}
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

        {activeNav === 'My Players' && (
          <OrganizationPlayersSection
            orgId={dashboardData?.organizationId}
            coachUserId={user?.id}
          />
        )}

        {activeNav === 'Staff' && (
          <OrganizationStaffSection orgId={dashboardData?.organizationId} />
        )}

        {activeNav === 'Tasks' && (
          <OrganizationTasksSection orgId={dashboardData?.organizationId} />
        )}

        {activeNav === 'Courts' && (
          <OrganizationCourtsSection orgId={dashboardData?.organizationId} />
        )}

        {activeNav === 'Bookings' && (
          <OrganizationBookingsSection orgId={dashboardData?.organizationId} />
        )}

        {activeNav === 'Events' && (
          <OrganizationEventsSection orgId={dashboardData?.organizationId} />
        )}

        {activeNav === 'Tournaments' && (
          <OrganizationTournamentsSection organizationId={dashboardData?.organizationId} />
        )}

        {activeNav === 'Messages' && (
          <MessagingPanel userId={user?.id || ''} userType="admin" />
        )}

        {activeNav === 'Reports' && (
          <OrganizationReportsSection />
        )}
      </main>

      <EditProfileModal
        show={showEditModal}
        editForm={editForm}
        onChange={handleEditFormChange}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleSaveProfile}
        saving={profileSaving}
      />
    </div>
  );
};
