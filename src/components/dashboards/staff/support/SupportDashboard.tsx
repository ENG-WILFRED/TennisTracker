'use client';

import React from 'react';
import { StaffUser, DepartmentConfig, RoleConfig } from '@/types/staff-dashboard';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d7a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

interface SupportDashboardProps {
  staffUser: StaffUser;
  department: string;
  departmentConfig: DepartmentConfig;
  roleConfig: RoleConfig;
  activeSection: string;
  onNavigate: (section: string) => void;
  stats?: Record<string, any>;
  sectionData?: Record<string, any>;
}

const SupportDashboard: React.FC<SupportDashboardProps> = ({ activeSection, stats, sectionData }) => {
  const baseStats = {
    openTickets: 0,
    resolved: 0,
    avgTime: 'N/A',
    satisfaction: 'N/A',
    ...stats,
  };

  const tickets = (sectionData?.tickets ?? []).map((ticket: any) => ({
    id: ticket.id,
    subject: ticket.title || 'Support ticket',
    priority: ticket.status || 'Open',
    status: ticket.status || 'Open',
    createdAt: ticket.createdAt,
  }));

  const complaints = (sectionData?.complaints ?? []).map((ticket: any) => ({
    id: ticket.id,
    issue: ticket.title || ticket.description || 'Issue report',
    status: ticket.status || 'Open',
  }));

  const renderOverview = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-10" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
      {[
        { label: 'Open Tickets', value: baseStats.openTickets, icon: '🎫' },
        { label: 'Resolved', value: baseStats.resolved, icon: '✅' },
        { label: 'Avg Response', value: baseStats.avgTime, icon: '⏱️' },
        { label: 'Satisfaction', value: baseStats.satisfaction, icon: '📈' },
      ].map((item, index) => (
        <div key={index} style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 16 }}>
          <div style={{ color: G.muted, fontSize: 10 }}>{item.label}</div>
          <div style={{ color: G.accent, fontSize: 20, fontWeight: 800, marginTop: 8 }}>{item.icon} {item.value}</div>
        </div>
      ))}
    </div>
  );

  const renderTickets = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>🎫 Support Tickets</div>
      {tickets.length === 0 ? (
        <div style={{ color: G.muted, fontSize: 11 }}>No ticket data available.</div>
      ) : tickets.map((ticket: any, index: number) => (
        <div key={ticket.id} style={{ padding: '10px 0', borderBottom: index < tickets.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{ticket.subject}</div>
          <div style={{ fontSize: 10, color: G.muted }}>{ticket.id} • {ticket.priority} • {ticket.status}</div>
        </div>
      ))}
    </div>
  );

  const renderComplaints = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>⚠️ Complaints</div>
      {complaints.length === 0 ? (
        <div style={{ color: G.muted, fontSize: 11 }}>No complaints found.</div>
      ) : complaints.map((complaint: any, index: number) => (
        <div key={complaint.id} style={{ padding: '10px 0', borderBottom: index < complaints.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{complaint.issue}</div>
          <div style={{ fontSize: 10, color: G.muted }}>{complaint.id} • {complaint.status}</div>
        </div>
      ))}
    </div>
  );

  const renderChat = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>💬 Live Chat</div>
      <div style={{ color: G.muted, fontSize: 12 }}>
        {sectionData?.chat?.length ? 'Live support conversations are available in the support channel.' : 'No chat activity available yet.'}
      </div>
    </div>
  );

  const renderKnowledge = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📚 Knowledge Base</div>
      <div style={{ color: G.muted, fontSize: 12 }}>
        {sectionData?.knowledge?.length ? 'Knowledge base content has been loaded.' : 'Create articles to help the team resolve tickets faster.'}
      </div>
    </div>
  );

  const sectionRenderers: Record<string, () => React.ReactElement> = {
    overview: renderOverview,
    tickets: renderTickets,
    complaints: renderComplaints,
    chat: renderChat,
    knowledge: renderKnowledge,
  };

  const renderer = sectionRenderers[activeSection] || sectionRenderers.overview;

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{renderer()}</div>;
};

export default SupportDashboard;
