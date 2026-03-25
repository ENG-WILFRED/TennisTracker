"use client";

import React from 'react';

interface TournamentOverviewSectionProps {
  tournament: any;
  leaderboard: any[];
  pendingRegistrations: any[];
  approvedRegistrations: any[];
  announcements: any[];
  setActiveTab: (tab: any) => void;
}

const MOCK_SCHEDULE = [
  { id: 'r1', round: 'Round of 16', date: '2025-07-10', time: '09:00', court: 'Court A', player1: 'Alex Chen', player2: 'Maria Lopez', status: 'completed', score: '21-18, 21-15' },
  { id: 'r3', round: 'Quarter Final', date: '2025-07-11', time: '09:00', court: 'Court A', player1: 'Alex Chen', player2: 'Sam Kim', status: 'live', score: '21-18, 14-9' },
];

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Alex Chen', wins: 5, losses: 0, points: 1500, trend: '+' },
  { rank: 2, name: 'Priya Sharma', wins: 4, losses: 1, points: 1380, trend: '+' },
  { rank: 3, name: 'Sam Kim', wins: 4, losses: 1, points: 1360, trend: '=' },
  { rank: 4, name: 'Tom Nakamura', wins: 3, losses: 2, points: 1200, trend: '-' },
];

const MOCK_ANNOUNCEMENTS = [
  { id: 'a1', title: 'Schedule Update', body: 'Quarter-final matches on Court A have been moved 30 minutes earlier.', time: '2h ago', type: 'warning' },
  { id: 'a2', title: 'Welcome Players!', body: 'Registration check-in opens at 8 AM on July 10th.', time: '1d ago', type: 'info' },
];

const fillRate = (tournament: any, approvedRegistrations: any[]) =>
  tournament?.registrationCap
    ? Math.round((approvedRegistrations.length / tournament.registrationCap) * 100)
    : 0;

export function TournamentOverviewSection({
  tournament,
  leaderboard,
  pendingRegistrations,
  approvedRegistrations,
  announcements,
  setActiveTab,
}: TournamentOverviewSectionProps) {
  const fill = fillRate(tournament, approvedRegistrations);
  const data = leaderboard.length ? leaderboard : MOCK_LEADERBOARD;

  return (
    <div>
      {/* Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
        gap: '14px',
        marginBottom: '24px',
      }}>
        {[
          { label: 'Approved Players', value: approvedRegistrations.length, sub: `of ${tournament.registrationCap} spots` },
          { label: 'Pending', value: pendingRegistrations.length, sub: 'awaiting review', color: '#f0c040' },
          { label: 'Prize Pool', value: `$${tournament.prizePool?.toLocaleString()}`, sub: 'total purse' },
          { label: 'Fill Rate', value: `${fill}%`, sub: `${tournament.registrationCap - approvedRegistrations.length} spots left` },
          { label: 'Entry Fee', value: `$${tournament.entryFee}`, sub: 'per player' },
          { label: 'Revenue', value: `$${(approvedRegistrations.length * (tournament.entryFee || 0)).toLocaleString()}`, sub: 'collected' },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              background: 'rgba(18, 38, 18, 0.72)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(125,193,66,0.16)',
              borderRadius: '14px',
              padding: '20px 22px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, #7dc142, transparent)',
              opacity: 0.5,
            }} />
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', color: '#6a9058', textTransform: 'uppercase', marginBottom: 6 }}>
              {stat.label}
            </div>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 30,
              fontWeight: 800,
              color: stat.color || '#c8f07a',
              lineHeight: 1,
            }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 12, color: '#6a9058', marginTop: 4 }}>{stat.sub}</div>
            {i === 0 && (
              <div style={{
                height: '6px',
                background: 'rgba(125,193,66,0.1)',
                borderRadius: '99px',
                overflow: 'hidden',
                marginTop: 8,
              }}>
                <div
                  style={{
                    height: '100%',
                    borderRadius: '99px',
                    background: 'linear-gradient(90deg,#4a9a1a,#7dc142,#c8f07a)',
                    width: `${fill}%`,
                    transition: 'width .8s ease',
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
        gap: '18px',
      }}>
        {/* Live matches */}
        <div style={{
          background: 'rgba(18, 38, 18, 0.72)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(125,193,66,0.16)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '20px',
        }}>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 16,
            fontWeight: 700,
            color: '#a8d84e',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            🔴 Live Matches
          </div>
          {MOCK_SCHEDULE.filter(m => m.status === 'live').length === 0 ? (
            <p style={{ color: '#4a6a3a', fontSize: 13 }}>No live matches right now.</p>
          ) : (
            MOCK_SCHEDULE.filter(m => m.status === 'live').map(m => (
              <div
                key={m.id}
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'rgba(60,10,10,0.4)',
                  border: '1px solid rgba(240,80,80,0.35)',
                  marginBottom: 8,
                }}
              >
                <div style={{ fontSize: 11, color: '#c06060', fontWeight: 700, marginBottom: 4, letterSpacing: '.06em' }}>
                  ● LIVE · {m.court}
                </div>
                <div style={{ fontWeight: 600, color: '#dff0d0' }}>
                  {m.player1} <span style={{ color: '#4a6a3a' }}>vs</span> {m.player2}
                </div>
                <div style={{ fontSize: 12, color: '#a8d84e', marginTop: 4 }}>{m.score}</div>
              </div>
            ))
          )}
        </div>

        {/* Upcoming */}
        <div style={{
          background: 'rgba(18, 38, 18, 0.72)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(125,193,66,0.16)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '20px',
        }}>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 16,
            fontWeight: 700,
            color: '#a8d84e',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            ⏳ Upcoming Matches
          </div>
          {MOCK_SCHEDULE.filter(m => m.status === 'upcoming')
            .slice(0, 3)
            .map(m => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid rgba(125,193,66,0.08)',
                  fontSize: 13,
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, color: '#dff0d0' }}>
                    {m.player1} vs {m.player2}
                  </div>
                  <div style={{ color: '#4a6a3a', fontSize: 11, marginTop: 2 }}>
                    {m.round} · {m.court}
                  </div>
                </div>
                <div style={{ color: '#6a9058', fontSize: 12, textAlign: 'right' }}>
                  <div>{m.date}</div>
                  <div>{m.time}</div>
                </div>
              </div>
            ))}
        </div>

        {/* Announcements preview */}
        <div style={{
          background: 'rgba(18, 38, 18, 0.72)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(125,193,66,0.16)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '20px',
        }}>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 16,
            fontWeight: 700,
            color: '#a8d84e',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            📢 Recent Announcements
          </div>
          {(announcements.length ? announcements : MOCK_ANNOUNCEMENTS).slice(0, 2).map(a => (
            <div key={a.id} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600, color: '#dff0d0', fontSize: 14, marginBottom: 4 }}>
                {a.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#7a9c6a',
                  WebkitLineClamp: 2,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {a.body}
              </div>
              <div style={{ fontSize: 11, color: '#4a6a3a', marginTop: 6 }}>{a.time}</div>
            </div>
          ))}
          <button
            onClick={() => setActiveTab('announcements')}
            style={{
              marginTop: 8,
              width: '100%',
              padding: '10px 24px',
              background: 'linear-gradient(135deg,#5aa820,#7dc142,#a8d84e)',
              color: '#0a160a',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            Manage Announcements
          </button>
        </div>

        {/* Top players */}
        <div style={{
          background: 'rgba(18, 38, 18, 0.72)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(125,193,66,0.16)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '20px',
        }}>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 16,
            fontWeight: 700,
            color: '#a8d84e',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            🏅 Top Players
          </div>
          {data.slice(0, 4).map(p => (
            <div
              key={p.rank}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 0',
                borderBottom: '1px solid rgba(125,193,66,0.08)',
              }}
            >
              <span
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  color: p.rank === 1 ? '#ffd700' : p.rank === 2 ? '#c0c0c0' : p.rank === 3 ? '#cd7f32' : '#4a6a3a',
                  width: 24,
                  textAlign: 'center',
                }}
              >
                {p.rank}
              </span>
              <span style={{ flex: 1, color: '#dff0d0', fontSize: 14 }}>{p.name}</span>
              <span style={{ fontFamily: 'Syne, sans-serif', color: '#a8d84e', fontWeight: 700 }}>
                {p.points}
              </span>
            </div>
          ))}
          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              marginTop: 12,
              width: '100%',
              padding: '10px 24px',
              background: 'linear-gradient(135deg,#5aa820,#7dc142,#a8d84e)',
              color: '#0a160a',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            Full Leaderboard →
          </button>
        </div>
      </div>
    </div>
  );
}
