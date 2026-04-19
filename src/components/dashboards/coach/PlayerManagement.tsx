'use client';

import React, { useEffect, useState } from 'react';
import { LoadingState } from '@/components/LoadingState';

const G = {
  dark: '#0a180a', sidebar: '#0f1e0f', card: '#162616', card2: '#1b2f1b', card3: '#203520',
  border: '#243e24', border2: '#326832', mid: '#2a5224', bright: '#3a7230',
  lime: '#79bf3e', lime2: '#a8d84e', text: '#e4f2da', text2: '#c2dbb0',
  muted: '#5e8e50', muted2: '#7aaa68', yellow: '#efc040', red: '#d94f4f', blue: '#4a9eff',
};

interface Player {
  id: string;
  user: { firstName: string; lastName: string; email: string; photo: string };
  status: string;
  joinedAt: string;
  sessionsCount: number;
  notes: { id: string; title: string; content: string; category: string; createdAt?: string }[];
  totalSpent?: number;
  level?: string;
  lastSession?: string;
  upcomingSessions?: number;
  progress?: {
    stats: {
      totalMatches: number;
      wins: number;
      losses: number;
      winRate: number;
      coachSessions: number;
      attendanceRate: number;
      badgesEarned: number;
    };
    progress: {
      monthly: Array<{
        month: string;
        matches: number;
        wins: number;
        losses: number;
        winRate: number;
      }>;
      recentWinRate: number;
      overallWinRate: number;
      improvement: number;
    };
    badges: Array<{
      id: string;
      name: string;
      description: string;
      icon: string;
      earnedAt: string;
    }>;
    attendance: Array<{
      date: string;
      present: boolean;
    }>;
  };
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 8.5, color: G.lime2, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 7 }}>{children}</div>
);

const Tag = ({ children, yellow, red, color }: { children: React.ReactNode; yellow?: boolean; red?: boolean; color?: string }) => {
  const c = color || (yellow ? G.yellow : red ? G.red : G.lime);
  return <span style={{ fontSize: 8.5, fontWeight: 700, borderRadius: 4, padding: '2px 7px', background: `${c}22`, border: `1px solid ${c}44`, color: c, display: 'inline-block' }}>{children}</span>;
};

const ProgressBar = ({ value, color = G.lime }: { value: number; color?: string }) => (
  <div style={{ height: 4, background: G.dark, borderRadius: 2, overflow: 'hidden', marginTop: 3 }}>
    <div style={{ height: '100%', width: `${Math.min(value, 100)}%`, background: color, borderRadius: 2 }} />
  </div>
);

const noteCategoryColors: Record<string, string> = {
  general: G.lime, performance: G.blue, injury: G.red, progress: G.yellow,
};

const levelColors: Record<string, string> = {
  Beginner: G.muted2, Intermediate: G.lime, Advanced: G.yellow,
};

export default function PlayerManagement({ coachId }: { coachId: string }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: '', content: '', category: 'general' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/coaches/players?coachId=${coachId}`);
        if (res.ok) {
          const d = await res.json();
          console.log('📊 Raw API response:', d);
          
          // Transform API response to component format
          const transformed = Array.isArray(d) ? d.map((rel: any) => ({
            id: rel.playerId,
            user: rel.player.user,
            status: rel.status,
            joinedAt: rel.joinedAt,
            sessionsCount: rel.sessionsCount,
            notes: rel.notes || [],
          })) : [];
          
          console.log('✅ Transformed players:', transformed);
          setPlayers(transformed);
        }
      } catch (error) {
        console.error('Error fetching players:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [coachId]);

  const addNote = async (playerId: string) => {
    if (!noteForm.title || !noteForm.content) return;
    const newNote = { id: `n${Date.now()}`, ...noteForm, createdAt: new Date().toISOString() };
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, notes: [newNote, ...p.notes] } : p));
    setSelectedPlayer(prev => prev ? { ...prev, notes: [newNote, ...prev.notes] } : null);
    setNoteForm({ title: '', content: '', category: 'general' });
    try {
      await fetch(`/api/coaches/players/${playerId}/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coachId, ...noteForm }) });
    } catch { }
  };

  const selectPlayer = async (player: Player) => {
    setSelectedPlayer(player);
    setLoadingProgress(true);
    try {
      const res = await fetch(`/api/player/progress?playerId=${player.id}`);
      if (res.ok) {
        const progressData = await res.json();
        setSelectedPlayer(prev => prev ? { ...prev, progress: progressData } : null);
      }
    } catch (error) {
      console.error('Error fetching player progress:', error);
    } finally {
      setLoadingProgress(false);
    }
  };

  const filtered = players.filter(p => {
    const matchSearch = p.user ? `${p.user.firstName} ${p.user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) : false;
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const card = { background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, padding: 14 } as const;
  const inputSt = { width: '100%', padding: '8px 11px', background: G.dark, border: `1px solid ${G.border}`, color: G.text, borderRadius: 7, fontSize: 11.5, outline: 'none', boxSizing: 'border-box' } as const;

  if (loading) return <LoadingState icon="👨‍💻" message="Loading players..." fullPage={false} />;

  if (selectedPlayer) {
    const sp = selectedPlayer;
    const initials = `${sp.user.firstName[0]}${sp.user.lastName[0]}`;
    const sessionProgress = Math.min((sp.sessionsCount / 30) * 100, 100);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {/* Back */}
        <button onClick={() => setSelectedPlayer(null)} style={{ background: 'none', border: 'none', color: G.lime, cursor: 'pointer', fontSize: 11.5, fontWeight: 700, textAlign: 'left', padding: 0 }}>
          ← Back to Players
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 11 }}>

          {/* Player Profile */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <div style={card}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: G.mid, border: `2px solid ${G.lime}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: G.lime, flexShrink: 0 }}>
                  {sp.user.photo ? <img src={sp.user.photo} alt="" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} /> : initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 900 }}>{sp.user.firstName} {sp.user.lastName}</span>
                    <Tag color={sp.status === 'active' ? G.lime : G.muted}>{sp.status}</Tag>
                    {sp.level && <Tag color={levelColors[sp.level]}>{sp.level}</Tag>}
                  </div>
                  <div style={{ fontSize: 10.5, color: G.muted2, marginBottom: 8 }}>{sp.user.email}</div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 10 }}>
                    <span style={{ color: G.muted }}>📅 Joined {new Date(sp.joinedAt).toLocaleDateString()}</span>
                    {sp.lastSession && <span style={{ color: G.muted }}>🎾 Last: {sp.lastSession}</span>}
                    {sp.upcomingSessions ? <span style={{ color: G.lime2 }}>⏰ {sp.upcomingSessions} upcoming</span> : null}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: G.lime2 }}>{sp.sessionsCount}</div>
                  <div style={{ fontSize: 9, color: G.muted }}>sessions</div>
                  {sp.totalSpent && <div style={{ fontSize: 13, fontWeight: 800, color: G.yellow, marginTop: 4 }}>${sp.totalSpent.toLocaleString()}</div>}
                </div>
              </div>

              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${G.border}` }}>
                <SectionLabel>Session Progress</SectionLabel>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10.5, color: G.text2 }}>{sp.sessionsCount} of 30 sessions milestone</span>
                  <span style={{ fontSize: 10.5, color: G.lime2, fontWeight: 800 }}>{Math.round(sessionProgress)}%</span>
                </div>
                <ProgressBar value={sessionProgress} />
              </div>

              {/* Progress Stats */}
              {sp.progress && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${G.border}` }}>
                  <SectionLabel>Performance Progress</SectionLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                    <div style={{ background: G.dark, borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: G.lime2 }}>{sp.progress.stats.winRate}%</div>
                      <div style={{ fontSize: 8, color: G.muted, textTransform: 'uppercase' }}>Win Rate</div>
                    </div>
                    <div style={{ background: G.dark, borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: G.lime2 }}>{sp.progress.stats.totalMatches}</div>
                      <div style={{ fontSize: 8, color: G.muted, textTransform: 'uppercase' }}>Matches</div>
                    </div>
                    <div style={{ background: G.dark, borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: G.lime2 }}>{sp.progress.stats.badgesEarned}</div>
                      <div style={{ fontSize: 8, color: G.muted, textTransform: 'uppercase' }}>Badges</div>
                    </div>
                  </div>

                  {sp.progress.progress.monthly.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 9.5, color: G.muted2, marginBottom: 6 }}>Recent Monthly Performance</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {sp.progress.progress.monthly.slice(-3).map((month, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: G.dark, borderRadius: 4, padding: '4px 8px' }}>
                            <span style={{ fontSize: 9, color: G.text2 }}>{month.month}</span>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <span style={{ fontSize: 8, color: G.muted }}>{month.wins}W-{month.losses}L</span>
                              <span style={{ fontSize: 9, fontWeight: 700, color: month.winRate >= 50 ? G.lime : G.yellow }}>{month.winRate}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {sp.progress.badges.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 9.5, color: G.muted2, marginBottom: 6 }}>Recent Achievements</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {sp.progress.badges.slice(0, 3).map((badge, i) => (
                          <span key={i} style={{ fontSize: 8, background: G.mid, color: G.lime, borderRadius: 10, padding: '2px 6px' }}>
                            {badge.icon} {badge.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {loadingProgress && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${G.border}`, textAlign: 'center', color: G.muted }}>
                  Loading progress data...
                </div>
              )}
            </div>

            {/* Add Note */}
            <div style={card}>
              <SectionLabel>Add Coaching Note</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <input style={inputSt} placeholder="Note title (e.g. Serve Improvement)" value={noteForm.title} onChange={e => setNoteForm({ ...noteForm, title: e.target.value })} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                  <select style={inputSt} value={noteForm.category} onChange={e => setNoteForm({ ...noteForm, category: e.target.value })}>
                    <option value="general">📝 General</option>
                    <option value="performance">📊 Performance</option>
                    <option value="injury">🩹 Injury</option>
                    <option value="progress">📈 Progress</option>
                  </select>
                  <button onClick={() => addNote(sp.id)} style={{ background: G.lime, color: '#0a180a', border: 'none', borderRadius: 7, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
                    ✓ Save Note
                  </button>
                </div>
                <textarea style={{ ...inputSt, resize: 'none' }} rows={3} placeholder="Describe the coaching observation..." value={noteForm.content} onChange={e => setNoteForm({ ...noteForm, content: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Notes Timeline */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <SectionLabel>Coaching Notes</SectionLabel>
              <Tag>{sp.notes.length}</Tag>
            </div>
            {sp.notes.length === 0 ? (
              <div style={{ color: G.muted, fontSize: 10.5, textAlign: 'center', padding: '20px 0' }}>No notes yet. Add your first coaching note!</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {sp.notes.map((note, i) => (
                  <div key={note.id} style={{ background: G.card2, border: `1px solid ${G.border}`, borderRadius: 9, padding: 11, borderLeft: `3px solid ${noteCategoryColors[note.category] || G.lime}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 800 }}>{note.title}</span>
                      <Tag color={noteCategoryColors[note.category]}>{note.category}</Tag>
                    </div>
                    <p style={{ fontSize: 10.5, color: G.text2, lineHeight: 1.55, margin: 0 }}>{note.content}</p>
                    {note.createdAt && <div style={{ fontSize: 9, color: G.muted, marginTop: 6 }}>{new Date(note.createdAt).toLocaleDateString()}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color: G.text }}>👥 My Players</div>
          <div style={{ fontSize: 10, color: G.muted2, marginTop: 2 }}>Manage your player roster</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Tag>{players.filter(p => p.status === 'active').length} active</Tag>
          <Tag color={G.muted}>{players.filter(p => p.status === 'inactive').length} inactive</Tag>
        </div>
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: G.muted }}>🔍</span>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search players..." style={{ width: '100%', padding: '8px 11px 8px 28px', background: G.card2, border: `1px solid ${G.border}`, color: G.text, borderRadius: 8, fontSize: 11.5, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: 3, background: G.card, border: `1px solid ${G.border}`, borderRadius: 8, padding: 3 }}>
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button key={f} onClick={() => setFilterStatus(f)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, background: filterStatus === f ? G.lime : 'transparent', color: filterStatus === f ? '#0a180a' : G.muted, textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Player Grid */}
      {filtered.length === 0 ? (
        <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, padding: 40, textAlign: 'center', color: G.muted }}>
          No players found
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {filtered.map(player => {
            const initials = `${player.user.firstName[0]}${player.user.lastName[0]}`;
            const isActive = player.status === 'active';
            return (
              <div
                key={player.id}
                onClick={() => selectPlayer(player)}
                style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 11, padding: 13, cursor: 'pointer', transition: 'all .15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = G.border2; (e.currentTarget as HTMLDivElement).style.background = G.card2; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = G.border; (e.currentTarget as HTMLDivElement).style.background = G.card; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: G.mid, border: `1.5px solid ${isActive ? G.lime : G.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: G.lime }}>
                      {player.user.photo ? <img src={player.user.photo} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} /> : initials}
                    </div>
                    {isActive && <div style={{ position: 'absolute', bottom: 1, right: 1, width: 7, height: 7, background: '#4cd964', borderRadius: '50%', border: `1.5px solid ${G.card}` }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.user.firstName} {player.user.lastName}</div>
                    <div style={{ fontSize: 9.5, color: G.muted2 }}>{player.user.email}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 9 }}>
                  {[
                    { label: 'Sessions', value: player.sessionsCount },
                    { label: 'Spent', value: player.totalSpent ? `$${player.totalSpent}` : '–' },
                  ].map((s, i) => (
                    <div key={i} style={{ background: G.dark, borderRadius: 6, padding: '6px 8px' }}>
                      <div style={{ fontSize: 7.5, color: G.muted, textTransform: 'uppercase', marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: G.lime2 }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 5, justifyContent: 'space-between', alignItems: 'center' }}>
                  <Tag color={isActive ? G.lime : G.muted}>{player.status}</Tag>
                  {player.level && <Tag color={levelColors[player.level] || G.muted}>{player.level}</Tag>}
                  {player.notes.length > 0 && <Tag color={G.blue}>📝 {player.notes.length}</Tag>}
                </div>

                {player.lastSession && (
                  <div style={{ fontSize: 9, color: G.muted, marginTop: 7 }}>Last session: {player.lastSession}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}