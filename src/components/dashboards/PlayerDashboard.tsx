'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ProfileView } from '@/components/profile/ProfileView';
import { BookingView } from '@/components/booking/BookingView';
import { CommunityView } from '@/components/community/CommunityView';
import { TournamentsView } from '@/components/tournaments/TournamentsView';
import { StatsView } from '@/components/stats/StatsView';
import { SettingsView } from '@/components/settings/SettingsView';
import { DashboardHome, ProfileSnapshot, UpcomingEvents, FriendsOnline } from '@/components/dashboards/DashboardHome';
import { PaymentRemindersWidget } from '@/components/dashboards/PaymentRemindersWidget';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

export const PlayerDashboard: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const showProfile = searchParams.get('profile') === 'true';
  const showBooking = searchParams.get('booking') === 'true';
  const showCommunity = searchParams.get('community') === 'true';
  const showTournaments = searchParams.get('tournaments') === 'true';
  const showStats = searchParams.get('stats') === 'true';
  const showSettings = searchParams.get('settings') === 'true';
  const [activeNav, setActiveNav] = useState('Home');
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
    } else if (showSettings) {
      setActiveNav('Settings');
    } else {
      setActiveNav('Home');
    }
  }, [showProfile, showBooking, showCommunity, showTournaments, showStats, showSettings]);

  useEffect(() => {
    if (user?.id) {
      const fetchData = async () => {
        try {
          const res = await fetch(`/api/dashboard?playerId=${user.id}`);
          const data = await res.json();
          setPlayerData(data);
          
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
    { label: 'Services', icon: '🛠️', href: '/services' },
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

  const friendsOnline: { name: string; status: 'online' | 'away' | 'offline'; avatar: string }[] = [
    { name: 'Michael', status: 'online', avatar: '👦' }, { name: 'Lisa', status: 'online', avatar: '👩' },
    { name: 'Tom', status: 'away', avatar: '👨' }, { name: 'Anna', status: 'online', avatar: '👧' },
  ];

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-court-dark text-court-text"><div>Loading...</div></div>;
  }

  const upcomingMatches = playerData?.upcomingMatches || [
    { opponent: 'Alex Carter', date: 'Tomorrow, 3:00 PM', court: 'Court 2', type: 'Singles' },
    { opponent: 'David Lee', date: 'Fri, 5:00 PM', court: 'Court 1', type: 'Singles' },
  ];

  return (
    <div className="min-h-screen text-court-text flex" style={{ background: G.sidebar, color: G.text }}>

      {/* ── LEFT SIDEBAR ── */}
      <aside style={{ width: 192, background: G.sidebar, borderRight: `1px solid ${G.cardBorder}`, padding: '12px 14px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ paddingBottom: 12, borderBottom: `1px solid ${G.cardBorder}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="text-2xl">🎾</span>
          <div><div className="text-court-lime font-black text-sm">Vico Tennis</div></div>
        </div>
        <nav style={{ flex: 1, paddingTop: 8 }}>
          {navItems.map(item => 
            item.href ? (
              <Link key={item.label} href={item.href}>
                <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 14, paddingRight: 14, paddingTop: 10, paddingBottom: 10, fontSize: 12, textAlign: 'left', borderTop: 'none', borderRight: 'none', borderBottom: 'none', borderLeft: `3px solid ${activeNav === item.label ? G.lime : 'transparent'}`, transition: 'all 0.2s', background: activeNav === item.label ? G.mid : 'transparent', color: activeNav === item.label ? 'white' : G.muted, cursor: 'pointer' }} className="hover:text-court-text">
                  <span>{item.icon}</span>{item.label}
                </button>
              </Link>
            ) : (
              <button key={item.label} onClick={() => {
                setActiveNav(item.label);
                if (item.label === 'Home' && params?.role && params?.id) {
                  router.push(`/dashboard/${params.role}/${params.id}`);
                } else if (item.label === 'Court Booking' && params?.role && params?.id) {
                  router.push(`/dashboard/${params.role}/${params.id}?booking=true`);
                } else if (item.label === 'Community' && params?.role && params?.id) {
                  router.push(`/dashboard/${params.role}/${params.id}?community=true`);
                } else if (item.label === 'Tournaments' && params?.role && params?.id) {
                  router.push(`/dashboard/${params.role}/${params.id}?tournaments=true`);
                } else if (item.label === 'Stats' && params?.role && params?.id) {
                  router.push(`/dashboard/${params.role}/${params.id}?stats=true`);
                } else if (item.label === 'Settings' && params?.role && params?.id) {
                  router.push(`/dashboard/${params.role}/${params.id}?settings=true`);
                }
              }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 14, paddingRight: 14, paddingTop: 10, paddingBottom: 10, fontSize: 12, textAlign: 'left', borderTop: 'none', borderRight: 'none', borderBottom: 'none', borderLeft: `3px solid ${activeNav === item.label ? G.lime : 'transparent'}`, transition: 'all 0.2s', background: activeNav === item.label ? G.mid : 'transparent', color: activeNav === item.label ? 'white' : G.muted, cursor: 'pointer' }} className="hover:text-court-text">
                <span>{item.icon}</span>{item.label}
              </button>
            )
          )}
        </nav>
        <div style={{ paddingLeft: 12, paddingRight: 12, paddingBottom: 8, paddingTop: 8 }}>
          <button
            onClick={() => {
              setActiveNav('Court Booking');
              if (params?.role && params?.id) {
                router.push(`/dashboard/${params.role}/${params.id}?booking=true`);
              }
            }}
            style={{ width: '100%', backgroundImage: `linear-gradient(to right, ${G.lime}, ${G.bright})`, border: 'none', color: '#0f1f0f', borderRadius: 6, padding: '10px 0', fontWeight: 800, fontSize: 12, cursor: 'pointer', opacity: 0.9 }}
            className="hover:opacity-100 transition-opacity"
          >
            🎾 Book a Court
          </button>
        </div>
        <div style={{ marginLeft: 10, marginRight: 10, marginBottom: 12, background: G.mid, borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 10, color: G.accent, fontWeight: 800, letterSpacing: '0.05em' }}>UPCOMING EVENT</div>
          <div style={{ fontSize: 12, fontWeight: 800, marginTop: 6 }}>Club Tournament</div>
          <div style={{ fontSize: 12, color: G.muted, marginTop: 6 }}>Saturday, May 28</div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 p-3 flex flex-col gap-3" style={{ background: G.sidebar }} >{showProfile ? (
          <ProfileView isEmbedded={true} canEdit={true} />
        ) : showBooking ? (
          <BookingView isEmbedded={true} canBook={true} organizationId={organizationId} />
        ) : showCommunity ? (
          <CommunityView isEmbedded={true} />
        ) : showTournaments ? (
          <TournamentsView isEmbedded={true} />
        ) : showStats ? (
          <StatsView isEmbedded={true} playerData={playerData} />
        ) : showSettings ? (
          <SettingsView isEmbedded={true} />
        ) : (
          <DashboardHome playerData={playerData} upcomingMatches={upcomingMatches} leaderboard={leaderboard} activityFeed={activityFeed} />
        )}
      </main>

      {/* ── RIGHT SIDEBAR ── */}
      <aside style={{ width: 188, background: G.sidebar, borderLeft: `2px solid ${G.lime}`, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0, minWidth: 188 }}>
        <ProfileSnapshot user={user} playerData={playerData} />

        <PaymentRemindersWidget />

        <UpcomingEvents events={upcomingEvents} />

        <FriendsOnline friends={friendsOnline} />
      </aside>
    </div>
  );
};
