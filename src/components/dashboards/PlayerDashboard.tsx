'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getStoredTokens } from '@/lib/tokenManager';
import { LoadingState } from '@/components/LoadingState';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { ProfileView } from '@/components/profile/ProfileView';
import { BookingView } from '@/components/booking/BookingViewNew';
import { CommunityView } from '@/components/community/CommunityView';
import { TournamentsView } from '@/components/players/TournamentsView';
import { SessionsView } from '@/components/players/SessionsView';
import { StatsView } from '@/components/stats/StatsView';
import { ProgressView } from '@/components/stats/ProgressView';
import { SettingsView } from '@/components/settings/SettingsView';
import { DashboardHome, ProfileSnapshot } from '@/components/dashboards/DashboardHome';
import MessagingPanel from '@/components/dashboards/MessagingPanel';
import { FindNearbyPeople } from '@/components/FindNearbyPeople';
import { FindNearbyCourts } from '@/components/FindNearbyCourts';
import { PlayerSearchChallenge } from '@/components/PlayerSearchChallenge';
import { chatUrlForUser, sendChallengeRequest } from '@/lib/nearby';
import { toast } from '@vico/design-system';
import { Button, Card, DashboardMain, DashboardPanel, DashboardShell, DashboardSidebar, colors, radii, shadows, spacing, sizing, toastOptions, typography } from '@vico/design-system';

export const PlayerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const showProfile = searchParams.get('profile') === 'true';
  const showBooking = searchParams.get('booking') === 'true';
  const showCommunity = searchParams.get('community') === 'true';
  const showTournaments = searchParams.get('tournaments') === 'true';
  const showSessions = searchParams.get('sessions') === 'true';
  const showStats = searchParams.get('stats') === 'true';
  const showProgress = searchParams.get('progress') === 'true';
  const showMessages = searchParams.get('messages') === 'true';
  const showSettings = searchParams.get('settings') === 'true';
  const section = searchParams.get('section');
  const showFindPlayers = section === 'find-players';
  const showFindCourts = section === 'find-courts';
  const [activeNav, setActiveNav] = useState('Home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [feedPost, setFeedPost] = useState('');
  const [playerData, setPlayerData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string>('');

  // Update active nav based on query parameter
  useEffect(() => {
    if (showProfile) {
      setActiveNav('My Profile');
    } else if (showBooking) {
      setActiveNav('Court Booking');
    } else if (showCommunity) {
      setActiveNav('Community');
    } else if (showTournaments) {
      setActiveNav('Tournaments');
    } else if (showSessions) {
      setActiveNav('My Sessions');
    } else if (showStats) {
      setActiveNav('Stats');
    } else if (showProgress) {
      setActiveNav('Progress');
    } else if (showFindPlayers) {
      setActiveNav('Find Players');
    } else if (showFindCourts) {
      setActiveNav('Find Courts');
    } else if (showMessages) {
      setActiveNav('Messages');
    } else if (showSettings) {
      setActiveNav('Settings');
    } else {
      setActiveNav('Home');
    }
  }, [showProfile, showBooking, showCommunity, showTournaments, showSessions, showStats, showProgress, showFindPlayers, showFindCourts, showMessages, showSettings]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1024px)');
    const handleResize = () => setIsMobileView(mediaQuery.matches);
    handleResize();
    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  useEffect(() => {
    if (user?.id) {
      const cacheKey = `player-dashboard-cache:${user.id}`;
      const fetchData = async () => {
        try {
          if (typeof window !== 'undefined') {
            const cachedData = window.localStorage.getItem(cacheKey);
            if (cachedData) {
              try {
                setPlayerData(JSON.parse(cachedData));
              } catch (error) {
                console.warn('Failed to parse cached player data', error);
              }
            }
          }

          const res = await fetch(`/api/dashboard?playerId=${user.id}`);
          const data = await res.json();
          setPlayerData(data);

          if (typeof window !== 'undefined') {
            window.localStorage.setItem(cacheKey, JSON.stringify(data));
          }

          const leaderboardRes = await fetch(`/api/leaderboard?limit=5&playerId=${user.id}`);
          const leaderboardData = await leaderboardRes.json();
          setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);

          // Try to get organization ID (first club membership)
          const orgRes = await fetch(`/api/player/organization?playerId=${user.id}`);
          const orgData = await orgRes.json();
          if (orgData.organizationId) {
            setOrganizationId(orgData.organizationId);
          }
        } catch (err) {
          console.error('Failed to fetch player data:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user?.id]);

  const navItems = [
    { label: 'Home', icon: '🏠', href: undefined }, 
    { label: 'My Profile', icon: '👤', href: '?profile=true' },
    { label: 'My Sessions', icon: '📅', href: '?sessions=true' },
    { label: 'Tournaments', icon: '🏆', href: '?tournaments=true' }, 
    { label: 'Court Booking', icon: '🎾', href: '?booking=true' },
    { label: 'Progress', icon: '📈', href: '?progress=true' },
    { label: 'Find Players', icon: '🧑‍🤝‍🧑', href: '?section=find-players' },
    { label: 'Find Courts', icon: '🏓', href: '?section=find-courts' },
    { label: 'Messages', icon: '💬', href: '?messages=true' },
    { label: 'Stats', icon: '📊', href: '?stats=true' }, 
    { label: 'Community', icon: '👥', href: '?community=true' },
    { label: 'Settings', icon: '⚙️', href: '?settings=true' },
  ];


  const activityFeed = playerData?.activityFeed || [];

  const handleLogout = async () => {
    const storedTokens = getStoredTokens();
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(storedTokens?.accessToken ? { Authorization: `Bearer ${storedTokens.accessToken}` } : {}),
        },
        body: JSON.stringify({ refreshToken: storedTokens?.refreshToken }),
      });
      toast.success('Logged out successfully. 👋', toastOptions);
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed. Please try again.', toastOptions);
    } finally {
      logout();
      router.push('/login');
    }
  };

  const handleChallenge = async (personId: string, personName: string, isFormal: boolean = false) => {
    if (!user?.id) {
      toast.error('Please sign in to challenge a player.', toastOptions);
      return;
    }

    try {
      const result = await sendChallengeRequest(user.id, personId, isFormal);
      toast.success(result?.message || `Challenge sent to ${personName}${isFormal ? ' as a formal challenge' : ''}.`, toastOptions);
    } catch (error) {
      console.error('Challenge error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send challenge.', toastOptions);
    }
  };

  const handleCourtBooking = (courtId: string, courtName: string) => {
    if (!user?.id) {
      toast.error('Please sign in to book a court.', toastOptions);
      return;
    }
    if (!organizationId) {
      toast.error('Please connect a club first before booking a court.', toastOptions);
      return;
    }

    router.push(`/player/booking/details?court=${courtId}&org=${organizationId}&type=singles`);
  };


  if (loading) {
    return <LoadingState icon="🎾" message="Loading dashboard..." />;
  }

  const upcomingMatches = playerData?.upcomingMatches || [];

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    zIndex: 30,
  };

  const sidebarStyle = {
    position: isMobileView ? 'fixed' : 'sticky',
    top: 0,
    left: 0,
    width: isMobileView ? '100%' : sizing.sidebar,
    transform: isMobileView ? (sidebarOpen ? 'translateX(0)' : 'translateX(-108%)') : 'translateX(0)',
    transition: 'transform 0.28s ease',
    zIndex: 40,
    height: '100vh',
    overflowY: 'auto',
    
  } as React.CSSProperties;

  return (
    <DashboardShell>
      {isMobileView && sidebarOpen && <div style={overlayStyle} onClick={() => setSidebarOpen(false)} />}

      <DashboardSidebar style={sidebarStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderBottom: `1px solid ${colors.border}`,
            padding: '15px 14px 10px',
          }}
        >
          <span style={{ fontSize: 20 }}>🎾</span>
          <div style={{ color: colors.primary, fontWeight: 900, fontSize: 14 }}>
            Vico Tennis
          </div>
          {isMobileView && (
            <Button
              variant="secondary"
              size="sm"
              style={{ marginLeft: 'auto', padding: `${spacing.xs} ${spacing.sm}`, borderRadius: radii.lg }}
              onClick={() => setSidebarOpen(false)}
            >
              Close
            </Button>
          )}
        </div>

        <nav style={{ paddingTop: 8, flexShrink: 0 }}>
          {navItems.map((item) => {
            const isActive = activeNav === item.label;
            const targetPath = item.href?.startsWith('/')
              ? item.href
              : `/dashboard/${params?.role || 'player'}/${params?.userId || user?.id}${item.href || ''}`;

            return (
              <button
                key={item.label}
                onClick={() => {
                  if (activeNav !== item.label) {
                    toast.success(`Navigating to ${item.label}`, toastOptions);
                  }
                  setActiveNav(item.label);
                  setSidebarOpen(false);
                  if (item.label === 'Home' && params?.role && params?.userId) {
                    router.push(`/dashboard/${params.role}/${params.userId}`);
                  } else {
                    router.push(targetPath);
                  }
                }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px',
                  backgroundColor: isActive ? colors.surfaceTertiary : 'transparent',
                  border: 'none', cursor: 'pointer', fontSize: 11, textAlign: 'left',
                  color: isActive ? colors.textPrimary : colors.textMuted,
                  borderLeft: isActive ? `3px solid ${colors.primary}` : '3px solid transparent',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={{ flex: 1, minHeight: 24 }} />

        <div className="hidden lg:block" style={{ padding: '0 10px 14px', flexShrink: 0 }}>
          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 9, padding: 11 }}>
            <div style={{ fontWeight: 800, fontSize: 11, marginBottom: 8 }}>📊 Quick Stats</div>
            {[
              { label: 'Upcoming', value: upcomingMatches.length || '0' },
              { label: 'Challenges', value: playerData?.pendingChallenges || '0' },
              { label: 'Sessions', value: playerData?.sessionCount || '0' },
            ].map((metric, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < 2 ? `1px solid ${colors.border}33` : 'none' }}>
                <span style={{ fontSize: 9, color: colors.textMuted }}>{metric.label}</span>
                <span style={{ fontWeight: 800, color: colors.accent, fontSize: 9 }}>{metric.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 10px 14px', flexShrink: 0 }}>
          <div style={{ background: colors.surfaceTertiary, borderRadius: 10, padding: 12, textAlign: 'center' }}>
            {user?.photo ? (
              <img
                src={user.photo}
                alt={user.firstName}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  border: `2.5px solid ${colors.primary}`,
                  objectFit: 'cover',
                  marginBottom: 6,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  display: 'block',
                }}
              />
            ) : (
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: colors.bright,
                  margin: '0 auto 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                }}
              >
                🎾
              </div>
            )}
            <div style={{ fontWeight: 800, fontSize: 12 }}>
              {user?.firstName ?? 'Player'} {user?.lastName ?? ''}
            </div>
            <div style={{ color: colors.textMuted, fontSize: 9, marginTop: 2 }}>Player</div>
            <div className="hidden sm:block" style={{ color: colors.textMuted, fontSize: 8, marginTop: 1, wordBreak: 'break-word' }}>📧 {user?.email || 'No email'}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                onClick={() => {
                  setActiveNav('My Profile');
                  setSidebarOpen(false);
                  if (params?.role && params?.userId) {
                    router.push(`/dashboard/${params.role}/${params.userId}?profile=true`);
                  } else {
                    router.push('?profile=true');
                  }
                }}
                style={{
                  flex: 1,
                  background: colors.dark,
                  color: colors.primary,
                  border: `1px solid ${colors.primary}`,
                  borderRadius: 6,
                  padding: '4px 0',
                  fontSize: 9,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Profile
              </button>
              <button
                onClick={handleLogout}
                style={{
                  flex: 1,
                  background: '#ff6b6b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 0',
                  fontSize: 9,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </DashboardSidebar>

      <DashboardMain style={{ padding: isMobileView ? spacing['2xl'] : spacing.md }}>
        {showProfile ? (
          <DashboardPanel style={{ marginBottom: spacing.lg }}>
            <ProfileView isEmbedded={true} canEdit={true} />
          </DashboardPanel>
        ) : showBooking ? (
          <DashboardPanel style={{ marginBottom: spacing.lg }}>
            <BookingView isEmbedded={true} canBook={true} organizationId={organizationId} />
          </DashboardPanel>
        ) : showMessages ? (
          <DashboardPanel style={{ marginBottom: spacing.lg }}>
            <MessagingPanel userId={user?.id || ''} userType="player" />
          </DashboardPanel>
        ) : showCommunity ? (
          <DashboardPanel style={{ marginBottom: spacing.lg }}>
            <CommunityView isEmbedded={true} />
          </DashboardPanel>
        ) : showTournaments ? (
          <DashboardPanel style={{ marginBottom: spacing.lg }}>
            <TournamentsView isEmbedded={true} playerId={user?.id || ''} />
          </DashboardPanel>
        ) : showSessions ? (
          <DashboardPanel style={{ marginBottom: spacing.lg }}>
            <SessionsView isEmbedded={true} playerId={user?.id} />
          </DashboardPanel>
        ) : showStats ? (
          <DashboardPanel style={{ marginBottom: spacing.lg }}>
            <StatsView isEmbedded={true} playerData={playerData} />
          </DashboardPanel>
        ) : showProgress ? (
          <DashboardPanel style={{ marginBottom: spacing.lg }}>
            <ProgressView isEmbedded={true} playerId={user?.id} />
          </DashboardPanel>
        ) : showFindPlayers ? (
          <DashboardPanel style={{ padding: spacing['2xl'], marginBottom: 0 }}>
            <div style={{ fontSize: typography.fontSize.label, textTransform: 'uppercase', letterSpacing: '0.32em', color: colors.primary, fontWeight: typography.fontWeight.extraBold, marginBottom: spacing.lg }}>Player Tools</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg, marginTop: spacing.md }}>
              <div>
                <h1 style={{ margin: `${spacing.xs} 0`, fontSize: typography.fontSize.h2, fontWeight: typography.fontWeight.extraBold, color: colors.textPrimary }}>
                  Find Players and Send Challenges
                </h1>
                <p style={{ fontSize: typography.fontSize.body, color: colors.textMuted, maxWidth: 560 }}>
                  Search by email, username, or nearby players, then choose a formal or informal challenge option.
                </p>
              </div>
              <PlayerSearchChallenge organizationId={organizationId} />
              <FindNearbyPeople onMessageClick={(personId, personName) => router.push(chatUrlForUser(personId, personName))} onChallengeClick={handleChallenge} />
            </div>
          </DashboardPanel>
        ) : showFindCourts ? (
          <DashboardPanel style={{ padding: spacing['2xl'], marginBottom: 0 }}>
            <div style={{ fontSize: typography.fontSize.label, textTransform: 'uppercase', letterSpacing: '0.32em', color: colors.primary, fontWeight: typography.fontWeight.extraBold, marginBottom: spacing.lg }}>Coach Tools</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg, marginTop: spacing.md }}>
              <div>
                <h1 style={{ margin: `${spacing.xs} 0`, fontSize: typography.fontSize.h2, fontWeight: typography.fontWeight.extraBold, color: colors.textPrimary }}>
                  Find Courts Near You
                </h1>
                <p style={{ fontSize: typography.fontSize.body, color: colors.textMuted, maxWidth: 560 }}>
                  Search nearby courts and book from the dashboard body, while keeping the sidebar visible.
                </p>
              </div>
              <FindNearbyCourts onBookClick={handleCourtBooking} />
            </div>
          </DashboardPanel>
        ) : showSettings ? (
          <DashboardPanel style={{ marginBottom: spacing['2xl'] }}>
            <SettingsView isEmbedded={true} />
          </DashboardPanel>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2xl'] }}>
            <DashboardHome playerData={playerData} upcomingMatches={upcomingMatches} leaderboard={leaderboard} activityFeed={activityFeed} />
          </div>
        )}
      </DashboardMain>
    </DashboardShell>
  );
};
