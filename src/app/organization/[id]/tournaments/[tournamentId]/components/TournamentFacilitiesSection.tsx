"use client";

import React from 'react';
import Link from 'next/link';

interface TournamentFacilitiesSectionProps {
  orgId: string;
  tournament?: any;
}

export function TournamentFacilitiesSection({
  orgId,
  tournament,
}: TournamentFacilitiesSectionProps) {
  return (
    <div>
      <h2 style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: 24,
        fontWeight: 700,
        color: '#a8d84e',
        marginBottom: 24,
      }}>
        Facilities
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
        gap: '18px',
        marginBottom: 20,
      }}>
        {[
          { icon: '🏸', title: 'Courts', desc: tournament?.courtInfo || 'No court info added yet.' },
          { icon: '🍽️', title: 'Eating Areas', desc: tournament?.eatingAreas || 'No eating area info added yet.' },
          { icon: '🛏️', title: 'Sleeping Areas', desc: tournament?.sleepingAreas || 'No sleeping area info added yet.' },
        ].map(f => (
          <div
            key={f.title}
            style={{
              background: 'rgba(18, 38, 18, 0.72)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(125,193,66,0.16)',
              borderRadius: '16px',
              padding: '24px',
            }}
          >
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
              {f.icon} {f.title}
            </div>
            <p style={{ color: '#7a9c6a', fontSize: 13, lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      <div style={{
        background: 'rgba(18, 38, 18, 0.72)',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(125,193,66,0.16)',
        borderRadius: '16px',
        padding: '24px',
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
          🏢 Manage Facilities
        </div>
        <p style={{ color: '#7a9c6a', fontSize: 14, marginBottom: 16 }}>
          Update court assignments, eating, and sleeping area details in tournament settings, or manage organization courts below.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link
            href={`/organization/${orgId}/courts`}
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg,#5aa820,#7dc142,#a8d84e)',
              color: '#0a160a',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'DM Sans, sans-serif',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Manage Courts →
          </Link>
        </div>
      </div>
    </div>
  );
}
