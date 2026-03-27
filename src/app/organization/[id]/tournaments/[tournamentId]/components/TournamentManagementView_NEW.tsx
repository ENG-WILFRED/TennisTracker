"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface TournamentManagementViewProps {
  tournament: any;
  leaderboard: any[];
  activeTab: 'overview' | 'registrations' | 'settings' | 'rules' | 'facilities' | 'schedule' | 'analytics' | 'announcements' | 'appeals';
  setActiveTab: (tab: 'overview' | 'registrations' | 'settings' | 'rules' | 'facilities' | 'schedule' | 'analytics' | 'announcements' | 'appeals') => void;
  pendingRegistrations: any[];
  approvedRegistrations: any[];
  onRegistrationAction: (registrationId: string, action: 'approve' | 'reject') => void;
  managementLoading: boolean;
  fetchTournamentData: () => void;
  onSaveTournament: (updates: any) => Promise<void>;
  updateLoading: boolean;
  orgId: string;
}
const TABS = [
  { key: 'overview',       label: 'Overview',       icon: '⬡' },
  { key: 'registrations',  label: 'Registrations',  icon: '◈' },
  { key: 'schedule',       label: 'Schedule',        icon: '◷' },
  { key: 'analytics',      label: 'Analytics',       icon: '◎' },
  { key: 'announcements',  label: 'Announcements',   icon: '◉' },
  { key: 'rules',          label: 'Rules',           icon: '◆' },
  { key: 'appeals',        label: 'Appeals',         icon: '⚖️' },
  { key: 'facilities',     label: 'Facilities',      icon: '◫' },
  { key: 'settings',       label: 'Settings',        icon: '◌' },
];

const pill = (color = '#7dc142', bg = 'rgba(125,193,66,0.12)') => ({
  display: 'inline-flex', alignItems: 'center', gap: '5px',
  padding: '4px 12px', borderRadius: '999px',
  fontSize: '12px', fontWeight: 700,
  color, background: bg, letterSpacing: '0.03em',
} as React.CSSProperties);

const MOCK_SCHEDULE = [
  { id: 'r1', round: 'Round of 16', date: '2025-07-10', time: '09:00', court: 'Court A', player1: 'Alex Chen', player2: 'Maria Lopez', status: 'completed', score: '21-18, 21-15' },
  { id: 'r2', round: 'Round of 16', date: '2025-07-10', time: '10:30', court: 'Court B', player1: 'Sam Kim',   player2: 'Jordan Reed',  status: 'completed', score: '21-12, 19-21, 21-16' },
  { id: 'r3', round: 'Quarter Final', date: '2025-07-11', time: '09:00', court: 'Court A', player1: 'Alex Chen', player2: 'Sam Kim',   status: 'live', score: '21-18, 14-9' },
  { id: 'r4', round: 'Quarter Final', date: '2025-07-11', time: '11:00', court: 'Court B', player1: 'Priya Sharma', player2: 'Tom Nakamura', status: 'upcoming', score: '' },
  { id: 'r5', round: 'Semi Final',    date: '2025-07-12', time: '09:00', court: 'Main Court', player1: 'TBD', player2: 'TBD', status: 'upcoming', score: '' },
  { id: 'r6', round: 'Final',         date: '2025-07-13', time: '15:00', court: 'Main Court', player1: 'TBD', player2: 'TBD', status: 'upcoming', score: '' },
];

const MOCK_ANNOUNCEMENTS = [
  { id: 'a1', title: 'Schedule Update', body: 'Quarter-final matches on Court A have been moved 30 minutes earlier. Please check the updated schedule.', time: '2h ago', type: 'warning' },
  { id: 'a2', title: 'Welcome Players!', body: 'We are thrilled to welcome all participants to the tournament. Registration check-in opens at 8 AM on July 10th.', time: '1d ago', type: 'info' },
  { id: 'a3', title: 'Prize Pool Increased', body: 'Thanks to our new sponsors, the total prize pool has been raised to $15,000. Good luck to all competitors!', time: '3d ago', type: 'success' },
];

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Alex Chen',      wins: 5, losses: 0, points: 1500, trend: '+' },
  { rank: 2, name: 'Priya Sharma',   wins: 4, losses: 1, points: 1380, trend: '+' },
  { rank: 3, name: 'Sam Kim',        wins: 4, losses: 1, points: 1360, trend: '=' },
  { rank: 4, name: 'Tom Nakamura',   wins: 3, losses: 2, points: 1200, trend: '-' },
  { rank: 5, name: 'Jordan Reed',    wins: 2, losses: 3, points: 1050, trend: '-' },
  { rank: 6, name: 'Maria Lopez',    wins: 1, losses: 4, points: 900,  trend: '=' },
];

export function TournamentManagementView({
  tournament,
  leaderboard,
  activeTab,
  setActiveTab,
  pendingRegistrations,
  approvedRegistrations,
  onRegistrationAction,
  managementLoading,
  fetchTournamentData,
  orgId,
  onSaveTournament,
  updateLoading,
}: TournamentManagementViewProps) {
  const [rulesText, setRulesText]   = useState(tournament?.rules || '');
  const [savingRules, setSavingRules] = useState(false);
  const [draft, setDraft]           = useState<any>(null);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', body: '' });
  const [announcements, setAnnouncements]     = useState(MOCK_ANNOUNCEMENTS);
  const [appeals, setAppeals] = useState<any[]>([]);
  const [appealsLoading, setAppealsLoading] = useState(false);

  useEffect(() => {
    if (tournament) {
      setDraft({
        name: tournament.name || '',
        description: tournament.description || '',
        startDate: tournament.startDate ? new Date(tournament.startDate).toISOString().slice(0, 10) : '',
        endDate: tournament.endDate ? new Date(tournament.endDate).toISOString().slice(0, 10) : '',
        registrationDeadline: tournament.registrationDeadline ? new Date(tournament.registrationDeadline).toISOString().slice(0, 10) : '',
        location: tournament.location || '',
        prizePool: tournament.prizePool || 0,
        entryFee: tournament.entryFee || 0,
        registrationCap: tournament.registrationCap || 0,
        rules: tournament.rules || '',
        instructions: tournament.instructions || '',
        eatingAreas: tournament.eatingAreas || '',
        sleepingAreas: tournament.sleepingAreas || '',
        courtInfo: tournament.courtInfo || '',
      });
      setRulesText(tournament.rules || '');
    }
  }, [tournament]);

  const handleSaveRules = async () => {
    if (!tournament) return;
    setSavingRules(true);
    try { await onSaveTournament({ rules: rulesText }); await fetchTournamentData(); }
    catch (e) { console.error(e); }
    finally { setSavingRules(false); }
  };

  const fetchAppeals = async () => {
    if (!tournament) return;
    setAppealsLoading(true);
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/appeals`);
      if (response.ok) {
        const data = await response.json();
        setAppeals(data);
      }
    } catch (e) {
      console.error('Error fetching appeals:', e);
    } finally {
      setAppealsLoading(false);
    }
  };

  const handleRespondToAppeal = async (appealId: string, status: 'approved' | 'denied') => {
    const responseText = prompt(`Enter your response for this ${status} decision:`);
    if (!responseText?.trim()) return;

    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/appeals/${appealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, responseText: responseText.trim() })
      });

      if (response.ok) {
        await fetchAppeals(); // Refresh appeals
      } else {
        alert('Failed to respond to appeal');
      }
    } catch (e) {
      console.error('Error responding to appeal:', e);
      alert('Failed to respond to appeal');
    }
  };

  useEffect(() => {
    if (tournament && activeTab === 'appeals') {
      fetchAppeals();
    }
  }, [tournament, activeTab]);

  const fillRate = tournament?.registrationCap
    ? Math.round((approvedRegistrations.length / tournament.registrationCap) * 100)
    : 0;

  const statusColor = tournament?.status === 'open' ? '#7dc142' : '#d4a574';
  const statusBg    = tournament?.status === 'open' ? 'rgba(125,193,66,0.12)' : 'rgba(212,165,116,0.12)';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; }

        .tmv-root {
          min-height: 100vh;
          background: #0a160a;
          color: #dff0d0;
          font-family: 'DM Sans', sans-serif;
          padding: 28px 32px;
          position: relative;
          overflow-x: hidden;
        }

        .tmv-root::before {
          content: '';
          position: fixed;
          top: -200px; left: 40%;
          width: 700px; height: 700px;
          background: radial-gradient(ellipse, rgba(125,193,66,0.07) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .tmv-content { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; }

        .tmv-back {
          display: inline-flex; align-items: center; gap: 6px;
          color: #7dc142; text-decoration: none; font-size: 13px;
          font-weight: 500; margin-bottom: 18px; letter-spacing: 0.02em;
          opacity: .8; transition: opacity .2s;
        }
        .tmv-back:hover { opacity: 1; }

        .tmv-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          flex-wrap: wrap; gap: 16px; margin-bottom: 32px;
        }

        .tmv-title {
          font-family: 'Syne', sans-serif;
          font-size: 38px; font-weight: 800;
          background: linear-gradient(120deg,#7dc142 0%,#c8f07a 60%,#e8f5e0 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.1; margin: 0 0 10px;
        }

        .tmv-meta {
          display: flex; flex-wrap: wrap; gap: 12px; align-items: center;
          font-size: 13px; color: #9dc880;
        }
        .tmv-meta span { display: flex; align-items: center; gap: 5px; }

        .tmv-tabs {
          display: flex; gap: 2px; overflow-x: auto;
          border-bottom: 1px solid rgba(125,193,66,0.14);
          margin-bottom: 28px; padding-bottom: 0;
          scrollbar-width: none;
        }
        .tmv-tabs::-webkit-scrollbar { display: none; }

        .tmv-tab {
          padding: 11px 18px;
          background: transparent; border: none; border-bottom: 2px solid transparent;
          color: #6a9058; font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all .2s; white-space: nowrap;
          display: flex; align-items: center; gap: 6px;
          font-family: 'DM Sans', sans-serif;
          position: relative; top: 1px;
        }
        .tmv-tab:hover  { color: #a8d87e; }
        .tmv-tab.active {
          color: #a8d84e; border-bottom-color: #7dc142;
          background: rgba(125,193,66,0.06); border-radius: 6px 6px 0 0;
        }
        .tmv-tab .tab-icon { font-size: 15px; }

        .stat-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap: 14px; margin-bottom: 24px; }
        .stat-card {
          background: rgba(18,38,18,0.72);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(125,193,66,0.16);
          border-radius: 14px;
          padding: 20px 22px;
          position: relative; overflow: hidden;
        }
        .stat-card::after {
          content: '';
          position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, #7dc142, transparent);
          opacity: .5;
        }
        .stat-label { font-size: 11px; font-weight: 600; letter-spacing: .08em; color: #6a9058; text-transform: uppercase; margin-bottom: 6px; }
        .stat-value { font-family: 'Syne', sans-serif; font-size: 30px; font-weight: 800; color: #c8f07a; line-height: 1; }
        .stat-sub   { font-size: 12px; color: #6a9058; margin-top: 4px; }

        .g-card {
          background: rgba(18,38,18,0.72);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(125,193,66,0.16);
          border-radius: 16px; padding: 24px;
          margin-bottom: 20px;
        }
        .g-card-title {
          font-family: 'Syne', sans-serif;
          font-size: 16px; font-weight: 700;
          color: #a8d84e; margin: 0 0 16px;
          display: flex; align-items: center; gap: 8px;
        }

        .prog-track { height: 6px; background: rgba(125,193,66,0.1); border-radius: 99px; overflow: hidden; margin-top: 8px; }
        .prog-fill  { height: 100%; border-radius: 99px; background: linear-gradient(90deg,#4a9a1a,#7dc142,#c8f07a); transition: width .8s ease; }

        .reg-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 18px; border-radius: 10px;
          background: rgba(12,24,12,0.6);
          border: 1px solid rgba(125,193,66,0.12);
          margin-bottom: 8px; transition: border-color .2s;
        }
        .reg-row:hover { border-color: rgba(125,193,66,0.3); }

        .schedule-grid { display: grid; gap: 10px; }
        .match-card {
          background: rgba(12,24,12,0.6);
          border: 1px solid rgba(125,193,66,0.12);
          border-radius: 12px; padding: 16px 20px;
          display: grid; grid-template-columns: 130px 1fr auto;
          align-items: center; gap: 16px;
          transition: border-color .2s;
        }
        .match-card:hover { border-color: rgba(125,193,66,0.3); }
        .match-card.live { border-color: rgba(240,80,80,0.5); background: rgba(60,10,10,0.4); }
        .match-meta { font-size: 11px; color: #6a9058; }
        .match-players { display: flex; flex-direction: column; gap: 4px; }
        .player-name { font-size: 14px; font-weight: 500; color: #dff0d0; }
        .vs-label { font-size: 10px; color: #4a7038; letter-spacing: .08em; }
        .match-result { text-align: right; }
        .match-score { font-family: 'Syne', sans-serif; font-size: 13px; color: #a8d84e; font-weight: 700; }

        .lb-row {
          display: grid; grid-template-columns: 40px 1fr 60px 60px 80px 50px;
          align-items: center; gap: 12px;
          padding: 13px 18px; border-radius: 10px;
          background: rgba(12,24,12,0.6);
          border: 1px solid rgba(125,193,66,0.10);
          margin-bottom: 6px; font-size: 14px;
          transition: border-color .2s;
        }
        .lb-row:hover { border-color: rgba(125,193,66,0.3); }
        .lb-row.top1 { border-color: rgba(255,215,0,0.35); background: rgba(50,40,0,0.5); }
        .lb-row.top2 { border-color: rgba(192,192,192,0.25); }
        .lb-row.top3 { border-color: rgba(205,127,50,0.25); }
        .lb-rank { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; color: #6a9058; text-align: center; }
        .lb-rank.gold   { color: #ffd700; }
        .lb-rank.silver { color: #c0c0c0; }
        .lb-rank.bronze { color: #cd7f32; }
        .lb-name { font-weight: 500; color: #dff0d0; }
        .lb-col  { text-align: center; color: #9dc880; }
        .lb-pts  { font-family: 'Syne', sans-serif; font-weight: 700; color: #a8d84e; }
        .lb-trend-up   { color: #7dc142; }
        .lb-trend-down { color: #e05050; }
        .lb-trend-eq   { color: #6a9058; }

        .analytics-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(300px,1fr)); gap: 18px; }
        .bar-chart { margin-top: 12px; }
        .bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; font-size: 13px; }
        .bar-label { width: 120px; color: #9dc880; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bar-track { flex: 1; height: 8px; background: rgba(125,193,66,0.08); border-radius: 99px; overflow: hidden; }
        .bar-fill  { height: 100%; border-radius: 99px; background: linear-gradient(90deg,#4a9a1a,#a8d84e); }
        .bar-val   { width: 36px; text-align: right; color: #a8d84e; font-weight: 600; font-size: 12px; }

        .ann-card {
          display: flex; gap: 14px;
          padding: 16px 18px; border-radius: 12px;
          background: rgba(12,24,12,0.6);
          border: 1px solid rgba(125,193,66,0.12);
          margin-bottom: 10px;
        }
        .ann-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
        .ann-dot.info    { background: #7dc142; box-shadow: 0 0 8px rgba(125,193,66,.5); }
        .ann-dot.warning { background: #f0c040; box-shadow: 0 0 8px rgba(240,192,64,.5); }
        .ann-dot.success { background: #40d090; box-shadow: 0 0 8px rgba(64,208,144,.5); }
        .ann-title { font-weight: 600; color: #dff0d0; font-size: 14px; margin-bottom: 4px; }
        .ann-body  { font-size: 13px; color: #7a9c6a; line-height: 1.5; }
        .ann-time  { font-size: 11px; color: #4a6a3a; margin-top: 6px; }

        .form-grid { display: grid; gap: 14px; }
        .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
        .form-label { display: grid; gap: 6px; font-size: 12px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; color: #6a9058; }
        .form-label input, .form-label textarea, .form-label select {
          padding: 10px 14px; border-radius: 8px;
          border: 1px solid rgba(125,193,66,0.22);
          background: rgba(10,18,10,0.8); color: #dff0d0;
          font-size: 14px; width: 100%; font-family: inherit;
          transition: border-color .2s;
        }
        .form-label input:focus, .form-label textarea:focus {
          outline: none; border-color: rgba(125,193,66,0.55);
        }

        .btn-primary {
          padding: 10px 24px;
          background: linear-gradient(135deg,#5aa820,#7dc142,#a8d84e);
          color: #0a160a; border: none; border-radius: 8px;
          cursor: pointer; font-size: 13px; font-weight: 700;
          letter-spacing: .04em; font-family: 'DM Sans', sans-serif;
          transition: opacity .2s, transform .1s;
        }
        .btn-primary:hover   { opacity: .9; }
        .btn-primary:active  { transform: scale(.98); }
        .btn-primary:disabled { opacity: .5; cursor: not-allowed; }

        .btn-danger {
          padding: 8px 16px; background: rgba(224,80,80,0.15);
          color: #e05050; border: 1px solid rgba(224,80,80,0.3);
          border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 700;
          font-family: 'DM Sans', sans-serif; transition: background .2s;
        }
        .btn-danger:hover { background: rgba(224,80,80,0.25); }

        .btn-approve {
          padding: 8px 16px; background: rgba(125,193,66,0.15);
          color: #7dc142; border: 1px solid rgba(125,193,66,0.3);
          border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 700;
          font-family: 'DM Sans', sans-serif; transition: background .2s;
        }
        .btn-approve:hover { background: rgba(125,193,66,0.25); }

        @media (max-width: 640px) {
          .tmv-root { padding: 16px; }
          .form-row-2, .form-row-3 { grid-template-columns: 1fr; }
          .match-card { grid-template-columns: 1fr; }
          .lb-row { grid-template-columns: 40px 1fr 60px 80px; }
          .lb-row > :nth-child(4), .lb-row > :nth-child(5) { display: none; }
        }
      `}</style>

      <div className="tmv-root">
        <div className="tmv-content">

          <Link href={`/dashboard/org/${orgId}`} className="tmv-back">
            ← Back to Organization
          </Link>

          <div className="tmv-header">
            <div>
              <h1 className="tmv-title">{tournament.name}</h1>
              <div className="tmv-meta">
                <span>📅 {new Date(tournament.startDate).toLocaleDateString()} — {tournament.endDate ? new Date(tournament.endDate).toLocaleDateString() : 'TBD'}</span>
                <span>📍 {tournament.location || 'TBD'}</span>
                <span>🏆 ${tournament.prizePool?.toLocaleString()} Prize Pool</span>
                <span>💳 ${tournament.entryFee} Entry</span>
                <span style={pill(statusColor, statusBg)}>{tournament.status?.toUpperCase()}</span>
              </div>
            </div>
            {pendingRegistrations.length > 0 && (
              <div style={{
                background: 'rgba(240,192,64,0.1)', border: '1px solid rgba(240,192,64,0.3)',
                borderRadius: '10px', padding: '12px 18px', fontSize: '13px', color: '#f0c040',
                fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                ⚡ {pendingRegistrations.length} registration{pendingRegistrations.length > 1 ? 's' : ''} awaiting review
              </div>
            )}
          </div>

          <div className="tmv-tabs">
            {TABS.map(t => (
              <button
                key={t.key}
                className={`tmv-tab${activeTab === t.key ? ' active' : ''}`}
                onClick={() => setActiveTab(t.key as any)}
              >
                <span className="tab-icon">{t.icon}</span>
                {t.label}
                {t.key === 'registrations' && pendingRegistrations.length > 0 && (
                  <span style={{
                    marginLeft: 4, background: '#f0c040', color: '#0a160a',
                    borderRadius: '99px', padding: '1px 7px', fontSize: '11px', fontWeight: 800,
                  }}>{pendingRegistrations.length}</span>
                )}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div>
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-label">Approved Players</div>
                  <div className="stat-value">{approvedRegistrations.length}</div>
                  <div className="stat-sub">of {tournament.registrationCap} spots</div>
                  <div className="prog-track"><div className="prog-fill" style={{ width: `${fillRate}%` }} /></div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Pending</div>
                  <div className="stat-value" style={{ color: '#f0c040' }}>{pendingRegistrations.length}</div>
                  <div className="stat-sub">awaiting review</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Prize Pool</div>
                  <div className="stat-value">${tournament.prizePool?.toLocaleString()}</div>
                  <div className="stat-sub">total purse</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Fill Rate</div>
                  <div className="stat-value">{fillRate}%</div>
                  <div className="stat-sub">{tournament.registrationCap - approvedRegistrations.length} spots left</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Entry Fee</div>
                  <div className="stat-value">${tournament.entryFee}</div>
                  <div className="stat-sub">per player</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Revenue</div>
                  <div className="stat-value">${(approvedRegistrations.length * (tournament.entryFee || 0)).toLocaleString()}</div>
                  <div className="stat-sub">collected</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 18 }}>

                <div className="g-card">
                  <div className="g-card-title">🔴 Live Matches</div>
                  {MOCK_SCHEDULE.filter(m => m.status === 'live').length === 0
                    ? <p style={{ color: '#4a6a3a', fontSize: 13 }}>No live matches right now.</p>
                    : MOCK_SCHEDULE.filter(m => m.status === 'live').map(m => (
                      <div key={m.id} style={{
                        padding: '12px 16px', borderRadius: 10,
                        background: 'rgba(60,10,10,0.4)',
                        border: '1px solid rgba(240,80,80,0.35)', marginBottom: 8,
                      }}>
                        <div style={{ fontSize: 11, color: '#c06060', fontWeight: 700, marginBottom: 4, letterSpacing: '.06em' }}>● LIVE · {m.court}</div>
                        <div style={{ fontWeight: 600, color: '#dff0d0' }}>{m.player1} <span style={{ color: '#4a6a3a' }}>vs</span> {m.player2}</div>
                        <div style={{ fontSize: 12, color: '#a8d84e', marginTop: 4 }}>{m.score}</div>
                      </div>
                    ))
                  }
                </div>

                <div className="g-card">
                  <div className="g-card-title">⏳ Upcoming Matches</div>
                  {MOCK_SCHEDULE.filter(m => m.status === 'upcoming').slice(0,3).map(m => (
                    <div key={m.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 0', borderBottom: '1px solid rgba(125,193,66,0.08)',
                      fontSize: 13,
                    }}>
                      <div>
                        <div style={{ fontWeight: 500, color: '#dff0d0' }}>{m.player1} vs {m.player2}</div>
                        <div style={{ color: '#4a6a3a', fontSize: 11, marginTop: 2 }}>{m.round} · {m.court}</div>
                      </div>
                      <div style={{ color: '#6a9058', fontSize: 12, textAlign: 'right' }}>
                        <div>{m.date}</div>
                        <div>{m.time}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="g-card">
                  <div className="g-card-title">📢 Recent Announcements</div>
                  {announcements.slice(0,2).map(a => (
                    <div key={a.id} className="ann-card" style={{ marginBottom: 8 }}>
                      <div className={`ann-dot ${a.type}`} />
                      <div>
                        <div className="ann-title">{a.title}</div>
                        <div className="ann-body" style={{ fontSize: 12, WebkitLineClamp: 2, overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical' }}>{a.body}</div>
                        <div className="ann-time">{a.time}</div>
                      </div>
                    </div>
                  ))}
                  <button className="btn-primary" style={{ marginTop: 8, width: '100%' }} onClick={() => setActiveTab('announcements')}>
                    Manage Announcements
                  </button>
                </div>

                <div className="g-card">
                  <div className="g-card-title">🏅 Top Players</div>
                  {MOCK_LEADERBOARD.slice(0,4).map(p => (
                    <div key={p.rank} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '8px 0', borderBottom: '1px solid rgba(125,193,66,0.08)',
                    }}>
                      <span style={{
                        fontFamily: 'Syne,sans-serif', fontWeight: 800,
                        color: p.rank === 1 ? '#ffd700' : p.rank === 2 ? '#c0c0c0' : p.rank === 3 ? '#cd7f32' : '#4a6a3a',
                        width: 24, textAlign: 'center',
                      }}>{p.rank}</span>
                      <span style={{ flex: 1, color: '#dff0d0', fontSize: 14 }}>{p.name}</span>
                      <span style={{ fontFamily: 'Syne,sans-serif', color: '#a8d84e', fontWeight: 700 }}>{p.points}</span>
                    </div>
                  ))}
                  <button className="btn-primary" style={{ marginTop: 12, width: '100%' }} onClick={() => setActiveTab('analytics')}>
                    Full Leaderboard →
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'registrations' && (
            <div>
              <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 700, color: '#a8d84e', marginBottom: 24 }}>Player Registrations</h2>

              {pendingRegistrations.length > 0 && (
                <div className="g-card" style={{ borderColor: 'rgba(240,192,64,0.25)', marginBottom: 24 }}>
                  <div className="g-card-title" style={{ color: '#f0c040' }}>
                    ⏰ Pending Approvals
                    <span style={{
                      marginLeft: 8, background: '#f0c040', color: '#0a160a',
                      borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 800,
                    }}>{pendingRegistrations.length}</span>
                  </div>
                  {pendingRegistrations.map((reg: any) => (
                    <div key={reg.id} className="reg-row" style={{ borderColor: 'rgba(240,192,64,0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%',
                          background: 'linear-gradient(135deg,#4a7a1a,#7dc142)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'Syne,sans-serif', fontWeight: 800, color: '#0a160a', fontSize: 16,
                          flexShrink: 0,
                        }}>
                          {(reg.member?.player?.user?.firstName || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#dff0d0', fontSize: 14 }}>{reg.member?.player?.user?.firstName} {reg.member?.player?.user?.lastName}</div>
                          <div style={{ fontSize: 11, color: '#6a9058', marginTop: 2 }}>Applied {new Date(reg.registeredAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-approve" onClick={() => onRegistrationAction(reg.id, 'approve')} disabled={managementLoading}>✓ Approve</button>
                        <button className="btn-danger"  onClick={() => onRegistrationAction(reg.id, 'reject')}  disabled={managementLoading}>✕ Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="g-card">
                <div className="g-card-title">
                  ✅ Approved Players
                  <span style={{ marginLeft: 8, color: '#6a9058', fontWeight: 400, fontSize: 14 }}>({approvedRegistrations.length}/{tournament.registrationCap})</span>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6a9058', marginBottom: 6 }}>
                    <span>Capacity fill</span><span>{fillRate}%</span>
                  </div>
                  <div className="prog-track" style={{ height: 8 }}>
                    <div className="prog-fill" style={{ width: `${fillRate}%` }} />
                  </div>
                </div>

                {approvedRegistrations.length === 0
                  ? <p style={{ color: '#4a6a3a', fontSize: 13 }}>No approved players yet.</p>
                  : approvedRegistrations.map((reg: any) => (
                    <div key={reg.id} className="reg-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'linear-gradient(135deg,#2a5a12,#4a8a22)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'Syne,sans-serif', fontWeight: 800, color: '#a8d84e', fontSize: 15,
                          flexShrink: 0,
                        }}>
                          {(reg.member?.player?.user?.firstName || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: '#dff0d0', fontSize: 14 }}>{reg.member?.player?.user?.firstName} {reg.member?.player?.user?.lastName}</div>
                          <div style={{ fontSize: 11, color: '#4a6a3a', marginTop: 2 }}>Approved {new Date(reg.registeredAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <span style={{ color: '#7dc142', fontSize: 18 }}>✓</span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div>
              <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 700, color: '#a8d84e', marginBottom: 24 }}>Match Schedule</h2>

              {['Round of 16', 'Quarter Final', 'Semi Final', 'Final'].map(round => {
                const matches = MOCK_SCHEDULE.filter(m => m.round === round);
                if (!matches.length) return null;
                return (
                  <div key={round} className="g-card" style={{ marginBottom: 18 }}>
                    <div className="g-card-title">{round}</div>
                    <div className="schedule-grid">
                      {matches.map(m => (
                        <div key={m.id} className={`match-card${m.status === 'live' ? ' live' : ''}`}>
                          <div>
                            <div className="match-meta" style={{ marginBottom: 4 }}>{m.date} · {m.time}</div>
                            <div className="match-meta">{m.court}</div>
                            {m.status === 'live' && (
                              <span style={{ ...pill('#e05050','rgba(224,80,80,0.12)'), marginTop: 6, display: 'inline-flex' }}>● LIVE</span>
                            )}
                            {m.status === 'completed' && (
                              <span style={{ ...pill('#7dc142','rgba(125,193,66,0.10)'), marginTop: 6, display: 'inline-flex' }}>DONE</span>
                            )}
                            {m.status === 'upcoming' && (
                              <span style={{ ...pill('#9dc880','rgba(157,200,128,0.10)'), marginTop: 6, display: 'inline-flex' }}>UPCOMING</span>
                            )}
                          </div>
                          <div className="match-players">
                            <div className="player-name">{m.player1}</div>
                            <div className="vs-label">VS</div>
                            <div className="player-name">{m.player2}</div>
                          </div>
                          <div className="match-result">
                            {m.score
                              ? <div className="match-score">{m.score.split(',').map((s,i) => <div key={i}>{s.trim()}</div>)}</div>
                              : <div style={{ color: '#4a6a3a', fontSize: 13 }}>—</div>
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 700, color: '#a8d84e', marginBottom: 24 }}>Analytics & Leaderboard</h2>

              <div className="g-card" style={{ marginBottom: 20 }}>
                <div className="g-card-title">🏅 Player Rankings</div>

                <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 60px 60px 80px 50px', gap: 12, padding: '6px 18px', fontSize: 11, fontWeight: 700, letterSpacing: '.07em', color: '#4a6a3a', textTransform: 'uppercase', marginBottom: 6 }}>
                  <span style={{ textAlign: 'center' }}>#</span>
                  <span>Player</span>
                  <span style={{ textAlign: 'center' }}>W</span>
                  <span style={{ textAlign: 'center' }}>L</span>
                  <span style={{ textAlign: 'center' }}>Points</span>
                  <span style={{ textAlign: 'center' }}>Trend</span>
                </div>

                {(leaderboard.length ? leaderboard : MOCK_LEADERBOARD).map((p: any) => {
                  const rankClass = p.rank === 1 ? 'top1' : p.rank === 2 ? 'top2' : p.rank === 3 ? 'top3' : '';
                  const rankColor = p.rank === 1 ? 'gold' : p.rank === 2 ? 'silver' : p.rank === 3 ? 'bronze' : '';
                  const trendClass = p.trend === '+' ? 'lb-trend-up' : p.trend === '-' ? 'lb-trend-down' : 'lb-trend-eq';
                  const trendIcon  = p.trend === '+' ? '▲' : p.trend === '-' ? '▼' : '—';
                  return (
                    <div key={p.rank} className={`lb-row ${rankClass}`}>
                      <span className={`lb-rank ${rankColor}`}>{p.rank}</span>
                      <span className="lb-name">{p.name}</span>
                      <span className="lb-col">{p.wins}</span>
                      <span className="lb-col">{p.losses}</span>
                      <span className={`lb-col lb-pts`}>{p.points}</span>
                      <span className={`lb-col ${trendClass}`}>{trendIcon}</span>
                    </div>
                  );
                })}
              </div>

              <div className="analytics-grid">
                <div className="g-card">
                  <div className="g-card-title">📊 Win Distribution</div>
                  <div className="bar-chart">
                    {MOCK_LEADERBOARD.map(p => (
                      <div key={p.rank} className="bar-row">
                        <span className="bar-label">{p.name.split(' ')[0]}</span>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${(p.wins / 5) * 100}%` }} />
                        </div>
                        <span className="bar-val">{p.wins}W</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="g-card">
                  <div className="g-card-title">📈 Registration Timeline</div>
                  <div className="bar-chart">
                    {['Week 1','Week 2','Week 3','Week 4','Week 5'].map((w,i) => {
                      const vals = [12,28,45,60,approvedRegistrations.length || 68];
                      return (
                        <div key={w} className="bar-row">
                          <span className="bar-label">{w}</span>
                          <div className="bar-track">
                            <div className="bar-fill" style={{ width: `${(vals[i] / (tournament.registrationCap || 80)) * 100}%` }} />
                          </div>
                          <span className="bar-val">{vals[i]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="g-card">
                  <div className="g-card-title">💰 Financial Summary</div>
                  {[
                    { label: 'Entry Revenue', value: `$${(approvedRegistrations.length * (tournament.entryFee || 0)).toLocaleString()}` },
                    { label: 'Prize Pool',    value: `$${tournament.prizePool?.toLocaleString()}` },
                    { label: 'Net (est.)',    value: `$${Math.max(0,(approvedRegistrations.length*(tournament.entryFee||0))-(tournament.prizePool||0)).toLocaleString()}` },
                    { label: 'Players',       value: `${approvedRegistrations.length}` },
                    { label: 'Avg Revenue/Player', value: `$${approvedRegistrations.length ? (approvedRegistrations.length*(tournament.entryFee||0)/approvedRegistrations.length).toFixed(0) : 0}` },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(125,193,66,0.07)', fontSize: 13 }}>
                      <span style={{ color: '#6a9058' }}>{row.label}</span>
                      <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, color: '#a8d84e' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div>
              <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 700, color: '#a8d84e', marginBottom: 24 }}>Announcements</h2>

              <div className="g-card" style={{ marginBottom: 24 }}>
                <div className="g-card-title">📣 New Announcement</div>
                <div className="form-grid">
                  <label className="form-label">
                    Title
                    <input
                      value={newAnnouncement.title}
                      onChange={e => setNewAnnouncement(p => ({ ...p, title: e.target.value }))}
                      placeholder="Announcement title..."
                    />
                  </label>
                  <label className="form-label">
                    Message
                    <textarea
                      value={newAnnouncement.body}
                      onChange={e => setNewAnnouncement(p => ({ ...p, body: e.target.value }))}
                      rows={4}
                      placeholder="Write your announcement..."
                    />
                  </label>
                  <div>
                    <button
                      className="btn-primary"
                      onClick={() => {
                        if (!newAnnouncement.title || !newAnnouncement.body) return;
                        setAnnouncements(prev => [{
                          id: Date.now().toString(),
                          title: newAnnouncement.title,
                          body: newAnnouncement.body,
                          time: 'just now',
                          type: 'info',
                        }, ...prev]);
                        setNewAnnouncement({ title: '', body: '' });
                      }}
                    >
                      Publish Announcement
                    </button>
                  </div>
                </div>
              </div>

              <div className="g-card">
                <div className="g-card-title">📋 Published</div>
                {announcements.map(a => (
                  <div key={a.id} className="ann-card">
                    <div className={`ann-dot ${a.type}`} />
                    <div style={{ flex: 1 }}>
                      <div className="ann-title">{a.title}</div>
                      <div className="ann-body">{a.body}</div>
                      <div className="ann-time">{a.time}</div>
                    </div>
                    <button
                      className="btn-danger"
                      style={{ alignSelf: 'flex-start', padding: '5px 12px', fontSize: 11 }}
                      onClick={() => setAnnouncements(p => p.filter(x => x.id !== a.id))}
                    >Delete</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div>
              <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 700, color: '#a8d84e', marginBottom: 24 }}>Rules & Regulations</h2>
              <div className="g-card">
                <div className="g-card-title">📋 Tournament Rules</div>
                <textarea
                  value={rulesText}
                  onChange={e => setRulesText(e.target.value)}
                  placeholder="Enter tournament rules and regulations..."
                  rows={16}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(125,193,66,0.28)', background: 'rgba(10,20,10,0.7)', color: '#e8f5e0', fontSize: '14px', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
                />
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn-primary" onClick={handleSaveRules} disabled={savingRules}>
                    {savingRules ? 'Saving…' : 'Save Rules'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appeals' && (
            <div>
              <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 700, color: '#a8d84e', marginBottom: 24 }}>Rule Appeals</h2>

              {appealsLoading ? (
                <div className="g-card" style={{ color: '#6a9058' }}>Loading appeals…</div>
              ) : appeals.length === 0 ? (
                <div className="g-card" style={{ color: '#6a9058' }}>No appeals submitted yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {appeals.map((appeal) => (
                    <div key={appeal.id} className="g-card">
                      <div className="g-card-title">
                        Appeal from {appeal.user.user.firstName} {appeal.user.user.lastName}
                        <span style={{
                          marginLeft: 12,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          background: appeal.status === 'pending' ? 'rgba(212,165,116,0.2)' :
                                     appeal.status === 'approved' ? 'rgba(125,193,66,0.2)' : 'rgba(220,53,69,0.2)',
                          color: appeal.status === 'pending' ? '#d4a574' :
                                 appeal.status === 'approved' ? '#7dc142' : '#dc3545'
                        }}>
                          {appeal.status}
                        </span>
                      </div>

                      {appeal.ruleCategory && (
                        <div style={{ marginBottom: 8 }}>
                          <span style={{ color: '#7a9c6a', fontSize: 13 }}>Category:</span>
                          <span style={{ color: '#c8e0a8', marginLeft: 8 }}>{appeal.ruleCategory}</span>
                        </div>
                      )}

                      {appeal.ruleLabel && (
                        <div style={{ marginBottom: 8 }}>
                          <span style={{ color: '#7a9c6a', fontSize: 13 }}>Rule:</span>
                          <span style={{ color: '#c8e0a8', marginLeft: 8 }}>{appeal.ruleLabel}</span>
                        </div>
                      )}

                      <div style={{ marginBottom: 12 }}>
                        <div style={{ color: '#7a9c6a', fontSize: 13, marginBottom: 4 }}>Appeal:</div>
                        <div style={{ color: '#c8e0a8', lineHeight: 1.5 }}>{appeal.appealText}</div>
                      </div>

                      {appeal.status !== 'pending' && appeal.responseText && (
                        <div style={{ marginTop: 12, padding: '12px', background: 'rgba(10,20,10,0.5)', borderRadius: '8px' }}>
                          <div style={{ color: '#7a9c6a', fontSize: 13, marginBottom: 4 }}>Response:</div>
                          <div style={{ color: '#c8e0a8', lineHeight: 1.5 }}>{appeal.responseText}</div>
                        </div>
                      )}

                      {appeal.status === 'pending' && (
                        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                          <button
                            className="btn-primary"
                            style={{ background: 'rgba(125,193,66,0.15)', color: '#7dc142', border: '1px solid rgba(125,193,66,0.3)' }}
                            onClick={() => handleRespondToAppeal(appeal.id, 'approved')}
                          >
                            Approve
                          </button>
                          <button
                            className="btn-primary"
                            style={{ background: 'rgba(220,53,69,0.15)', color: '#dc3545', border: '1px solid rgba(220,53,69,0.3)' }}
                            onClick={() => handleRespondToAppeal(appeal.id, 'denied')}
                          >
                            Deny
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'facilities' && (
            <div>
              <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 700, color: '#a8d84e', marginBottom: 24 }}>Facilities</h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 18, marginBottom: 20 }}>
                {[
                  { icon: '🏸', title: 'Courts', desc: tournament.courtInfo || 'No court info added yet.' },
                  { icon: '🍽️', title: 'Eating Areas', desc: tournament.eatingAreas || 'No eating area info added yet.' },
                  { icon: '🛏️', title: 'Sleeping Areas', desc: tournament.sleepingAreas || 'No sleeping area info added yet.' },
                ].map(f => (
                  <div key={f.title} className="g-card">
                    <div className="g-card-title">{f.icon} {f.title}</div>
                    <p style={{ color: '#7a9c6a', fontSize: 13, lineHeight: 1.6 }}>{f.desc}</p>
                  </div>
                ))}
              </div>

              <div className="g-card">
                <div className="g-card-title">🏢 Manage Facilities</div>
                <p style={{ color: '#7a9c6a', fontSize: 14, marginBottom: 16 }}>
                  Update court assignments, eating, and sleeping area details in tournament settings, or manage organization courts below.
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <Link href={`/organization/${orgId}/courts`} className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                    Manage Courts →
                  </Link>
                  <button className="btn-primary" style={{ background: 'rgba(125,193,66,0.15)', color: '#7dc142', border: '1px solid rgba(125,193,66,0.3)' }} onClick={() => setActiveTab('settings')}>
                    Edit in Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 700, color: '#a8d84e', marginBottom: 24 }}>Tournament Settings</h2>

              {!draft ? (
                <div className="g-card" style={{ color: '#6a9058' }}>Loading settings…</div>
              ) : (
                <>
                  <div className="g-card" style={{ marginBottom: 18 }}>
                    <div className="g-card-title">📝 Basic Information</div>
                    <div className="form-grid">
                      <label className="form-label">Tournament Name
                        <input value={draft.name} onChange={e => setDraft((p: any) => ({ ...p, name: e.target.value }))} />
                      </label>
                      <label className="form-label">Description
                        <textarea value={draft.description} rows={3} onChange={e => setDraft((p: any) => ({ ...p, description: e.target.value }))} />
                      </label>
                      <label className="form-label">Location
                        <input value={draft.location} onChange={e => setDraft((p: any) => ({ ...p, location: e.target.value }))} />
                      </label>
                    </div>
                  </div>

                  <div className="g-card" style={{ marginBottom: 18 }}>
                    <div className="g-card-title">📅 Dates</div>
                    <div className="form-row-3">
                      <label className="form-label">Start Date
                        <input type="date" value={draft.startDate} onChange={e => setDraft((p: any) => ({ ...p, startDate: e.target.value }))} />
                      </label>
                      <label className="form-label">End Date
                        <input type="date" value={draft.endDate} onChange={e => setDraft((p: any) => ({ ...p, endDate: e.target.value }))} />
                      </label>
                      <label className="form-label">Registration Deadline
                        <input type="date" value={draft.registrationDeadline} onChange={e => setDraft((p: any) => ({ ...p, registrationDeadline: e.target.value }))} />
                      </label>
                    </div>
                  </div>

                  <div className="g-card" style={{ marginBottom: 18 }}>
                    <div className="g-card-title">💰 Pricing & Capacity</div>
                    <div className="form-row-3">
                      <label className="form-label">Registration Cap
                        <input type="number" min={1} value={draft.registrationCap} onChange={e => setDraft((p: any) => ({ ...p, registrationCap: parseInt(e.target.value || '0') }))} />
                      </label>
                      <label className="form-label">Entry Fee ($)
                        <input type="number" min={0} value={draft.entryFee} onChange={e => setDraft((p: any) => ({ ...p, entryFee: parseFloat(e.target.value || '0') }))} />
                      </label>
                      <label className="form-label">Prize Pool ($)
                        <input type="number" min={0} value={draft.prizePool} onChange={e => setDraft((p: any) => ({ ...p, prizePool: parseFloat(e.target.value || '0') }))} />
                      </label>
                    </div>
                  </div>

                  <div className="g-card" style={{ marginBottom: 18 }}>
                    <div className="g-card-title">🏢 Facility Details</div>
                    <div className="form-grid">
                      <label className="form-label">Court Information
                        <textarea rows={3} value={draft.courtInfo} onChange={e => setDraft((p: any) => ({ ...p, courtInfo: e.target.value }))} />
                      </label>
                      <div className="form-row-2">
                        <label className="form-label">Eating Areas
                          <textarea rows={3} value={draft.eatingAreas} onChange={e => setDraft((p: any) => ({ ...p, eatingAreas: e.target.value }))} />
                        </label>
                        <label className="form-label">Sleeping Areas
                          <textarea rows={3} value={draft.sleepingAreas} onChange={e => setDraft((p: any) => ({ ...p, sleepingAreas: e.target.value }))} />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="g-card" style={{ marginBottom: 18 }}>
                    <div className="g-card-title">📋 Rules & Instructions</div>
                    <div className="form-grid">
                      <label className="form-label">Tournament Rules
                        <textarea rows={5} value={draft.rules} onChange={e => setDraft((p: any) => ({ ...p, rules: e.target.value }))} />
                      </label>
                      <label className="form-label">Additional Instructions
                        <textarea rows={3} value={draft.instructions} onChange={e => setDraft((p: any) => ({ ...p, instructions: e.target.value }))} />
                      </label>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button className="btn-primary" style={{ background: 'rgba(125,193,66,0.12)', color: '#7dc142', border: '1px solid rgba(125,193,66,0.3)' }} onClick={() => setDraft(null)}>
                      Reset
                    </button>
                    <button
                      className="btn-primary"
                      disabled={updateLoading}
                      onClick={() => onSaveTournament({
                        name: draft.name, description: draft.description,
                        startDate: draft.startDate, endDate: draft.endDate || null,
                        registrationDeadline: draft.registrationDeadline, location: draft.location,
                        registrationCap: draft.registrationCap, entryFee: draft.entryFee,
                        prizePool: draft.prizePool, rules: draft.rules, instructions: draft.instructions,
                        eatingAreas: draft.eatingAreas, sleepingAreas: draft.sleepingAreas, courtInfo: draft.courtInfo,
                      })}
                    >
                      {updateLoading ? 'Saving…' : '✓ Save Tournament'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
