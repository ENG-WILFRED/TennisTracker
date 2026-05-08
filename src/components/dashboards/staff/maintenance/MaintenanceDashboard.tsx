'use client';

import React from 'react';
import { StaffUser, DepartmentConfig, RoleConfig } from '@/types/staff-dashboard';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d7a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

interface MaintenanceDashboardProps {
  staffUser: StaffUser;
  department: string;
  departmentConfig: DepartmentConfig;
  roleConfig: RoleConfig;
  activeSection: string;
  onNavigate: (section: string) => void;
  stats?: Record<string, any>;
  sectionData?: Record<string, any>;
}

const MaintenanceDashboard: React.FC<MaintenanceDashboardProps> = ({ activeSection, stats, sectionData }) => {
  const baseStats = {
    openTickets: 8,
    completed: 12,
    scheduled: 5,
    equipment: 34,
    ...stats,
  };

  const repairs: Array<{ id: string; item: string; status: string }> =
    sectionData?.repairs?.map((repair: any) => ({
      id: repair.id || 'unknown',
      item: repair.title || 'Repair task',
      status: repair.status === 'resolved' ? 'Completed' : repair.status === 'in_progress' ? 'In progress' : 'Open',
    })) ?? [
      { id: 'MT-1001', item: 'Court net', status: 'Assigned' },
      { id: 'MT-1002', item: 'Floodlight', status: 'Pending' },
      { id: 'MT-1003', item: 'Locker door', status: 'Completed' },
    ];

  const equipment: Array<{ name: string; status: string }> =
    sectionData?.equipment?.map((item: any) => ({
      name: item.name || 'Equipment item',
      status: item.count === 0 ? 'Out of stock' : item.count < 5 ? 'Low stock' : 'Available',
    })) ?? [
      { name: 'Ball machine', status: 'Good' },
      { name: 'Scoreboard', status: 'Maintenance due' },
      { name: 'Court cleaner', status: 'Good' },
    ];

  const renderOverview = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-10" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
      {[
        { label: 'Open Tickets', value: baseStats.openTickets, icon: '🎫' },
        { label: 'Completed', value: baseStats.completed, icon: '✅' },
        { label: 'Scheduled', value: baseStats.scheduled, icon: '📅' },
        { label: 'Equipment', value: baseStats.equipment, icon: '⚙️' },
      ].map((item, index) => (
        <div key={index} style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 16 }}>
          <div style={{ color: G.muted, fontSize: 10 }}>{item.label}</div>
          <div style={{ color: G.accent, fontSize: 20, fontWeight: 800, marginTop: 8 }}>{item.icon} {item.value}</div>
        </div>
      ))}
    </div>
  );

  const renderRepairs = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>🛠️ Repairs</div>
      {repairs.map((repair, index) => (
        <div key={repair.id} style={{ padding: '10px 0', borderBottom: index < repairs.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{repair.item}</div>
          <div style={{ fontSize: 10, color: G.muted }}>{repair.id} • {repair.status}</div>
        </div>
      ))}
    </div>
  );

  const renderEquipment = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📦 Equipment</div>
      {equipment.map((item, index) => (
        <div key={item.name} style={{ padding: '10px 0', borderBottom: index < equipment.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{item.name}</div>
          <div style={{ fontSize: 10, color: G.muted }}>{item.status}</div>
        </div>
      ))}
    </div>
  );

  const renderSchedules = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📅 Schedules</div>
      <div style={{ color: G.muted, fontSize: 12 }}>Maintenance schedules and planned repairs.</div>
    </div>
  );

  const renderReports = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📊 Reports</div>
      <div style={{ color: G.muted, fontSize: 12 }}>Maintenance logs, safety checks, and asset reports.</div>
    </div>
  );

  const sectionRenderers: Record<string, () => React.ReactElement> = {
    overview: renderOverview,
    repairs: renderRepairs,
    equipment: renderEquipment,
    schedules: renderSchedules,
    reports: renderReports,
  };

  const renderer = sectionRenderers[activeSection] || sectionRenderers.overview;

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{renderer()}</div>;
};

export default MaintenanceDashboard;
