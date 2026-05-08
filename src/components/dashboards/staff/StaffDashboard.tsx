'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { MembershipSwitcher } from '@/components/MembershipSwitcher';
import { StaffDepartment, StaffUser } from '@/types/staff-dashboard';
import { STAFF_DEPARTMENTS, getDepartmentConfig, getRoleConfig } from '@/config/staff-departments';
import FinanceDashboard from './finance/FinanceDashboard';
import HRDashboard from './hr/HRDashboard';
import ReceptionDashboard from './reception/ReceptionDashboard';
import SecurityDashboard from './security/SecurityDashboard';
import MaintenanceDashboard from './maintenance/MaintenanceDashboard';
import InventoryDashboard from './inventory/InventoryDashboard';
import SupportDashboard from './support/SupportDashboard';
import MarketingDashboard from './marketing/MarketingDashboard';
import OperationsDashboard from './operations/OperationsDashboard';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

const DEPARTMENT_COMPONENTS: Record<StaffDepartment, React.ComponentType<any>> = {
  finance: FinanceDashboard,
  hr: HRDashboard,
  reception: ReceptionDashboard,
  security: SecurityDashboard,
  maintenance: MaintenanceDashboard,
  inventory: InventoryDashboard,
  support: SupportDashboard,
  marketing: MarketingDashboard,
  operations: OperationsDashboard,
};

interface StaffDashboardProps {
  department: StaffDepartment;
  staffUser: StaffUser;
  dashboardData: {
    stats: Record<string, any>;
    sectionData?: Record<string, any>;
  };
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ department, staffUser, dashboardData }) => {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const departmentConfig = getDepartmentConfig(department);
  const roleConfig = getRoleConfig(department, staffUser.role);

  if (!departmentConfig || !roleConfig) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: G.text }}>
        <p>Invalid department or role configuration</p>
      </div>
    );
  }

  const activeSection = (searchParams.get('section') as string) || 'overview';

  const handleNavigation = (section: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', section);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const DepartmentComponent = DEPARTMENT_COMPONENTS[department];

  return (
    <div className="flex flex-col md:flex-row" style={{ height: '100vh', background: G.dark, color: G.text, overflow: 'hidden' }}>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* LEFT SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 max-w-[80vw] transform border-r transition-transform duration-300 md:relative md:sticky md:top-0 md:translate-x-0 md:flex md:w-56 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: G.sidebar,
          borderRight: `1px solid ${G.cardBorder}`,
          flexDirection: 'column',
          flexShrink: 0,
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '15px 14px 10px', borderBottom: `1px solid ${G.cardBorder}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{departmentConfig.icon}</span>
          <div style={{ color: G.lime, fontWeight: 900, fontSize: 14 }}>{departmentConfig.name}</div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-[#2d5a35] text-[#7aaa6a] hover:bg-[#1e3a20] transition md:hidden ml-auto"
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, paddingTop: 8, overflowY: 'auto', paddingBottom: 12 }}>
          {departmentConfig.sidebarItems
            .filter(item => {
              // Only show items that user has permission for
              if (!item.requiresPermission) return true;
              return roleConfig.permissions.includes(item.requiresPermission);
            })
            .map(item => (
              <button
                key={item.section}
                onClick={() => handleNavigation(item.section)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '9px 13px',
                  background: activeSection === item.section ? G.mid : 'transparent',
                  color: activeSection === item.section ? '#fff' : G.muted,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  textAlign: 'left',
                  borderLeft: activeSection === item.section ? `3px solid ${G.lime}` : '3px solid transparent',
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1, minHeight: 12 }} />

        {/* Profile Card at Bottom */}
        <div style={{ padding: '10px 12px 14px', flexShrink: 0 }}>
          <div style={{ background: G.mid, border: `1px solid ${G.cardBorder}`, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
            {staffUser.photo ? (
              <img
                src={staffUser.photo}
                alt={staffUser.firstName}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: `2px solid ${G.lime}`,
                  objectFit: 'cover',
                  marginBottom: 6,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  display: 'block',
                }}
              />
            ) : (
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: G.bright,
                  margin: '0 auto 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}
              >
                👤
              </div>
            )}
            <div style={{ fontWeight: 800, fontSize: 11, marginTop: 4 }}>
              {staffUser.firstName} {staffUser.lastName}
            </div>
            <div style={{ fontSize: 9, color: G.muted, marginTop: 2 }}>{roleConfig.title}</div>
            {staffUser.email && (
              <div style={{ fontSize: 8, color: G.muted, marginTop: 2, wordBreak: 'break-word' }}>
                📧 {staffUser.email}
              </div>
            )}
            <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
              <button
                onClick={handleLogout}
                style={{
                  flex: 1,
                  background: '#ff6b6b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 0',
                  fontSize: 8,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-20 bg-[#0f1f0f] border-b border-[#2d5a35] px-4 py-3 -mx-4 -mt-14">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#7dc142] flex items-center justify-center text-sm">
                {departmentConfig.icon}
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#e8f5e0]">{departmentConfig.name}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[#2d5a35] text-[#7aaa6a] hover:bg-[#1e3a20] transition"
              aria-label="Open navigation"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Render Department-Specific Dashboard */}
        <DepartmentComponent
          staffUser={staffUser}
          department={department}
          departmentConfig={departmentConfig}
          roleConfig={roleConfig}
          activeSection={activeSection}
          onNavigate={handleNavigation}
          stats={dashboardData.stats}
          sectionData={dashboardData.sectionData}
        />
      </main>
    </div>
  );
};

export default StaffDashboard;
