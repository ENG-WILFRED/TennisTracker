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
import { StatsView } from '@/components/stats/StatsView';
import { ProgressView } from '@/components/stats/ProgressView';
import { SettingsView } from '@/components/settings/SettingsView';
import { DashboardHome, ProfileSnapshot } from '@/components/dashboards/DashboardHome';
import MessagingPanel from '@/components/dashboards/MessagingPanel';
import { FindNearbyPeople } from '@/components/FindNearbyPeople';
import { FindNearbyCourts } from '@/components/FindNearbyCourts';
import { chatUrlForUser, sendChallengeRequest } from '@/lib/nearby';
import { MembershipSwitcher } from '@/components/MembershipSwitcher';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

export const PlayerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const showProfile = searchParams.get('profile') === 'true';
  const showBooking = searchParams.get('booking') === 'true';
  const showCommunity = searchParams.get('community') === 'true';
  const showTournaments = searchParams.get('tournaments') === 'true';
  const showStats = searchParams.get('stats') === 'true';
  const showProgress = searchParams.get('progress') === 'true';
  const showMessages = searchParams.get('messages') === 'true';
  const showSettings = searchParams.get('settings') === 'true';
  const [activeNav, setActiveNav] = useState('Home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [feedPost, setFeedPost] = useState('');
  const [playerData, setPlayerData] = useState<any>(null);
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
    } else if (showStats) {
      setActiveNav('Stats');
    } else if (showProgress) {
      setActiveNav('Progress');
    } else if (showMessages) {
      setActiveNav('Messages');
    } else if (showSettings) {
      setActiveNav('Settings');
    } else {
      setActiveNav('Home');
    }
  }, [showProfile, showBooking, showCommunity, showTournaments, showStats, showProgress, showMessages, showSettings]);

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
    { label: 'Tournaments', icon: '🏆', href: '?tournaments=true' }, 
    { label: 'Court Booking', icon: '📅', href: '?booking=true' },
    { label: 'Progress', icon: '📈', href: '?progress=true' },
    { label: 'Services', icon: '🛠️', href: '/services' },
    { label: 'Messages', icon: '💬', href: '?messages=true' },
    { label: 'Stats', icon: '📊', href: '?stats=true' }, 
    { label: 'Community', icon: '👥', href: '?community=true' },
    { label: 'Settings', icon: '⚙️', href: '?settings=true' },
  ];

  const leaderboard = [
    { rank: 1, name: 'Adam Brown', pts: 1250 }, { rank: 2, name: 'David Lee', pts: 1185 },
    { rank: 3, name: 'Mark Taylor', pts: 1100 }, { rank: 4, name: 'Chris Maina', pts: 1050 },
    { rank: 5, name: 'John Smith', pts: 990 },
  ];

  const activityFeed = [
    { user: 'Sarah', avatar: '👩', action: 'posted: "Great match today! 🎾 #tennislife"', time: '15 mins ago' },
    { user: 'Mike', avatar: '👨', action: 'commented on your photo: "Nice shot, John!"', time: '30 mins ago' },
    { user: 'Emily', avatar: '👧', action: 'shared an event: "Saturday Tennis Social - Join us!"', time: '10 mins ago' },
    { user: 'Coach David', avatar: '👨‍🏫', action: 'posted a training tip: "Focus on your serve stance!"', time: '1h ago' },
  ];

  const upcomingEvents = [
    { name: 'Doubles Clinic', date: 'May 24', icon: '🎾' },
    { name: 'Junior Tournament', date: 'May 30', icon: '🏆' },
    { name: 'Social Mixer', date: 'June 5', icon: '🎉' },
  ];

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
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      router.push('/login');
    }
  };

  const handleChallenge = async (personId: string, personName: string) => {
    if (!user?.id) {
      alert('Please sign in to challenge a player.');
      return;
    }

    try {
      const result = await sendChallengeRequest(user.id, personId);
      alert(result?.message || `Challenge sent to ${personName}.`);
    } catch (error) {
      console.error('Challenge error:', error);
      alert(error instanceof Error ? error.message : 'Failed to send challenge.');
    }
  };

  const handleCourtBooking = (courtId: string, courtName: string) => {
    if (!user?.id) {
      alert('Please sign in to book a court.');
      return;
    }
    if (!organizationId) {
      alert('Please connect a club first before booking a court.');
      return;
    }

    router.push(`/player/booking/details?court=${courtId}&org=${organizationId}&type=singles`);
  };

  const friendsOnline: { name: string; status: 'online' | 'away' | 'offline'; avatar: string }[] = [
    { name: 'Michael', status: 'online', avatar: '👦' }, { name: 'Lisa', status: 'online', avatar: '👩' },
    { name: 'Tom', status: 'away', avatar: '👨' }, { name: 'Anna', status: 'online', avatar: '👧' },
  ];

  if (loading) {
    return <LoadingState icon="🎾" message="Loading dashboard..." />;
  }

  const upcomingMatches = playerData?.upcomingMatches || [
    { opponent: 'Alex Carter', date: 'Tomorrow, 3:00 PM', court: 'Court 2', type: 'Singles' },
    { opponent: 'David Lee', date: 'Fri, 5:00 PM', court: 'Court 1', type: 'Singles' },
  ];

  return (
    <div className="text-court-text flex flex-col lg:flex-row" style={{ height: '100vh', background: G.sidebar, color: G.text, overflow: 'hidden' }}>

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[#2d5a35] flex-shrink-0" style={{ background: G.sidebar }}>
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[#2d5a35] text-[#7aaa6a] hover:bg-[#1e3a20] transition"
          aria-label="Open navigation"
        >
          ☰
        </button>
        <div className="text-sm font-semibold">Player Dashboard</div>
        <div className="text-xs text-[#7aaa6a] truncate">{user?.firstName ?? 'Player'}</div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 w-72 max-w-[80vw] transform border-r lg:relative lg:translate-x-0 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:w-72 lg:translate-x-0`} style={{ background: G.sidebar, borderColor: G.cardBorder, display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh', overflow: 'hidden' }}>
        <div className="flex items-center justify-between gap-3 px-4 py-4 lg:hidden">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎾</span>
            <div>
              <div className="text-court-lime font-black text-sm">Vico Tennis</div>
              <div className="text-[11px] text-[#7aaa6a]">Player Dashboard</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-[#2d5a35] text-[#7aaa6a] hover:bg-[#1e3a20] transition"
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>
        <div className="hidden lg:flex items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎾</span>
            <div>
              <div className="text-court-lime font-black text-sm">Vico Tennis</div>
              <div className="text-[11px] text-[#7aaa6a]">Player Dashboard</div>
            </div>
          </div>
          <div className="text-xs text-[#7aaa6a] truncate">{user?.firstName ?? 'Player'}</div>
        </div>

        <div className="flex-1 px-4 pb-4 overflow-y-auto">
          <div className="flex flex-col gap-2">
            {navItems.map(item => {
              const isActive = activeNav === item.label;
              const buttonClasses = `w-full flex items-center gap-2 px-3 py-2 text-[11px] text-left rounded-xl transition-all ${isActive ? 'bg-[#2d5a27] border-l-4 border-[#7dc142] text-white' : 'bg-[#152515] text-[#7aaa6a] hover:border-l-4 hover:border-[#7dc142] hover:text-white'}`;
              const targetPath = item.href?.startsWith('/')
                ? item.href
                : `/dashboard/${params?.role || 'player'}/${params?.userId || user?.id}${item.href || ''}`;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setActiveNav(item.label);
                    setSidebarOpen(false);
                    if (item.label === 'Home' && params?.role && params?.id) {
                      router.push(`/dashboard/${params.role}/${params.userId}`);
                    } else {
                      router.push(targetPath);
                    }
                  }}
                  className={buttonClasses}
                >
                  <span>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={() => {
              setActiveNav('Court Booking');
              setSidebarOpen(false);
              if (params?.role && params?.id) {
                router.push(`/dashboard/${params.role}/${params.userId}?booking=true`);
              }
            }}
            className="w-full rounded-xl py-3 font-bold text-[12px] bg-gradient-to-r from-[#7dc142] to-[#a8d84e] text-[#0f1f0f] hover:opacity-90 transition-opacity"
          >
            🎾 Book a Court
          </button>
          <div className="mt-4">
            <ProfileSnapshot user={user} playerData={playerData} showViewProfileButton={false} />
          </div>
          <MembershipSwitcher style={{ marginTop: 8 }} />
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              type="button"
              onClick={() => {
                setActiveNav('My Profile');
                setSidebarOpen(false);
                if (params?.role && params?.id) {
                  router.push(`/dashboard/${params.role}/${params.userId}?profile=true`);
                } else {
                  router.push('?profile=true');
                }
              }}
              className="rounded-xl py-3 text-[12px] font-bold bg-[#2d5a27] text-[#7dc142] hover:bg-[#3d7a32] transition-colors"
            >
              View Profile
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl py-3 text-[12px] font-bold bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 px-3 py-4 sm:px-5 sm:py-5 overflow-y-auto" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="space-y-4">
          {showProfile ? (
            <ProfileView isEmbedded={true} canEdit={true} />
          ) : showBooking ? (
            <BookingView isEmbedded={true} canBook={true} organizationId={organizationId} />
          ) : showMessages ? (
            <MessagingPanel userId={user?.id || ''} userType="player" />
          ) : showCommunity ? (
            <CommunityView isEmbedded={true} />
          ) : showTournaments ? (
            <TournamentsView isEmbedded={true} playerId={user?.id || ''} />
          ) : showStats ? (
            <StatsView isEmbedded={true} playerData={playerData} />
          ) : showProgress ? (
            <ProgressView isEmbedded={true} playerId={user?.id} />
          ) : showSettings ? (
            <SettingsView isEmbedded={true} />
          ) : (
            <div className="space-y-4">
              <DashboardHome playerData={playerData} upcomingMatches={upcomingMatches} leaderboard={leaderboard} activityFeed={activityFeed} />
              <div className="grid gap-4 xl:grid-cols-2">
                <FindNearbyPeople
                  onMessageClick={(personId, personName) => router.push(chatUrlForUser(personId, personName))}
                  onChallengeClick={handleChallenge}
                />
                <FindNearbyCourts onBookClick={handleCourtBooking} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
