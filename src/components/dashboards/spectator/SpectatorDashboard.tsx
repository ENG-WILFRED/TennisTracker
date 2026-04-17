'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { chatUrlForUser, sendChallengeRequest } from '@/lib/nearby';
import { FindNearbyPeople } from '@/components/FindNearbyPeople';
import { FindNearbyCourts } from '@/components/FindNearbyCourts';
import { Badge, ActionBtn, SectionCard, G } from './ui';
import {
  Match,
  Player,
  Organization,
  MatchFilter,
  NAV_SECTIONS,
} from './types';
import {
  HomeSection,
  WatchSection,
  PlayersSection,
  OrgsSection,
  ApplySection,
  MatchesSection,
  MessagesSection,
  MembershipSection,
  CommunitySection,
} from './sections';

export const SpectatorDashboard: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { userMemberships, currentRole } = useRole();
  const [activeSection, setActiveSection] = useState('Home');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [matches, setMatches] = useState<Match[]>([]);
  const [liveMatch, setLiveMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [selectedOrgDetails, setSelectedOrgDetails] = useState<Organization | null>(null);

  const [loading, setLoading] = useState(true);
  const [matchFilter, setMatchFilter] = useState<MatchFilter>('all');
  const [matchPage, setMatchPage] = useState(1);
  const [matchSort, setMatchSort] = useState<'latest' | 'oldest'>('latest');
  const [matchLoading, setMatchLoading] = useState(false);
  const [hasMoreMatches, setHasMoreMatches] = useState(false);

  const [applyOrg, setApplyOrg] = useState('');
  const [applyPosition, setApplyPosition] = useState('player');
  const [applyEmail, setApplyEmail] = useState(user?.email || '');
  const [applicationResult, setApplicationResult] = useState('');

  const [paymentStatus, setPaymentStatus] = useState('');
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);

  const [initialChatUserId, setInitialChatUserId] = useState<string | undefined>(undefined);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchMatches = async (page: number, sort: 'latest' | 'oldest') => {
    setMatchLoading(true);
    try {
      const response = await authenticatedFetch(`/api/matches?page=${page}&limit=10&sort=${sort}`);
      if (response.ok) {
        const data = await response.json();
        setMatches(data.items || []);
        setHasMoreMatches(!!data.hasMore);
        const live = (data.items || []).find((match: Match) => match.status === 'ONGOING');
        setLiveMatch(live || null);
      } else {
        setMatches([]);
        setLiveMatch(null);
        setHasMoreMatches(false);
      }
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      setMatches([]);
      setLiveMatch(null);
      setHasMoreMatches(false);
    } finally {
      setMatchLoading(false);
    }
  };

  const fetchPlayers = async () => {
    try {
      const response = await authenticatedFetch('/api/players');
      if (response.ok) {
        const data = await response.json();
        setPlayers(data);
        if (!selectedPlayer && data.length > 0) {
          setSelectedPlayer(data[0]);
        }
      } else {
        setPlayers([]);
      }
    } catch (error) {
      console.error('Failed to fetch players:', error);
      setPlayers([]);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await authenticatedFetch('/api/organization');
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data);
        if (!selectedOrg && data.length > 0) {
          setSelectedOrg(data[0]);
        }
      } else {
        setOrganizations([]);
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      setOrganizations([]);
    }
  };

  const fetchOrganizationDetails = async (orgId: string) => {
    try {
      const response = await authenticatedFetch(`/api/organization/${orgId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedOrgDetails(data);
      } else {
        setSelectedOrgDetails(null);
      }
    } catch (error) {
      console.error('Failed to fetch organization details:', error);
      setSelectedOrgDetails(null);
    }
  };

  const connectWebSocket = (matchId: string) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/matches/ws?matchId=${matchId}`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => console.log('Connected to match websocket');

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'score_update') {
          setMatches((previous) =>
            previous.map((match) =>
              match.id === matchId
                ? { ...match, score: data.score, status: data.status }
                : match
            )
          );

          setLiveMatch((previous) =>
            previous && previous.id === matchId
              ? { ...previous, score: data.score, status: data.status }
              : previous
          );
        }
      } catch (error) {
        console.error('Failed to parse websocket message:', error);
      }
    };

    wsRef.current.onclose = () => {
      reconnectTimeoutRef.current = setTimeout(() => {
        if (liveMatch?.id) connectWebSocket(liveMatch.id);
      }, 5000);
    };

    wsRef.current.onerror = (event) => {
      console.error('WebSocket error:', event);
    };
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([fetchMatches(1, matchSort), fetchPlayers(), fetchOrganizations()]);
      setLoading(false);
    };

    if (user?.id) {
      initializeData();
    }
  }, [user?.id, matchSort]);

  useEffect(() => {
    if (activeSection === 'Matches') {
      fetchMatches(matchPage, matchSort);
    }
  }, [activeSection, matchPage, matchSort]);

  useEffect(() => {
    if (liveMatch?.id) {
      connectWebSocket(liveMatch.id);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [liveMatch?.id]);

  const searchParams = useSearchParams();
  const orgViewId = searchParams?.get('org');
  const viewFullDetails = searchParams?.get('view') === 'full';

  useEffect(() => {
    if (!orgViewId || !organizations.length) return;
    const matchedOrg = organizations.find((org) => org.id === orgViewId);
    if (matchedOrg) {
      setSelectedOrg(matchedOrg);
    }
  }, [orgViewId, organizations]);

  useEffect(() => {
    if (selectedOrg?.id) {
      fetchOrganizationDetails(selectedOrg.id);
    }
  }, [selectedOrg?.id]);

  const filteredMatches = matches.filter((match) => {
    switch (matchFilter) {
      case 'ongoing':
        return match.status === 'ONGOING';
      case 'upcoming':
        return match.status === 'PENDING';
      case 'past':
        return match.status === 'COMPLETED';
      default:
        return true;
    }
  });

  const handleApply = async () => {
    if (!applyEmail || !applyPosition || !applyOrg) {
      setApplicationResult('Please choose an organization, role, and provide your email.');
      return;
    }

    if (!user) {
      setApplicationResult('You must be signed in to apply.');
      return;
    }

    setApplicationResult('Submitting application…');

    try {
      const response = await authenticatedFetch('/api/organization/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: applyOrg,
          role: applyPosition,
          email: applyEmail,
          fullName: `${user.firstName} ${user.lastName}`,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setApplicationResult(result.error || 'Application submission failed.');
      } else {
        setApplicationResult(result.message || 'Application submitted successfully.');
      }
    } catch (error: any) {
      setApplicationResult(error?.message || 'Application submission failed.');
    }
  };

  const purchaseMembership = async (tier: { id?: string; name: string; cost?: number; monthlyPrice?: number }) => {
    if (!user?.id || !selectedOrg?.id) {
      setPaymentStatus('User or organization not available.');
      return;
    }

    const amount = tier.monthlyPrice ?? tier.cost ?? 0;
    if (!amount || amount <= 0) {
      setPaymentStatus('Invalid membership tier selected.');
      return;
    }

    setLoadingPayment(true);
    setPaymentStatus('Creating checkout session…');

    try {
      const response = await authenticatedFetch('/api/payments/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'usd',
          userId: user.id,
          eventId: selectedOrg.id,
          bookingType: 'membership_purchase',
          metadata: {
            membershipTier: tier.name,
            organization: selectedOrg.name,
            membershipTierId: tier.id,
          },
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        setPaymentStatus(result.error || 'Payment session creation failed.');
      } else if (result.checkoutUrl) {
        setPaymentStatus(`Ready for checkout — ${tier.name} tier.`);
        window.open(result.checkoutUrl, '_blank');
      } else {
        setPaymentStatus('Checkout URL not returned.');
      }
    } catch (error: any) {
      setPaymentStatus(error?.message || 'Payment request failed.');
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setMobileNavOpen(false);
    // Clear initial chat user ID when switching sections
    if (section !== 'Messages') {
      setInitialChatUserId(undefined);
    }
  };

  const handleApplyRole = (orgId: string, role: string) => {
    setApplyOrg(orgId);
    setApplyPosition(role);
    setActiveSection('Apply');
  };

  const handleExploreMemberships = () => {
    setActiveSection('Membership');
  };

  const handleViewFullDetails = (orgId: string) => {
    router.push(`/organization/${orgId}`);
  };

  const handleMessageClick = (personId: string, personName: string) => {
    setInitialChatUserId(personId);
    setActiveSection('Messages');
  };

  const handleChallenge = async (personId: string, personName: string) => {
    if (!user?.id) {
      window.alert('Please sign in to send a challenge.');
      return;
    }

    try {
      await sendChallengeRequest(user.id, personId);
      window.alert(`Challenge request sent to ${personName}.`);
    } catch (error: any) {
      window.alert(error?.message || 'Failed to send challenge request.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      router.push('/login');
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ background: G.card }}>
              <div className="w-8 h-8 border-4 border-transparent rounded-full animate-spin" style={{ borderTopColor: G.lime }} />
            </div>
            <p style={{ color: G.muted }}>Loading spectator dashboard...</p>
          </div>
        </div>
      );
    }

    switch (activeSection) {
      case 'Watch Match':
        return liveMatch ? <WatchSection match={liveMatch} /> : (
          <SectionCard title="No Live Match" subtitle="Check back later for live matches">
            <p style={{ color: G.muted }}>There are no matches currently in progress.</p>
          </SectionCard>
        );
      case 'Matches':
        return (
          <MatchesSection
            matches={filteredMatches}
            filter={matchFilter}
            setFilter={setMatchFilter}
            page={matchPage}
            setPage={setMatchPage}
            sort={matchSort}
            setSort={setMatchSort}
            hasMore={hasMoreMatches}
            loading={matchLoading}
          />
        );
      case 'Players':
        return <PlayersSection players={players} selectedPlayer={selectedPlayer} setSelectedPlayer={setSelectedPlayer} />;
      case 'Organizations':
        return (
          <OrgsSection
            orgs={organizations}
            selectedOrg={selectedOrg}
            selectedOrgDetails={selectedOrgDetails}
            setSelectedOrg={setSelectedOrg}
            onExploreMemberships={handleExploreMemberships}
            onApplyRole={handleApplyRole}
            onViewFullDetails={handleViewFullDetails}
            viewFullDetails={viewFullDetails}
            purchaseMembership={purchaseMembership}
            loadingPayment={loadingPayment}
            paymentStatus={paymentStatus}
          />
        );
      case 'Apply':
        return (
          <ApplySection
            orgs={organizations}
            applyOrg={applyOrg}
            setApplyOrg={setApplyOrg}
            applyPosition={applyPosition}
            setApplyPosition={setApplyPosition}
            applyEmail={applyEmail}
            setApplyEmail={setApplyEmail}
            handleApply={handleApply}
            applicationResult={applicationResult}
          />
        );
      case 'Membership':
        return (
          <MembershipSection
            selectedOrg={selectedOrg}
            selectedOrgDetails={selectedOrgDetails}
            purchaseMembership={purchaseMembership}
            loadingPayment={loadingPayment}
            paymentStatus={paymentStatus}
          />
        );
      case 'Messages':
        return user?.id ? (
          <MessagesSection userId={user.id} initialChatUserId={initialChatUserId} />
        ) : (
          <SectionCard title="Messages" subtitle="Loading your messaging panel">
            <p style={{ color: G.muted }}>Initializing messages...</p>
          </SectionCard>
        );
      case 'Community':
        return (
          <CommunitySection
            suggestedUsers={suggestedUsers}
            followingUsers={followingUsers}
            onFollow={(userId: string) => {
              const newFollowing = new Set(followingUsers);
              newFollowing.add(userId);
              setFollowingUsers(newFollowing);
            }}
          />
        );
      default:
        return (
          <HomeSection
            user={user}
            memberships={userMemberships}
            currentRole={currentRole}
            match={liveMatch}
            matches={matches}
            players={players}
            selectedOrg={selectedOrg}
            setActiveSection={handleSectionChange}            onMessageClick={handleMessageClick}
            onChallengeClick={handleChallenge}          />
        );
    }
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row" style={{ background: G.dark, color: G.text, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <header
        className="lg:hidden flex items-center justify-between px-4 py-3 border-b"
        style={{ background: G.sidebar, borderColor: G.cardBorder }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🎾</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: G.lime }}>Spectator Dashboard</p>
            <p className="text-xs" style={{ color: G.muted }}>{user?.firstName} {user?.lastName}</p>
          </div>
        </div>
        <button
          onClick={() => setMobileNavOpen(true)}
          className="rounded-xl px-3 py-2 text-xs font-semibold"
          style={{ background: G.mid, color: G.text }}
        >
          Menu
        </button>
      </header>

      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r lg:relative lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen transition-transform duration-300 ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        style={{ background: G.sidebar, borderColor: G.cardBorder, display: 'flex', flexDirection: 'column', flexShrink: 0, paddingBottom: 14 }}
      >
        <div style={{ padding: '15px 14px 10px', borderBottom: `1px solid ${G.cardBorder}`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 20 }}>🎾</span>
          <div style={{ color: G.lime, fontWeight: 900, fontSize: 14 }}>Spectator Hub</div>
          <button
            className="lg:hidden ml-auto rounded-md px-2 py-1 text-xs font-semibold"
            style={{ background: G.card, color: G.text, border: `1px solid ${G.cardBorder}` }}
            onClick={() => setMobileNavOpen(false)}
          >
            Close
          </button>
        </div>

        <nav style={{ paddingTop: 8, flexShrink: 0 }}>
          {NAV_SECTIONS.map((section) => (
            <button
              key={section.label}
              onClick={() => {
                handleSectionChange(section.label);
                setMobileNavOpen(false);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 13px',
                background: activeSection === section.label ? G.mid : 'transparent',
                color: activeSection === section.label ? '#fff' : G.muted,
                border: 'none',
                cursor: 'pointer',
                fontSize: 11,
                textAlign: 'left',
                borderLeft: activeSection === section.label ? `3px solid ${G.lime}` : '3px solid transparent',
              }}
            >
              <span>{section.icon}</span>
              <span className="truncate">{section.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ flex: 1, minHeight: 12, flexShrink: 0 }} />

        <div style={{ padding: '0 10px 14px', flexShrink: 0 }}>
          <div style={{ background: G.mid, borderRadius: 10, padding: 12, textAlign: 'center' }}>
            {user?.photo ? (
              <img
                src={user.photo}
                alt={user.firstName}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  border: `2.5px solid ${G.lime}`,
                  objectFit: 'cover',
                  marginBottom: 6,
                }}
              />
            ) : (
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: G.bright,
                  margin: '0 auto 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                }}
              >
                👀
              </div>
            )}
            <div style={{ fontWeight: 800, fontSize: 12 }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ color: G.muted, fontSize: 9, marginTop: 2 }}>Spectator</div>
            <div className="hidden sm:block" style={{ color: G.muted, fontSize: 8, marginTop: 1, wordBreak: 'break-word' }}>
              📧 {user?.email}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleLogout}
                className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold"
                style={{ background: '#ff5e5e', color: '#fff', border: 'none' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden" style={{ minWidth: 0 }}>
        <div className="h-full overflow-y-auto" style={{ padding: '24px' }}>
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: G.text }}>
                  {activeSection === 'Home' ? 'Spectator Hub' : activeSection}
                </h1>
                <p className="text-sm leading-6 max-w-2xl mt-2" style={{ color: G.muted }}>
                  {activeSection === 'Home'
                    ? 'Your live match dashboard, club updates, and community activity in one place.'
                    : `Explore ${activeSection.toLowerCase()} details and stay connected to the action.`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge color={G.lime}>Live Viewer</Badge>
              <div
                className="rounded-2xl px-3 py-2 text-xs font-semibold"
                style={{ background: G.card2, border: `1px solid ${G.cardBorder}`, color: G.text }}
              >
                {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};
