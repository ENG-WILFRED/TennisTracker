"use client";

import React, { useState, useEffect } from 'react';

interface TournamentAnalyticsSectionProps {
  tournament: any;
  leaderboard: any[];
  approvedRegistrations: any[];
}

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Alex Chen', wins: 5, losses: 0, points: 1500, trend: '+' },
  { rank: 2, name: 'Priya Sharma', wins: 4, losses: 1, points: 1380, trend: '+' },
  { rank: 3, name: 'Sam Kim', wins: 4, losses: 1, points: 1360, trend: '=' },
  { rank: 4, name: 'Tom Nakamura', wins: 3, losses: 2, points: 1200, trend: '-' },
  { rank: 5, name: 'Jordan Reed', wins: 2, losses: 3, points: 1050, trend: '-' },
  { rank: 6, name: 'Maria Lopez', wins: 1, losses: 4, points: 900, trend: '=' },
];

export function TournamentAnalyticsSection({
  tournament,
  leaderboard,
  approvedRegistrations,
}: TournamentAnalyticsSectionProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const data = leaderboard.length ? leaderboard : MOCK_LEADERBOARD;

  return (
    <div>
      {/* Leaderboard */}
      <div style={{
        background: 'rgba(18, 38, 18, 0.72)',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(125,193,66,0.16)',
        borderRadius: '16px',
        padding: isMobile ? '16px' : '24px',
        marginBottom: '20px',
        overflowX: isMobile ? 'auto' : 'visible',
      }}>
        <h3 style={{
          fontFamily: "'Clash Display', sans-serif",
          fontSize: isMobile ? 14 : 16,
          fontWeight: 700,
          color: '#a8d84e',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>🏅 Player Rankings</h3>

        {/* Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '40px 1fr 40px 40px 60px 40px' : '40px 1fr 60px 60px 80px 50px',
          gap: 12,
          padding: '6px 18px',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '.07em',
          color: '#4a6a3a',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}>
          <span style={{ textAlign: 'center' }}>#</span>
          <span>Player</span>
          <span style={{ textAlign: 'center' }}>W</span>
          <span style={{ textAlign: 'center' }}>L</span>
          <span style={{ textAlign: 'center' }}>Points</span>
          <span style={{ textAlign: 'center' }}>Trend</span>
        </div>

        {data.map((p: any) => {
          const rankColor = p.rank === 1 ? '#ffd700' : p.rank === 2 ? '#c0c0c0' : p.rank === 3 ? '#cd7f32' : '#4a6a3a';
          const trendIcon = p.trend === '+' ? '▲' : p.trend === '-' ? '▼' : '—';
          const trendColor = p.trend === '+' ? '#7dc142' : p.trend === '-' ? '#e05050' : '#6a9058';

          return (
            <div
              key={p.rank}
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '40px 1fr 40px 40px 60px 40px' : '40px 1fr 60px 60px 80px 50px',
                alignItems: 'center',
                gap: 12,
                padding: '13px 18px',
                borderRadius: '10px',
                background: p.rank === 1 ? 'rgba(50,40,0,0.5)' : 'rgba(12,24,12,0.6)',
                border: p.rank === 1 ? '1px solid rgba(255,215,0,0.35)' : p.rank === 2 ? '1px solid rgba(192,192,192,0.25)' : p.rank === 3 ? '1px solid rgba(205,127,50,0.25)' : '1px solid rgba(125,193,66,0.10)',
                marginBottom: 6,
                fontSize: isMobile ? 12 : 14,
                transition: 'border-color .2s',
              }}
            >
              <span style={{
                fontFamily: "'Clash Display', sans-serif",
                fontSize: isMobile ? 14 : 16,
                fontWeight: 800,
                color: rankColor,
                textAlign: 'center',
              }}>
                {p.rank}
              </span>
              <span style={{ fontWeight: 500, color: '#dff0d0' }}>{p.name}</span>
              <span style={{ textAlign: 'center', color: '#9dc880' }}>{p.wins}</span>
              <span style={{ textAlign: 'center', color: '#9dc880' }}>{p.losses}</span>
              <span style={{
                textAlign: 'center',
                fontFamily: "'Clash Display', sans-serif",
                fontWeight: 700,
                color: '#a8d84e',
              }}>
                {p.points}
              </span>
              <span style={{ textAlign: 'center', color: trendColor }}>{trendIcon}</span>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit,minmax(300px,1fr))',
        gap: isMobile ? 16 : 18,
      }}>
        {/* Win Distribution */}
        <div style={{
          background: 'rgba(18, 38, 18, 0.72)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(125,193,66,0.16)',
          borderRadius: '16px',
          padding: isMobile ? '16px' : '24px',
        }}>
          <h4 style={{
            fontFamily: "'Clash Display', sans-serif",
            fontSize: isMobile ? 14 : 16,
            fontWeight: 700,
            color: '#a8d84e',
            marginBottom: 12,
          }}>📊 Win Distribution</h4>
          <div>
            {data.map(p => (
              <div key={p.rank} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, fontSize: isMobile ? 12 : 13 }}>
                <span style={{ width: isMobile ? 80 : 120, color: '#9dc880', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name.split(' ')[0]}
                </span>
                <div style={{ flex: 1, height: 8, background: 'rgba(125,193,66,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    borderRadius: '99px',
                    background: 'linear-gradient(90deg,#4a9a1a,#a8d84e)',
                    width: `${(p.wins / 5) * 100}%`,
                  }} />
                </div>
                <span style={{ width: 36, textAlign: 'right', color: '#a8d84e', fontWeight: 600, fontSize: 12 }}>
                  {p.wins}W
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Registration Timeline */}
        <div style={{
          background: 'rgba(18, 38, 18, 0.72)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(125,193,66,0.16)',
          borderRadius: '16px',
          padding: isMobile ? '16px' : '24px',
        }}>
          <h4 style={{
            fontFamily: "'Clash Display', sans-serif",
            fontSize: isMobile ? 14 : 16,
            fontWeight: 700,
            color: '#a8d84e',
            marginBottom: 12,
          }}>📈 Registration Timeline</h4>
          <div>
            {['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'].map((w, i) => {
              const vals = [12, 28, 45, 60, approvedRegistrations.length || 68];
              return (
                <div key={w} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, fontSize: isMobile ? 12 : 13 }}>
                  <span style={{ width: isMobile ? 80 : 120, color: '#9dc880' }}>{w}</span>
                  <div style={{ flex: 1, height: 8, background: 'rgba(125,193,66,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      borderRadius: '99px',
                      background: 'linear-gradient(90deg,#4a9a1a,#a8d84e)',
                      width: `${(vals[i] / (tournament.registrationCap || 80)) * 100}%`,
                    }} />
                  </div>
                  <span style={{ width: 36, textAlign: 'right', color: '#a8d84e', fontWeight: 600, fontSize: 12 }}>
                    {vals[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Financial Summary */}
        <div style={{
          background: 'rgba(18, 38, 18, 0.72)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(125,193,66,0.16)',
          borderRadius: '16px',
          padding: isMobile ? '16px' : '24px',
        }}>
          <h4 style={{
            fontFamily: "'Clash Display', sans-serif",
            fontSize: isMobile ? 14 : 16,
            fontWeight: 700,
            color: '#a8d84e',
            marginBottom: 12,
          }}>💰 Financial Summary</h4>
          <div>
            {[
              { label: 'Entry Revenue', value: `$${(approvedRegistrations.length * (tournament.entryFee || 0)).toLocaleString()}` },
              { label: 'Prize Pool', value: `$${tournament.prizePool?.toLocaleString()}` },
              { label: 'Net (est.)', value: `$${Math.max(0, (approvedRegistrations.length * (tournament.entryFee || 0)) - (tournament.prizePool || 0)).toLocaleString()}` },
              { label: 'Players', value: `${approvedRegistrations.length}` },
              { label: 'Avg Revenue/Player', value: `$${approvedRegistrations.length ? ((approvedRegistrations.length * (tournament.entryFee || 0)) / approvedRegistrations.length).toFixed(0) : 0}` },
            ].map(row => (
              <div
                key={row.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid rgba(125,193,66,0.07)',
                  fontSize: isMobile ? 12 : 13,
                }}
              >
                <span style={{ color: '#6a9058' }}>{row.label}</span>
                <span style={{
                  fontFamily: "'Clash Display', sans-serif",
                  fontWeight: 700,
                  color: '#a8d84e',
                }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
