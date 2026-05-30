'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@/components/LoadingState';
import { useToast } from '@/components/ui/ToastContext';
import { usePDFDownload } from '@/hooks/usePDFDownload';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

const G = {
  dark: '#0a180a', sidebar: '#0f1e0f', card: '#162616', card2: '#1b2f1b', card3: '#203520',
  border: '#243e24', border2: '#326832', mid: '#2a5224', bright: '#3a7230',
  lime: '#79bf3e', lime2: '#a8d84e', text: '#e4f2da', text2: '#c2dbb0',
  muted: '#5e8e50', muted2: '#7aaa68', yellow: '#efc040', red: '#d94f4f', blue: '#4a9eff',
};

const Tag = ({ children, yellow, red, color }: { children: React.ReactNode; yellow?: boolean; red?: boolean; color?: string }) => {
  const c = color || (yellow ? G.yellow : red ? G.red : G.lime);
  return <span style={{ fontSize: 8.5, fontWeight: 700, borderRadius: 4, padding: '2px 7px', background: `${c}22`, border: `1px solid ${c}44`, color: c, display: 'inline-block' }}>{children}</span>;
};

export default function PlayerManagement({ coachId }: { coachId: string }) {
  type EligiblePlayer = {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    photo?: string | null;
    organizationId?: string | null;
    relationshipType: 'direct' | 'organization' | 'pending' | 'platform';
  };

  type PlayerDetails = EligiblePlayer & {
    status: 'active' | 'organization';
    joinedAt?: string;
    matchesPlayed?: number;
    matchesWon?: number;
    matchesLost?: number;
    winRate?: string | number;
    bio?: string;
    progress?: any;
    notes: any[];
  };

  const [players, setPlayers] = useState<PlayerDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDetails | null>(null);
  const [playerProgress, setPlayerProgress] = useState<any>(null);
  const [currentCoach, setCurrentCoach] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'our' | 'org' | 'pending'>('all');
  const [noteForm, setNoteForm] = useState({ title: '', content: '', category: 'general' });
  const [ratingForm, setRatingForm] = useState({
    overallRating: 5,
    techniquRating: 5,
    mentalRating: 5,
    fitnessRating: 5,
    teamworkRating: 5,
    strengths: '',
    areasForImprovement: '',
    notes: '',
  });
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);
  const [requestingPlayerId, setRequestingPlayerId] = useState<string | null>(null);
  const [viewingProfilePlayerId, setViewingProfilePlayerId] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { addToast } = useToast();
  const { downloadPDF, isDownloading } = usePDFDownload();

  useEffect(() => {
    const loadRoster = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/coaches/players/eligible?coachId=${coachId}`);
        if (!res.ok) {
          throw new Error('Unable to fetch roster');
        }
        const data = await res.json();
        if (!Array.isArray(data.players)) {
          throw new Error('Invalid roster response');
        }

        const list: PlayerDetails[] = data.players.map((player: EligiblePlayer) => ({
          ...player,
          status: player.relationshipType === 'direct' ? 'active' : 'organization',
          joinedAt: new Date().toISOString(),
          matchesPlayed: 0,
          notes: [],
        }));

        setPlayers(list);
      } catch (error) {
        console.error(error);
        addToast('Unable to load coach players', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadRoster();
  }, [coachId, addToast]);

  const totalDirect = useMemo(() => players.filter(player => player.status === 'active').length, [players]);
  const totalOrg = useMemo(() => players.filter(player => player.relationshipType === 'organization').length, [players]);
  const totalPending = useMemo(() => players.filter(player => player.relationshipType === 'pending').length, [players]);

  const fetchPlayerDetails = useCallback(async (player: PlayerDetails) => {
    setSelectedPlayer(player);
    setLoadingProgress(true);
    setCurrentCoach(null);
    setPlayerProgress(null);
    setNotes([]);

    try {
      const [profileRes, progressRes, coachesRes] = await Promise.all([
        fetch(`/api/players/${player.userId}`),
        fetch(`/api/players/${player.userId}/progress`),
        fetch(`/api/players/coaches?playerId=${player.userId}`),
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.player) {
          setSelectedPlayer(prev => prev ? { ...prev, ...profileData.player } : { ...player, ...profileData.player });
        }
      }

      if (progressRes.ok) {
        const progressData = await progressRes.json();
        setPlayerProgress(progressData);
      }

      if (coachesRes.ok) {
        const coachData = await coachesRes.json();
        setCurrentCoach(Array.isArray(coachData) && coachData.length > 0 ? coachData[0].coach : null);
      }

      if (player.status === 'active') {
        const notesRes = await fetch(`/api/coaches/players/${player.userId}/notes?coachId=${coachId}`);
        if (notesRes.ok) {
          const notesData = await notesRes.json();
          setNotes(Array.isArray(notesData) ? notesData : []);
        }
      }
    } catch (error) {
      console.error('Error loading player details:', error);
      addToast('Unable to load player details', 'error');
    } finally {
      setLoadingProgress(false);
    }
  }, [coachId, addToast]);

  const handleViewProfile = useCallback((player: PlayerDetails) => {
    if (viewingProfilePlayerId) return;
    setViewingProfilePlayerId(player.userId);
    addToast(`Opening ${player.firstName} ${player.lastName}'s profile...`, 'info');
    router.push(`/players/profile/${player.userId}?view=coach`);
  }, [addToast, router, viewingProfilePlayerId]);

  const handleRequestPlayer = useCallback(async (player: PlayerDetails) => {
    setRequestingPlayerId(player.userId);
    try {
      const res = await fetch('/api/coaches/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coachId, playerId: player.userId }),
      });

      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload?.error || 'Failed to request player');
      }

      setPlayers(prev => prev.map(p => p.userId === player.userId ? { ...p, status: 'active', relationshipType: 'direct' } : p));
      if (selectedPlayer?.userId === player.userId) {
        setSelectedPlayer(prev => prev ? { ...prev, status: 'active', relationshipType: 'direct' } : prev);
      }
      addToast(`${player.firstName} ${player.lastName} has been added to your roster`, 'success');
    } catch (error) {
      console.error(error);
      addToast('Unable to request player', 'error');
    } finally {
      setRequestingPlayerId(null);
    }
  }, [coachId, selectedPlayer, addToast]);

  const handleAcceptPlayer = useCallback(async (player: PlayerDetails) => {
    setRequestingPlayerId(player.userId);
    try {
      const res = await fetch(`/api/coaches/players/${player.userId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coachId }),
      });

      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload?.error || 'Failed to accept assignment');
      }

      setPlayers(prev => prev.map(p => p.userId === player.userId ? { ...p, status: 'active', relationshipType: 'direct' } : p));
      if (selectedPlayer?.userId === player.userId) {
        setSelectedPlayer(prev => prev ? { ...prev, status: 'active', relationshipType: 'direct' } : prev);
      }
      addToast(`${player.firstName} ${player.lastName} has been accepted for coaching`, 'success');
    } catch (error) {
      console.error(error);
      addToast('Unable to accept assignment', 'error');
    } finally {
      setRequestingPlayerId(null);
    }
  }, [coachId, selectedPlayer, addToast]);

  const handleAddNote = async () => {
    if (!selectedPlayer) return;
    if (!noteForm.title.trim() || !noteForm.content.trim()) {
      addToast('Please complete title and content before saving', 'warning');
      return;
    }

    setSavingNote(true);
    try {
      const res = await fetch(`/api/coaches/players/${selectedPlayer.userId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coachId, title: noteForm.title, content: noteForm.content, category: noteForm.category }),
      });

      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload?.error || 'Failed to save note');
      }
      const noteData = await res.json();
      setNotes(prev => [noteData, ...prev]);
      setNoteForm({ title: '', content: '', category: 'general' });
      addToast('Coaching note saved', 'success');
    } catch (error) {
      console.error(error);
      addToast('Unable to save note', 'error');
    } finally {
      setSavingNote(false);
    }
  };

  const submitRating = async () => {
    if (!selectedPlayer) return;
    if (!ratingForm.strengths.trim() || !ratingForm.areasForImprovement.trim()) {
      addToast('Please fill strengths and areas for improvement', 'warning');
      return;
    }

    setSubmittingRating(true);
    try {
      const res = await authenticatedFetch('/api/coaches/rate-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId,
          playerId: selectedPlayer.userId,
          ...ratingForm,
        }),
      });

      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload?.error || 'Failed to submit rating');
      }

      setRatingSuccess(true);
      setTimeout(() => setRatingSuccess(false), 3000);
      setRatingForm({
        overallRating: 5,
        techniquRating: 5,
        mentalRating: 5,
        fitnessRating: 5,
        teamworkRating: 5,
        strengths: '',
        areasForImprovement: '',
        notes: '',
      });
      addToast('Rating submitted successfully', 'success');
    } catch (error) {
      console.error(error);
      addToast('Unable to submit rating', 'error');
    } finally {
      setSubmittingRating(false);
    }
  };

  const exportPlayerPDF = async () => {
    if (!profileRef.current || !selectedPlayer) {
      addToast('Unable to generate PDF', 'error');
      return;
    }

    setPdfLoading(true);
    try {
      await downloadPDF(profileRef.current, {
        filename: `${selectedPlayer.firstName}-${selectedPlayer.lastName}-profile.pdf`,
        reportTitle: `${selectedPlayer.firstName} ${selectedPlayer.lastName}`,
        reportDescription: 'Player profile, organization membership, coach details, and progress summary',
      });
    } catch (error) {
      console.error(error);
      addToast('PDF export failed', 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return players.filter(player => {
      const searchable = `${player.firstName} ${player.lastName} ${player.email}`.toLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'our' && player.status === 'active') ||
        (activeTab === 'org' && player.relationshipType !== 'pending') ||
        (activeTab === 'pending' && player.relationshipType === 'pending');
      return matchesSearch && matchesTab;
    });
  }, [players, searchQuery, activeTab]);

  const playerCountLabel = `${totalDirect} roster player${totalDirect === 1 ? '' : 's'} · ${totalOrg} org player${totalOrg === 1 ? '' : 's'} · ${totalPending} requested`;
  const selectedIsDirect = selectedPlayer?.status === 'active';

  if (loading) {
    return <LoadingState icon="👨‍💻" message="Loading players..." fullPage={false} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {!selectedPlayer ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: G.text }}>Player Roster</div>
              <div style={{ fontSize: 11, color: G.muted2, marginTop: 3 }}>{playerCountLabel}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Tag color={G.lime}>{totalDirect} roster</Tag>
              <Tag color={G.blue}>{totalOrg} org</Tag>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 320px' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: G.muted }}>🔍</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search players by name or email"
                style={{ width: '100%', padding: '11px 14px 11px 34px', background: G.card2, border: `1px solid ${G.border}`, color: G.text, borderRadius: 10, fontSize: 12, outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6, background: G.card, border: `1px solid ${G.border}`, borderRadius: 10, padding: 4 }}>
              {(['all', 'our', 'org', 'pending'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                    background: activeTab === tab ? G.lime : 'transparent', color: activeTab === tab ? '#0a180a' : G.muted,
                  }}
                >
                  {tab === 'all' ? 'All players' : tab === 'our' ? 'Your players' : tab === 'org' ? 'Org players' : 'Requested'}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, padding: 28, color: G.muted, textAlign: 'center' }}>
              No players match your search.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
              {filtered.map(player => {
                const initials = `${player.firstName[0] || ''}${player.lastName[0] || ''}`;
                const isRoster = player.status === 'active';
                return (
                  <div
                    key={player.userId}
                    onClick={() => fetchPlayerDetails(player)}
                    style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 14, padding: 16, cursor: 'pointer', minHeight: 170, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: G.mid, border: `1.5px solid ${isRoster ? G.lime : G.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: G.lime }}>
                            {player.photo ? <img src={player.photo} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} /> : initials}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 900, color: G.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.firstName} {player.lastName}</div>
                            <div style={{ fontSize: 10, color: G.muted2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.email}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                          <Tag color={isRoster ? G.lime : player.relationshipType === 'pending' ? G.yellow : player.relationshipType === 'organization' ? G.blue : G.yellow}>
                            {isRoster ? 'Your player' : player.relationshipType === 'pending' ? 'Requested' : player.relationshipType === 'organization' ? 'Org player' : 'Platform player'}
                          </Tag>
                          {player.organizationId && player.relationshipType !== 'platform' && <Tag color={G.yellow}>Org member</Tag>}
                        </div>
                      </div>
                      <p style={{ color: G.muted2, fontSize: 10.5, lineHeight: 1.6, minHeight: 42 }}>
                        {isRoster
                          ? 'Coached directly by you with roster tools and progress detail.'
                          : player.relationshipType === 'pending'
                        ? 'An assignment request for this player is pending. Accept it to confirm the relationship.'
                        : player.relationshipType === 'organization'
                          ? 'Available inside your organization. Request this player to recruit them.'
                          : 'Available across the platform. Request this player to recruit them.'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 14 }}>
                      <div style={{ fontSize: 10, color: G.muted2 }}>{player.organizationId ? 'In org directory' : 'No org'} </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); handleViewProfile(player); }}
                          disabled={Boolean(viewingProfilePlayerId)}
                          style={{
                            background: viewingProfilePlayerId === player.userId ? G.muted : G.dark,
                            color: G.text,
                            border: `1px solid ${G.border}`,
                            borderRadius: 9,
                            padding: '9px 12px',
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: viewingProfilePlayerId === player.userId ? 'not-allowed' : 'pointer',
                            opacity: viewingProfilePlayerId === player.userId ? 0.7 : 1,
                          }}
                        >
                          {viewingProfilePlayerId === player.userId ? 'Loading…' : 'View profile'}
                        </button>
                        {!isRoster && (
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); player.relationshipType === 'pending' ? handleAcceptPlayer(player) : handleRequestPlayer(player); }}
                            disabled={requestingPlayerId === player.userId}
                            style={{ background: player.relationshipType === 'pending' ? G.yellow : G.lime, color: '#0a180a', border: 'none', borderRadius: 9, padding: '9px 12px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                          >
                            {requestingPlayerId === player.userId
                              ? player.relationshipType === 'pending' ? 'Accepting…' : 'Requesting…'
                              : player.relationshipType === 'pending' ? 'Accept assignment' : 'Request'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <button
              type="button"
              onClick={() => setSelectedPlayer(null)}
              style={{ background: 'none', border: 'none', color: G.lime, cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: 0, textAlign: 'left' }}
            >
              ← Back to players
            </button>

            <div ref={profileRef} style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 78, height: 78, borderRadius: '50%', background: G.mid, border: `2px solid ${G.lime}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: G.lime }}>
                  {selectedPlayer?.photo ? <img src={selectedPlayer.photo} alt="" style={{ width: 78, height: 78, borderRadius: '50%', objectFit: 'cover' }} /> : `${selectedPlayer?.firstName?.[0] || ''}${selectedPlayer?.lastName?.[0] || ''}`}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: G.text }}>{selectedPlayer?.firstName} {selectedPlayer?.lastName}</span>
                    <Tag color={selectedIsDirect ? G.lime : G.blue}>{selectedIsDirect ? 'Your player' : 'Org player'}</Tag>
                    {selectedPlayer?.organizationId && <Tag color={G.yellow}>Org member</Tag>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10, fontSize: 11, color: G.muted2 }}>
                    <div>{selectedPlayer?.email}</div>
                    <div>{selectedPlayer?.phone || 'Phone not set'}</div>
                    <div>Joined: {selectedPlayer?.joinedAt ? new Date(selectedPlayer.joinedAt).toLocaleDateString() : 'Unknown'}</div>
                    <div>Relationship: {selectedIsDirect ? 'Direct coaching' : 'Org candidate'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => router.push(`/players/profile/${selectedPlayer?.userId}?view=coach`)}
                    style={{ background: G.dark, color: G.text, border: `1px solid ${G.border}`, borderRadius: 10, padding: '11px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 11 }}
                  >
                    View full profile
                  </button>
                  <button
                    type="button"
                    onClick={exportPlayerPDF}
                    disabled={pdfLoading || isDownloading}
                    style={{ background: G.blue, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 11 }}
                  >
                    {pdfLoading || isDownloading ? 'Exporting…' : 'Export PDF'}
                  </button>
                  {!selectedIsDirect && (
                    <button
                      type="button"
                      onClick={() => selectedPlayer.relationshipType === 'pending' ? handleAcceptPlayer(selectedPlayer) : handleRequestPlayer(selectedPlayer)}
                      disabled={requestingPlayerId === selectedPlayer.userId}
                      style={{ background: selectedPlayer.relationshipType === 'pending' ? G.yellow : G.lime, color: '#0a180a', border: 'none', borderRadius: 10, padding: '11px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 11 }}
                    >
                      {requestingPlayerId === selectedPlayer.userId
                        ? selectedPlayer.relationshipType === 'pending' ? 'Accepting…' : 'Requesting…'
                        : selectedPlayer.relationshipType === 'pending' ? 'Accept assignment' : 'Request to coach'}
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                <div style={{ background: G.card2, borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 9, color: G.muted, textTransform: 'uppercase', marginBottom: 8 }}>Matches</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: G.lime }}>{selectedPlayer?.matchesPlayed ?? 0}</div>
                  <div style={{ fontSize: 10, color: G.muted2, marginTop: 6 }}>Total matches recorded</div>
                </div>
                <div style={{ background: G.card2, borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 9, color: G.muted, textTransform: 'uppercase', marginBottom: 8 }}>Win rate</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: G.lime }}>{selectedPlayer?.winRate ?? '0'}%</div>
                  <div style={{ fontSize: 10, color: G.muted2, marginTop: 6 }}>Performance snapshot</div>
                </div>
                <div style={{ background: G.card2, borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 9, color: G.muted, textTransform: 'uppercase', marginBottom: 8 }}>Coach</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: G.text }}>{currentCoach ? `${currentCoach.firstName} ${currentCoach.lastName}` : 'Unassigned'}</div>
                  <div style={{ fontSize: 10, color: G.muted2, marginTop: 6 }}>{currentCoach?.organization?.name || 'No current coach'}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: G.card2, borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 10, color: G.muted, textTransform: 'uppercase', marginBottom: 8 }}>Player bio</div>
                  <div style={{ fontSize: 11, color: G.text2, lineHeight: 1.6 }}>{selectedPlayer?.bio || 'No bio available yet for this player.'}</div>
                </div>
                <div style={{ background: G.card2, borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 10, color: G.muted, textTransform: 'uppercase', marginBottom: 8 }}>Membership</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11, color: G.text2 }}>
                    <div>Organization: {selectedPlayer?.organizationId ? 'Yes' : 'No'}</div>
                    <div>Status: {selectedIsDirect ? 'Direct roster player' : 'Available through org'}</div>
                    {currentCoach && currentCoach.organization && <div>Current coach organization: {currentCoach.organization.name}</div>}
                  </div>
                </div>
              </div>

              {loadingProgress && (
                <div style={{ color: G.muted2, fontSize: 11, textAlign: 'center' }}>Loading player progress...</div>
              )}
            </div>

            {selectedIsDirect && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 14, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: G.text }}>Coaching Notes</div>
                    <Tag color={G.blue}>{notes.length}</Tag>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <input
                      style={{ width: '100%', padding: '11px 12px', background: G.card2, border: `1px solid ${G.border}`, color: G.text, borderRadius: 10, fontSize: 12, outline: 'none' }}
                      placeholder="Note title"
                      value={noteForm.title}
                      onChange={e => setNoteForm({ ...noteForm, title: e.target.value })}
                    />
                    <select
                      style={{ width: '100%', padding: '11px 12px', background: G.card2, border: `1px solid ${G.border}`, color: G.text, borderRadius: 10, fontSize: 12, outline: 'none' }}
                      value={noteForm.category}
                      onChange={e => setNoteForm({ ...noteForm, category: e.target.value })}
                    >
                      <option value="general">General</option>
                      <option value="performance">Performance</option>
                      <option value="injury">Injury</option>
                      <option value="progress">Progress</option>
                    </select>
                    <textarea
                      rows={4}
                      style={{ width: '100%', padding: '11px 12px', background: G.card2, border: `1px solid ${G.border}`, color: G.text, borderRadius: 10, fontSize: 12, resize: 'vertical', outline: 'none' }}
                      placeholder="Add coaching note..."
                      value={noteForm.content}
                      onChange={e => setNoteForm({ ...noteForm, content: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={handleAddNote}
                      disabled={savingNote}
                      style={{ background: G.lime, color: '#0a180a', border: 'none', borderRadius: 10, padding: '12px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
                    >
                      {savingNote ? 'Saving…' : 'Save note'}
                    </button>
                  </div>

                  <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {notes.length === 0 ? (
                      <div style={{ fontSize: 11, color: G.muted2 }}>No notes yet. Add your first coaching observation.</div>
                    ) : (
                      notes.map(note => (
                        <div key={note.id} style={{ background: G.card2, borderRadius: 12, padding: 12, border: `1px solid ${G.border}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 800, color: G.text }}>{note.title}</div>
                              <div style={{ fontSize: 10, color: G.muted2 }}>{note.category}</div>
                            </div>
                            {note.createdAt && <div style={{ fontSize: 9, color: G.muted2 }}>{new Date(note.createdAt).toLocaleDateString()}</div>}
                          </div>
                          <p style={{ fontSize: 11, color: G.text2, marginTop: 10 }}>{note.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 14, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: G.text, marginBottom: 12 }}>Performance Rating</div>
                  {ratingSuccess && (
                    <div style={{ background: `${G.lime}22`, color: G.lime, padding: '10px 12px', borderRadius: 10, marginBottom: 12, fontSize: 11, fontWeight: 700 }}>
                      Rating submitted successfully.
                    </div>
                  )}
                  <div style={{ display: 'grid', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: G.muted, marginBottom: 6 }}>Overall rating</div>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={0.5}
                        value={ratingForm.overallRating}
                        onChange={e => setRatingForm({ ...ratingForm, overallRating: parseFloat(e.target.value) })}
                        style={{ width: '100%', accentColor: G.lime }}
                      />
                      <div style={{ fontSize: 14, fontWeight: 900, color: G.lime, marginTop: 8 }}>{ratingForm.overallRating.toFixed(1)}</div>
                    </div>
                    {[
                      { key: 'techniquRating', label: 'Technique' },
                      { key: 'mentalRating', label: 'Mental' },
                      { key: 'fitnessRating', label: 'Fitness' },
                      { key: 'teamworkRating', label: 'Teamwork' },
                    ].map((item) => (
                      <div key={item.key}>
                        <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>{item.label}</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {[1, 2, 3, 4, 5].map(value => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setRatingForm({ ...ratingForm, [item.key]: value })}
                              style={{
                                flex: 1,
                                padding: '8px 0',
                                borderRadius: 8,
                                border: 'none',
                                fontSize: 11,
                                fontWeight: 700,
                                background: (ratingForm as any)[item.key] >= value ? G.lime : G.card2,
                                color: (ratingForm as any)[item.key] >= value ? '#0a180a' : G.muted2,
                                cursor: 'pointer',
                              }}
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <textarea
                      rows={3}
                      placeholder="Strengths"
                      style={{ width: '100%', padding: '11px 12px', background: G.card2, border: `1px solid ${G.border}`, color: G.text, borderRadius: 10, fontSize: 12, resize: 'vertical', outline: 'none' }}
                      value={ratingForm.strengths}
                      onChange={e => setRatingForm({ ...ratingForm, strengths: e.target.value })}
                    />
                    <textarea
                      rows={3}
                      placeholder="Areas for improvement"
                      style={{ width: '100%', padding: '11px 12px', background: G.card2, border: `1px solid ${G.border}`, color: G.text, borderRadius: 10, fontSize: 12, resize: 'vertical', outline: 'none' }}
                      value={ratingForm.areasForImprovement}
                      onChange={e => setRatingForm({ ...ratingForm, areasForImprovement: e.target.value })}
                    />
                    <textarea
                      rows={2}
                      placeholder="Additional notes (optional)"
                      style={{ width: '100%', padding: '11px 12px', background: G.card2, border: `1px solid ${G.border}`, color: G.text, borderRadius: 10, fontSize: 12, resize: 'vertical', outline: 'none' }}
                      value={ratingForm.notes}
                      onChange={e => setRatingForm({ ...ratingForm, notes: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={submitRating}
                      disabled={submittingRating}
                      style={{ background: G.lime, color: '#0a180a', border: 'none', borderRadius: 10, padding: '12px 14px', fontWeight: 700, cursor: submittingRating ? 'not-allowed' : 'pointer', fontSize: 12 }}
                    >
                      {submittingRating ? 'Submitting…' : 'Submit rating'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: G.text }}>Player Progress</div>
                <Tag color={G.yellow}>{playerProgress?.sessions?.length ?? 0} sessions</Tag>
              </div>
              {playerProgress ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ background: G.card2, borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 9, color: G.muted, textTransform: 'uppercase' }}>Completed</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: G.lime }}>{playerProgress.stats.totalCompletedSessions}</div>
                    </div>
                    <div style={{ background: G.card2, borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 9, color: G.muted, textTransform: 'uppercase' }}>Average</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: G.lime }}>{playerProgress.stats.averageRating || '–'}</div>
                    </div>
                  </div>
                  <div style={{ background: G.card2, borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 10, color: G.muted, marginBottom: 8 }}>Trend</div>
                    <div style={{ fontSize: 13, color: G.text2 }}>{playerProgress.trend.last3MonthsAverage ? `${playerProgress.trend.last3MonthsAverage}% average over last 3 months` : 'Not enough rating history'}</div>
                    <div style={{ fontSize: 10, color: G.muted2, marginTop: 8 }}>{playerProgress.trend.totalRatingsInLast3Months ?? 0} ratings in last 3 months</div>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {playerProgress.sessions.slice(0, 3).map((session: any) => (
                      <div key={session.id} style={{ background: G.card2, borderRadius: 10, padding: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: G.text }}>{session.title}</div>
                        <div style={{ fontSize: 10, color: G.muted2, marginTop: 4 }}>{new Date(session.date).toLocaleDateString()}</div>
                        <div style={{ marginTop: 8, fontSize: 11, color: G.lime }}>Coach: {session.coachName}</div>
                        <div style={{ fontSize: 10, color: G.text2 }}>Rating: {session.rating ?? 'N/A'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ color: G.muted2, fontSize: 11 }}>Progress details are unavailable for this player yet.</div>
              )}
            </div>

            <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: G.text, marginBottom: 12 }}>Current Coach</div>
              {currentCoach ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: G.mid, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: G.lime }}>
                      {currentCoach.photo ? <img src={currentCoach.photo} alt="" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} /> : `${currentCoach.firstName?.[0] || ''}${currentCoach.lastName?.[0] || ''}`}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: G.text }}>{currentCoach.firstName} {currentCoach.lastName}</div>
                      <div style={{ fontSize: 10, color: G.muted2 }}>{currentCoach.email}</div>
                    </div>
                  </div>
                  {currentCoach.organization && <div style={{ fontSize: 11, color: G.text2 }}>Organization: {currentCoach.organization.name}</div>}
                  {currentCoach.bio && <div style={{ fontSize: 11, color: G.muted2 }}>{currentCoach.bio}</div>}
                </div>
              ) : (
                <div style={{ color: G.muted2, fontSize: 11 }}>This player does not have an assigned coach yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
