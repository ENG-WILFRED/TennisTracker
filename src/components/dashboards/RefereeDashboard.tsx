'use client';

import React, { useState, Suspense, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import MessagingPanel from '@/components/dashboards/MessagingPanel';
import CommunityPanel from '@/components/dashboards/coach/CommunityPanel';
import { useToast } from '@/components/ui/Toast';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

export const RefereeDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { show: showToast } = useToast();

  // Read active section from URL, default to 'Matches'
  const activeNav = (searchParams.get('section') as string) || 'Matches';

  // Handle logout
  const handleLogout = async () => {
    try {
      logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle navigation to a new section
  const handleNavigation = (section: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', section);
    params.delete('tab'); // Clear tab when switching sections
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Read active tab from URL, default to 'Matches'
  const activeTab = (searchParams.get('tab') as string) || 'Matches';

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Handle certificate file upload
  const handleCertificateUpload = async (file: File) => {
    if (!file) return;
    
    setUploadingCert(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        const newCert = {
          id: Date.now().toString(),
          name: file.name,
          data: base64Data,
          uploadedAt: new Date().toISOString(),
        };
        
        // Add to state
        setCertificates([...certificates, newCert]);
        
        // Save to database
        const res = await authenticatedFetch(`/api/user/profile/${user?.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id,
            certifications: [...certificates, newCert],
          }),
        });
        
        if (!res.ok) {
          console.error('Failed to save certificate');
          setCertificates(certificates);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingCert(false);
      if (certFileInputRef.current) certFileInputRef.current.value = '';
    }
  };

  // Handle profile photo upload
  const handlePhotoUpload = async (file: File) => {
    if (!file) return;
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        setPersonalForm({ ...personalForm, photo: base64Data });
      };
      reader.readAsDataURL(file);
    } finally {
      if (photoFileInputRef.current) photoFileInputRef.current.value = '';
    }
  };

  // Handle profile save
  const handleSaveProfile = async () => {
    try {
      const res = await authenticatedFetch(`/api/user/profile/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, ...personalForm }),
      });

      if (res.ok) {
        setEditingProfile(false);
        // Refresh profile data
      } else {
        alert('Failed to save profile');
      }
    } catch (error) {
      console.error('Profile save error:', error);
      alert('Error saving profile');
    }
  };

  // Delete certificate
  const deleteCertificate = async (certId: string) => {
    const updated = certificates.filter(c => c.id !== certId);
    setCertificates(updated);
    
    await authenticatedFetch(`/api/user/profile/${user?.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user?.id,
        certifications: updated,
      }),
    });
  };
  const [p1Score, setP1Score] = useState([4, 6, 7]);
  const [p2Score, setP2Score] = useState([6, 4, 6]);
  const [p1Pts, setP1Pts] = useState(30);
  const [p2Pts, setP2Pts] = useState(15);

  // Profile state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [personalForm, setPersonalForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    nationality: '',
    photo: '',
  });
  const [certificates, setCertificates] = useState<any[]>([]);
  const [uploadingCert, setUploadingCert] = useState(false);
  const certFileInputRef = useRef<HTMLInputElement>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);

  // Fetched data state
  const [matches, setMatches] = useState<any[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [varCases, setVarCases] = useState<any[]>([]);
  const [varStats, setVarStats] = useState<any>(null);
  const [refereeStats, setRefereeStats] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Report state
  const [allReports, setAllReports] = useState<any[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Event-driven match state
  const [activeMatch, setActiveMatch] = useState<any>(null);
  const [matchEvents, setMatchEvents] = useState<any[]>([]);
  const [liveTab, setLiveTab] = useState('Score');
  const [playersCheckedIn, setPlayersCheckedIn] = useState<Set<string>>(new Set());
  const [matchDelayed, setMatchDelayed] = useState(false);
  const [delayReason, setDelayReason] = useState('');

  // Generate report after match
  const generateMatchReport = async (matchId: string) => {
    if (!matchId || !user?.id) return;
    
    setGeneratingReport(true);
    try {
      const res = await authenticatedFetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, refereeId: user.id }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`Report generated: ${data.fileName}`, 'success');
        loadReports();
      } else {
        const errorData = await res.json();
        showToast(errorData.error || 'Failed to generate report', 'error');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error generating report', 'error');
    } finally {
      setGeneratingReport(false);
    }
  };

  // Load reports
  const loadReports = async () => {
    if (!user?.id) return;
    
    try {
      const res = await authenticatedFetch(`/api/reports?refereeId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setAllReports(data.reports || []);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  };

  // Download report
  const downloadReport = async (reportId: string, fileName: string) => {
    try {
      const report = allReports.find(r => r.id === reportId);
      if (!report) return;

      // Create a blob from the base64 PDF content
      // For now, we'll create a downloadable HTML file  
      const htmlContent = atob(report.pdfContent);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName.replace('.pdf', '.html');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      showToast('Failed to download report', 'error');
    }
  };

  // View report
  const viewReport = (reportId: string) => {
    setSelectedReportId(reportId);
  };

  // Load reports on mount
  useEffect(() => {
    loadReports();
  }, [user?.id]);

  // ==================== EVENT HANDLERS ====================
  
  // Log a match event (immutable event stream)
  const logMatchEvent = (eventType: string, details: any = {}) => {
    const event = {
      id: `evt-${Date.now()}-${Math.random()}`,
      type: eventType,
      timestamp: new Date().toISOString(),
      details,
    };
    setMatchEvents(prev => [...prev, event]);
    console.log(`📍 Event: ${eventType}`, event);
  };

  // Check in a player
  const checkInPlayer = (playerId: string, playerName: string) => {
    const newCheckedIn = new Set(playersCheckedIn);
    newCheckedIn.add(playerId);
    setPlayersCheckedIn(newCheckedIn);
    logMatchEvent('player_checked_in', { playerId, playerName });
  };

  // Mark player as absent
  const markPlayerAbsent = (playerId: string, playerName: string) => {
    setPlayersCheckedIn(prev => {
      const updated = new Set(prev);
      updated.delete(playerId);
      return updated;
    });
    logMatchEvent('player_absent', { playerId, playerName });
  };

  // Award point to a player
  const awardPoint = (playerNumber: 1 | 2, playerName: string) => {
    if (playerNumber === 1) {
      setP1Pts(prev => prev + 1);
      logMatchEvent('point_awarded', { player: 1, playerName, newPoints: p1Pts + 1 });
    } else {
      setP2Pts(prev => prev + 1);
      logMatchEvent('point_awarded', { player: 2, playerName, newPoints: p2Pts + 1 });
    }
  };

  // Undo last point
  const undoLastPoint = () => {
    if (matchEvents.length > 0) {
      const lastEvent = matchEvents[matchEvents.length - 1];
      if (lastEvent.type === 'point_awarded') {
        if (lastEvent.details.player === 1) {
          setP1Pts(prev => Math.max(0, prev - 1));
        } else {
          setP2Pts(prev => Math.max(0, prev - 1));
        }
        setMatchEvents(prev => prev.slice(0, -1));
        logMatchEvent('point_undone', lastEvent.details);
      }
    }
  };

  // Log a fault
  const logFault = (playerNumber: 1 | 2, playerName: string) => {
    logMatchEvent('fault', { player: playerNumber, playerName });
  };

  // Log double fault (fault + fault)
  const logDoubleFault = (playerNumber: 1 | 2, playerName: string) => {
    logMatchEvent('double_fault', { player: playerNumber, playerName });
    awardPoint(playerNumber === 1 ? 2 : 1, playerNumber === 1 ? 'Player 2' : 'Player 1');
  };

  // Log warning/penalty
  const logWarning = (playerNumber: 1 | 2, playerName: string, reason: string) => {
    logMatchEvent('warning', { player: playerNumber, playerName, reason });
  };

  // Request medical timeout
  const requestMedicalTimeout = (playerNumber: 1 | 2, playerName: string) => {
    logMatchEvent('medical_timeout_requested', { player: playerNumber, playerName });
  };

  // Start match
  const startMatch = (match: any) => {
    setActiveMatch(match);
    setMatchEvents([]);
    setPlayersCheckedIn(new Set());
    logMatchEvent('match_started', { matchId: match.id, players: [match.p1, match.p2] });
  };

  // Finish match and prepare finalization
  const finishMatch = () => {
    if (activeMatch) {
      logMatchEvent('match_finished', { 
        matchId: activeMatch.id,
        winner: p1Pts > p2Pts ? activeMatch.p1 : activeMatch.p2,
        finalScore: { player1: p1Pts, player2: p2Pts }
      });
    }
  };

  // Fetch data on mount
  useEffect(() => {
    if (!user?.id) return;

    const fetchRefereeData = async () => {
      try {
        setLoadingData(true);

        // Fetch matches
        const matchesRes = await authenticatedFetch(`/api/referees/${user.id}/matches`);
        if (matchesRes.ok) {
          const data = await matchesRes.json();
          setMatches(data.matches || []);
          setUpcomingMatches(data.upcomingMatches || []);
          setRefereeStats(data.stats);
        }

        // Fetch performance
        const perfRes = await authenticatedFetch(`/api/referees/${user.id}/performance`);
        if (perfRes.ok) {
          const data = await perfRes.json();
          setPerformanceData(data);
        }

        // Fetch VAR cases
        const varRes = await authenticatedFetch(`/api/referees/${user.id}/var-cases`);
        if (varRes.ok) {
          const data = await varRes.json();
          setVarCases(data.allCases || []);
          setVarStats(data.statistics);
        }

        // Fetch certificates
        const certRes = await authenticatedFetch(`/api/referees/${user.id}/certificates`);
        if (certRes.ok) {
          const data = await certRes.json();
          setCertificates(data.certificates || []);
        }
      } catch (error) {
        console.error('Failed to fetch referee data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchRefereeData();
  }, [user?.id]);

  const navItems = [
    { label: 'Assigned Matches', icon: '🎾', section: 'matches' },
    { label: 'Live Match', icon: '🔴', section: 'live' },
    { label: 'Match History', icon: '📋', section: 'history' },
    { label: 'Reports', icon: '📄', section: 'reports' },
    { label: 'Analytics', icon: '📊', section: 'analytics' },
    { label: 'Profile', icon: '👤', section: 'profile' },
    { label: 'Messages', icon: '💬', section: 'messages' },
    { label: 'Community', icon: '🌐', section: 'community' },
  ];

  // Match-centric tabs
  const matchStatuses = ['Upcoming', 'Active', 'Completed'];
  const liveMatchTabs = ['Score', 'Events', 'Players', 'Issues'];

  const liveMatch = {
    p1: 'Roger Federer', p2: 'Carlos Alcaraz', court: 'Court 1', status: 'Sunday 3:00 PM',
  };

  const nextMatches = [
    { p1: 'Carlos Alcaraz', p2: 'Alexander Zverev', date: 'Saturday, May 28 · 2:00 PM · Court 2', type: 'Final Match' },
    { p1: 'Daniil Medvedev', p2: 'Novak Djokovic', date: 'Friday · 4:00 PM · Court 1', type: 'Semi-Final' },
  ];

  const scoreSubmissions = [
    { match: 'Omondi vs Hassan', winner: 'A. Omondi', score: '6-4, 7-5', date: 'Today', status: 'Submitted' },
    { match: 'Kimani vs Wanjiru', winner: 'S. Kimani', score: '6-3, 6-2', date: 'Yesterday', status: 'Submitted' },
    { match: 'Mutua vs Kamau', winner: 'T. Mutua', score: '4-6, 6-3, 7-5', date: 'Mar 18', status: 'Dispute' },
  ];

  const scorers = [
    { name: 'Daniil Medvedev', pts: 100, rank: 1 },
    { name: 'Andy Murray', pts: 120, rank: 2 },
    { name: 'Andy Murray', pts: 1350, rank: 3 },
  ];

  const addPoint = (player: 1 | 2) => {
    if (player === 1) setP1Pts(p => Math.min(p + 15 > 40 ? 0 : p + 15, 40));
    else setP2Pts(p => Math.min(p + 15 > 40 ? 0 : p + 15, 40));
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif", background: G.dark, color: G.text, overflow: 'hidden' }}>

      {/* LEFT SIDEBAR */}
      <aside style={{ width: 210, background: G.sidebar, borderRight: `1px solid ${G.cardBorder}`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
        {/* Logo */}
        <div style={{ padding: '15px 14px 10px', borderBottom: `1px solid ${G.cardBorder}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🎾</span>
          <div style={{ color: G.lime, fontWeight: 900, fontSize: 14 }}>Vico Sports</div>
        </div>

        {/* Profile Section */}
        <div style={{ padding: '14px 12px', borderBottom: `1px solid ${G.cardBorder}` }}>
          <div style={{ background: G.mid, borderRadius: 10, padding: 12, textAlign: 'center' }}>
            {user?.photo
              ? <img src={user.photo} alt={user.firstName} style={{ width: 56, height: 56, borderRadius: '50%', border: `2.5px solid ${G.lime}`, objectFit: 'cover', marginBottom: 8 }} />
              : <div style={{ width: 56, height: 56, borderRadius: '50%', background: G.bright, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>👤</div>}
            <div style={{ fontWeight: 800, fontSize: 13 }}>Referee {user?.firstName ?? 'Referee'}</div>
            <div style={{ color: G.muted, fontSize: 10, marginTop: 2 }}>⭐ 4.8 · 89 matches</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <span style={{ background: G.lime, color: '#0f1f0f', borderRadius: 4, padding: '2px 7px', fontSize: 9, fontWeight: 700 }}>ITF L2</span>
              <span style={{ background: G.card, borderRadius: 4, padding: '2px 7px', fontSize: 9 }}>ATP</span>
              <span style={{ background: G.card, borderRadius: 4, padding: '2px 7px', fontSize: 9 }}>WTA</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, paddingTop: 8 }}>
          {navItems.map(item => (
            <button key={item.label} onClick={() => handleNavigation(item.label)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 13px',
              background: activeNav === item.label ? G.mid : 'transparent',
              color: activeNav === item.label ? '#fff' : G.muted,
              border: 'none', cursor: 'pointer', fontSize: 12, textAlign: 'left',
              borderLeft: activeNav === item.label ? `3px solid ${G.lime}` : '3px solid transparent',
            }}><span>{item.icon}</span>{item.label}</button>
          ))}
        </nav>

        {/* Buttons at bottom */}
        <div style={{ padding: '10px 12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button style={{ width: '100%', background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 8, padding: '9px 0', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
            📝 Submit Score
          </button>
          <button onClick={handleLogout} style={{ width: '100%', background: G.card, color: G.text, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: '9px 0', fontWeight: 800, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.background = G.bright; }} onMouseLeave={(e) => { e.currentTarget.style.background = G.card; }}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>

        {/* ASSIGNED MATCHES - Primary Entry Point */}
        {activeNav === 'Assigned Matches' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>🎾 Assigned Match</h2>
            
            {/* Match Status Filter */}
            <div style={{ display: 'flex', gap: 8 }}>
              {matchStatuses.map(status => (
                <button key={status} style={{
                  padding: '7px 14px', borderRadius: 6, border: `1px solid ${G.cardBorder}`,
                  background: 'transparent', color: G.muted, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                  transition: 'all .2s',
                }} onMouseEnter={e => { e.currentTarget.style.borderColor = G.lime; e.currentTarget.style.color = G.lime; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = G.cardBorder; e.currentTarget.style.color = G.muted; }}>
                  {status}
                </button>
              ))}
            </div>

            {/* Upcoming Matches List */}
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                { p1: 'Roger Federer', p2: 'Carlos Alcaraz', time: 'Today 3:00 PM', court: 'Court 1', type: 'Final' },
                { p1: 'Daniil Medvedev', p2: 'Novak Djokovic', time: 'Tomorrow 4:00 PM', court: 'Court 2', type: 'Semi-Final' },
              ].map((match, idx) => (
                <div key={idx} style={{ background: G.card, borderRadius: 10, border: `1px solid ${G.cardBorder}`, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{match.p1} vs {match.p2}</div>
                      <div style={{ fontSize: 10, color: G.muted }}>📍 {match.court} · {match.time}</div>
                      <div style={{ fontSize: 9, color: G.lime, marginTop: 4, fontWeight: 700 }}>{match.type}</div>
                    </div>
                    <button onClick={() => startMatch(match)} style={{
                      padding: '7px 16px', background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 6,
                      fontWeight: 800, fontSize: 11, cursor: 'pointer', transition: 'all .2s'
                    }} onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                      🎮 Start
                    </button>
                  </div>
                  <div style={{ fontSize: 9, color: G.muted, padding: '8px', background: G.mid, borderRadius: 6 }}>
                    ✓ Check match format · ✓ Court ready · ✓ Players confirmed
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LIVE MATCH - Event-Driven Scoring */}
        {activeNav === 'Live Match' && activeMatch && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
            {/* Live Header */}
            <div style={{ background: `linear-gradient(135deg, ${G.mid}, #1d3d1d)`, borderRadius: 12, padding: 14, border: `2px solid ${G.lime}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ background: '#e53935', color: '#fff', fontSize: 9, fontWeight: 800, padding: '3px 10px', borderRadius: 20, animation: 'pulse 1s infinite', letterSpacing: 1 }}>● LIVE</span>
                <span style={{ fontSize: 11, color: G.lime, fontWeight: 700 }}>Match in progress</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>{activeMatch.p1} vs {activeMatch.p2}</div>
              <div style={{ fontSize: 10, color: G.muted, marginTop: 4 }}>Court: {activeMatch.court}</div>
            </div>

            {/* Live Match Tabs */}
            <div style={{ display: 'flex', gap: 4, background: G.card, borderRadius: 8, padding: 4, border: `1px solid ${G.cardBorder}` }}>
              {liveMatchTabs.map(t => (
                <button key={t} onClick={() => setLiveTab(t)} style={{
                  flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                  background: liveTab === t ? G.lime : 'transparent',
                  color: liveTab === t ? '#0f1f0f' : G.muted,
                  transition: 'all .15s',
                }}>{t}</button>
              ))}
            </div>

            {/* Score Tab */}
            {liveTab === 'Score' && (
              <div style={{ background: G.card, borderRadius: 10, border: `1px solid ${G.cardBorder}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Score Board */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: G.lime, marginBottom: 8 }}>{p1Pts}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: G.text }}>{activeMatch.p1}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: G.lime, marginBottom: 8 }}>{p2Pts}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: G.text }}>{activeMatch.p2}</div>
                  </div>
                </div>

                {/* Point Control Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button onClick={() => awardPoint(1, activeMatch.p1)} style={{
                    padding: '12px', background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 12, cursor: 'pointer',
                  }}>➕ Point {activeMatch.p1}</button>
                  <button onClick={() => awardPoint(2, activeMatch.p2)} style={{
                    padding: '12px', background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 12, cursor: 'pointer',
                  }}>➕ Point {activeMatch.p2}</button>
                </div>

                {/* Undo Button */}
                <button onClick={undoLastPoint} style={{
                  padding: '10px', background: G.card, border: `1px solid ${G.cardBorder}`, color: G.muted, borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer',
                }}>↶ Undo Last</button>
              </div>
            )}

            {/* Events Tab */}
            {liveTab === 'Events' && (
              <div style={{ background: G.card, borderRadius: 10, border: `1px solid ${G.cardBorder}`, padding: 12, maxHeight: 400, overflowY: 'auto' }}>
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 10, color: G.lime }}>Event Stream ({matchEvents.length})</div>
                {matchEvents.length === 0 ? (
                  <div style={{ fontSize: 10, color: G.muted, textAlign: 'center', padding: '20px 0' }}>No events yet. Match started.</div>
                ) : (
                  matchEvents.map((evt, i) => (
                    <div key={evt.id} style={{ fontSize: 9, padding: '8px', borderBottom: `1px solid ${G.mid}`, color: G.muted }}>
                      <div style={{ fontWeight: 700, color: G.lime }}>{evt.type.replace(/_/g, ' ').toUpperCase()}</div>
                      <div style={{ fontSize: 8 }}>{new Date(evt.timestamp).toLocaleTimeString()}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Players Tab */}
            {liveTab === 'Players' && (
              <div style={{ background: G.card, borderRadius: 10, border: `1px solid ${G.cardBorder}`, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[activeMatch.p1, activeMatch.p2].map((player, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: G.mid, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>{player}</div>
                    {playersCheckedIn.has(player) ? (
                      <span style={{ fontSize: 9, color: G.lime, fontWeight: 700 }}>✓ Checked In</span>
                    ) : (
                      <button onClick={() => checkInPlayer(player, player)} style={{
                        padding: '4px 10px', background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 4, fontWeight: 700, fontSize: 9, cursor: 'pointer',
                      }}>Check In</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Issues Tab */}
            {liveTab === 'Issues' && (
              <div style={{ background: G.card, borderRadius: 10, border: `1px solid ${G.cardBorder}`, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button style={{ padding: '10px', background: G.card, border: `1px dashed ${G.cardBorder}`, color: G.text, borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer', transition: 'all .2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = G.lime} onMouseLeave={e => e.currentTarget.style.borderColor = G.cardBorder}>
                  ⚠️ Report Issue
                </button>
                <button style={{ padding: '10px', background: G.card, border: `1px dashed ${G.cardBorder}`, color: G.text, borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer', transition: 'all .2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = G.lime} onMouseLeave={e => e.currentTarget.style.borderColor = G.cardBorder}>
                  🚑 Medical Timeout
                </button>
                <button style={{ padding: '10px', background: G.card, border: `1px dashed ${G.cardBorder}`, color: G.text, borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer', transition: 'all .2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = G.lime} onMouseLeave={e => e.currentTarget.style.borderColor = G.cardBorder}>
                  🔄 Replay Point
                </button>
              </div>
            )}

            {/* Finish Match */}
            <button onClick={finishMatch} style={{
              padding: '12px', background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 12, cursor: 'pointer', marginTop: 'auto',
            }}>⏹️ Finish Match</button>
          </div>
        )}

        {/* NOT IN MATCH - Show placeholder */}
        {activeNav === 'Live Match' && !activeMatch && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: G.muted }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎾</div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>No active match</div>
            <div style={{ fontSize: 10, marginTop: 8 }}>Start a match from "Assigned Matches" to begin</div>
          </div>
        )}

        {/* MATCH HISTORY */}
        {activeNav === 'Match History' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>📋 Match History</h2>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                { p1: 'Federer', p2: 'Alcaraz', score: '6-4, 6-3', date: 'Today' },
                { p1: 'Medvedev', p2: 'Djokovic', score: '7-5, 6-4', date: 'Yesterday' },
              ].map((m,i) => (
                <div key={i} style={{ background: G.card, borderRadius: 8, padding: 12, border: `1px solid ${G.cardBorder}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>{m.p1} vs {m.p2}</div>
                  <div style={{ fontSize: 10, color: G.lime, fontWeight: 700, marginBottom: 4 }}>{m.score}</div>
                  <div style={{ fontSize: 9, color: G.muted }}>{m.date}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REPORTS */}  
        {activeNav === 'Reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>📄 Match Reports</h2>
            
            {/* Generate Report Button */}
            {activeMatch && (
              <div style={{ background: G.card, borderRadius: 10, border: `1px solid ${G.cardBorder}`, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Active Match</div>
                <button 
                  onClick={() => generateMatchReport(activeMatch.id)}
                  disabled={generatingReport}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    background: generatingReport ? G.muted : G.lime, 
                    color: '#0f1f0f', 
                    border: 'none', 
                    borderRadius: 6, 
                    fontWeight: 800, 
                    cursor: generatingReport ? 'not-allowed' : 'pointer',
                    opacity: generatingReport ? 0.6 : 1
                  }}
                >
                  {generatingReport ? '⏳ Generating...' : '📊 Generate Report'}
                </button>
              </div>
            )}

            {/* Reports List */}
            <div style={{ background: G.card, borderRadius: 10, border: `1px solid ${G.cardBorder}`, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
                Previous Reports ({allReports.length})
              </div>
              
              {allReports.length === 0 ? (
                <div style={{ fontSize: 11, color: G.muted, fontStyle: 'italic' }}>
                  No reports yet. Generate a report after completing a match.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {allReports.map((report: any) => (
                    <div 
                      key={report.id}
                      style={{ 
                        background: G.sidebar, 
                        borderRadius: 6, 
                        padding: 10, 
                        border: `1px solid ${G.cardBorder}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: G.text, marginBottom: 4 }}>
                          {report.fileName}
                        </div>
                        <div style={{ fontSize: 10, color: G.muted }}>
                          {report.playerNames ? `${report.playerNames}` : 'Players'} • 
                          {report.score ? ` ${report.score}` : ' Score'} • 
                          {new Date(report.generatedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => viewReport(report.id)}
                          style={{
                            padding: '6px 10px',
                            background: G.bright,
                            color: G.text,
                            border: 'none',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => downloadReport(report.id, report.fileName)}
                          style={{
                            padding: '6px 10px',
                            background: G.lime,
                            color: '#0f1f0f',
                            border: 'none',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          ⬇️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* REPORT VIEWER MODAL */}
        {selectedReportId && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}>
            <div style={{
              background: G.card,
              borderRadius: 10,
              border: `1px solid ${G.cardBorder}`,
              padding: 0,
              width: '90%',
              height: '90%',
              maxWidth: '900px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}>
              {/* Modal Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                borderBottom: `1px solid ${G.cardBorder}`,
              }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: G.text }}>Match Report</div>
                <button
                  onClick={() => setSelectedReportId(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: 18,
                    cursor: 'pointer',
                    color: G.muted,
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Content - Display HTML Report */}
              <div style={{
                flex: 1,
                overflow: 'auto',
                padding: 16,
                background: G.dark,
              }}>
                {(() => {
                  const report = allReports.find(r => r.id === selectedReportId);
                  if (!report) return <div style={{ color: G.muted }}>Report not found</div>;
                  
                  try {
                    const htmlContent = atob(report.pdfContent);
                    return (
                      <div 
                        style={{ 
                          background: 'white', 
                          color: '#000', 
                          padding: 20, 
                          borderRadius: 6,
                          fontSize: 12,
                          lineHeight: 1.6,
                        }}
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                      />
                    );
                  } catch (error) {
                    return <div style={{ color: G.muted }}>Error displaying report</div>;
                  }
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {activeNav === 'Analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>📊 Referee Analytics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: G.card, borderRadius: 8, padding: 12, border: `1px solid ${G.cardBorder}` }}>
                <div style={{ fontSize: 9, color: G.muted, fontWeight: 700, marginBottom: 6 }}>Matches Officiated</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: G.lime }}>89</div>
              </div>
              <div style={{ background: G.card, borderRadius: 8, padding: 12, border: `1px solid ${G.cardBorder}` }}>
                <div style={{ fontSize: 9, color: G.muted, fontWeight: 700, marginBottom: 6 }}>Avg Duration</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: G.lime }}>2h 34m</div>
              </div>
              <div style={{ background: G.card, borderRadius: 8, padding: 12, border: `1px solid ${G.cardBorder}` }}>
                <div style={{ fontSize: 9, color: G.muted, fontWeight: 700, marginBottom: 6 }}>Accuracy</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: G.lime }}>98.2%</div>
              </div>
              <div style={{ background: G.card, borderRadius: 8, padding: 12, border: `1px solid ${G.cardBorder}` }}>
                <div style={{ fontSize: 9, color: G.muted, fontWeight: 700, marginBottom: 6 }}>Disputes</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: G.lime }}>3</div>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Matches + Score Log */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Next Matches */}
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📅 Next Matches to Referee</div>
            {nextMatches.map((m, i) => (
              <div key={i} style={{ background: '#0f1f0f', borderRadius: 9, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, background: G.mid, padding: '1px 7px', borderRadius: 4, color: G.accent }}>{m.type}</span>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{m.p1}</div>
                <div style={{ fontSize: 11, color: G.muted }}>vs {m.p2}</div>
                <div style={{ fontSize: 10, color: G.bright, marginTop: 4 }}>{m.date}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button style={{ flex: 1, background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 5, padding: '6px 0', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>📝 Enter Scores</button>
                  <button style={{ flex: 1, background: G.mid, color: G.text, border: 'none', borderRadius: 5, padding: '6px 0', fontSize: 11, cursor: 'pointer' }}>Preview Match</button>
                </div>
              </div>
            ))}
          </div>

         {/* Score Submissions */}
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📊 Recent Score Submissions</div>
            {scoreSubmissions.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#0f1f0f', borderRadius: 8, marginBottom: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{s.match}</div>
                  <div style={{ fontSize: 10.5, color: G.muted }}>🏆 {s.winner} · {s.score}</div>
                  <div style={{ fontSize: 10, color: G.bright, marginTop: 2 }}>{s.date}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: s.status === 'Submitted' ? '#2d5a2733' : '#7a2d2d33', color: s.status === 'Submitted' ? G.lime : '#e57373', flexShrink: 0 }}>
                  {s.status}
                </span>
              </div>
            ))}

            {/* Scorer Table */}
            <div style={{ marginTop: 12, borderTop: `1px solid ${G.cardBorder}`, paddingTop: 10 }}>
              <div style={{ fontSize: 10, color: G.accent, fontWeight: 700, marginBottom: 6 }}>TOURNAMENT SCORERS</div>
              {scorers.map((sc, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, padding: '4px 0' }}>
                  <span>{i + 1}. {sc.name}</span>
                  <span style={{ color: G.accent, fontWeight: 700 }}>{sc.pts} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {[
            { label: 'Matches Refereed', value: refereeStats?.totalMatches || 89, icon: '🏆' },
            { label: 'This Month', value: performanceData?.stats?.thisMonth || 12, icon: '📅' },
            { label: 'Rating', value: performanceData?.stats?.rating ? performanceData.stats.rating + '⭐' : '4.8⭐', icon: '🌟' },
            { label: 'Accuracy', value: performanceData?.stats?.accuracy ? performanceData.stats.accuracy + '%' : '96.5%', icon: '🎯' },
          ].map((s, i) => (
            <div key={i} style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: '11px 13px' }}>
              <div style={{ color: G.muted, fontSize: 10 }}>{s.label}</div>
              <div style={{ color: G.accent, fontSize: 20, fontWeight: 900, marginTop: 4 }}>{s.icon} {s.value}</div>
            </div>
          ))}
        </div>

        {activeNav === 'Training' && (
          <>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>📋 Training & Certification</div>
            
            {/* Training Courses */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📚 Available Courses</div>
                {[
                  { title: 'ITF Level 2 Certification', duration: '40 hours', status: 'In Progress', progress: 65 },
                  { title: 'ATP Rules Update 2026', duration: '8 hours', status: 'Available', progress: 0 },
                  { title: 'Advanced Line Calling', duration: '16 hours', status: 'Available', progress: 0 },
                  { title: 'Match Management', duration: '12 hours', status: 'Completed', progress: 100 },
                ].map((course, i) => (
                  <div key={i} style={{ background: '#0f1f0f', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 12.5 }}>{course.title}</div>
                        <div style={{ fontSize: 10, color: G.muted, marginTop: 2 }}>⏱️ {course.duration}</div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, background: course.status === 'Completed' ? G.lime : course.status === 'In Progress' ? G.bright : G.mid, color: course.status === 'Completed' ? '#0f1f0f' : '#fff', padding: '2px 8px', borderRadius: 4 }}>{course.status}</span>
                    </div>
                    <div style={{ height: 6, background: G.mid, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${course.progress}%`, background: G.lime, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Certifications */}
              <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>🏆 Current Certifications</div>
                {[
                  { name: 'ITF Level 2', issued: '2023-05-15', expires: '2026-05-15', status: 'Active' },
                  { name: 'ATP Certified', issued: '2024-01-20', expires: '2027-01-20', status: 'Active' },
                  { name: 'WTA Certified', issued: '2023-11-10', expires: '2025-11-10', status: 'Expiring Soon' },
                ].map((cert, i) => (
                  <div key={i} style={{ background: '#0f1f0f', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 12 }}>{cert.name}</div>
                        <div style={{ fontSize: 10, color: G.muted, marginTop: 4 }}>Expires: {new Date(cert.expires).toLocaleDateString()}</div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, background: cert.status === 'Active' ? `${G.lime}22` : `${G.yellow}22`, color: cert.status === 'Active' ? G.lime : G.yellow, padding: '2px 8px', borderRadius: 4, border: `1px solid ${cert.status === 'Active' ? G.lime : G.yellow}44` }}>{cert.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Training */}
            <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 16, marginTop: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📅 Upcoming Training Sessions</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { date: '2026-04-15', title: 'Rules Workshop', time: '2:00 PM - 4:00 PM', venue: 'Nairobi Tennis Club' },
                  { date: '2026-04-22', title: 'Line Calling Clinic', time: '10:00 AM - 12:00 PM', venue: 'Karen Country Club' },
                  { date: '2026-05-05', title: 'Match Management Seminar', time: '3:00 PM - 5:00 PM', venue: 'Gigiri Tennis Courts' },
                ].map((session, i) => (
                  <div key={i} style={{ background: '#0f1f0f', borderRadius: 8, padding: 12, border: `1px solid ${G.cardBorder}` }}>
                    <div style={{ color: G.accent, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{new Date(session.date).toLocaleDateString()}</div>
                    <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6 }}>{session.title}</div>
                    <div style={{ fontSize: 10, color: G.muted, marginBottom: 2 }}>⏱️ {session.time}</div>
                    <div style={{ fontSize: 10, color: G.muted, marginBottom: 8 }}>📍 {session.venue}</div>
                    <button style={{ width: '100%', background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 5, padding: '6px 0', fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>Enroll</button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeNav === 'Match Analysis' && (
          <>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>📊 Match Analysis & Performance</div>
            
            {/* Performance Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 12 }}>
              {[
                { label: 'Total Matches', value: performanceData?.stats?.totalMatches || 89, icon: '🏆' },
                { label: 'Avg Rating', value: performanceData?.stats?.rating ? performanceData.stats.rating + '⭐' : '4.8⭐', icon: '⭐' },
                { label: 'Accuracy Rate', value: performanceData?.stats?.accuracy ? performanceData.stats.accuracy + '%' : '96.5%', icon: '🎯' },
                { label: 'Disputes', value: performanceData?.stats?.disputes || 3, icon: '⚖️' },
                { label: 'This Month', value: performanceData?.stats?.thisMonth || 12, icon: '📅' },
              ].map((stat, i) => (
                <div key={i} style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: 12 }}>
                  <div style={{ color: G.muted, fontSize: 10 }}>{stat.label}</div>
                  <div style={{ color: G.accent, fontSize: 18, fontWeight: 900, marginTop: 6 }}>{stat.icon} {stat.value}</div>
                </div>
              ))}
            </div>

            {/* Analysis Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>🎾 Match Categories</div>
                {(() => {
                  const total = performanceData?.categories?.total || 89;
                  const singles = performanceData?.categories?.singles || 56;
                  const doubles = performanceData?.categories?.doubles || 20;
                  const mixed = performanceData?.categories?.mixed || 13;
                  return [
                    { type: 'Singles', count: singles, percentage: Math.round((singles / total) * 100) },
                    { type: 'Doubles', count: doubles, percentage: Math.round((doubles / total) * 100) },
                    { type: 'Mixed', count: mixed, percentage: Math.round((mixed / total) * 100) },
                  ].map((cat, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                        <span>{cat.type}</span>
                        <span style={{ color: G.accent, fontWeight: 700 }}>{cat.count} ({cat.percentage}%)</span>
                      </div>
                      <div style={{ height: 6, background: G.mid, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${cat.percentage}%`, background: G.lime }} />
                      </div>
                    </div>
                  ))
                })()}
              </div>

              <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>⚡ Performance Trends</div>
                {[
                  { metric: 'Call Accuracy', trend: '↑', change: '+2.5%', color: G.lime },
                  { metric: 'Player Satisfaction', trend: '↑', change: '+1.2%', color: G.lime },
                  { metric: 'Dispute Rate', trend: '↓', change: '-0.8%', color: G.lime },
                  { metric: 'Punctuality', trend: '→', change: '0%', color: G.muted },
                ].map((perf, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 3 ? `1px solid ${G.cardBorder}33` : 'none' }}>
                    <span style={{ fontSize: 11.5 }}>{perf.metric}</span>
                    <span style={{ color: perf.color, fontWeight: 700, fontSize: 11 }}>{perf.trend} {perf.change}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Matches Analysis */}
            <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14, marginTop: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📈 Recent Matches Analysis</div>
              {[
                { match: 'Omondi vs Hassan', date: 'Today', rating: '5.0⭐', accuracy: '99.5%', disputes: 0 },
                { match: 'Kimani vs Wanjiru', date: 'Yesterday', rating: '4.8⭐', accuracy: '98.2%', disputes: 0 },
                { match: 'Mutua vs Kamau', date: 'Mar 18', rating: '4.5⭐', accuracy: '96.0%', disputes: 1 },
              ].map((match, i) => (
                <div key={i} style={{ background: '#0f1f0f', borderRadius: 8, padding: 12, marginBottom: 8, display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 12, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>{match.match}</div>
                    <div style={{ fontSize: 10, color: G.muted, marginTop: 2 }}>{match.date}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: G.accent, fontWeight: 700, fontSize: 12 }}>{match.rating}</div>
                    <div style={{ fontSize: 9, color: G.muted }}>Rating</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: G.accent, fontWeight: 700, fontSize: 12 }}>{match.accuracy}</div>
                    <div style={{ fontSize: 9, color: G.muted }}>Accuracy</div>
                  </div>
                  <button style={{ background: match.disputes > 0 ? `#d94f4f22` : `${G.lime}22`, color: match.disputes > 0 ? '#ff6b6b' : G.lime, border: `1px solid ${match.disputes > 0 ? '#d94f4f44' : G.lime}44`, borderRadius: 5, padding: '4px 10px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>{match.disputes} Disputes</button>
                </div>
              ))}
            </div>
          </>
        )}

        {activeNav === 'Reports' && (
          <>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>📄 Reports & Documentation</div>
            
            {/* Report Types */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 12 }}>
              {[
                { title: 'Monthly Performance Report', desc: 'Comprehensive analysis of your match performance', icon: '📊', action: 'View' },
                { title: 'Earnings Statement', desc: 'Your earnings and payment history', icon: '💰', action: 'Download' },
                { title: 'Match Logs', desc: 'Detailed records of all matches refereed', icon: '📋', action: 'Export' },
                { title: 'Dispute Records', desc: 'All disputes and resolutions', icon: '⚖️', action: 'Review' },
              ].map((report, i) => (
                <div key={i} style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{report.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>{report.title}</div>
                    <div style={{ fontSize: 10, color: G.muted, marginTop: 4 }}>{report.desc}</div>
                  </div>
                  <button style={{ background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 6, padding: '8px 14px', fontWeight: 700, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: 12 }}>{report.action}</button>
                </div>
              ))}
            </div>

            {/* Report History */}
            <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📅 Generated Reports</div>
              {[
                { name: 'March 2026 Performance Report', date: 'Mar 31, 2026', size: '2.4 MB', format: 'PDF' },
                { name: 'February 2026 Performance Report', date: 'Feb 28, 2026', size: '2.1 MB', format: 'PDF' },
                { name: 'Q1 2026 Earnings Statement', date: 'Apr 1, 2026', size: '540 KB', format: 'PDF' },
                { name: 'January 2026 Performance Report', date: 'Jan 31, 2026', size: '1.9 MB', format: 'PDF' },
              ].map((report, i) => (
                <div key={i} style={{ background: '#0f1f0f', borderRadius: 8, padding: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>{report.name}</div>
                    <div style={{ fontSize: 10, color: G.muted, marginTop: 2 }}>{report.date} · {report.size}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ background: G.mid, color: G.text, border: `1px solid ${G.cardBorder}`, borderRadius: 5, padding: '5px 12px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>📥 Download</button>
                    <button style={{ background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 5, padding: '5px 12px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>👁️ View</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeNav === 'Profile' && (
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 16 }}>
            {/* Profile Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800 }}>👤 My Profile</h2>
              <button
                onClick={() => setEditingProfile(!editingProfile)}
                style={{
                  background: editingProfile ? '#d94f4f' : G.lime,
                  color: editingProfile ? '#fff' : '#0f1f0f',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontWeight: 700,
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                {editingProfile ? '✕ Cancel' : '✎ Edit'}
              </button>
            </div>

            {editingProfile ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Photo Upload */}
                <div>
                  <label style={{ fontSize: 10, color: G.muted, display: 'block', marginBottom: 6, fontWeight: 600 }}>PROFILE PHOTO</label>
                  <div
                    onClick={() => photoFileInputRef.current?.click()}
                    style={{
                      width: '100%',
                      height: 120,
                      background: G.mid,
                      border: `2px dashed ${G.lime}`,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      overflow: 'hidden',
                    }}
                  >
                    {personalForm.photo ? (
                      <img src={personalForm.photo} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ textAlign: 'center', color: G.muted }}>
                        <div style={{ fontSize: 24, marginBottom: 4 }}>📸</div>
                        <div style={{ fontSize: 10 }}>Click to upload photo</div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={photoFileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, gridColumn: '1 / -1' }}>
                  <div>
                    <label style={{ fontSize: 10, color: G.muted, display: 'block', marginBottom: 4, fontWeight: 600 }}>FIRST NAME</label>
                    <input
                      style={{ width: '100%', padding: '7px 9px', background: '#0f1f0f', border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 6, fontSize: 11 }}
                      value={personalForm.firstName}
                      onChange={(e) => setPersonalForm({ ...personalForm, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: G.muted, display: 'block', marginBottom: 4, fontWeight: 600 }}>LAST NAME</label>
                    <input
                      style={{ width: '100%', padding: '7px 9px', background: '#0f1f0f', border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 6, fontSize: 11 }}
                      value={personalForm.lastName}
                      onChange={(e) => setPersonalForm({ ...personalForm, lastName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: G.muted, display: 'block', marginBottom: 4, fontWeight: 600 }}>EMAIL</label>
                    <input
                      style={{ width: '100%', padding: '7px 9px', background: '#0f1f0f', border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 6, fontSize: 11 }}
                      type="email"
                      value={personalForm.email}
                      onChange={(e) => setPersonalForm({ ...personalForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: G.muted, display: 'block', marginBottom: 4, fontWeight: 600 }}>PHONE</label>
                    <input
                      style={{ width: '100%', padding: '7px 9px', background: '#0f1f0f', border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 6, fontSize: 11 }}
                      value={personalForm.phone}
                      onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: G.muted, display: 'block', marginBottom: 4, fontWeight: 600 }}>GENDER</label>
                    <input
                      style={{ width: '100%', padding: '7px 9px', background: '#0f1f0f', border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 6, fontSize: 11 }}
                      value={personalForm.gender}
                      onChange={(e) => setPersonalForm({ ...personalForm, gender: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: G.muted, display: 'block', marginBottom: 4, fontWeight: 600 }}>DATE OF BIRTH</label>
                    <input
                      style={{ width: '100%', padding: '7px 9px', background: '#0f1f0f', border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 6, fontSize: 11 }}
                      type="date"
                      value={personalForm.dateOfBirth}
                      onChange={(e) => setPersonalForm({ ...personalForm, dateOfBirth: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: G.muted, display: 'block', marginBottom: 4, fontWeight: 600 }}>NATIONALITY</label>
                    <input
                      style={{ width: '100%', padding: '7px 9px', background: '#0f1f0f', border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 6, fontSize: 11 }}
                      value={personalForm.nationality}
                      onChange={(e) => setPersonalForm({ ...personalForm, nationality: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  style={{ gridColumn: '1 / -1', background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 7, padding: '9px 0', fontWeight: 800, fontSize: 11.5, cursor: 'pointer', marginTop: 8 }}
                >
                  ✓ Save Changes
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'First Name', value: personalForm.firstName || user?.firstName },
                  { label: 'Last Name', value: personalForm.lastName || user?.lastName },
                  { label: 'Email', value: personalForm.email || user?.email },
                  { label: 'Phone', value: personalForm.phone || 'N/A' },
                  { label: 'Gender', value: personalForm.gender || 'N/A' },
                  { label: 'Nationality', value: personalForm.nationality || 'N/A' },
                ].map((item, i) => (
                  <div key={i} style={{ background: '#0f1f0f', borderRadius: 7, padding: 10 }}>
                    <div style={{ fontSize: 9.5, color: G.muted, fontWeight: 600, marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: 11.5, color: G.text }}>{item.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Certificates Section */}
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 13, fontWeight: 800 }}>🏆 Certifications</h3>
                <button
                  onClick={() => certFileInputRef.current?.click()}
                  disabled={uploadingCert}
                  style={{
                    background: G.lime,
                    color: '#0f1f0f',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 12px',
                    fontWeight: 700,
                    fontSize: 11,
                    cursor: uploadingCert ? 'not-allowed' : 'pointer',
                    opacity: uploadingCert ? 0.6 : 1,
                  }}
                >
                  {uploadingCert ? '⏳ Uploading...' : '+ Add Certificate'}
                </button>
              </div>
              <input
                ref={certFileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && handleCertificateUpload(e.target.files[0])}
              />

              {certificates.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                  {certificates.map((cert, i) => (
                    <div
                      key={cert.id || `cert-${i}`}
                      style={{
                        background: '#0f1f0f',
                        border: `1px solid ${G.cardBorder}`,
                        borderRadius: 8,
                        padding: 12,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 12 }}>📄 {cert.name}</div>
                        <div style={{ fontSize: 9, color: G.muted, marginTop: 4 }}>Uploaded: {new Date(cert.uploadedAt).toLocaleDateString()}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <a
                          href={cert.data}
                          download={cert.name}
                          style={{
                            background: G.mid,
                            color: G.text,
                            border: `1px solid ${G.cardBorder}`,
                            borderRadius: 5,
                            padding: '4px 10px',
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: 'pointer',
                            textDecoration: 'none',
                          }}
                        >
                          📥 Download
                        </a>
                        <button
                          onClick={() => deleteCertificate(cert.id)}
                          style={{
                            background: '#d94f4f22',
                            color: '#ff6b6b',
                            border: `1px solid #d94f4f44`,
                            borderRadius: 5,
                            padding: '4px 10px',
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: '#0f1f0f', borderRadius: 8, padding: 12, textAlign: 'center', color: G.muted, fontSize: 11 }}>
                  No certificates uploaded yet
                </div>
              )}
            </div>
          </div>
        )}

        {activeNav === 'Community' && (
          <Suspense fallback={<div style={{ color: G.text }}>Loading community...</div>}>
            <CommunityPanel userId={user?.id || ''} />
          </Suspense>
        )}

        {activeNav === 'Messages' && (
          <Suspense fallback={<div style={{ color: G.text }}>Loading messages...</div>}>
            <MessagingPanel userId={user?.id || ''} userType="referee" />
          </Suspense>
        )}

        {activeNav === 'VAR' && (
          <>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>📹 Video Assistant Referee (VAR)</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* VAR Cases */}
              <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📋 Active VAR Cases</div>
                {[
                  { caseId: 'VAR-001', match: 'Federer vs Alcaraz', issue: 'Ball Line Challenge', status: 'In Review', time: '2:45 PM' },
                  { caseId: 'VAR-002', match: 'Medvedev vs Djokovic', issue: 'Net Touch Query', status: 'Resolved', time: '1:15 PM' },
                  { caseId: 'VAR-003', match: 'Omondi vs Hassan', issue: 'Double Hit Check', status: 'Pending', time: '3:30 PM' },
                ].map((varCase, i) => (
                  <div key={i} style={{ background: '#0f1f0f', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 11 }}>{varCase.match}</div>
                        <div style={{ fontSize: 9.5, color: G.muted, marginTop: 2 }}>{varCase.issue}</div>
                      </div>
                      <span
                        style={{
                          fontSize: 8.5,
                          fontWeight: 700,
                          background:
                            varCase.status === 'In Review'
                              ? `${G.yellow}22`
                              : varCase.status === 'Resolved'
                              ? `${G.lime}22`
                              : `${G.bright}22`,
                          color:
                            varCase.status === 'In Review'
                              ? G.yellow
                              : varCase.status === 'Resolved'
                              ? G.lime
                              : G.bright,
                          padding: '2px 6px',
                          borderRadius: 3,
                        }}
                      >
                        {varCase.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 9, color: G.muted }}>⏱️ {varCase.time}</div>
                  </div>
                ))}
              </div>

              {/* VAR Stats */}
              <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📊 VAR Statistics</div>
                {[
                  { label: 'Total VAR Cases', value: varStats?.totalVarCases || 18, icon: '📹' },
                  { label: 'Overturned Calls', value: varStats?.overturnedCalls || 4, icon: '🔄' },
                  { label: 'Accuracy Rate', value: varStats?.accuracyRate || '95.8%', icon: '🎯' },
                  { label: 'Avg Review Time', value: varStats?.avgReviewTime || '1m 23s', icon: '⏱️' },
                ].map((stat, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 3 ? `1px solid ${G.cardBorder}33` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{stat.icon}</span>
                      <span style={{ fontSize: 11 }}>{stat.label}</span>
                    </div>
                    <span style={{ color: G.accent, fontWeight: 700, fontSize: 12 }}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Reviews */}
            <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14, marginTop: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📼 Recent Reviews</div>
              {[
                { date: 'Today', match: 'Federer vs Alcaraz', decision: 'Call Confirmed', duration: '58 seconds' },
                { date: 'Yesterday', match: 'Medvedev vs Djokovic', decision: 'Call Overturned', duration: '2m 15s' },
                { date: 'Mar 20', match: 'Omondi vs Hassan', decision: 'Call Confirmed', duration: '1m 42s' },
              ].map((review, i) => (
                <div key={i} style={{ background: '#0f1f0f', borderRadius: 8, padding: 10, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 11.5 }}>{review.match}</div>
                    <div style={{ fontSize: 9, color: G.muted, marginTop: 2 }}>{review.date} · {review.duration}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, background: review.decision === 'Call Confirmed' ? `${G.lime}22` : `${G.yellow}22`, color: review.decision === 'Call Confirmed' ? G.lime : G.yellow, padding: '2px 8px', borderRadius: 4 }}>
                    {review.decision}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};
