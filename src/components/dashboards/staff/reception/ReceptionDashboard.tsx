'use client';

import React from 'react';
import { StaffUser, DepartmentConfig, RoleConfig } from '@/types/staff-dashboard';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d7a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

interface ReceptionDashboardProps {
  staffUser: StaffUser;
  department: string;
  departmentConfig: DepartmentConfig;
  roleConfig: RoleConfig;
  activeSection: string;
  onNavigate: (section: string) => void;
  stats?: Record<string, any>;
  sectionData?: Record<string, any>;
}

const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({ activeSection, stats, sectionData }) => {
  const baseStats = {
    checkinsToday: 0,
    activeBookings: 0,
    visitorsToday: 0,
    newMembers: 0,
    pendingTickets: 0,
    ...stats,
  };

  const bookings = (sectionData?.bookings ?? []).map((booking: any) => ({
    court: booking.courtId ?? booking.court ?? 'N/A',
    time: booking.startTime && booking.endTime ? `${new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'N/A',
    member: booking.memberName || booking.userId || booking.title || 'Guest',
    status: booking.status || 'Scheduled',
  }));

  const visitors = (sectionData?.visitors ?? []).map((visitor: any) => ({
    name: visitor.name || visitor.userId || 'Visitor',
    purpose: visitor.location || visitor.scanType || 'Check-in',
    status: visitor.status || 'Checked in',
    scannedAt: visitor.scannedAt,
  }));

  const members = (sectionData?.members ?? []).map((member: any) => ({
    name: member.userId || String(member.id || 'Member'),
    subscription: member.status || 'Active',
    status: member.joinedAt ? 'Joined' : 'Pending',
  }));

  const supportTickets = (sectionData?.support ?? []).map((ticket: any) => ({
    subject: ticket.title || ticket.description || 'Support ticket',
    status: ticket.status || 'Open',
  }));

  const renderOverview = () => (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-10" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        {[
          { label: 'Check-ins Today', value: baseStats.checkinsToday, icon: '✅' },
          { label: 'Active Bookings', value: baseStats.activeBookings, icon: '📅' },
          { label: 'Visitors Today', value: baseStats.visitorsToday, icon: '👋' },
          { label: 'New Members', value: baseStats.newMembers, icon: '💳' },
          { label: 'Support Tickets', value: baseStats.pendingTickets, icon: '🎫' },
        ].map((item, index) => (
          <div key={index} style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 16 }}>
            <div style={{ color: G.muted, fontSize: 10 }}>{item.label}</div>
            <div style={{ color: G.accent, fontSize: 20, fontWeight: 800, marginTop: 8 }}>{item.icon} {item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-12" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📅 Today’s Bookings</div>
          {bookings.length === 0 ? (
            <div style={{ color: G.muted, fontSize: 11 }}>No bookings available.</div>
          ) : bookings.map((booking: { court: string; time: string; member: string; status: string }, index: number) => (
            <div key={`${booking.member}-${index}`} style={{ padding: '10px 0', borderBottom: index < bookings.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>Court {booking.court}</div>
              <div style={{ fontSize: 10, color: G.muted }}>{booking.time} · {booking.member}</div>
              <div style={{ fontSize: 10, color: G.yellow, marginTop: 4 }}>{booking.status}</div>
            </div>
          ))}
        </div>

        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>👋 Visitor Queue</div>
          {visitors.length === 0 ? (
            <div style={{ color: G.muted, fontSize: 11 }}>No visitor activity available.</div>
          ) : visitors.map((visitor: { name: string; purpose: string; status: string }, index: number) => (
            <div key={`${visitor.name}-${index}`} style={{ padding: '10px 0', borderBottom: index < visitors.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{visitor.name}</div>
              <div style={{ fontSize: 10, color: G.muted }}>{visitor.purpose}</div>
              <div style={{ fontSize: 10, color: visitor.status === 'Checked in' ? G.lime : G.yellow }}>{visitor.status}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderCheckins = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>✅ Check-ins</div>
      <div style={{ color: G.muted, fontSize: 12 }}>Track member arrivals and desk activity.</div>
    </div>
  );

  const renderBookings = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📅 Bookings</div>
      {bookings.length === 0 ? (
        <div style={{ color: G.muted, fontSize: 11 }}>No booking entries available.</div>
      ) : bookings.map((booking: { court: string; time: string; member: string; status: string }, index: number) => (
        <div key={`${booking.member}-${index}`} style={{ padding: '10px 0', borderBottom: index < bookings.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{booking.member}</div>
          <div style={{ fontSize: 10, color: G.muted }}>Court {booking.court} · {booking.time}</div>
          <div style={{ fontSize: 10, color: G.yellow, marginTop: 4 }}>{booking.status}</div>
        </div>
      ))}
    </div>
  );

  const renderVisitors = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>👥 Visitors</div>
      {visitors.length === 0 ? (
        <div style={{ color: G.muted, fontSize: 11 }}>No visitor activity available.</div>
      ) : visitors.map((visitor: { name: string; purpose: string; status: string }, index: number) => (
        <div key={`${visitor.name}-${index}`} style={{ padding: '10px 0', borderBottom: index < visitors.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{visitor.name}</div>
          <div style={{ fontSize: 10, color: G.muted }}>{visitor.purpose}</div>
          <div style={{ fontSize: 10, color: visitor.status === 'Checked in' ? G.lime : G.yellow }}>{visitor.status}</div>
        </div>
      ))}
    </div>
  );

  const renderMembers = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>💳 Members</div>
      {members.length === 0 ? (
        <div style={{ color: G.muted, fontSize: 11 }}>No membership activity available.</div>
      ) : members.map((member: { name: string; subscription: string; status: string }, index: number) => (
        <div key={`${member.name}-${index}`} style={{ padding: '10px 0', borderBottom: index < members.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{member.name}</div>
          <div style={{ fontSize: 10, color: G.muted }}>{member.subscription}</div>
          <div style={{ fontSize: 10, color: member.status === 'Active' ? G.lime : G.yellow }}>{member.status}</div>
        </div>
      ))}
    </div>
  );

  const renderSupport = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>🎫 Support</div>
      {supportTickets.length === 0 ? (
        <div style={{ color: G.muted, fontSize: 11 }}>No support tickets available.</div>
      ) : supportTickets.map((ticket: { subject: string; status: string }, index: number) => (
        <div key={`${ticket.subject}-${index}`} style={{ padding: '10px 0', borderBottom: index < supportTickets.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{ticket.subject}</div>
          <div style={{ fontSize: 10, color: G.muted }}>{ticket.status}</div>
        </div>
      ))}
    </div>
  );

  const renderSchedules = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>🗓️ Schedules</div>
      <div style={{ color: G.muted, fontSize: 12 }}>Scheduled front desk shifts and roster planning.</div>
    </div>
  );

  const sectionRenderers: Record<string, () => React.ReactElement> = {
    overview: renderOverview,
    checkins: renderCheckins,
    bookings: renderBookings,
    visitors: renderVisitors,
    members: renderMembers,
    support: renderSupport,
    schedules: renderSchedules,
  };

  const renderer = sectionRenderers[activeSection] || sectionRenderers.overview;

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{renderer()}</div>;
};

export default ReceptionDashboard;
