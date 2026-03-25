'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

const ProgressBar: React.FC<{ value: number; color?: string }> = ({ value, color = G.lime }) => (
  <div style={{ height: 6, background: G.dark, borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
    <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 3, transition: 'width 0.5s' }} />
  </div>
);

export const CoachDashboard: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('My Team');
  const [activeNav, setActiveNav] = useState('Home');

  const navItems = [
    { label: 'Home', icon: '🏠' }, { label: 'Upcoming Matches', icon: '📅' },
    { label: 'Highlights', icon: '🎬' }, { label: 'My Favorites', icon: '⭐' },
    { label: 'Stats', icon: '📊' }, { label: 'Referee Details', icon: '🏆' },
    { label: 'My Favorites', icon: '❤️' },
  ];

  const tabs = ['My Team', 'Training Plans', 'Match Analysis', 'Reports'];

  const students = [
    { name: 'Michael', progress: 85, sessions: 12, nextSession: 'Tomorrow, 10:00 AM' },
    { name: 'Eval', progress: 72, sessions: 9, nextSession: 'Wed, 2:00 PM' },
    { name: 'Lisa', progress: 60, sessions: 7, nextSession: 'Thu, 11:00 AM' },
    { name: 'Tom', progress: 55, sessions: 6, nextSession: 'Fri, 9:00 AM' },
  ];

  const upcomingSession = {
    date: 'Tomorrow, 10:00 AM', court: 'Court 1',
    drills: [
      { name: 'Serve Technique', duration: '30 min', pct: 90, color: '#7dc142' },
      { name: 'Net Volley Practice', duration: '25 min', pct: 75, color: '#5aa832' },
      { name: 'Footwork Drills', duration: '20 min', pct: 60, color: '#3d7a32' },
      { name: 'Intensive Training', duration: '15 min', pct: 45, color: '#2d5a27' },
    ],
  };

  const nextMatch = { player: 'Carlos Alcaraz', date: 'Saturday, 2:00 PM', opp: 'Anderton Charter', court: 'Court 4', type: 'Open Tennis Cup' };

  const liveMatch = {
    p1: 'Carlos Alcaraz', p2: 'Daniil Medvedev', court: 'Court 1',
    sets: [[6, 3], [4, 6], [7, 6]],
  };

  const earnings = { thisMonth: 2040, pending: 240, perSession: 60 };

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
            <button key={item.label + item.icon} onClick={() => {
              setActiveNav(item.label);
              if (item.label === 'Stats') {
                router.push('/leaderboard');
              }
            }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 13px',
              background: activeNav === item.label ? G.mid : 'transparent',
              color: activeNav === item.label ? '#fff' : G.muted,
              border: 'none', cursor: 'pointer', fontSize: 12, textAlign: 'left',
              borderLeft: activeNav === item.label ? `3px solid ${G.lime}` : '3px solid transparent',
            }}><span>{item.icon}</span>{item.label}</button>
          ))}
        </nav>
        <div style={{ padding: '10px 12px 14px' }}>
          <button style={{ width: '100%', background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 8, padding: '9px 0', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
            🏆 Referee Details
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

        {/* Live Match Banner */}
        <div style={{ background: `linear-gradient(135deg, ${G.mid}, #1d3d1d)`, borderRadius: 10, padding: '12px 16px', border: `1px solid ${G.cardBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ background: '#e53935', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 3, letterSpacing: 1 }}>● LIVE MATCH</span>
            <span style={{ fontSize: 11, color: G.muted }}>{liveMatch.court}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{liveMatch.p1}</div>
              <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>vs {liveMatch.p2}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {liveMatch.sets.map((s, i) => (
                <div key={i} style={{ textAlign: 'center', background: G.card, borderRadius: 6, padding: '6px 12px' }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: G.accent }}>{s[0]}</div>
                  <div style={{ fontSize: 12, color: G.muted }}>–</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: G.muted }}>{s[1]}</div>
                </div>
              ))}
            </div>
            <button style={{ background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>▶ Watch Live</button>
          </div>
        </div>

        {/* Students + Drills */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

          {/* Student Progress */}
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 13 }}>👥 Student Progress</div>
              <Link href="/staff/manage"><span style={{ color: G.lime, fontSize: 11, cursor: 'pointer' }}>Manage Session →</span></Link>
            </div>
            {students.map((s, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{s.name}</span>
                  <span style={{ fontSize: 11, color: G.accent, fontWeight: 700 }}>{s.progress}%</span>
                </div>
                <ProgressBar value={s.progress} />
                <div style={{ fontSize: 9.5, color: G.muted, marginTop: 3 }}>Next: {s.nextSession} · {s.sessions} sessions</div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button style={{ flex: 1, background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 6, padding: '8px 0', fontWeight: 700, fontSize: 11.5, cursor: 'pointer' }}>Manage Session</button>
              <button style={{ flex: 1, background: G.mid, color: G.text, border: 'none', borderRadius: 6, padding: '8px 0', fontWeight: 600, fontSize: 11.5, cursor: 'pointer' }}>📋 Attendance</button>
            </div>
          </div>

          {/* Upcoming Training Session */}
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4 }}>📅 Upcoming Training Session</div>
            <div style={{ fontSize: 10.5, color: G.muted, marginBottom: 12 }}>{upcomingSession.date} · {upcomingSession.court}</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: G.accent, fontWeight: 700, marginBottom: 6 }}>DRILLS FOCUS</div>
                {upcomingSession.drills.map((d, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 11.5 }}>{d.name}</span>
                      <span style={{ fontSize: 10, color: G.muted }}>{d.pct}%</span>
                    </div>
                    <div style={{ height: 5, background: G.dark, borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${d.pct}%`, background: d.color, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ width: 80, display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'flex-start', paddingTop: 20 }}>
                {['Badminton', 'Stretchy', 'Squiggle', 'Orange'].map((c, i) => (
                  <div key={i} style={{ fontSize: 9, color: G.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: upcomingSession.drills[i]?.color, display: 'inline-block' }} />
                    {upcomingSession.drills[i]?.name.split(' ')[0]}
                  </div>
                ))}
              </div>
            </div>

            {/* Next Match */}
            <div style={{ marginTop: 12, borderTop: `1px solid ${G.cardBorder}`, paddingTop: 10 }}>
              <div style={{ fontSize: 10, color: G.accent, fontWeight: 700, marginBottom: 6 }}>NEXT MATCH</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>{nextMatch.player}</div>
                  <div style={{ fontSize: 10.5, color: G.muted }}>{nextMatch.type}</div>
                  <div style={{ fontSize: 10, color: G.muted }}>{nextMatch.date} · {nextMatch.court}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={{ background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 5, padding: '5px 10px', fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}>Coach</button>
                  <button style={{ background: G.mid, color: G.text, border: 'none', borderRadius: 5, padding: '5px 10px', fontSize: 10.5, cursor: 'pointer' }}>Details</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings + Achievements */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {[
            { label: 'This Month', value: `$${earnings.thisMonth.toLocaleString()}`, icon: '💰' },
            { label: 'Per Session', value: `$${earnings.perSession}`, icon: '📈' },
            { label: 'Pending Payout', value: `$${earnings.pending}`, icon: '⏳' },
            { label: 'Students', value: 18, icon: '👥' },
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
        {/* Coach profile */}
        <div style={{ background: G.mid, borderRadius: 10, padding: 12, textAlign: 'center' }}>
          {user?.photo
            ? <img src={user.photo} alt={user.firstName} style={{ width: 52, height: 52, borderRadius: '50%', border: `2.5px solid ${G.lime}`, objectFit: 'cover', marginBottom: 6 }} />
            : <div style={{ width: 52, height: 52, borderRadius: '50%', background: G.bright, margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>👨‍🏫</div>}
          <div style={{ fontWeight: 800, fontSize: 13 }}>Coach {user?.firstName ?? 'Maria'}</div>
          <div style={{ color: G.muted, fontSize: 10, marginTop: 2 }}>⭐ 4.8 · 18 students</div>
          <div style={{ display: 'flex', gap: 5, marginTop: 8, justifyContent: 'center' }}>
            <span style={{ background: G.lime, color: '#0f1f0f', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>ITF L2</span>
            <span style={{ background: G.card, borderRadius: 4, padding: '2px 7px', fontSize: 10 }}>ATP</span>
          </div>
        </div>

        {/* Match Stats quick */}
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 9, padding: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 8 }}>📊 Live Match Stats</div>
          {[['1st Serve %', '68%'], ['Aces', '4'], ['Winners', '12'], ['Unforced Err.', '8']].map(([l, v], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, padding: '4px 0', borderBottom: i < 3 ? `1px solid ${G.cardBorder}33` : 'none' }}>
              <span style={{ color: G.muted }}>{l}</span>
              <span style={{ fontWeight: 700, color: G.accent }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Leaderboards & Tabs link */}
        <div>
          <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 8 }}>🏆 Quick Links</div>
          {[{ l: 'Live Scores', i: '🔴' }, { l: 'Match Schedule', i: '📅' }, { l: 'Player Profiles', i: '👤' }, { l: 'Training Plans', i: '📋' }].map((item, i) => (
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
