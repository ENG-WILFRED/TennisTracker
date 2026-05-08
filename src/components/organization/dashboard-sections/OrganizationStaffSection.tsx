'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { StaffDepartment } from '@/types/staff-dashboard';
import { DEPARTMENT_LIST, STAFF_DEPARTMENTS } from '@/config/staff-departments';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040', orange: '#e8944f', blue: '#4ab0d0',
};

interface Staff {
  id: string;
  name: string;
  email: string;
  photo?: string;
  role: string;
  department?: StaffDepartment;
  expertise?: string;
  coachingLevel?: string;
  experience: number;
  status: string;
  sessions: number;
  source: 'staff' | 'member';
}

interface StaffSectionProps {
  orgId?: string;
}

type DepartmentSelection = StaffDepartment | 'all';

const roleConfig: Record<string, { icon: string; color: string; bgColor: string }> = {
  coach: { icon: '🏆', color: G.blue, bgColor: 'rgba(74,176,208,0.12)' },
  referee: { icon: '⚖️', color: G.yellow, bgColor: 'rgba(240,192,64,0.12)' },
  admin: { icon: '⚙️', color: G.orange, bgColor: 'rgba(232,148,79,0.12)' },
};

export default function OrganizationStaffSection({ orgId }: StaffSectionProps) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentSelection>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (orgId) {
      fetchStaff();
    }
  }, [orgId, selectedDepartment, selectedRole]);

  async function fetchStaff() {
    if (!orgId) {
      setError('Organization ID is missing');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDepartment !== 'all') params.set('department', selectedDepartment);
      if (selectedRole !== 'all') params.set('role', selectedRole);
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/organization/${orgId}/staff${queryString}`);
      if (!res.ok) throw new Error(`Failed to fetch staff: ${res.status}`);
      const data = await res.json();
      setStaff(data || []);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching staff';
      setError(message);
      console.error('Error fetching staff:', err);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [orgId, activeRole]);

  useEffect(() => {
    if (orgId) {
      fetchStaff();
    }
  }, [orgId, activeRole, fetchStaff]);

  useEffect(() => {
    const handleOrganizationMembershipUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ orgId?: string }>).detail;
      if (!detail?.orgId || detail.orgId !== orgId) return;
      fetchStaff();
    };

    window.addEventListener('organizationMembershipUpdated', handleOrganizationMembershipUpdated as EventListener);
    return () => {
      window.removeEventListener('organizationMembershipUpdated', handleOrganizationMembershipUpdated as EventListener);
    };
  }, [orgId, fetchStaff]);

  const roleOptions = selectedDepartment === 'all'
    ? ['all', ...Object.values(STAFF_DEPARTMENTS).flatMap((dept) => dept.roles.map((role) => role.roleId))]
    : ['all', ...STAFF_DEPARTMENTS[selectedDepartment].roles.map((role) => role.roleId)];

  const formatLabel = (value: string) => {
    if (!value) return '';
    return value
      .replace(/_/g, ' ')
      .split(' ')
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(' ');
  };

  const getRoleIcon = (role: string) => roleConfig[role.toLowerCase()]?.icon || '👤';
  const getRoleColor = (role: string) => roleConfig[role.toLowerCase()]?.color || G.muted;
  const getRoleBgColor = (role: string) => roleConfig[role.toLowerCase()]?.bgColor || 'rgba(122,170,106,0.12)';

  const filteredStaff = staff.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.department || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const uniqueDepartments = new Set(staff.map((s) => s.department).filter(Boolean));
  const uniqueRoles = new Set(staff.map((s) => s.role.toLowerCase()));
  const pendingApplicants = staff.filter((s) => s.source === 'member' && s.status === 'Pending');
  const stats = {
    total: staff.length,
    departments: uniqueDepartments.size,
    roles: uniqueRoles.size,
    active: staff.filter((s) => s.status === 'Active').length,
    pending: pendingApplicants.length,
    totalSessions: staff.reduce((sum, s) => sum + (s.sessions || 0), 0),
  };

  const renderStatusBadge = (status: string) => {
    const isActive = status === 'Active';
    return (
      <span
        style={{
          fontSize: 9,
          padding: '4px 10px',
          background: isActive ? `${G.lime}33` : `${G.yellow}33`,
          color: isActive ? G.lime : G.yellow,
          borderRadius: 6,
          fontWeight: 700,
          whiteSpace: 'nowrap',
        }}
      >
        {status}
      </span>
    );
  };

  if (error) {
    return <div style={{ color: '#ff6b6b', padding: 12 }}>Error: {error}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Staff Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 md:gap-4">
        {[
          { label: 'Total Staff', value: stats.total, color: G.lime },
          { label: 'Departments', value: stats.departments, color: G.blue },
          { label: 'Role Types', value: stats.roles, color: G.accent },
          { label: 'Active', value: stats.active, color: G.bright },
          { label: 'Open Applicants', value: stats.pending, color: G.yellow },
          { label: 'Sessions', value: `${stats.totalSessions}h`, color: G.orange },
        ].map((metric) => (
          <div key={metric.label} style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 10, color: G.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{metric.label}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: metric.color }}>{loading ? '-' : metric.value}</div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_220px_minmax(220px,1fr)] gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-2">Department</label>
          <select
            value={selectedDepartment}
            onChange={(e) => {
              setSelectedDepartment(e.target.value as DepartmentSelection);
              setSelectedRole('all');
            }}
            className="w-full rounded-xl border border-gray-600 bg-[#101f10] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lime-500"
          >
            <option value="all">All Departments</option>
            {DEPARTMENT_LIST.map((department) => (
              <option key={department} value={department}>{STAFF_DEPARTMENTS[department].name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-2">Role</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full rounded-xl border border-gray-600 bg-[#101f10] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lime-500"
          >
            <option value="all">All Roles</option>
            {roleOptions.map((role) => (
              role === 'all' ? null : (
                <option key={role} value={role}>{formatLabel(role)}</option>
              )
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-2">Search</label>
          <input
            type="text"
            placeholder="Search staff, role, dept..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-600 bg-[#101f10] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lime-500"
          />
        </div>
      </div>

      {/* Staff Applicants */}
      {pendingApplicants.length > 0 && (
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>🕒 Role Applications</div>
              <div style={{ fontSize: 11, color: G.muted }}>Users applying for coach/referee/admin roles.</div>
            </div>
            <span style={{ fontSize: 12, color: G.yellow, fontWeight: 700 }}>{pendingApplicants.length} waiting</span>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {pendingApplicants.slice(0, 4).map(s => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, background: '#09160b', border: `1px solid ${G.cardBorder}` }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: G.text }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: G.muted }}>{s.email} · {s.role}</div>
                </div>
                <span style={{ fontSize: 10, color: G.yellow, background: 'rgba(240,192,64,0.12)', padding: '5px 8px', borderRadius: 8, fontWeight: 700 }}>Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff List */}
      <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14, minHeight: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 14 }}>👥 Team Members</div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, color: G.muted }}>Loading staff...</div>
        ) : filteredStaff.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: G.muted }}>
            {searchQuery ? 'No staff found matching your search' : 'No staff members found'}
          </div>
        ) : (
          <div style={{ maxHeight: 520, overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {filteredStaff.map((s, i) => (
              <Link
                key={s.id}
                href={`/dashboard/staff/${s.department || 'support'}/${s.id}?org=${orgId}`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 rounded-lg border border-gray-600 hover:border-lime-500 hover:bg-[#0f1f0f]/50 transition-all cursor-pointer">
                  {/* Avatar */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: s.photo ? `url(${s.photo})` : getRoleBgColor(s.role),
                      border: `2px solid ${getRoleColor(s.role)}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      fontWeight: 700,
                      flexShrink: 0,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      color: getRoleColor(s.role),
                    }}
                  >
                    {!s.photo && getRoleIcon(s.role)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: G.muted, marginBottom: 2 }}>{s.email}</div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                      <span style={{ textTransform: 'capitalize', fontWeight: 600, color: getRoleColor(s.role) }}>
                        {getRoleIcon(s.role)} {formatLabel(s.role)}
                      </span>
                      {s.department && <span>• {formatLabel(s.department)}</span>}
                      {s.expertise && <span>• {s.expertise}</span>}
                      {s.experience > 0 && <span>• {s.experience}yr exp</span>}
                      {s.source === 'member' && <span style={{ color: G.bright }}>• org member</span>}
                    </div>
                  </div>

                  {/* Status & Activity */}
                  <div className="flex gap-2 items-center flex-shrink-0">
                    {renderStatusBadge(s.status)}
                    {s.sessions > 0 && (
                      <span
                        style={{
                          fontSize: 9,
                          padding: '4px 10px',
                          background: G.dark,
                          color: G.accent,
                          borderRadius: 6,
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {s.sessions}h
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: G.muted, marginLeft: 4 }}>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        <button
          style={{
            width: '100%',
            marginTop: 14,
            padding: '10px',
            background: G.bright,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = G.lime)}
          onMouseLeave={(e) => (e.currentTarget.style.background = G.bright)}
        >
          + Add Staff Member
        </button>
      </div>
    </div>
  );
}
