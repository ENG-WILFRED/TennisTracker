'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from '@vico/design-system';
import { useSearchParams } from 'next/navigation';
import { ProgressView } from '@/components/stats/ProgressView';
import { CoachRequestsComponent } from '@/components/player/CoachRequestsComponent';
import { useAuth } from '@/context/AuthContext';
import { getAuthHeader } from '@/lib/tokenManager';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

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
  phone?: string;
  bio?: string;
  photo?: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  winRate: string | number;
  rank?: number;
  skillLevel?: string;
  joinedAt?: string;
  lastActive?: string;
  organization?: any;
}

interface Comment {
  id: string;
  author: string;
  authorId: string;
  text: string;
  createdAt: string;
  rating?: number;
}

interface Session {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type: 'training' | 'match' | 'practice';
  court?: string;
  maxParticipants?: number;
  price?: number;
}

interface Partner {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  winRate: number;
  skillLevel: string;
  compatibility: number;
}

interface Match {
  id: string;
  opponent: string;
  opponentId: string;
  date: string;
  result: 'win' | 'loss';
  score: string;
  matchType: 'training' | 'match' | 'practice';
  court?: string;
  serveAccuracy?: number;
  rallyWinRate?: number;
  acesHit?: number;
  doubleFaults?: number;
}

interface PlayerStats {
  totalMatches: number;
  matchesWon: number;
  matchesLost: number;
  winRate: number;
  averageServeAccuracy: number;
  averageRallyWinRate: number;
  totalAces: number;
  totalDoubleFaults: number;
  skillProgression: Array<{ date: string; level: number }>;
  monthlyStats: Array<{ month: string; wins: number; losses: number }>;
}

export default function PlayerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.playerId as string;

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'comments' | 'sessions' | 'partners' | 'challenges' | 'coach-requests'>('overview');

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [previousRating, setPreviousRating] = useState(5);
  
  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([]);
  
  // Partners state
  const [suggestedPartners, setSuggestedPartners] = useState<Partner[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  
  // Auth and recruit state
  const { user } = useAuth();
  const coachUserId = user?.id;
  const searchParams = useSearchParams();
  const isCoach = Boolean(user?.role?.toLowerCase() === 'coach' || (user as any)?.isCoach === true);
  const isCoachView = Boolean(searchParams?.get('view') === 'coach');
  const showRecruitButton = isCoach && isCoachView;
  const showCoachActions = isCoach && isCoachView;
  const [recruitOpen, setRecruitOpen] = useState(false);
  const [recruiting, setRecruiting] = useState(false);
  const [recruitIntro, setRecruitIntro] = useState('');
  const [recruitReason, setRecruitReason] = useState('Tournament preparation');
  const [recruitOfferMode, setRecruitOfferMode] = useState('Online');
  const [recruitSessionFormat, setRecruitSessionFormat] = useState('One-on-one');
  const [recruitPaymentType, setRecruitPaymentType] = useState('Paid');
  const [recruitWeeklySessions, setRecruitWeeklySessions] = useState('2');
  const [recruitAnalysis, setRecruitAnalysis] = useState('');
  const [coachRelationship, setCoachRelationship] = useState<any | null>(null);
  const [relationshipLoading, setRelationshipLoading] = useState(false);
  const [remindSending, setRemindSending] = useState(false);
  const [coachPlayers, setCoachPlayers] = useState<Player[]>([]);
  const [orgPlayers, setOrgPlayers] = useState<Player[]>([]);
  const [availableChallengePlayers, setAvailableChallengePlayers] = useState<Player[]>([]);
  const [coachPlayersLoading, setCoachPlayersLoading] = useState(false);
  const [challengeSourcesLoading, setChallengeSourcesLoading] = useState(false);
  const [selectedCoachPlayerId, setSelectedCoachPlayerId] = useState<string>('');
  const [challengeSending, setChallengeSending] = useState(false);
  
  // Other states
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (playerId) {
      loadPlayerData();
      loadComments();
      loadSessions();
    }
  }, [playerId]);

  useEffect(() => {
    if (!isCoachView || !coachUserId || !playerId) {
      setCoachRelationship(null);
      return;
    }

    async function loadCoachRelationship() {
      setRelationshipLoading(true);
      try {
        const encodedCoachId = encodeURIComponent(coachUserId as string);
        const res = await authenticatedFetch(
          `/api/coaches/players?coachId=${encodedCoachId}&playerId=${encodeURIComponent(playerId)}&status=all`
        );

        if (!res.ok) {
          throw new Error('Failed to load coach relationship');
        }

        const data = await res.json();
        const relationship = Array.isArray(data) ? data[0] : null;
        setCoachRelationship(relationship || null);
      } catch (error) {
        console.error('Error loading coach relationship:', error);
        setCoachRelationship(null);
      } finally {
        setRelationshipLoading(false);
      }
    }

    loadCoachRelationship();
  }, [isCoachView, coachUserId, playerId]);

  useEffect(() => {
    if (!isCoach || !user?.id) {
      setCoachPlayers([]);
      setOrgPlayers([]);
      setAvailableChallengePlayers([]);
      return;
    }

    const coachId = user.id;
    const orgId = (user as any)?.organization?.id || (user as any)?.organizationId;

    async function loadCoachPlayers() {
      setCoachPlayersLoading(true);
      setChallengeSourcesLoading(true);
      try {
        const coachRequest = fetch(`/api/coaches/players?coachId=${encodeURIComponent(coachId)}&status=active`);
        const orgRequest = orgId
          ? fetch(`/api/organization/${orgId}/players?type=all`)
          : Promise.resolve(null);

        const [coachRes, orgRes] = await Promise.all([coachRequest, orgRequest]);

        let coachData: any[] = [];
        let orgData: any[] = [];

        if (coachRes?.ok) {
          const data = await coachRes.json();
          coachData = Array.isArray(data) ? data : [];
        } else {
          console.error('Unable to load coached players');
        }

        if (orgRes) {
          if (orgRes.ok) {
            const data = await orgRes.json();
            orgData = Array.isArray(data) ? data : [];
          } else {
            console.error('Unable to load org players');
          }
        }

        setCoachPlayers(coachData);
        setOrgPlayers(orgData);

        const unique = new Map<string, Player>();
        [...coachData, ...orgData].forEach((item) => {
          if (item?.userId && !unique.has(item.userId) && item.userId !== player?.userId) {
            unique.set(item.userId, item);
          }
        });

        setAvailableChallengePlayers(Array.from(unique.values()));
      } catch (error) {
        console.error('Error loading coach or org players:', error);
        setCoachPlayers([]);
        setOrgPlayers([]);
        setAvailableChallengePlayers([]);
      } finally {
        setCoachPlayersLoading(false);
        setChallengeSourcesLoading(false);
      }
    }

    loadCoachPlayers();
  }, [isCoach, user?.id, player?.userId]);


  async function loadPlayerData() {
    try {
      setLoading(true);
      const res = await fetch(`/api/players/${playerId}`);
      if (!res.ok) throw new Error('Failed to load player');
      
      const data = await res.json();
      setPlayer(data.player || data);
    } catch (error) {
      console.error('Error loading player:', error);
      toast.error('Failed to load player data');
    } finally {
      setLoading(false);
    }
  }

  async function loadComments() {
    try {
      setCommentsLoading(true);
      const res = await fetch(`/api/players/${playerId}/comments`);
      if (!res.ok) return;
      
      const data = await res.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setCommentsLoading(false);
    }
  }

  async function addComment() {
    if (!newComment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    try {
      setCommentSubmitting(true);
      const res = await authenticatedFetch(`/api/players/${playerId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newComment, rating }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRating(previousRating);
        throw new Error(data?.error || 'Failed to add comment');
      }

      setComments([data.comment, ...comments]);
      setNewComment('');
      setPreviousRating(rating);
      toast.success('Comment added!');
    } catch (error) {
      setRating(previousRating);
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setCommentSubmitting(false);
    }
  }

  async function loadSessions() {
    try {
      const res = await fetch(`/api/players/${playerId}/sessions`);
      if (!res.ok) return;
      
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }

  async function findPartners() {
    try {
      setPartnersLoading(true);
      const res = await fetch(`/api/players/${playerId}/find-partners`);
      if (!res.ok) throw new Error('Failed to find partners');
      
      const data = await res.json();
      setSuggestedPartners(data.partners || []);
    } catch (error) {
      console.error('Error finding partners:', error);
      toast.error('Failed to find partners');
    } finally {
      setPartnersLoading(false);
    }
  }

  

  async function sendChallenge() {
    if (!showCoachActions) {
      toast.error('Challenges are only available from the coach dashboard.');
      return;
    }

    if (!selectedCoachPlayerId) {
      toast.error('Select one of your coached players first.');
      return;
    }

    if (!player?.userId) {
      toast.error('Player not loaded.');
      return;
    }

    try {
      setChallengeSending(true);
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengerUserId: selectedCoachPlayerId,
          opponentUserId: player.userId,
          isFormal: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to send challenge');
      }

      toast.success('Challenge request sent successfully.');
    } catch (error) {
      console.error('Error sending challenge:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send challenge');
    } finally {
      setChallengeSending(false);
    }
  }

  async function recruitPlayer() {
    const coachId = user?.id;
    const orgId =
      (user as any)?.organization?.id ||
      (user as any)?.organizationId;

    if (!coachId || !player?.userId || !orgId) {
      toast.error('Unable to send recruitment request: missing information');
      return;
    }

    if (coachId === player.userId) {
      toast.error('You cannot recruit yourself.');
      return;
    }

    if (!recruitIntro.trim()) {
      toast.error('Please add a short introduction message for the player');
      return;
    }

    try {
      setRecruiting(true);
      const res = await authenticatedFetch('/api/coaches/recruit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId,
          playerId: player.userId,
          orgId,
          introMessage: recruitIntro.trim(),
          reason: recruitReason,
          offerMode: recruitOfferMode,
          sessionFormat: recruitSessionFormat,
          paymentType: recruitPaymentType,
          weeklySessions: recruitWeeklySessions,
          personalAnalysis: recruitAnalysis.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to send recruitment request');
      }

      setRecruitOpen(false);
      setRecruitIntro('');
      setRecruitReason('Tournament preparation');
      setRecruitOfferMode('Online');
      setRecruitSessionFormat('One-on-one');
      setRecruitPaymentType('Paid');
      setRecruitWeeklySessions('2');
      setRecruitAnalysis('');

      toast.success(data?.message || 'Recruitment request sent successfully');
      await refreshCoachRelationship();
    } catch (error) {
      console.error('Recruitment error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send recruitment request');
    } finally {
      setRecruiting(false);
    }
  }

  async function refreshCoachRelationship() {
    if (!isCoachView || !coachUserId || !playerId) {
      return;
    }

    try {
      const res = await authenticatedFetch(
        `/api/coaches/players?coachId=${encodeURIComponent(coachUserId)}&playerId=${encodeURIComponent(playerId)}&status=all`
      );

      if (!res.ok) {
        throw new Error('Failed to refresh coach relationship');
      }

      const data = await res.json();
      const relationship = Array.isArray(data) ? data[0] : null;
      setCoachRelationship(relationship || null);
    } catch (error) {
      console.error('Error refreshing coach relationship:', error);
    }
  }

  async function sendRecruitReminder() {
    if (!coachRelationship?.id || !coachUserId || !playerId) {
      toast.error('Unable to send reminder');
      return;
    }

    try {
      setRemindSending(true);
      const res = await authenticatedFetch('/api/coaches/recruit/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId: coachUserId,
          playerId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to send reminder');
      }

      toast.success(data?.message || 'Reminder sent successfully');
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send reminder');
    } finally {
      setRemindSending(false);
    }
  }

  async function removePlayer() {
    if (!confirm('Are you sure you want to remove this player?')) return;

    try {
      setRemoving(true);
      const res = await fetch(`/api/players/${playerId}`, { method: 'DELETE' });

      if (!res.ok) throw new Error('Failed to remove player');
      
      toast.success('Player removed');
      router.push('/players');
    } catch (error) {
      console.error('Error removing player:', error);
      toast.error('Failed to remove player');
    } finally {
      setRemoving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: G.dark, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: G.text, fontSize: 16 }}>⏳ Loading player profile...</div>
      </div>
    );
  }

  if (!player) {
    return (
      <div style={{ minHeight: '100vh', background: G.dark, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: G.red, fontSize: 16 }}>❌ Player not found</div>
      </div>
    );
  }

  const winRate = player.matchesPlayed > 0 
    ? Math.round((player.matchesWon / player.matchesPlayed) * 100)
    : 0;

  return (
    <div style={{ minHeight: '100vh', background: G.dark, color: G.text, padding: '20px' }}>
      <div style={{ maxWidth: 'auto', margin: '0 auto' }}>
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          style={{
            background: 'transparent',
            border: `1px solid ${G.cardBorder}`,
            color: G.text,
            padding: '10px 16px',
            borderRadius: 6,
            cursor: 'pointer',
            marginBottom: 20,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          ← Back
        </button>

        {/* Header Section */}
        <div style={{ position: 'relative', background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
          {showRecruitButton && (
            <div style={{ position: 'absolute', top: 24, right: 24, textAlign: 'right' }}>
              <button
                onClick={async () => {
                  if (coachRelationship?.status === 'pending') {
                    await sendRecruitReminder();
                    return;
                  }

                  if (coachRelationship?.status) {
                    return;
                  }

                  setRecruitOpen(true);
                }}
                disabled={relationshipLoading || remindSending || coachRelationship?.status === 'active' || coachRelationship?.status === 'declined' || coachRelationship?.status === 'inactive'}
                style={{
                  background: G.lime,
                  color: G.dark,
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: relationshipLoading || remindSending || coachRelationship?.status === 'active' || coachRelationship?.status === 'declined' || coachRelationship?.status === 'inactive' ? 'not-allowed' : 'pointer',
                }}
              >
                {relationshipLoading
                  ? 'Loading…'
                  : coachRelationship?.status === 'pending'
                  ? remindSending
                    ? 'Sending reminder…'
                    : 'Remind'
                  : coachRelationship?.status === 'active'
                  ? 'Accepted'
                  : coachRelationship?.status === 'declined' || coachRelationship?.status === 'inactive'
                  ? 'Declined'
                  : 'Recruit Player'}
              </button>
              {!relationshipLoading && coachRelationship?.status && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color:
                      coachRelationship.status === 'active'
                        ? G.lime
                        : coachRelationship.status === 'pending'
                        ? G.yellow
                        : G.red,
                  }}
                >
                  {coachRelationship.status === 'active'
                    ? 'Recruitment accepted'
                    : coachRelationship.status === 'pending'
                    ? 'Request pending'
                    : 'Recruitment declined'}
                </div>
              )}
            </div>
          )}
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: player.photo ? `url(${player.photo})` : G.mid,
                border: `3px solid ${G.lime}`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 48,
                fontWeight: 900,
                color: G.lime,
                flexShrink: 0,
              }}
            >
              {!player.photo && `${player.firstName.charAt(0)}${player.lastName.charAt(0)}`}
            </div>

            {/* Player Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: G.accent }}>
                  {player.firstName} {player.lastName}
                </div>
                {isCoachView && (
                  <div style={{ background: G.lime, color: G.dark, borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                    Coach view
                  </div>
                )}
              </div>
              <div style={{ fontSize: 14, color: G.muted, marginBottom: 12 }}>
                @{player.username} • {player.email}
              </div>
              {player.bio && (
                <div style={{ fontSize: 13, color: G.text, marginBottom: 12, fontStyle: 'italic' }}>
                  "{player.bio}"
                </div>
              )}

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Matches Played</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: G.accent }}>{player.matchesPlayed}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Matches Won</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: G.lime }}>{player.matchesWon}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Win Rate</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: G.blue }}>{winRate}%</div>
                </div>
                {player.rank && (
                  <div>
                    <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Rank</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: G.yellow }}>#{player.rank}</div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'nowrap', alignItems: 'center', overflow: 'auto' }}>
                <button
                  onClick={() => setActiveTab('analytics')}
                  style={{
                    background: G.yellow,
                    color: G.dark,
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 16px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: isCoachView ? 'none' : 'inline-block',
                  }}
                >
                  📊 View Analytics
                </button>
                <button
                  onClick={() => setActiveTab('sessions')}
                  style={{
                    background: G.mid,
                    color: G.text,
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 16px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: isCoachView ? 'none' : 'inline-block',
                  }}
                >
                  📅 Sessions
                </button>
                <button
                  onClick={() => setActiveTab('challenges')}
                  style={{
                    background: G.mid,
                    color: G.text,
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 16px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: isCoachView ? 'none' : 'inline-block',
                  }}
                >
                  ⚡ Find Challenge
                </button>
                <button
                  onClick={() => setActiveTab('partners')}
                  style={{
                    background: G.mid,
                    color: G.text,
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 16px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: isCoachView ? 'none' : 'inline-block',
                  }}
                >
                  {isCoachView ? '🤝 Similar Players' : '🤝 Find Partner'}
                </button>
                {!isCoachView && (
                  <button
                    onClick={removePlayer}
                    disabled={removing}
                    style={{
                      background: G.red,
                      color: G.text,
                      border: 'none',
                      borderRadius: 6,
                      padding: '10px 16px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: removing ? 'not-allowed' : 'pointer',
                      opacity: removing ? 0.6 : 1,
                    }}
                  >
                    {removing ? '⏳ Removing...' : '🗑️ Remove'}
                  </button>
                )}
              </div>
            </div>
          </div>


        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: `1px solid ${G.cardBorder}`, paddingBottom: 12 }}>
          {['overview', 'analytics', 'comments', 'sessions', 'partners', 'challenges', 'coach-requests'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              style={{
                background: activeTab === tab ? G.bright : 'transparent',
                color: activeTab === tab ? G.text : G.muted,
                border: 'none',
                padding: '10px 16px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'overview' && '📊'} {tab === 'analytics' && '📈'} {tab === 'comments' && '💬'} {tab === 'sessions' && '📅'} {tab === 'partners' && '🤝'} {tab === 'challenges' && '⚡'} {tab === 'coach-requests' && '👨‍🏫'} {tab === 'partners' ? 'Similar Players' : tab === 'coach-requests' ? 'Coach Requests' : tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: G.lime, marginBottom: 12 }}>📋 Player Details</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                  <div><span style={{ color: G.muted }}>Email:</span> {player.email}</div>
                  {player.phone && <div><span style={{ color: G.muted }}>Phone:</span> {player.phone}</div>}
                  {player.skillLevel && <div><span style={{ color: G.muted }}>Skill Level:</span> {player.skillLevel}</div>}
                  {player.joinedAt && <div><span style={{ color: G.muted }}>Joined:</span> {new Date(player.joinedAt).toLocaleDateString()}</div>}
                  {player.lastActive && <div><span style={{ color: G.muted }}>Last Active:</span> {new Date(player.lastActive).toLocaleDateString()}</div>}
                </div>
              </div>

              <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: G.lime, marginBottom: 12 }}>📈 Performance</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Win Rate</div>
                    <div style={{ width: '100%', height: 8, background: G.dark, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${winRate}%`, height: '100%', background: G.lime, transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: G.lime, marginTop: 4 }}>{winRate}%</div>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>W-L Record</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: G.accent }}>
                      {player.matchesWon}-{player.matchesLost}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div>
              <ProgressView playerId={playerId} />
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* New Comment Form */}
              <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: G.lime, marginBottom: 12 }}>✍️ Add Your Comment</div>
                
                {/* Rating */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>Rating</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setPreviousRating(rating);
                          setRating(r);
                        }}
                        style={{
                          background: r <= rating ? G.yellow : G.dark,
                          border: `1px solid ${G.cardBorder}`,
                          color: G.text,
                          width: 32,
                          height: 32,
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 16,
                        }}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment Text */}
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write your comment..."
                  style={{
                    width: '100%',
                    background: G.dark,
                    border: `1px solid ${G.cardBorder}`,
                    borderRadius: 6,
                    padding: '10px',
                    color: G.text,
                    fontSize: 12,
                    minHeight: 80,
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    marginBottom: 12,
                  }}
                />

                <button
                  onClick={addComment}
                  disabled={commentSubmitting}
                  style={{
                    background: G.lime,
                    color: G.dark,
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 16px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: commentSubmitting ? 'not-allowed' : 'pointer',
                    opacity: commentSubmitting ? 0.75 : 1,
                    width: '100%',
                  }}
                >
                  {commentSubmitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>

              {/* Comments List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {commentsLoading ? (
                  <div style={{ color: G.muted }}>⏳ Loading comments...</div>
                ) : comments.length === 0 ? (
                  <div style={{ color: G.muted, textAlign: 'center', padding: '20px' }}>
                    No comments yet. Be the first to comment!
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: G.accent }}>{comment.author}</div>
                          {comment.rating && (
                            <div style={{ fontSize: 10, color: G.yellow }}>
                              {'⭐'.repeat(comment.rating)}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 10, color: G.muted }}>
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: G.text }}>{comment.text}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Sessions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sessions.length === 0 ? (
                  <div style={{ color: G.muted, textAlign: 'center', padding: '20px', background: G.card, borderRadius: 12 }}>
                    No sessions yet
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div key={session.id} style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: G.accent }}>{session.title}</div>
                          <div style={{ fontSize: 10, color: G.muted }}>
                            {session.type === 'training' && '🏆'} {session.type === 'match' && '⚡'} {session.type === 'practice' && '🎾'} {session.type}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: G.muted, marginBottom: 6 }}>
                        📅 {new Date(session.startTime).toLocaleDateString()} at {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {session.court && <div style={{ fontSize: 10, color: G.muted }}>📍 {session.court}</div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Partners Tab */}
          {activeTab === 'partners' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <button
                onClick={findPartners}
                disabled={partnersLoading}
                style={{
                  width: '100%',
                  background: G.bright,
                  color: G.text,
                  border: 'none',
                  borderRadius: 6,
                  padding: '12px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: partnersLoading ? 'not-allowed' : 'pointer',
                  opacity: partnersLoading ? 0.6 : 1,
                }}
              >
                {partnersLoading ? '⏳ Finding partners...' : isCoachView ? '🔎 Find Similar Players' : '🤝 Find Perfect Partner Match'}
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
                {suggestedPartners.length === 0 ? (
                  <div style={{ color: G.muted, textAlign: 'center', padding: '20px', background: G.card, borderRadius: 12, gridColumn: '1/-1' }}>
                    {partnersLoading ? 'Loading...' : isCoachView ? 'Click "Find Similar Players" to browse suggested profiles' : 'Click "Find Partner" to see suggestions'}
                  </div>
                ) : (
                  suggestedPartners.map((partner) => (
                    <div key={partner.id} style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: G.accent, marginBottom: 6 }}>
                        {partner.firstName} {partner.lastName}
                      </div>
                      <div style={{ fontSize: 10, color: G.muted, marginBottom: 8 }}>
                        @{partner.username}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 10, marginBottom: 8 }}>
                        <div><span style={{ color: G.muted }}>Skill:</span> {partner.skillLevel}</div>
                        <div><span style={{ color: G.muted }}>Win Rate:</span> {partner.winRate}%</div>
                        <div style={{ background: G.dark, padding: '4px 8px', borderRadius: 4, color: G.lime }}>
                          ✓ {partner.compatibility}% Compatibility
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (isCoachView) {
                            router.push(`/players/profile/${partner.id}?view=coach`);
                          } else {
                            toast('Match proposals are not available here yet.');
                          }
                        }}
                        style={{
                          width: '100%',
                          background: isCoachView ? G.lime : G.bright,
                          color: isCoachView ? G.dark : G.text,
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px',
                          fontSize: 10,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {isCoachView ? 'View Profile' : 'Propose Match'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Challenges Tab */}
          {activeTab === 'challenges' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {showCoachActions ? (
                <>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div style={{ fontSize: 12, color: G.muted }}>
                      Select the coached or organization player who will issue this challenge.
                    </div>
                    <select
                      value={selectedCoachPlayerId}
                      onChange={(e) => setSelectedCoachPlayerId(e.target.value)}
                      style={{
                        width: '100%',
                        background: G.card,
                        border: `1px solid ${G.cardBorder}`,
                        borderRadius: 6,
                        color: G.text,
                        padding: '12px 14px',
                        fontSize: 12,
                        appearance: 'none',
                      }}
                    >
                      <option value="">Choose your player</option>
                      {availableChallengePlayers.map((coachPlayer) => (
                        <option key={coachPlayer.userId} value={coachPlayer.userId}>
                          {coachPlayer.firstName} {coachPlayer.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={sendChallenge}
                    disabled={challengeSending || challengeSourcesLoading || !selectedCoachPlayerId}
                    style={{
                      width: '100%',
                      background: challengeSending || !selectedCoachPlayerId ? G.dark : G.yellow,
                      color: G.dark,
                      border: 'none',
                      borderRadius: 6,
                      padding: '12px 16px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: challengeSending || !selectedCoachPlayerId ? 'not-allowed' : 'pointer',
                      opacity: challengeSourcesLoading ? 0.7 : 1,
                    }}
                  >
                    {challengeSending ? 'Sending challenge…' : '⚡ Send Challenge from selected player'}
                  </button>

                  {challengeSourcesLoading && (
                    <div style={{ color: G.muted, fontSize: 12 }}>Loading your players…</div>
                  )}
                  {!challengeSourcesLoading && availableChallengePlayers.length === 0 && (
                    <div style={{ color: G.muted, fontSize: 12 }}>
                      You need at least one coached player or organization player to send a challenge from the coach dashboard.
                    </div>
                  )}
                </>
              ) : (
                <div style={{ color: G.muted, textAlign: 'center', padding: '20px', background: G.card, borderRadius: 12 }}>
                  Challenge creation is only available when a coach views this profile from their dashboard.
                </div>
              )}

              <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: G.lime, marginBottom: 12 }}>🏆 Recent Challenges</div>
                <div style={{ color: G.muted, textAlign: 'center', padding: '20px' }}>
                  No challenges yet. Send one to get started!
                </div>
              </div>
            </div>
          )}

          {/* Coach Requests Tab */}
          {activeTab === 'coach-requests' && (
            <div>
              <CoachRequestsComponent playerId={playerId} />
            </div>
          )}
        </div>
      </div>
      {recruitOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 14, width: 'min(620px,100%)', maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: G.text }}>🧲 Recruit player</div>
                <div style={{ fontSize: 12, color: G.muted }}>Send a trust-first coaching invitation with context, credibility, and intent.</div>
              </div>
              <button onClick={() => setRecruitOpen(false)} style={{ background: 'transparent', border: 'none', color: G.muted, fontSize: 18, cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'grid', gap: 18 }}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ fontSize: 12, color: G.text }}>This is a recruitment request, not a direct hire action. Give the player enough detail so they can answer “Why should I trust this coach with my growth?”</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ fontSize: 12, color: G.muted, fontWeight: 700 }}>Coach snapshot</div>
                  <div style={{ background: G.sidebar, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12, display: 'grid', gap: 6, fontSize: 12, color: G.text }}>
                    <div style={{ fontWeight: 700 }}>{user?.firstName || 'Coach'} {user?.lastName || ''}</div>
                    <div>{user?.role ? user.role : 'Coach'}</div>
                    <div>{(user as any)?.organization?.name || 'Independent coach'}</div>
                    <div>{user?.email}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 14 }}>
                <label style={{ fontSize: 12, color: G.muted, fontWeight: 700 }}>Short introduction message</label>
                <textarea
                  value={recruitIntro}
                  onChange={(event) => setRecruitIntro(event.target.value)}
                  placeholder="Hi Brian, I’ve been following your tournament results and believe your defense is strong. I can help you improve attacking transitions and tournament preparation."
                  style={{ width: '100%', minHeight: 120, borderRadius: 12, border: `1px solid ${G.cardBorder}`, background: G.card, color: G.text, padding: 12, fontSize: 13, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ display: 'grid', gap: 10 }}>
                  <label style={{ fontSize: 12, color: G.muted, fontWeight: 700 }}>Reason for recruitment</label>
                  <select
                    value={recruitReason}
                    onChange={(event) => setRecruitReason(event.target.value)}
                    style={{ width: '100%', borderRadius: 10, border: `1px solid ${G.cardBorder}`, background: G.card, color: G.text, padding: '10px 12px', fontSize: 13 }}
                  >
                    <option value="Tournament preparation">Tournament preparation</option>
                    <option value="Beginner development">Beginner development</option>
                    <option value="Professional pathway">Professional pathway</option>
                    <option value="Fitness & conditioning">Fitness & conditioning</option>
                    <option value="Technique improvement">Technique improvement</option>
                    <option value="Junior coaching">Junior coaching</option>
                    <option value="Elite competition training">Elite competition training</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                  <label style={{ fontSize: 12, color: G.muted, fontWeight: 700 }}>Coaching offer</label>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <select
                      value={recruitOfferMode}
                      onChange={(event) => setRecruitOfferMode(event.target.value)}
                      style={{ width: '100%', borderRadius: 10, border: `1px solid ${G.cardBorder}`, background: G.card, color: G.text, padding: '10px 12px', fontSize: 13 }}
                    >
                      <option value="Online">Online coaching</option>
                      <option value="Physical">Physical coaching</option>
                      <option value="Hybrid">Hybrid coaching</option>
                    </select>
                    <select
                      value={recruitSessionFormat}
                      onChange={(event) => setRecruitSessionFormat(event.target.value)}
                      style={{ width: '100%', borderRadius: 10, border: `1px solid ${G.cardBorder}`, background: G.card, color: G.text, padding: '10px 12px', fontSize: 13 }}
                    >
                      <option value="One-on-one">One-on-one</option>
                      <option value="Group">Group</option>
                    </select>
                    <select
                      value={recruitPaymentType}
                      onChange={(event) => setRecruitPaymentType(event.target.value)}
                      style={{ width: '100%', borderRadius: 10, border: `1px solid ${G.cardBorder}`, background: G.card, color: G.text, padding: '10px 12px', fontSize: 13 }}
                    >
                      <option value="Paid">Paid</option>
                      <option value="Free trial">Free trial</option>
                      <option value="Custom">Custom</option>
                    </select>
                    <input
                      type="number"
                      value={recruitWeeklySessions}
                      onChange={(event) => setRecruitWeeklySessions(event.target.value)}
                      min={1}
                      max={7}
                      placeholder="Weekly sessions"
                      style={{ width: '100%', borderRadius: 10, border: `1px solid ${G.cardBorder}`, background: G.card, color: G.text, padding: '10px 12px', fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                  <label style={{ fontSize: 12, color: G.muted, fontWeight: 700 }}>Optional personalized analysis</label>
                  <textarea
                    value={recruitAnalysis}
                    onChange={(event) => setRecruitAnalysis(event.target.value)}
                    placeholder="Your backhand placement is strong, but footwork recovery after wide forehand shots needs improvement."
                    style={{ width: '100%', minHeight: 100, borderRadius: 12, border: `1px solid ${G.cardBorder}`, background: G.card, color: G.text, padding: 12, fontSize: 13, resize: 'vertical' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                <button onClick={() => setRecruitOpen(false)} style={{ flex: 1, background: G.mid, color: G.text, border: 'none', borderRadius: 8, padding: '12px 16px', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                <button onClick={recruitPlayer} disabled={recruiting} style={{ flex: 1, background: G.lime, color: G.dark, border: 'none', borderRadius: 8, padding: '12px 16px', fontSize: 12, fontWeight: 700, cursor: recruiting ? 'not-allowed' : 'pointer', opacity: recruiting ? 0.7 : 1 }}>{recruiting ? 'Sending request…' : 'Send recruitment request'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );

}
