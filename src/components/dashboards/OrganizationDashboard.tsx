'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { LoadingState } from '@/components/LoadingState';
import { chatUrlForUser, sendChallengeRequest } from '@/lib/nearby';
import { FindNearbyPeople } from '@/components/FindNearbyPeople';
import { FindNearbyCourts } from '@/components/FindNearbyCourts';
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
import { getCachedData, setCachedData, clearCacheEntry, fetchWithCache } from '@/lib/dashboardCache';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

/**
 * Helper function to normalize members data
 */
function normalizeMembersData(membersRaw: any[]) {
  return membersRaw.map((cm: any) => {
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
}


export const OrganizationDashboard: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Define nav items at the top for easy access
  const navItems = [
    { label: 'Overview', icon: '🏢', section: 'overview' },
    { label: 'Find People', icon: '👥', section: 'find-people' },
    { label: 'Find Courts', icon: '🎾', section: 'find-courts' },
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
  const mobileNavItems = useMemo(() => navItems.filter((item) => !['Reports', 'Messages'].includes(item.label)), [navItems]);
  const displayedNav = sidebarOpen ? mobileNavItems : navItems;

  // Handle navigation to a new section
  const handleNavigation = useCallback((section: string) => {
    const params = new URLSearchParams();
    params.set('section', section);
    router.push(`?${params.toString()}`, { scroll: false });
    toast.success(`Navigating to ${section}...`, { duration: 1000 });
  }, [router]);

  // Read active tab from URL, default to 'Overview'
  const activeTab = (searchParams.get('tab') as string) || 'Overview';
  
  // Handle tab change
  const handleTabChange = useCallback((tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

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
      const cacheKey = `dashboard_${user.id}`;
      
      try {
        // Check if we have cached data
        const cached = getCachedData(cacheKey);
        if (cached) {
          const json = cached as any;
          setDashboardData(json);
          setMembers(normalizeMembersData(json.members));
          setMembersLoading(false);
          
          // Sync user data silently from cache
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
          
          setIsLoading(false);
          toast.success('Dashboard loaded from cache', { duration: 1000 });
          return;
        }

        const res = await authenticatedFetch(`/api/dashboard/role?role=organization&userId=${user.id}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || 'Failed to load dashboard');
        }

        // Cache the response
        setCachedData(cacheKey, json);
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
          setMembers(normalizeMembersData(json.members));
          setMembersLoading(false);
        }

        // Fetch activities for the resolved organization
        if (json?.organizationId) {
          const activitiesCacheKey = `activities_${json.organizationId}`;
          const cachedActivities = getCachedData(activitiesCacheKey);
          
          if (cachedActivities) {
            setActivities(Array.isArray(cachedActivities) ? (cachedActivities as any[]).slice(0, 5) : []);
          } else {
            try {
              const actRes = await authenticatedFetch(`/api/organization/${json.organizationId}/activities`);
              if (actRes.ok) {
                const actData = await actRes.json();
                const activitiesArray = Array.isArray(actData) ? actData.slice(0, 5) : [];
                setCachedData(activitiesCacheKey, activitiesArray);
                setActivities(activitiesArray);
              }
            } catch (err) {
              console.error('Failed to fetch activities:', err);
            }
          }
        }

        // Initialize edit form with user data
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

        toast.success('Dashboard data loaded successfully', { duration: 2000 });
      } catch (err: any) {
        setError(err?.message || 'Unknown error');
        toast.error(`Error loading dashboard: ${err?.message || 'Unknown error'}`, { duration: 3000 });
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, [user?.id]);

  const fetchActivities = useCallback(async () => {
    if (!dashboardData?.organizationId) {
      toast.error('Organization not found', { duration: 2000 });
      return;
    }
    const activitiesCacheKey = `activities_${dashboardData.organizationId}`;
    
    try {
      // Check cache first
      const cached = getCachedData(activitiesCacheKey);
      if (cached) {
        setActivities(Array.isArray(cached) ? (cached as any[]).slice(0, 5) : []);
        return;
      }

      const res = await authenticatedFetch(`/api/organization/${dashboardData.organizationId}/activities`);
      if (res.ok) {
        const data = await res.json();
        const activitiesArray = Array.isArray(data) ? data.slice(0, 5) : [];
        setCachedData(activitiesCacheKey, activitiesArray);
        setActivities(activitiesArray);
        toast.success('Activities refreshed', { duration: 1500 });
      } else {
        toast.error('Failed to fetch activities', { duration: 2000 });
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err);
      toast.error('Error loading activities', { duration: 2000 });
    }
  }, [dashboardData?.organizationId]);

  const handleEditFormChange = (e: any) => {
    const { name, value } = e.target;
    setEditForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleOpenEditModal = useCallback(() => {
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
    toast.success('Edit mode activated', { duration: 1000 });
  }, [user]);

  const handleSaveProfile = async (e: any) => {
    e.preventDefault();
    setProfileSaving(true);
    const savingToast = toast.loading('Saving profile...', { duration: Infinity });
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

      // Update the auth context with the new user data
      if (user) {
        Object.assign(user, updatedUserData);
      }

      // Clear cache to force refresh
      clearCacheEntry(`dashboard_${user?.id}`);
      clearCacheEntry(`activities_${dashboardData?.organizationId}`);

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
      
      toast.dismiss(savingToast);
      toast.success('Profile updated successfully! 🎉', { duration: 3000 });
    } catch (err: any) {
      toast.dismiss(savingToast);
      toast.error(`Failed to save profile: ${err.message || 'Unknown error'}`, { duration: 3000 });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleMessageClick = useCallback((personId: string, personName: string) => {
    toast.loading(`Opening chat with ${personName}...`, { duration: 1000 });
    router.push(chatUrlForUser(personId, personName));
  }, [router]);

  const handleChallenge = useCallback(async (personId: string, personName: string) => {
    if (!user?.id) {
      toast.error('Please sign in to send a challenge.', { duration: 2000 });
      return;
    }

    const challengeToast = toast.loading(`Sending challenge to ${personName}...`, { duration: Infinity });
    try {
      await sendChallengeRequest(user.id, personId);
      toast.dismiss(challengeToast);
      toast.success(`Challenge request sent to ${personName}! 🎾`, { duration: 3000 });
    } catch (error: any) {
      toast.dismiss(challengeToast);
      toast.error(`Failed to send challenge: ${error?.message || 'Unknown error'}`, { duration: 3000 });
    }
  }, [user?.id]);

  const handleLogout = useCallback(async () => {
    const logoutToast = toast.loading('Logging out...', { duration: Infinity });
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
        toast.dismiss(logoutToast);
        toast.success('Logged out successfully! 👋', { duration: 2000 });
        router.push('/');
      } else {
        console.error('Logout failed', await response.text());
        clearTokens();
        toast.dismiss(logoutToast);
        toast.success('Logged out', { duration: 2000 });
        router.push('/');
      }
    } catch (err) {
      console.error('Logout error:', err);
      clearTokens();
      toast.dismiss(logoutToast);
      toast.error('Error during logout, but session cleared', { duration: 2000 });
      router.push('/');
    }
  }, [router]);

  // Rest of component body below


  const kpiData = useMemo(() => dashboardData?.kpi ?? [], [dashboardData?.kpi]);
  const revenueTrend = useMemo(() => dashboardData?.revenueTrend ?? [], [dashboardData?.revenueTrend]);
  const revenueSummary = useMemo(() => dashboardData?.revenueSummary, [dashboardData?.revenueSummary]);
  const scheduleItems = useMemo(() => dashboardData?.schedule ?? [], [dashboardData?.schedule]);
  const staffRoles = useMemo(() => dashboardData?.staff ?? [], [dashboardData?.staff]);
  const announcements = useMemo(() => dashboardData?.announcements ?? [], [dashboardData?.announcements]);
  const pendingTasks = useMemo(() => dashboardData?.pendingTasks ?? [], [dashboardData?.pendingTasks]);
  const systemStatus = useMemo(() => dashboardData?.systemStatus ?? [], [dashboardData?.systemStatus]);

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
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: G.dark, color: G.text }}>

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
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r lg:sticky lg:top-0 lg:h-screen lg:relative lg:translate-x-0 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        style={{ background: G.sidebar, borderColor: G.cardBorder, display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto', paddingBottom: 14, height: '100vh' }}
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
                onClick={handleOpenEditModal}
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
      <main className="flex-1 min-h-screen overflow-y-auto p-4 lg:p-6" style={{ minWidth: 0 }}>


        {/* Conditional Content Rendering */}
        {activeNav === 'Overview' && (
          <div className="min-h-screen flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <OrganizationOverviewSection
                organizationId={dashboardData?.organizationId}
                kpiData={kpiData}
                activeTab={activeTab}
                setActiveTab={handleTabChange}
                revenueTrend={revenueTrend}
                revenueSummary={revenueSummary}
                revenueBreakdown={dashboardData?.revenueBreakdown ?? []}
                scheduleItems={scheduleItems}
                staffRoles={staffRoles}
                announcements={announcements}
                pendingTasks={pendingTasks}
                systemStatus={systemStatus}
              />
            </div>
          </div>
        )}

        {activeNav === 'Find People' && (
          <div className="w-full min-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6" style={{ color: G.lime }}>Find Nearby People</h2>
            <FindNearbyPeople onMessageClick={handleMessageClick} onChallengeClick={handleChallenge} />
          </div>
        )}

        {activeNav === 'Find Courts' && (
          <div className="w-full min-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6" style={{ color: G.lime }}>Find Nearby Courts</h2>
            <FindNearbyCourts />
          </div>
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
        onClose={() => {
          setShowEditModal(false);
          toast('Edit cancelled', { icon: '✖️', duration: 1000 });
        }}
        onSubmit={handleSaveProfile}
        saving={profileSaving}
      />
    </div>
  );
};
