'use client';

import React from 'react';
import { StaffUser, DepartmentConfig, RoleConfig } from '@/types/staff-dashboard';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d7a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

interface OperationsDashboardProps {
  staffUser: StaffUser;
  department: string;
  departmentConfig: DepartmentConfig;
  roleConfig: RoleConfig;
  activeSection: string;
  onNavigate: (section: string) => void;
  stats?: Record<string, any>;
  sectionData?: Record<string, any>;
}

const OperationsDashboard: React.FC<OperationsDashboardProps> = ({ activeSection, stats, sectionData }) => {
  const baseStats = {
    staffScheduled: 0,
    facilitiesGood: 0,
    incidents: 0,
    reports: 0,
    ...stats,
  };

  const courts = (sectionData?.scheduling ?? sectionData?.facilities ?? []).map((court: any) => ({
    name: court.name || `Court ${court.id}`,
    status: court.status || 'Unknown',
  }));

  const staff = (sectionData?.staff ?? []).map((record: any) => ({
    name: `${record.user?.firstName ?? ''} ${record.user?.lastName ?? ''}`.trim() || 'Staff Member',
    role: record.role || 'Team',
    status: record.user?.email ? 'Active' : 'Unknown',
  }));

  const incidents = (sectionData?.incidents ?? []).map((item: any) => ({
    id: item.id,
    type: item.title || 'Issue',
    status: item.status || 'Open',
    description: item.description,
  }));

  const renderOverview = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-10" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
      {[
        { label: 'Staff Scheduled', value: baseStats.staffScheduled, icon: '🧑‍🤝‍🧑' },
        { label: 'Facilities Available', value: baseStats.facilitiesGood, icon: '🏢' },
        { label: 'Incidents', value: baseStats.incidents, icon: '⚠️' },
        { label: 'Reports', value: baseStats.reports, icon: '📊' },
      ].map((item, index) => (
        <div key={index} style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 16 }}>
          <div style={{ color: G.muted, fontSize: 10 }}>{item.label}</div>
          <div style={{ color: G.accent, fontSize: 20, fontWeight: 800, marginTop: 8 }}>{item.icon} {item.value}</div>
        </div>
      ))}
    </div>
  );

  const renderScheduling = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>🗓️ Schedule</div>
      {courts.length === 0 ? (
        <div style={{ color: G.muted, fontSize: 11 }}>No schedule entries found.</div>
      ) : courts.map((court: { name: string; status: string }, index: number) => (
        <div key={`${court.name}-${index}`} style={{ padding: '10px 0', borderBottom: index < courts.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{court.name}</div>
          <div style={{ fontSize: 10, color: G.muted }}>{court.status}</div>
        </div>
      ))}
    </div>
  );

  const renderFacilities = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>🏟️ Facilities</div>
      {courts.length === 0 ? (
        <div style={{ color: G.muted, fontSize: 11 }}>No facilities data available.</div>
      ) : courts.map((court: { name: string; status: string }, index: number) => (
        <div key={`${court.name}-${index}`} style={{ padding: '10px 0', borderBottom: index < courts.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{court.name}</div>
          <div style={{ fontSize: 10, color: G.muted }}>{court.status}</div>
        </div>
      ))}
    </div>
  );

  const renderStaff = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>👥 Staff Directory</div>
      {staff.length === 0 ? (
        <div style={{ color: G.muted, fontSize: 11 }}>No staff records available.</div>
      ) : staff.map((member: { name: string; role: string; status: string }, index: number) => (
        <div key={`${member.name}-${index}`} style={{ padding: '10px 0', borderBottom: index < staff.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{member.name}</div>
          <div style={{ fontSize: 10, color: G.muted }}>{member.role} • {member.status}</div>
        </div>
      ))}
    </div>
  );

  const renderIncidents = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>⚠️ Incidents</div>
      {incidents.length === 0 ? (
        <div style={{ color: G.muted, fontSize: 11 }}>No incidents reported.</div>
      ) : incidents.map((incident: { id: string; type: string; status: string; description?: string }, index: number) => (
        <div key={incident.id} style={{ padding: '10px 0', borderBottom: index < incidents.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{incident.type}</div>
          <div style={{ fontSize: 10, color: G.muted }}>{incident.id} • {incident.status}</div>
          {incident.description && <div style={{ fontSize: 10, color: G.muted, marginTop: 4 }}>{incident.description}</div>}
        </div>
      ))}
    </div>
  );

  const renderReports = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📊 Reports</div>
      <div style={{ color: G.muted, fontSize: 12 }}>Operations metrics, court utilization, and incident summaries.</div>
    </div>
  );

  const sectionRenderers: Record<string, () => React.ReactElement> = {
    overview: renderOverview,
    scheduling: renderScheduling,
    facilities: renderFacilities,
    staff: renderStaff,
    incidents: renderIncidents,
    reports: renderReports,
  };

  const renderer = sectionRenderers[activeSection] || sectionRenderers.overview;

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{renderer()}</div>;
};

export default OperationsDashboard;
