'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const G = {
  dark: '#0f1f0f',
  sidebar: '#152515',
  card: '#1a3020',
  cardBorder: '#2d5a35',
  mid: '#2d5a27',
  bright: '#3d7a32',
  lime: '#7dc142',
  accent: '#a8d84e',
  text: '#e8f5e0',
  muted: '#7aaa6a',
  yellow: '#f0c040',
  red: '#e05050',
  blue: '#4ab0d0',
};

interface Player {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  name: string;
  username: string;
  email: string;
  photo?: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  winRate: string | number;
  sessionsCompleted?: number;
  lastSessionAt?: string;
  joinedAt?: string;
  status?: string;
  createdAt: string;
}

interface OrganizationPlayersProps {
  orgId?: string;
  coachUserId?: string;
}

export default function OrganizationPlayersSection({ orgId, coachUserId }: OrganizationPlayersProps) {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [managedPlayers, setManagedPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'managed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sendingMessage, setSendingMessage] = useState<string | null>(null);
  const [recruiting, setRecruiting] = useState<string | null>(null);
  const [selectedPlayerAnalytics, setSelectedPlayerAnalytics] = useState<Player | null>(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    if (orgId) {
      fetchPlayers();
    }
  }, [orgId, coachUserId]);

  async function fetchPlayers() {
    if (!orgId) {
      console.warn('⚠️ OrganizationPlayersSection: No orgId provided');
      setLoading(false);
      return;
    }

    console.log('🔍 Fetching players for org:', orgId);
    try {
      setLoading(true);

      // Fetch all organization players
      const allRes = await fetch(`/api/organization/${orgId}/players`);
      if (allRes.ok) {
        const allData = await allRes.json();
        console.log('✅ Fetched all players:', allData?.length);
        setAllPlayers(allData || []);
      } else {
        console.error('❌ Failed to fetch all players:', allRes.status, allRes.statusText);
      }

      // If user is a coach, fetch their managed players
      if (coachUserId) {
        const managedRes = await fetch(`/api/organization/${orgId}/players?type=managed&coachId=${coachUserId}`);
        if (managedRes.ok) {
          const managedData = await managedRes.json();
          console.log('✅ Fetched managed players:', managedData?.length);
          setManagedPlayers(managedData || []);
        } else {
          console.error('❌ Failed to fetch managed players:', managedRes.status, managedRes.statusText);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching players:', error);
      toast.error('Failed to load players');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage(playerId: string, playerEmail: string) {
    try {
      setSendingMessage(playerId);
      const res = await fetch('/api/chat/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserEmail: playerEmail }),
      });

      if (!res.ok) throw new Error('Failed to create message');

      toast.success('Message opened! You can start chatting now.');
      // TODO: Optionally redirect to chat or open chat modal
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(null);
    }
  }

  async function handleRecruitPlayer(playerId: string, playerName: string) {
    if (!coachUserId) {
      toast.error('Coach ID not found');
      return;
    }

    try {
      setRecruiting(playerId);
      const res = await fetch(`/api/coaches/recruit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId: coachUserId,
          playerId: playerId,
          orgId: orgId,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to recruit player');
      }

      toast.success(`${playerName} has been recruited!`);
      // Refresh the players list
      fetchPlayers();
    } catch (error) {
      console.error('Error recruiting player:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to recruit player');
    } finally {
      setRecruiting(null);
    }
  }

  async function loadAnalytics(player: Player) {
    try {
      setAnalyticsLoading(true);
      setSelectedPlayerAnalytics(player);
      setShowAnalyticsModal(true);

      const res = await fetch(`/api/coaches/player-analytics/${player.userId}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Failed to load analytics');
      }

      const data = await res.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  }

  function getPlayerStats(player: Player) {
    return {
      level: player.matchesWon > 20 ? 'Advanced' : player.matchesWon > 10 ? 'Intermediate' : 'Beginner',
      winRate: typeof player.winRate === 'string' ? parseFloat(player.winRate) : player.winRate,
      sessionsCompleted: player.sessionsCompleted || 0,
    };
  }

  function renderPlayerCard(player: Player, showManageButton = false) {
    const stats = getPlayerStats(player);
    const joinDate = player.joinedAt ? new Date(player.joinedAt).toLocaleDateString() : 'N/A';

    return (
      <div
        key={player.id}
        style={{
          background: G.card,
          border: `1px solid ${G.cardBorder}`,
          borderRadius: 10,
          padding: 14,
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: player.photo ? `url(${player.photo})` : G.dark,
            border: `2px solid ${G.bright}`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: G.accent,
            flexShrink: 0,
          }}
        >
          {!player.photo && `${player.firstName.charAt(0)}${player.lastName.charAt(0)}`}
        </div>

        {/* Player Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
            {player.firstName} {player.lastName}
          </div>
          <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>
            @{player.username} • {player.email}
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 10, color: G.muted }}>Level</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: G.lime }}>{stats.level}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: G.muted }}>Matches</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: G.accent }}>
                {player.matchesPlayed}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: G.muted }}>Win Rate</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: G.blue }}>
                {stats.winRate.toFixed(1)}%
              </div>
            </div>
            {showManageButton && (
              <div>
                <div style={{ fontSize: 10, color: G.muted }}>Sessions</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: G.yellow }}>
                  {stats.sessionsCompleted}
                </div>
              </div>
            )}
          </div>

          {/* Join Date Info */}
          {showManageButton && player.joinedAt && (
            <div style={{ fontSize: 10, color: G.muted, marginBottom: 8 }}>
              Joined: {joinDate}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {/* View Profile Button */}
          <Link
            href={`/players/profile/${player.userId}`}
            style={{
              background: G.blue,
              color: G.text,
              border: 'none',
              borderRadius: 6,
              padding: '8px 12px',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 0.2s',
              textDecoration: 'none',
              display: 'inline-block',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = '#5ab5d8';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = G.blue;
            }}
          >
            👤 Profile
          </Link>

          {/* Message Button - Always show */}
          <button
            onClick={() => handleSendMessage(player.id, player.email)}
            disabled={sendingMessage === player.id}
            style={{
              background: sendingMessage === player.id ? G.muted : G.bright,
              color: G.text,
              border: 'none',
              borderRadius: 6,
              padding: '8px 12px',
              fontSize: 11,
              fontWeight: 600,
              cursor: sendingMessage === player.id ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              if (sendingMessage !== player.id) {
                (e.target as HTMLButtonElement).style.background = G.lime;
              }
            }}
            onMouseLeave={(e) => {
              if (sendingMessage !== player.id) {
                (e.target as HTMLButtonElement).style.background = G.bright;
              }
            }}
          >
            {sendingMessage === player.id ? '⏳...' : '💬 Message'}
          </button>

          {/* View Analytics Button - Show for managed players */}
          {showManageButton && (
            <button
              onClick={() => loadAnalytics(player)}
              style={{
                background: G.bright,
                color: G.text,
                border: 'none',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = G.lime;
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = G.bright;
              }}
            >
              📊 Analytics
            </button>
          )}

          {/* Recruit Button - Show for "All Players" tab when not already managed */}
          {!showManageButton && !managedPlayers.some((mp) => mp.id === player.id) && (
            <button
              onClick={() => handleRecruitPlayer(player.id, `${player.firstName} ${player.lastName}`)}
              disabled={recruiting === player.id}
              style={{
                background: recruiting === player.id ? G.muted : '#2d7a32',
                color: G.text,
                border: 'none',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: 11,
                fontWeight: 600,
                cursor: recruiting === player.id ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                if (recruiting !== player.id) {
                  (e.target as HTMLButtonElement).style.background = '#3a9a42';
                }
              }}
              onMouseLeave={(e) => {
                if (recruiting !== player.id) {
                  (e.target as HTMLButtonElement).style.background = '#2d7a32';
                }
              }}
            >
              {recruiting === player.id ? '⏳...' : '✚ Recruit'}
            </button>
          )}
        </div>
      </div>
    );
  }

  const displayPlayers = activeTab === 'managed' ? managedPlayers : allPlayers;
  const filteredPlayers = displayPlayers.filter(
    (p) =>
      p.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>My Players</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: G.lime }}>
            {loading ? '-' : managedPlayers.length}
          </div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>Total Players</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: G.accent }}>
            {loading ? '-' : allPlayers.length}
          </div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>Available to Recruit</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: G.blue }}>
            {loading ? '-' : Math.max(0, allPlayers.length - managedPlayers.length)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, borderBottom: `1px solid ${G.cardBorder}`, paddingBottom: 12 }}>
        <button
          onClick={() => setActiveTab('managed')}
          style={{
            background: activeTab === 'managed' ? G.bright : 'transparent',
            color: activeTab === 'managed' ? G.text : G.muted,
            border: 'none',
            padding: '10px 16px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'managed') {
              (e.target as HTMLButtonElement).style.color = G.text;
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'managed') {
              (e.target as HTMLButtonElement).style.color = G.muted;
            }
          }}
        >
          👨‍🏫 My Players ({managedPlayers.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            background: activeTab === 'all' ? G.bright : 'transparent',
            color: activeTab === 'all' ? G.text : G.muted,
            border: 'none',
            padding: '10px 16px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'all') {
              (e.target as HTMLButtonElement).style.color = G.text;
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'all') {
              (e.target as HTMLButtonElement).style.color = G.muted;
            }
          }}
        >
          🎾 All Players ({allPlayers.length})
        </button>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="text"
          placeholder={`Search ${activeTab === 'managed' ? 'my players' : 'players'}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            background: G.dark,
            border: `1px solid ${G.cardBorder}`,
            borderRadius: 6,
            padding: '10px 12px',
            color: G.text,
            fontSize: 12,
            outline: 'none',
          }}
        />
        <button
          onClick={() => setSearchQuery('')}
          style={{
            background: G.mid,
            color: G.text,
            border: 'none',
            borderRadius: 6,
            padding: '10px 12px',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>

      {/* Players List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!orgId ? (
          <div style={{ textAlign: 'center', padding: 20, color: G.red }}>
            ❌ Error: Organization ID not found. Please make sure you're logged in as an organization admin.
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: 20, color: G.muted }}>Loading players...</div>
        ) : filteredPlayers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: G.muted }}>
            {activeTab === 'managed'
              ? 'You have no managed players yet. Start recruiting from the "All Players" tab!'
              : 'No players found in this organization.'}
          </div>
        ) : (
          filteredPlayers.map((player) => renderPlayerCard(player, activeTab === 'managed'))
        )}
      </div>

      {/* Analytics Modal */}
      {showAnalyticsModal && selectedPlayerAnalytics && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => setShowAnalyticsModal(false)}
        >
          <div
            style={{
              background: G.card,
              border: `1px solid ${G.cardBorder}`,
              borderRadius: 12,
              padding: 24,
              maxWidth: 600,
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: G.text, margin: 0 }}>
                  📊 Player Analytics
                </h2>
                <p style={{ fontSize: 12, color: G.muted, margin: '4px 0 0 0' }}>
                  {selectedPlayerAnalytics.firstName} {selectedPlayerAnalytics.lastName}
                </p>
              </div>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: G.text,
                  fontSize: 20,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            {analyticsLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: G.muted }}>
                Loading analytics...
              </div>
            ) : analyticsData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <div style={{ background: G.dark, borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 10, color: G.muted, marginBottom: 4 }}>Total Sessions</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: G.lime }}>
                      {analyticsData.totalSessions || 0}
                    </div>
                  </div>
                  <div style={{ background: G.dark, borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 10, color: G.muted, marginBottom: 4 }}>Games Played</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: G.accent }}>
                      {analyticsData.gamesPlayed || 0}
                    </div>
                  </div>
                  <div style={{ background: G.dark, borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 10, color: G.muted, marginBottom: 4 }}>Win Rate</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: G.blue }}>
                      {analyticsData.winRate ? analyticsData.winRate.toFixed(1) : 0}%
                    </div>
                  </div>
                  <div style={{ background: G.dark, borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 10, color: G.muted, marginBottom: 4 }}>Activities</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: G.yellow }}>
                      {analyticsData.activitiesAttended || 0}
                    </div>
                  </div>
                </div>

                {/* Detailed Stats */}
                <div style={{ background: G.dark, borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: G.lime, marginBottom: 12 }}>
                    📈 Performance Summary
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: G.muted }}>Games Won:</span>
                      <span style={{ color: G.text, fontWeight: 600 }}>
                        {analyticsData.gamesWon || 0}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: G.muted }}>Games Lost:</span>
                      <span style={{ color: G.text, fontWeight: 600 }}>
                        {analyticsData.gamesLost || 0}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: G.muted }}>Avg Session Duration:</span>
                      <span style={{ color: G.text, fontWeight: 600 }}>
                        {analyticsData.avgSessionDuration || 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: G.muted }}>Skill Level:</span>
                      <span style={{ color: G.lime, fontWeight: 600 }}>
                        {analyticsData.skillLevel || 'Beginner'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Last Updated */}
                {analyticsData.lastUpdated && (
                  <div style={{ fontSize: 10, color: G.muted, textAlign: 'center' }}>
                    Last updated: {new Date(analyticsData.lastUpdated).toLocaleString()}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: G.muted }}>
                No analytics data available
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={() => setShowAnalyticsModal(false)}
              style={{
                width: '100%',
                marginTop: 20,
                background: G.bright,
                color: G.text,
                border: 'none',
                borderRadius: 6,
                padding: 12,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = G.lime;
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = G.bright;
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
