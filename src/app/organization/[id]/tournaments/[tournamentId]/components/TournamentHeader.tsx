"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface TournamentHeaderProps {
  tournament: any;
  approvedRegistrations: any[];
  orgId: string;
  pendingRegistrations?: any[];
}

export function TournamentHeader({
  tournament,
  approvedRegistrations,
  orgId,
  pendingRegistrations = [],
}: TournamentHeaderProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const statusColor = tournament?.status === 'open' ? '#7dc142' : '#d4a574';
  const statusBg = tournament?.status === 'open' ? 'rgba(125,193,66,0.12)' : 'rgba(212,165,116,0.12)';

  return (
    <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
      {/* Back link */}
      <Link href={`/dashboard/org/${orgId}`} style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        color: '#7dc142',
        textDecoration: 'none',
        fontSize: '13px',
        fontWeight: 500,
        marginBottom: '18px',
        letterSpacing: '0.02em',
        opacity: 0.8,
        transition: 'opacity .2s',
      }}>
        ← Back to Organization
      </Link>

      {/* Header flex */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '16px' : '16px',
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Clash Display', sans-serif",
            fontSize: isMobile ? '28px' : '38px',
            fontWeight: 800,
            background: 'linear-gradient(120deg,#7dc142 0%,#c8f07a 60%,#e8f5e0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: '1.1',
            margin: '0 0 10px',
          }}>
            {tournament.name}
          </h1>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            fontSize: isMobile ? '12px' : '13px',
            color: '#9dc880',
            fontFamily: "'Epilogue', sans-serif"
          }}>
            <span>📅 {new Date(tournament.startDate).toLocaleDateString()} — {new Date(tournament.endDate).toLocaleDateString()}</span>
            <span>📍 {tournament.location || 'TBD'}</span>
            <span>🏆 ${tournament.prizePool?.toLocaleString()} Prize Pool</span>
            <span>💳 ${tournament.entryFee} Entry</span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              color: statusColor,
              background: statusBg,
              letterSpacing: '0.03em',
            }}>
              {tournament.status?.toUpperCase()}
            </span>
          </div>
        </div>

        {pendingRegistrations.length > 0 && (
          <div style={{
            background: 'rgba(240,192,64,0.1)',
            border: '1px solid rgba(240,192,64,0.3)',
            borderRadius: '10px',
            padding: '12px 18px',
            fontSize: '13px',
            color: '#f0c040',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            ⚡ {pendingRegistrations.length} registration{pendingRegistrations.length > 1 ? 's' : ''} awaiting review
          </div>
        )}
      </div>
    </div>
  );
}
