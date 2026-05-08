'use client';

import React from 'react';
import { StaffUser, DepartmentConfig, RoleConfig } from '@/types/staff-dashboard';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d7a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

interface InventoryDashboardProps {
  staffUser: StaffUser;
  department: string;
  departmentConfig: DepartmentConfig;
  roleConfig: RoleConfig;
  activeSection: string;
  onNavigate: (section: string) => void;
  stats?: Record<string, any>;
  sectionData?: Record<string, any>;
}

const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ activeSection, stats, sectionData }) => {
  const baseStats = {
    totalItems: 245,
    lowStock: 8,
    pendingOrders: 5,
    assignments: 32,
    ...stats,
  };

  const inventory: Array<{ name: string; qty: number; status: string }> =
    sectionData?.inventory?.map((item: any) => ({
      name: item.name || 'Inventory item',
      qty: item.count ?? 0,
      status: item.count === 0 ? 'Out of stock' : item.count < 5 ? 'Low stock' : 'In stock',
    })) ?? [
      { name: 'Tennis balls', qty: 120, status: 'In stock' },
      { name: 'Replacement nets', qty: 4, status: 'Low stock' },
      { name: 'Court markers', qty: 18, status: 'In stock' },
    ];

  const assignments: Array<{ item: string; assignee: string; due: string }> =
    sectionData?.assignments?.map((item: any) => ({
      item: item.name || 'Assigned item',
      assignee: item.clubId ? `Club ${item.clubId}` : 'Team',
      due: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD',
    })) ?? [
      { item: 'Scoreboard remote', assignee: 'Reception', due: 'Apr 10' },
      { item: 'Ball machine', assignee: 'Maintenance', due: 'Apr 15' },
    ];

  const alerts: Array<{ item: string; level: string }> =
    sectionData?.alerts?.map((item: any) => ({
      item: item.name || 'Alert item',
      level: item.count === 0 ? 'Critical' : 'Low',
    })) ?? [
      { item: 'Replacement nets', level: 'Low' },
      { item: 'Court towels', level: 'Low' },
    ];

  const renderOverview = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-10" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
      {[
        { label: 'Total Items', value: baseStats.totalItems, icon: '📦' },
        { label: 'Low Stock', value: baseStats.lowStock, icon: '🚨' },
        { label: 'Pending Orders', value: baseStats.pendingOrders, icon: '🛒' },
        { label: 'Assignments', value: baseStats.assignments, icon: '🎯' },
      ].map((item, index) => (
        <div key={index} style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 16 }}>
          <div style={{ color: G.muted, fontSize: 10 }}>{item.label}</div>
          <div style={{ color: G.accent, fontSize: 20, fontWeight: 800, marginTop: 8 }}>{item.icon} {item.value}</div>
        </div>
      ))}
    </div>
  );

  const renderInventory = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📦 Inventory</div>
      {inventory.map((item, index) => (
        <div key={item.name} style={{ padding: '10px 0', borderBottom: index < inventory.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{item.name}</div>
          <div style={{ fontSize: 10, color: G.muted }}>Qty: {item.qty} • {item.status}</div>
        </div>
      ))}
    </div>
  );

  const renderPurchases = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>🛒 Purchases</div>
      <div style={{ color: G.muted, fontSize: 12 }}>Review recent purchase orders and supplier deliveries.</div>
    </div>
  );

  const renderAssignments = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>🎯 Assignments</div>
      {assignments.map((assignment, index) => (
        <div key={`${assignment.item}-${index}`} style={{ padding: '10px 0', borderBottom: index < assignments.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{assignment.item}</div>
          <div style={{ fontSize: 10, color: G.muted }}>{assignment.assignee} • due {assignment.due}</div>
        </div>
      ))}
    </div>
  );

  const renderAlerts = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>🚨 Alerts</div>
      {alerts.map((alert, index) => (
        <div key={`${alert.item}-${index}`} style={{ padding: '10px 0', borderBottom: index < alerts.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{alert.item}</div>
          <div style={{ fontSize: 10, color: G.muted }}>Stock level: {alert.level}</div>
        </div>
      ))}
    </div>
  );

  const renderReports = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📊 Reports</div>
      <div style={{ color: G.muted, fontSize: 12 }}>Inventory valuation, reorder alerts, and usage reports.</div>
    </div>
  );

  const sectionRenderers: Record<string, () => React.ReactElement> = {
    overview: renderOverview,
    inventory: renderInventory,
    purchases: renderPurchases,
    assignments: renderAssignments,
    alerts: renderAlerts,
    reports: renderReports,
  };

  const renderer = sectionRenderers[activeSection] || sectionRenderers.overview;

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{renderer()}</div>;
};

export default InventoryDashboard;
