'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

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

type RoleType = 'all' | 'coach' | 'referee' | 'admin';

const roleConfig: Record<string, { icon: string; color: string; bgColor: string }> = {
  coach: { icon: '🏆', color: G.blue, bgColor: 'rgba(74,176,208,0.12)' },
  referee: { icon: '⚖️', color: G.yellow, bgColor: 'rgba(240,192,64,0.12)' },
  admin: { icon: '⚙️', color: G.orange, bgColor: 'rgba(232,148,79,0.12)' },
};

export default function OrganizationStaffSection({ orgId }: StaffSectionProps) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<RoleType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (orgId) {
      fetchStaff();
    }
  }, [orgId, activeRole]);

  async function fetchStaff() {
    if (!orgId) {
      setError('Organization ID is missing');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const roleParam = activeRole !== 'all' ? `?role=${activeRole}` : '';
      const res = await fetch(`/api/organization/${orgId}/staff${roleParam}`);
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
  }

  // Filter staff by search query
  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const stats = {
    total: staff.length,
    coaches: staff.filter(s => s.role === 'coach').length,
    referees: staff.filter(s => s.role === 'referee').length,
    admins: staff.filter(s => s.role === 'admin').length,
    active: staff.filter(s => s.status === 'Active').length,
    totalSessions: staff.reduce((sum, s) => sum + (s.sessions || 0), 0),
  };

  const getRoleIcon = (role: string) => roleConfig[role.toLowerCase()]?.icon || '👤';
  const getRoleColor = (role: string) => roleConfig[role.toLowerCase()]?.color || G.muted;
  const getRoleBgColor = (role: string) => roleConfig[role.toLowerCase()]?.bgColor || 'rgba(122,170,106,0.12)';

  if (error) {
    return <div style={{ color: '#ff6b6b', padding: 12 }}>Error: {error}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Staff Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 10, color: G.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Staff</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: G.lime }}>{loading ? '-' : stats.total}</div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 10, color: G.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coaches</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: G.blue }}>{loading ? '-' : stats.coaches}</div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 10, color: G.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Referees</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: G.yellow }}>{loading ? '-' : stats.referees}</div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 10, color: G.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admins</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: G.orange }}>{loading ? '-' : stats.admins}</div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 10, color: G.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: G.bright }}>{loading ? '-' : stats.active}</div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 10, color: G.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sessions</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: G.accent }}>{loading ? '-' : stats.totalSessions}h</div>
        </div>
      </div>

      {/* Role Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-wrap gap-2">
          {(['all', 'coach', 'referee', 'admin'] as RoleType[]).map(role => (
            <button
              key={role}
              onClick={() => {
                setActiveRole(role);
                setSearchQuery('');
              }}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeRole === role ? (role === 'all' ? G.lime : getRoleColor(role)) : G.mid,
                color: activeRole === role ? (role === 'all' ? G.dark : '#fff') : G.muted,
                textTransform: 'capitalize',
                transition: 'all 0.2s',
              }}
            >
              {role === 'all' ? 'All Staff' : `${getRoleIcon(role)} ${role}`}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search staff..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-auto min-w-0 sm:min-w-[200px] px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Staff List */}
      <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 14 }}>👥 Team Members</div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, color: G.muted }}>Loading staff...</div>
        ) : filteredStaff.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: G.muted }}>
            {searchQuery ? 'No staff found matching your search' : 'No staff members found'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {filteredStaff.map((s, i) => (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 border-b border-gray-200 last:border-b-0"
              >
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
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    <span style={{ textTransform: 'capitalize', fontWeight: 600, color: getRoleColor(s.role) }}>
                      {getRoleIcon(s.role)} {s.role}
                    </span>
                    {s.expertise && <span>• {s.expertise}</span>}
                    {s.experience > 0 && <span>• {s.experience}yr exp</span>}
                    {s.source === 'member' && <span style={{ color: G.bright }}>• org member</span>}
                  </div>
                </div>

                {/* Status & Activity */}
                <div className="flex gap-2 items-center flex-shrink-0">
                  <span
                    style={{
                      fontSize: 9,
                      padding: '4px 10px',
                      background: s.status === 'Active' ? G.lime + '33' : G.yellow + '33',
                      color: s.status === 'Active' ? G.lime : G.yellow,
                      borderRadius: 6,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.status}
                  </span>
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
                </div>
              </div>
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
