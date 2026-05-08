'use client';

import React from 'react';
import { StaffUser, DepartmentConfig, RoleConfig } from '@/types/staff-dashboard';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d7a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

interface HRDashboardProps {
  staffUser: StaffUser;
  department: string;
  departmentConfig: DepartmentConfig;
  roleConfig: RoleConfig;
  activeSection: string;
  onNavigate: (section: string) => void;
  stats?: Record<string, any>;
  sectionData?: Record<string, any>;
}

const HRDashboard: React.FC<HRDashboardProps> = ({ activeSection, roleConfig, stats, sectionData }) => {
  const baseStats = {
    totalEmployees: 45,
    activeToday: 42,
    onLeave: 3,
    openPositions: 5,
    attendanceRate: 94,
    newHires: 2,
    ...stats,
  };

  const employees: Array<{ name: string; role: string; department: string; status: string }> =
    sectionData?.employees?.map((employee: any) => ({
      name: `${employee.user?.firstName || 'Staff'} ${employee.user?.lastName || ''}`.trim(),
      role: employee.role || 'Staff',
      department: employee.user?.email?.includes('coach') ? 'Coaching' : 'Operations',
      status: employee.isActive ? 'Active' : 'Inactive',
    })) ?? [
      { name: 'John Kimani', role: 'Coach', department: 'Sports', status: 'Active' },
      { name: 'Alice Okonkwo', role: 'Finance Manager', department: 'Finance', status: 'Active' },
      { name: 'David Kipchoge', role: 'Receptionist', department: 'Reception', status: 'On Leave' },
      { name: 'Martha Njoroge', role: 'Maintenance Lead', department: 'Facilities', status: 'Active' },
      { name: 'Samuel Kariuki', role: 'Security Officer', department: 'Security', status: 'Active' },
    ];

  const leaveRequests: Array<{ employee: string; type: string; range: string; status: string }> =
    sectionData?.leaveRequests?.map((request: any) => ({
      employee: request.title || 'Staff request',
      type: request.description?.slice(0, 20) || 'Leave',
      range: request.createdAt ? new Date(request.createdAt).toLocaleDateString('en-US') : 'TBD',
      status: request.status === 'resolved' ? 'Approved' : request.status === 'open' ? 'Pending' : 'Review',
    })) ?? [
      { employee: 'Grace Wanjiru', type: 'Annual Leave', range: 'Apr 1 - Apr 5', status: 'Pending' },
      { employee: 'James Omondi', type: 'Sick Leave', range: 'Today - Tomorrow', status: 'Approved' },
    ];

  const renderOverview = () => (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-10" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        {[
          { label: 'Employees', value: baseStats.totalEmployees, icon: '👥' },
          { label: 'Present', value: baseStats.activeToday, icon: '✅' },
          { label: 'On Leave', value: baseStats.onLeave, icon: '🏖️' },
          { label: 'Open Roles', value: baseStats.openPositions, icon: '💼' },
          { label: 'Attendance', value: `${baseStats.attendanceRate}%`, icon: '📊' },
          { label: 'New Hires', value: baseStats.newHires, icon: '🎉' },
        ].map((item, index) => (
          <div key={index} style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 16 }}>
            <div style={{ color: G.muted, fontSize: 10 }}>{item.label}</div>
            <div style={{ color: G.accent, fontSize: 20, fontWeight: 800, marginTop: 8 }}>{item.icon} {item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-12" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>👥 Employee Snapshot</div>
          {employees.map((employee, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: index < employees.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{employee.name}</div>
                <div style={{ fontSize: 10, color: G.muted }}>{employee.role} · {employee.department}</div>
              </div>
              <div style={{ color: employee.status === 'Active' ? G.lime : G.yellow, fontWeight: 700, fontSize: 10 }}>{employee.status}</div>
            </div>
          ))}
        </div>

        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📋 Leave Requests</div>
          {leaveRequests.map((request, index) => (
            <div key={index} style={{ padding: '10px 0', borderBottom: index < leaveRequests.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{request.employee}</div>
              <div style={{ fontSize: 10, color: G.muted }}>{request.type} · {request.range}</div>
              <div style={{ fontSize: 10, color: request.status === 'Approved' ? G.lime : G.yellow }}>{request.status}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderEmployees = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>👥 Employee Directory</div>
      {employees.map((employee, index) => (
        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: index < employees.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{employee.name}</div>
            <div style={{ fontSize: 10, color: G.muted }}>{employee.role} • {employee.department}</div>
          </div>
          <div style={{ color: employee.status === 'Active' ? G.lime : G.yellow, fontWeight: 700, fontSize: 10 }}>{employee.status}</div>
        </div>
      ))}
    </div>
  );

  const renderAttendance = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📅 Attendance</div>
      <div style={{ color: G.muted, fontSize: 12 }}>Daily attendance tracking, check-ins, and presence analytics.</div>
    </div>
  );

  const renderLeaves = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>🏖️ Leave Management</div>
      <div style={{ color: G.muted, fontSize: 12 }}>Approve requests and view team availability.</div>
    </div>
  );

  const renderRecruitment = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>💼 Recruitment</div>
      <div style={{ color: G.muted, fontSize: 12 }}>Open positions, candidate pipeline, and hiring status.</div>
    </div>
  );

  const renderReports = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📊 HR Reports</div>
      <div style={{ color: G.muted, fontSize: 12 }}>
        {roleConfig.canViewReports ? 'Use HR reports for headcount, turnover, and attendance analysis.' : 'Reports are restricted for your role.'}
      </div>
    </div>
  );

  const sectionRenderers: Record<string, () => React.ReactElement> = {
    overview: renderOverview,
    employees: renderEmployees,
    attendance: renderAttendance,
    leaves: renderLeaves,
    recruitment: renderRecruitment,
    reports: renderReports,
  };

  const renderer = sectionRenderers[activeSection] || sectionRenderers.overview;

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{renderer()}</div>;
};

export default HRDashboard;
