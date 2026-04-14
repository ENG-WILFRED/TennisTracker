'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { BookingView } from '@/components/booking/BookingViewNew';
import Link from 'next/link';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040', red: '#dc2626',
};

export default function BookingRoleIdPage() {
  const params = useParams();
  const roleFromURL = params?.role as string;
  const userIdFromURL = params?.id as string;

  // Get organization ID from localStorage or API
  const [organizationId, setOrganizationId] = React.useState<string>('');
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  React.useEffect(() => {
    const getOrgId = async () => {
      try {
        const res = await fetch(`/api/player/organization?playerId=${userIdFromURL}`);
        const data = await res.json();
        setOrganizationId(data.organizationId);
      } catch (error) {
        console.error('Failed to get organization:', error);
      }
    };
    
    if (userIdFromURL) {
      getOrgId();
    }
  }, [userIdFromURL]);

  // Render booking with sidebar layout
  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif", background: G.dark, color: G.text, overflow: 'hidden' }}>
      {/* LEFT SIDEBAR - Hidden on mobile */}
      {!isMobile && (
        <aside style={{ width: 188, background: G.sidebar, borderRight: `1px solid ${G.cardBorder}`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
          <div style={{ padding: '16px 14px 12px', borderBottom: `1px solid ${G.cardBorder}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🎾</span>
            <div style={{ color: G.lime, fontWeight: 900, fontSize: 15 }}>Vico Tennis</div>
          </div>
          <nav style={{ flex: 1, paddingTop: 8 }}>
            <Link href={`/dashboard/${roleFromURL}/${userIdFromURL}`}>
              <button style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
                background: 'transparent', color: G.muted, border: 'none', cursor: 'pointer',
                fontSize: 12.5, textAlign: 'left', borderLeft: '3px solid transparent',
                transition: 'all 0.2s',
              }}>
                <span>🏠</span>Dashboard
              </button>
            </Link>
            <button style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
              background: G.mid, color: '#fff', border: 'none', cursor: 'pointer',
              fontSize: 12.5, textAlign: 'left', borderLeft: `3px solid ${G.lime}`,
            }}>
              <span>📅</span>Court Booking
            </button>
          </nav>
          <div style={{ margin: '0 10px 12px', background: G.mid, borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, color: G.accent, fontWeight: 700, letterSpacing: 1 }}>BOOKING INFO</div>
            <div id="sidebarName" style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>Court Reservations</div>
            <div id="sidebarEmail" style={{ fontSize: 10, color: G.muted, marginTop: 2 }}>Manage your bookings</div>
          </div>
        </aside>
      )}

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, overflowY: 'auto', padding: isMobile ? 16 : 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Mobile Header with Back Button */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: 10 }}>
            <Link href={`/dashboard/${roleFromURL}/${userIdFromURL}`}>
              <button style={{
                background: 'transparent', border: 'none', color: G.lime, cursor: 'pointer',
                fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5,
              }}>
                ← Back to Dashboard
              </button>
            </Link>
          </div>
        )}

        {/* Booking View Component - Reusable */}
        <BookingView isEmbedded={false} canBook={true} organizationId={organizationId} />
      </main>
    </div>
  );
}
