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
  green: '#2d7a32',
  orange: '#e67e22',
};

interface Analytics {
  playerId: string;
  playerName: string;
  profilePhoto?: string;
  stats: {
    totalMatches: number;
    matchesWon: number;
    matchesLost: number;
    winRate: number;
    currentRank?: number;
    bestRank?: number;
    streak?: number;
  };
  monthly: Array<{
    month: string;
    matches: number;
    wins: number;
    losses: number;
  }>;
  performance: {
    serviceAccuracy: number;
    firstServeWinRate: number;
    breakPointConversion: number;
    aces: number;
    doubleFaults: number;
  };
  recentMatches: Array<{
    date: string;
    opponent: string;
    result: 'WIN' | 'LOSS';
    score: string;
  }>;
  goals: Array<{
    name: string;
    progress: number;
    target: string;
  }>;
}

const StatCard = ({ label, value, unit = '', color = G.lime, icon = '' }: any) => (
  <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 16 }}>
    <div style={{ fontSize: 12, color: G.muted, marginBottom: 8 }}>{icon} {label}</div>
    <div style={{ fontSize: 28, fontWeight: 900, color }}>
      {value}{unit && <span style={{ fontSize: 16, color: G.muted, marginLeft: 4 }}>{unit}</span>}
    </div>
  </div>
);

const ProgressBar = ({ label, value, max = 100, color = G.lime }: any) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
      <div style={{ fontSize: 12, color: G.muted }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color }}>{Math.round((value / max) * 100)}%</div>
    </div>
    <div style={{ width: '100%', height: 10, background: G.dark, borderRadius: 5, overflow: 'hidden' }}>
      <div
        style={{
          width: `${(value / max) * 100}%`,
          height: '100%',
          background: color,
          transition: 'width 0.3s',
        }}
      />
    </div>
  </div>
);

export default function PlayerAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.playerId as string;

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [timeframe, setTimeframe] = useState<'all' | '3months' | '6months' | 'year'>('all');
  
  // Coach features
  const [isCoach, setIsCoach] = useState(false);
  const [showEditMode, setShowEditMode] = useState(false);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(false);
  const [savingData, setSavingData] = useState(false);
  
  // Form states
  const [playerDetails, setPlayerDetails] = useState({
    firstName: '',
    lastName: '',
    skillLevel: '',
    rank: 0,
  });
  
  const [newMatch, setNewMatch] = useState({
    opponent: '',
    date: new Date().toISOString().split('T')[0],
    result: 'WIN' as 'WIN' | 'LOSS',
    score: '',
    serviceAccuracy: 65,
    firstServeWinRate: 60,
    aces: 0,
    doubleFaults: 0,
  });

  useEffect(() => {
    if (playerId) {
      checkCoachStatus();
      loadAnalytics();
    }
  }, [playerId, timeframe]);

  useEffect(() => {
    if (analytics) {
      setPlayerDetails({
        firstName: analytics.playerName.split(' ')[0] || '',
        lastName: analytics.playerName.split(' ')[1] || '',
        skillLevel: 'Advanced',
        rank: analytics.stats.currentRank || 0,
      });
    }
  }, [analytics]);

  async function checkCoachStatus() {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        // Check if user is a coach (you may need to adjust this based on your auth structure)
        setIsCoach(data.user?.role === 'coach' || data.user?.isCoach === true);
      }
    } catch (error) {
      console.error('Error checking coach status:', error);
    }
  }

  async function loadAnalytics() {
    try {
      setLoading(true);
      const res = await fetch(`/api/players/${playerId}/analytics?timeframe=${timeframe}`);
      if (!res.ok) throw new Error('Failed to load analytics');

      const data = await res.json();
      setAnalytics(data.analytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }

  async function generatePDF() {
    if (!analytics) return;

    try {
      setGenerating(true);
      const res = await fetch(`/api/players/${playerId}/analytics/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analytics, timeframe }),
      });

      if (!res.ok) throw new Error('Failed to generate PDF');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${analytics.playerName}-Analytics-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  }

  async function addMatch() {
    if (!newMatch.opponent || !newMatch.date || !newMatch.score) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSavingData(true);
      const res = await fetch(`/api/players/${playerId}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMatch),
      });

      if (!res.ok) throw new Error('Failed to add match');

      toast.success('Match added successfully!');
      setNewMatch({
        opponent: '',
        date: new Date().toISOString().split('T')[0],
        result: 'WIN',
        score: '',
        serviceAccuracy: 65,
        firstServeWinRate: 60,
        aces: 0,
        doubleFaults: 0,
      });
      setShowAddMatch(false);
      loadAnalytics();
    } catch (error) {
      console.error('Error adding match:', error);
      toast.error('Failed to add match');
    } finally {
      setSavingData(false);
    }
  }

  async function updatePlayerDetails() {
    try {
      setSavingData(true);
      const res = await fetch(`/api/players/${playerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: playerDetails.firstName,
          lastName: playerDetails.lastName,
          skillLevel: playerDetails.skillLevel,
          rank: playerDetails.rank,
        }),
      });

      if (!res.ok) throw new Error('Failed to update player');

      toast.success('Player details updated!');
      setEditingPlayer(false);
      loadAnalytics();
    } catch (error) {
      console.error('Error updating player:', error);
      toast.error('Failed to update player');
    } finally {
      setSavingData(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: G.dark, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: G.text, fontSize: 16 }}>⏳ Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div style={{ minHeight: '100vh', background: G.dark, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: G.red, fontSize: 16 }}>❌ Analytics not found</div>
      </div>
    );
  }

  const winPercentage = analytics.stats.winRate;

  return (
    <div style={{ minHeight: '100vh', background: G.dark, color: G.text, padding: '20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {analytics.profilePhoto && (
              <img
                src={analytics.profilePhoto}
                alt={analytics.playerName}
                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${G.lime}` }}
              />
            )}
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, marginBottom: 4, color: G.accent }}>
                📊 {analytics.playerName}
              </h1>
              <div style={{ fontSize: 12, color: G.muted }}>Performance Analytics & Progress Report</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              style={{
                background: G.card,
                border: `1px solid ${G.cardBorder}`,
                borderRadius: 6,
                padding: '10px 12px',
                color: G.text,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <option value="all">All Time</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="year">This Year</option>
            </select>

            {isCoach && (
              <>
                <button
                  onClick={() => setShowAddMatch(true)}
                  style={{
                    background: G.bright,
                    color: G.text,
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 16px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ➕ Add Match
                </button>
                <button
                  onClick={() => setEditingPlayer(!editingPlayer)}
                  style={{
                    background: editingPlayer ? G.yellow : G.mid,
                    color: editingPlayer ? G.dark : G.text,
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 16px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {editingPlayer ? '✓ Editing' : '✏️ Edit Details'}
                </button>
              </>
            )}

            <button
              onClick={generatePDF}
              disabled={generating}
              style={{
                background: G.blue,
                color: G.text,
                border: 'none',
                borderRadius: 6,
                padding: '10px 16px',
                fontSize: 12,
                fontWeight: 600,
                cursor: generating ? 'not-allowed' : 'pointer',
                opacity: generating ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {generating ? '⏳ Generating...' : '📥 Download PDF'}
            </button>
          </div>
        </div>

        {/* Edit Player Details Panel */}
        {isCoach && editingPlayer && (
          <div style={{ background: G.card, border: `2px solid ${G.yellow}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: G.yellow, marginBottom: 16 }}>
              ✏️ Edit Player Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
              <input
                type="text"
                placeholder="First Name"
                value={playerDetails.firstName}
                onChange={(e) => setPlayerDetails({ ...playerDetails, firstName: e.target.value })}
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
                type="text"
                placeholder="Last Name"
                value={playerDetails.lastName}
                onChange={(e) => setPlayerDetails({ ...playerDetails, lastName: e.target.value })}
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
                value={playerDetails.skillLevel}
                onChange={(e) => setPlayerDetails({ ...playerDetails, skillLevel: e.target.value })}
                style={{
                  background: G.dark,
                  border: `1px solid ${G.cardBorder}`,
                  borderRadius: 6,
                  padding: '10px',
                  color: G.text,
                  fontSize: 12,
                }}
              >
                <option value="">Select Skill Level</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Professional">Professional</option>
              </select>
              <input
                type="number"
                placeholder="Rank"
                value={playerDetails.rank}
                onChange={(e) => setPlayerDetails({ ...playerDetails, rank: parseInt(e.target.value) || 0 })}
                style={{
                  background: G.dark,
                  border: `1px solid ${G.cardBorder}`,
                  borderRadius: 6,
                  padding: '10px',
                  color: G.text,
                  fontSize: 12,
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={updatePlayerDetails}
                disabled={savingData}
                style={{
                  background: G.lime,
                  color: G.dark,
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: savingData ? 'not-allowed' : 'pointer',
                  opacity: savingData ? 0.6 : 1,
                }}
              >
                {savingData ? '⏳ Saving...' : '✓ Save Changes'}
              </button>
              <button
                onClick={() => setEditingPlayer(false)}
                style={{
                  background: G.mid,
                  color: G.text,
                  border: `1px solid ${G.cardBorder}`,
                  borderRadius: 6,
                  padding: '10px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        )}

        {/* Add Match Panel */}
        {isCoach && showAddMatch && (
          <div style={{ background: G.card, border: `2px solid ${G.bright}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: G.bright, marginBottom: 16 }}>
              ➕ Add New Match
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Opponent Name"
                value={newMatch.opponent}
                onChange={(e) => setNewMatch({ ...newMatch, opponent: e.target.value })}
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
                type="date"
                value={newMatch.date}
                onChange={(e) => setNewMatch({ ...newMatch, date: e.target.value })}
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
                value={newMatch.result}
                onChange={(e) => setNewMatch({ ...newMatch, result: e.target.value as 'WIN' | 'LOSS' })}
                style={{
                  background: G.dark,
                  border: `1px solid ${G.cardBorder}`,
                  borderRadius: 6,
                  padding: '10px',
                  color: G.text,
                  fontSize: 12,
                }}
              >
                <option value="WIN">WIN</option>
                <option value="LOSS">LOSS</option>
              </select>
              <input
                type="text"
                placeholder="Score (e.g., 6-4 7-5)"
                value={newMatch.score}
                onChange={(e) => setNewMatch({ ...newMatch, score: e.target.value })}
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
                type="number"
                placeholder="Service Accuracy %"
                min="0"
                max="100"
                value={newMatch.serviceAccuracy}
                onChange={(e) => setNewMatch({ ...newMatch, serviceAccuracy: parseInt(e.target.value) || 0 })}
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
                type="number"
                placeholder="First Serve Win Rate %"
                min="0"
                max="100"
                value={newMatch.firstServeWinRate}
                onChange={(e) => setNewMatch({ ...newMatch, firstServeWinRate: parseInt(e.target.value) || 0 })}
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
                type="number"
                placeholder="Aces"
                min="0"
                value={newMatch.aces}
                onChange={(e) => setNewMatch({ ...newMatch, aces: parseInt(e.target.value) || 0 })}
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
                type="number"
                placeholder="Double Faults"
                min="0"
                value={newMatch.doubleFaults}
                onChange={(e) => setNewMatch({ ...newMatch, doubleFaults: parseInt(e.target.value) || 0 })}
                style={{
                  background: G.dark,
                  border: `1px solid ${G.cardBorder}`,
                  borderRadius: 6,
                  padding: '10px',
                  color: G.text,
                  fontSize: 12,
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={addMatch}
                disabled={savingData}
                style={{
                  background: G.bright,
                  color: G.text,
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: savingData ? 'not-allowed' : 'pointer',
                  opacity: savingData ? 0.6 : 1,
                }}
              >
                {savingData ? '⏳ Saving...' : '✓ Add Match'}
              </button>
              <button
                onClick={() => setShowAddMatch(false)}
                style={{
                  background: G.mid,
                  color: G.text,
                  border: `1px solid ${G.cardBorder}`,
                  borderRadius: 6,
                  padding: '10px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        )}

        {/* Main Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <StatCard label="Total Matches" value={analytics.stats.totalMatches} icon="🎾" color={G.accent} />
          <StatCard label="Matches Won" value={analytics.stats.matchesWon} icon="🏆" color={G.lime} />
          <StatCard label="Matches Lost" value={analytics.stats.matchesLost} icon="📉" color={G.red} />
          <StatCard label="Win Rate" value={winPercentage.toFixed(1)} unit="%" icon="📊" color={G.blue} />
          {analytics.stats.currentRank && <StatCard label="Current Rank" value={`#${analytics.stats.currentRank}`} icon="🥇" color={G.yellow} />}
          {analytics.stats.streak && <StatCard label="Current Streak" value={analytics.stats.streak} icon="🔥" color={G.orange} />}
        </div>

        {/* Performance Metrics Section */}
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: G.lime, marginBottom: 16, margin: 0 }}>
            ⚡ Performance Metrics
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            <div>
              <ProgressBar label="Service Accuracy" value={analytics.performance.serviceAccuracy} color={G.lime} />
              <div style={{ fontSize: 11, color: G.muted }}>Percentage of first serves in</div>
            </div>
            <div>
              <ProgressBar label="1st Serve Win Rate" value={analytics.performance.firstServeWinRate} color={G.blue} />
              <div style={{ fontSize: 11, color: G.muted }}>Points won on first serve</div>
            </div>
            <div>
              <ProgressBar label="Break Point Conv." value={analytics.performance.breakPointConversion} color={G.accent} />
              <div style={{ fontSize: 11, color: G.muted }}>Break points converted</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginTop: 20 }}>
            <div style={{ background: G.dark, padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Aces</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: G.lime }}>{analytics.performance.aces}</div>
            </div>
            <div style={{ background: G.dark, padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Double Faults</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: G.red }}>{analytics.performance.doubleFaults}</div>
            </div>
          </div>
        </div>

        {/* Monthly Progress Chart */}
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: G.lime, marginBottom: 16, margin: 0 }}>
            📈 Monthly Progress
          </h2>
          <div style={{ overflowX: 'auto', paddingBottom: 10 }}>
            <div style={{ display: 'flex', gap: 12, minWidth: '100%', paddingBottom: 10 }}>
              {analytics.monthly.map((month, idx) => (
                <div
                  key={idx}
                  style={{
                    background: G.dark,
                    border: `1px solid ${G.cardBorder}`,
                    borderRadius: 8,
                    padding: 12,
                    minWidth: 150,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 11, color: G.muted, marginBottom: 8 }}>{month.month}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: G.accent, marginBottom: 6 }}>
                    {month.matches} Matches
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', fontSize: 12 }}>
                    <div style={{ color: G.lime }}>W: {month.wins}</div>
                    <div style={{ color: G.red }}>L: {month.losses}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Matches */}
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: G.lime, marginBottom: 16, margin: 0 }}>
            🎾 Recent Matches
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {analytics.recentMatches.length === 0 ? (
              <div style={{ color: G.muted, textAlign: 'center', padding: '20px' }}>
                No recent matches
              </div>
            ) : (
              analytics.recentMatches.map((match, idx) => (
                <div
                  key={idx}
                  style={{
                    background: G.dark,
                    border: `1px solid ${match.result === 'WIN' ? G.lime : G.red}`,
                    borderRadius: 8,
                    padding: 12,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: G.text }}>{match.opponent}</div>
                    <div style={{ fontSize: 11, color: G.muted }}>{match.date}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: G.muted }}>{match.score}</div>
                    <div
                      style={{
                        background: match.result === 'WIN' ? G.lime : G.red,
                        color: G.dark,
                        padding: '4px 12px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {match.result === 'WIN' ? '✓ WIN' : '✗ LOSS'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Goals Section */}
        {analytics.goals.length > 0 && (
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: G.lime, marginBottom: 16, margin: 0 }}>
              🎯 Goals & Targets
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              {analytics.goals.map((goal, idx) => (
                <div key={idx} style={{ background: G.dark, padding: 16, borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: G.accent, marginBottom: 12 }}>
                    {goal.name}
                  </div>
                  <ProgressBar label="Progress" value={goal.progress} max={100} color={G.lime} />
                  <div style={{ fontSize: 11, color: G.muted }}>Target: {goal.target}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div
          style={{
            background: G.mid,
            border: `1px solid ${G.cardBorder}`,
            borderRadius: 12,
            padding: 16,
            textAlign: 'center',
            fontSize: 11,
            color: G.muted,
          }}
        >
          Last updated: {new Date().toLocaleDateString()} | Data refreshed regularly
        </div>
      </div>
    </div>
  );
}
