'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'comments' | 'sessions' | 'partners' | 'challenges'>('overview');
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [rating, setRating] = useState(5);
  
  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionForm, setSessionForm] = useState({ title: '', type: 'training' as 'training' | 'match' | 'practice', date: '', time: '', duration: 1, court: '' });
  
  // Partners state
  const [suggestedPartners, setSuggestedPartners] = useState<Partner[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  
  // Other states
  const [messaging, setMessaging] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Analytics states
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Filter states
  const [dateFrom, setDateFrom] = useState(new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [matchTypeFilter, setMatchTypeFilter] = useState<'all' | 'training' | 'match' | 'practice'>('all');
  const [opponentFilter, setOpponentFilter] = useState('');
  const [comparisonPlayerId, setComparisonPlayerId] = useState('');
  const [comparisonStats, setComparisonStats] = useState<PlayerStats | null>(null);
  
  // Export states
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (playerId) {
      loadPlayerData();
      loadComments();
      loadSessions();
    }
  }, [playerId]);

  useEffect(() => {
    if (showAnalytics && playerId) {
      loadAnalyticsData();
    }
  }, [showAnalytics, playerId]);

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
      const res = await fetch(`/api/players/${playerId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newComment, rating }),
      });

      if (!res.ok) throw new Error('Failed to add comment');
      
      const data = await res.json();
      setComments([data.comment, ...comments]);
      setNewComment('');
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
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

  async function createSession() {
    if (!sessionForm.title || !sessionForm.date || !sessionForm.time) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const startTime = new Date(`${sessionForm.date}T${sessionForm.time}`);
      const endTime = new Date(startTime.getTime() + sessionForm.duration * 60 * 60 * 1000);

      const res = await fetch(`/api/players/${playerId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: sessionForm.title,
          type: sessionForm.type,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          court: sessionForm.court,
        }),
      });

      if (!res.ok) throw new Error('Failed to create session');
      
      const data = await res.json();
      setSessions([data.session, ...sessions]);
      setShowSessionForm(false);
      setSessionForm({ title: '', type: 'training', date: '', time: '', duration: 1, court: '' });
      toast.success('Session created!');
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
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

  async function sendMessage() {
    if (!player) return;

    try {
      setMessaging(true);
      const res = await fetch('/api/chat/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserEmail: player.email }),
      });

      if (!res.ok) throw new Error('Failed to create message');
      
      toast.success('Opening chat...');
      // TODO: Redirect to chat or open modal
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setMessaging(false);
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

  async function loadAnalyticsData() {
    try {
      setStatsLoading(true);
      const res = await fetch(`/api/players/${playerId}/analytics`);
      if (!res.ok) throw new Error('Failed to load analytics');
      
      const data = await res.json();
      setStats(data.stats);
      setMatches(data.matches || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Set mock data if API fails
      setStats({
        totalMatches: player?.matchesPlayed || 0,
        matchesWon: player?.matchesWon || 0,
        matchesLost: player?.matchesLost || 0,
        winRate: player?.matchesPlayed ? Math.round((player.matchesWon / player.matchesPlayed) * 100) : 0,
        averageServeAccuracy: 65 + Math.random() * 20,
        averageRallyWinRate: 55 + Math.random() * 25,
        totalAces: Math.floor(Math.random() * 100),
        totalDoubleFaults: Math.floor(Math.random() * 50),
        skillProgression: generateSkillProgression(),
        monthlyStats: generateMonthlyStats(player?.matchesPlayed || 0, player?.matchesWon || 0),
      });
    } finally {
      setStatsLoading(false);
    }
  }

  function generateSkillProgression() {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now);
      date.setMonth(date.getMonth() - (5 - i));
      return {
        date: date.toLocaleDateString(),
        level: 60 + i * 5 + Math.random() * 10,
      };
    });
  }

  function generateMonthlyStats(total: number, wins: number) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, i) => ({
      month,
      wins: Math.floor(wins / 6),
      losses: Math.floor((total - wins) / 6),
    }));
  }

  function getFilteredMatches() {
    return matches.filter(match => {
      const matchDate = new Date(match.date);
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      
      if (matchDate < from || matchDate > to) return false;
      if (matchTypeFilter !== 'all' && match.matchType !== matchTypeFilter) return false;
      if (opponentFilter && !match.opponent.toLowerCase().includes(opponentFilter.toLowerCase())) return false;
      
      return true;
    });
  }

  async function exportToCSV() {
    try {
      setIsExporting(true);
      const filtered = getFilteredMatches();
      
      if (!filtered.length) {
        toast.error('No matches to export');
        return;
      }

      const headers = ['Date', 'Opponent', 'Type', 'Result', 'Score', 'Serve Accuracy', 'Rally Win Rate', 'Aces', 'Double Faults'];
      const rows = filtered.map(m => [
        new Date(m.date).toLocaleDateString(),
        m.opponent,
        m.matchType,
        m.result,
        m.score,
        `${m.serveAccuracy || 0}%`,
        `${m.rallyWinRate || 0}%`,
        m.acesHit || 0,
        m.doubleFaults || 0,
      ]);

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${player?.firstName}_${player?.lastName}_analytics.csv`;
      a.click();
      
      toast.success('Analytics exported as CSV!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  }

  async function exportToPDF() {
    try {
      setIsExporting(true);
      const element = document.getElementById('analytics-pdf-content');
      
      if (!element) {
        toast.error('Analytics content not found');
        return;
      }

      // Dynamically import html2pdf
      const html2pdf = (await import('html2pdf.js')).default;

      const opt = {
        margin: 10,
        filename: `${player?.firstName}_${player?.lastName}_analytics.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { orientation: 'portrait' as const, unit: 'mm', format: 'a4' },
      };

      await html2pdf().set(opt).from(element).save();
      toast.success('Analytics exported as PDF!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
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
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
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
              <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 4, color: G.accent }}>
                {player.firstName} {player.lastName}
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
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={sendMessage}
                  disabled={messaging}
                  style={{
                    background: G.bright,
                    color: G.text,
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 16px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: messaging ? 'not-allowed' : 'pointer',
                    opacity: messaging ? 0.6 : 1,
                  }}
                >
                  {messaging ? '⏳ Sending...' : '💬 Message'}
                </button>
                <button
                  onClick={() => router.push(`/players/analytics/${playerId}`)}
                  style={{
                    background: G.yellow,
                    color: G.dark,
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 16px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
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
                  }}
                >
                  📅 Create Session
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
                  }}
                >
                  🤝 Find Partner
                </button>
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
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: `1px solid ${G.cardBorder}`, paddingBottom: 12 }}>
          {['overview', 'comments', 'sessions', 'partners', 'challenges'].map((tab) => (
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
              {tab === 'overview' && '📊'} {tab === 'comments' && '💬'} {tab === 'sessions' && '📅'} {tab === 'partners' && '🤝'} {tab === 'challenges' && '⚡'} {tab}
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
                        onClick={() => setRating(r)}
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
                  style={{
                    background: G.lime,
                    color: G.dark,
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 16px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  Post Comment
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
              {/* New Session Form */}
              {showSessionForm ? (
                <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: G.lime, marginBottom: 12 }}>📅 Create New Session</div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
                    <input
                      type="text"
                      placeholder="Session Title"
                      value={sessionForm.title}
                      onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                      style={{
                        background: G.dark,
                        border: `1px solid ${G.cardBorder}`,
                        borderRadius: 6,
                        padding: '10px',
                        color: G.text,
                        fontSize: 12,
                      }}
                    />
                    <select
                      value={sessionForm.type}
                      onChange={(e) => setSessionForm({ ...sessionForm, type: e.target.value as any })}
                      style={{
                        background: G.dark,
                        border: `1px solid ${G.cardBorder}`,
                        borderRadius: 6,
                        padding: '10px',
                        color: G.text,
                        fontSize: 12,
                      }}
                    >
                      <option value="training">🏆 Training</option>
                      <option value="match">⚡ Match</option>
                      <option value="practice">🎾 Practice</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 12 }}>
                    <input
                      type="date"
                      value={sessionForm.date}
                      onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                      style={{
                        background: G.dark,
                        border: `1px solid ${G.cardBorder}`,
                        borderRadius: 6,
                        padding: '10px',
                        color: G.text,
                        fontSize: 12,
                      }}
                    />
                    <input
                      type="time"
                      value={sessionForm.time}
                      onChange={(e) => setSessionForm({ ...sessionForm, time: e.target.value })}
                      style={{
                        background: G.dark,
                        border: `1px solid ${G.cardBorder}`,
                        borderRadius: 6,
                        padding: '10px',
                        color: G.text,
                        fontSize: 12,
                      }}
                    />
                    <select
                      value={sessionForm.duration}
                      onChange={(e) => setSessionForm({ ...sessionForm, duration: Number(e.target.value) })}
                      style={{
                        background: G.dark,
                        border: `1px solid ${G.cardBorder}`,
                        borderRadius: 6,
                        padding: '10px',
                        color: G.text,
                        fontSize: 12,
                      }}
                    >
                      {[0.5, 1, 1.5, 2, 3].map((d) => (
                        <option key={d} value={d}>{d}h Duration</option>
                      ))}
                    </select>
                  </div>

                  <input
                    type="text"
                    placeholder="Court (optional)"
                    value={sessionForm.court}
                    onChange={(e) => setSessionForm({ ...sessionForm, court: e.target.value })}
                    style={{
                      width: '100%',
                      background: G.dark,
                      border: `1px solid ${G.cardBorder}`,
                      borderRadius: 6,
                      padding: '10px',
                      color: G.text,
                      fontSize: 12,
                      marginBottom: 12,
                    }}
                  />

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={createSession}
                      style={{
                        flex: 1,
                        background: G.lime,
                        color: G.dark,
                        border: 'none',
                        borderRadius: 6,
                        padding: '10px 16px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Create Session
                    </button>
                    <button
                      onClick={() => setShowSessionForm(false)}
                      style={{
                        flex: 1,
                        background: G.mid,
                        color: G.text,
                        border: 'none',
                        borderRadius: 6,
                        padding: '10px 16px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowSessionForm(true)}
                  style={{
                    width: '100%',
                    background: G.bright,
                    color: G.text,
                    border: 'none',
                    borderRadius: 6,
                    padding: '12px 16px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  + Create New Session
                </button>
              )}

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
                {partnersLoading ? '⏳ Finding partners...' : '🤝 Find Perfect Partner Match'}
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
                {suggestedPartners.length === 0 ? (
                  <div style={{ color: G.muted, textAlign: 'center', padding: '20px', background: G.card, borderRadius: 12, gridColumn: '1/-1' }}>
                    {partnersLoading ? 'Loading...' : 'Click "Find Partner" to see suggestions'}
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
                        style={{
                          width: '100%',
                          background: G.lime,
                          color: G.dark,
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px',
                          fontSize: 10,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Propose Match
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
              <button
                onClick={() => toast.error('Challenge feature coming soon!')}
                style={{
                  width: '100%',
                  background: G.yellow,
                  color: G.dark,
                  border: 'none',
                  borderRadius: 6,
                  padding: '12px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ⚡ Send Challenge to Player
              </button>

              <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: G.lime, marginBottom: 12 }}>🏆 Recent Challenges</div>
                <div style={{ color: G.muted, textAlign: 'center', padding: '20px' }}>
                  No challenges yet. Send one to get started!
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
