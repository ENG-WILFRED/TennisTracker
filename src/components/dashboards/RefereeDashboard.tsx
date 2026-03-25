'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

export const RefereeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeNav, setActiveNav] = useState('Matches');
  const [activeTab, setActiveTab] = useState('Matches');
  const [p1Score, setP1Score] = useState([4, 6, 7]);
  const [p2Score, setP2Score] = useState([6, 4, 6]);
  const [p1Pts, setP1Pts] = useState(30);
  const [p2Pts, setP2Pts] = useState(15);

  const navItems = [
    { label: 'Matches', icon: '🎾' }, { label: 'Training', icon: '📋' },
    { label: 'Match Analysis', icon: '📊' }, { label: 'Reports', icon: '📄' },
  ];

  const tabs = ['Matches', 'Scheduler', 'Reporting', 'Rules §'];

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
      <aside style={{ width: 180, background: G.sidebar, borderRight: `1px solid ${G.cardBorder}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '15px 14px 10px', borderBottom: `1px solid ${G.cardBorder}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🎾</span>
          <div style={{ color: G.lime, fontWeight: 900, fontSize: 14 }}>Vico Sports</div>
        </div>
        <nav style={{ flex: 1, paddingTop: 8 }}>
          {navItems.map(item => (
            <button key={item.label} onClick={() => setActiveNav(item.label)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 13px',
              background: activeNav === item.label ? G.mid : 'transparent',
              color: activeNav === item.label ? '#fff' : G.muted,
              border: 'none', cursor: 'pointer', fontSize: 12, textAlign: 'left',
              borderLeft: activeNav === item.label ? `3px solid ${G.lime}` : '3px solid transparent',
            }}><span>{item.icon}</span>{item.label}</button>
          ))}
        </nav>
        <div style={{ padding: '10px 12px 14px' }}>
          <button style={{ width: '100%', background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 8, padding: '9px 0', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
            📝 Submit Score
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, background: G.card, borderRadius: 8, padding: 4, border: `1px solid ${G.cardBorder}` }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              flex: 1, padding: '7px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
              background: activeTab === t ? G.lime : 'transparent',
              color: activeTab === t ? '#0f1f0f' : G.muted,
            }}>{t}</button>
          ))}
        </div>

        {/* Live Match Scoring Panel */}
        <div style={{ background: `linear-gradient(135deg, ${G.mid}, #1d3d1d)`, borderRadius: 12, padding: 16, border: `1px solid ${G.cardBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ background: '#e53935', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 3, letterSpacing: 1 }}>● LIVE</span>
            <span style={{ fontSize: 11, color: G.muted }}>{liveMatch.status} · {liveMatch.court}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr auto', gap: 12, alignItems: 'center' }}>
            {/* P1 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: G.bright, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 6px' }}>🎾</div>
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>{liveMatch.p1}</div>
            </div>

            {/* Sets P1 */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              {p1Score.map((s, i) => (
                <div key={i} style={{ width: 36, height: 36, background: G.card, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: s > p2Score[i] ? G.lime : G.muted }}>{s}</div>
              ))}
            </div>

            {/* VS + Points */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: G.muted, marginBottom: 6 }}>POINTS</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => addPoint(1)} style={{ background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>{p1Pts}</button>
                <span style={{ color: G.muted, fontSize: 12 }}>–</span>
                <button onClick={() => addPoint(2)} style={{ background: G.card, color: G.text, border: `1px solid ${G.cardBorder}`, borderRadius: 6, padding: '6px 12px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>{p2Pts}</button>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'center' }}>
                <button style={{ background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 5, padding: '5px 10px', fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}>Add Point</button>
                <button style={{ background: G.bright, color: '#fff', border: 'none', borderRadius: 5, padding: '5px 10px', fontSize: 10.5, cursor: 'pointer' }}>Fault</button>
                <button style={{ background: G.card, color: G.muted, border: `1px solid ${G.cardBorder}`, borderRadius: 5, padding: '5px 10px', fontSize: 10.5, cursor: 'pointer' }}>List</button>
              </div>
            </div>

            {/* Sets P2 */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              {p2Score.map((s, i) => (
                <div key={i} style={{ width: 36, height: 36, background: G.card, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: s > p1Score[i] ? G.accent : G.muted }}>{s}</div>
              ))}
            </div>

            {/* P2 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: G.bright, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 6px' }}>🎾</div>
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>{liveMatch.p2}</div>
            </div>
          </div>
        </div>

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
            { label: 'Matches Refereed', value: 89, icon: '🏆' },
            { label: 'This Month', value: 12, icon: '📅' },
            { label: 'Rating', value: '4.8⭐', icon: '🌟' },
            { label: 'On-Time Rate', value: '98%', icon: '⏱️' },
          ].map((s, i) => (
            <div key={i} style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: '11px 13px' }}>
              <div style={{ color: G.muted, fontSize: 10 }}>{s.label}</div>
              <div style={{ color: G.accent, fontSize: 20, fontWeight: 900, marginTop: 4 }}>{s.icon} {s.value}</div>
            </div>
          ))}
        </div>
      </main>

      {/* RIGHT SIDEBAR */}
      <aside style={{ width: 200, background: G.sidebar, borderLeft: `1px solid ${G.cardBorder}`, padding: '14px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, flexShrink: 0 }}>
        <div style={{ background: G.mid, borderRadius: 10, padding: 12, textAlign: 'center' }}>
          {user?.photo
            ? <img src={user.photo} alt={user.firstName} style={{ width: 52, height: 52, borderRadius: '50%', border: `2.5px solid ${G.lime}`, objectFit: 'cover', marginBottom: 6 }} />
            : <div style={{ width: 52, height: 52, borderRadius: '50%', background: G.bright, margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🏆</div>}
          <div style={{ fontWeight: 800, fontSize: 13 }}>Referee {user?.firstName ?? 'James'}</div>
          <div style={{ color: G.muted, fontSize: 10, marginTop: 2 }}>⭐ 4.8 · 89 matches</div>
          <div style={{ display: 'flex', gap: 5, marginTop: 8, justifyContent: 'center' }}>
            <span style={{ background: G.lime, color: '#0f1f0f', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>ITF L2</span>
            <span style={{ background: G.card, borderRadius: 4, padding: '2px 7px', fontSize: 10 }}>ATP</span>
          </div>
        </div>

        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 9, padding: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 8 }}>📋 NetPlatform</div>
          {[['Nadine Tait', 100.52], ['Carlos Alcaraz', 100.52], ['Jason Murray', 102.75], ['Andy Murray', 102.75]].map(([n, v], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0', borderBottom: i < 3 ? `1px solid ${G.cardBorder}33` : 'none' }}>
              <span style={{ color: G.muted }}>{n}</span>
              <span style={{ fontWeight: 700, color: G.accent }}>${v}</span>
            </div>
          ))}
        </div>

        <div>
          <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 8 }}>🏆 Quick Actions</div>
          {[
            { l: 'Live Scores', i: '🔴' }, { l: 'Match History', i: '📊' },
            { l: 'Assignments', i: '📋' }, { l: 'My Profile', i: '👤' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', background: G.card, borderRadius: 7, border: `1px solid ${G.cardBorder}`, marginBottom: 5, cursor: 'pointer' }}>
              <span>{item.i}</span>
              <span style={{ fontSize: 11.5 }}>{item.l}</span>
              <span style={{ marginLeft: 'auto', color: G.muted, fontSize: 10 }}>›</span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
};
