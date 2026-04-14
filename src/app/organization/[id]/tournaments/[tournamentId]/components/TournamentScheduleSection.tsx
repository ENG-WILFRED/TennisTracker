"use client";

import React, { useState, useEffect } from 'react';

interface TournamentScheduleSectionProps {
  tournament: any;
}

const MOCK_SCHEDULE = [
  { id: 'r1', round: 'Round of 16', date: '2025-07-10', time: '09:00', court: 'Court A', player1: 'Alex Chen', player2: 'Maria Lopez', status: 'completed', score: '21-18, 21-15' },
  { id: 'r2', round: 'Round of 16', date: '2025-07-10', time: '10:30', court: 'Court B', player1: 'Sam Kim', player2: 'Jordan Reed', status: 'completed', score: '21-12, 19-21, 21-16' },
  { id: 'r3', round: 'Quarter Final', date: '2025-07-11', time: '09:00', court: 'Court A', player1: 'Alex Chen', player2: 'Sam Kim', status: 'live', score: '21-18, 14-9' },
  { id: 'r4', round: 'Quarter Final', date: '2025-07-11', time: '11:00', court: 'Court B', player1: 'Priya Sharma', player2: 'Tom Nakamura', status: 'upcoming', score: '' },
  { id: 'r5', round: 'Semi Final', date: '2025-07-12', time: '09:00', court: 'Main Court', player1: 'TBD', player2: 'TBD', status: 'upcoming', score: '' },
  { id: 'r6', round: 'Final', date: '2025-07-13', time: '15:00', court: 'Main Court', player1: 'TBD', player2: 'TBD', status: 'upcoming', score: '' },
];

const pill = (color = '#7dc142', bg = 'rgba(125,193,66,0.12)') => ({
  display: 'inline-flex', alignItems: 'center', gap: '5px',
  padding: '4px 12px', borderRadius: '999px',
  fontSize: '12px', fontWeight: 700,
  color, background: bg, letterSpacing: '0.03em',
} as React.CSSProperties);

export function TournamentScheduleSection({ tournament }: TournamentScheduleSectionProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div>
      {['Round of 16', 'Quarter Final', 'Semi Final', 'Final'].map(round => {
        const matches = MOCK_SCHEDULE.filter(m => m.round === round);
        if (!matches.length) return null;
        return (
          <div key={round} style={{
            background: 'rgba(18, 38, 18, 0.72)',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(125,193,66,0.16)',
            borderRadius: '16px',
            padding: isMobile ? '16px' : '24px',
            marginBottom: '20px',
          }}>
            <h3 style={{
              fontFamily: 'Clash Display, sans-serif',
              fontSize: isMobile ? 18 : 16,
              fontWeight: 700,
              color: '#a8d84e',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>◷ {round}</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {matches.map(m => (
                <div
                  key={m.id}
                  style={{
                    background: m.status === 'live' ? 'rgba(60,10,10,0.4)' : 'rgba(12,24,12,0.6)',
                    border: m.status === 'live' ? '1px solid rgba(240,80,80,0.5)' : '1px solid rgba(125,193,66,0.12)',
                    borderRadius: '12px',
                    padding: isMobile ? '12px 16px' : '16px 20px',
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '130px 1fr auto',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    gap: isMobile ? '12px' : '16px',
                    transition: 'border-color .2s',
                  }}
                >
                  <div>
                    <div style={{ fontSize: isMobile ? 10 : 11, color: '#6a9058', marginBottom: 4 }}>{m.date} · {m.time}</div>
                    <div style={{ fontSize: isMobile ? 10 : 11, color: '#6a9058' }}>{m.court}</div>
                    {m.status === 'live' && <div style={{ ...pill('#e05050', 'rgba(224,80,80,0.12)'), marginTop: 6 }}>● LIVE</div>}
                    {m.status === 'completed' && <div style={{ ...pill('#7dc142', 'rgba(125,193,66,0.10)'), marginTop: 6 }}>DONE</div>}
                    {m.status === 'upcoming' && <div style={{ ...pill('#9dc880', 'rgba(157,200,128,0.10)'), marginTop: 6 }}>UPCOMING</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 500, color: '#dff0d0' }}>{m.player1}</div>
                    <div style={{ fontSize: isMobile ? 9 : 10, color: '#4a6a3a', letterSpacing: '.08em' }}>VS</div>
                    <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 500, color: '#dff0d0' }}>{m.player2}</div>
                  </div>
                  <div style={{ textAlign: isMobile ? 'left' : 'right', marginTop: isMobile ? '8px' : 0 }}>
                    {m.score ? (
                      <div style={{ fontFamily: 'Clash Display, sans-serif', fontSize: isMobile ? 12 : 13, color: '#a8d84e', fontWeight: 700 }}>
                        {m.score.split(',').map((s, i) => <div key={i}>{s.trim()}</div>)}
                      </div>
                    ) : (
                      <div style={{ color: '#4a6a3a', fontSize: isMobile ? 12 : 13 }}>—</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
